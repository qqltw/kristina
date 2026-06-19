import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

// На Vercel (serverless) Puppeteer не работает: нет Chromium, bundle вылетает за лимит.
// Грузим его ЛЕНИВО — только если NODE_ENV !== "production" или не задан VERCEL.
const isServerless = !!process.env.VERCEL;
async function loadPuppeteer(): Promise<any | null> {
  if (isServerless) return null;
  try {
    const mod: any = await import("puppeteer");
    return mod.default || mod;
  } catch (e) {
    console.warn("Puppeteer не загрузился (это ок на serverless):", (e as Error).message);
    return null;
  }
}

// Import modular server logic
import { detectAssetType, getPrebuiltAudit, transformAudit } from "./src/server/auditFallbacks.js";
import { generateHtmlReport } from "./src/server/htmlReport.js";
import { scrapeWebsite } from "./src/server/scraper.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Диагностический эндпоинт — открой /api/debug в браузере на проде,
// убедись, что нужные env-ключи подхвачены Vercel.
app.get("/api/debug", (_req, res) => {
  res.json({
    runtime: "vercel/serverless or local express",
    env_status: {
      MANUS_API_KEY: process.env.MANUS_API_KEY ? `set (len=${process.env.MANUS_API_KEY.length})` : "MISSING",
      MANUS_AGENT_PROFILE: process.env.MANUS_AGENT_PROFILE || "default(manus-1.6-lite)",
      MANUS_BASE_URL: process.env.MANUS_BASE_URL || "default(https://api.manus.ai)",
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? "set" : "missing",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "set" : "missing",
      VERCEL: process.env.VERCEL ? "yes" : "no",
    },
    expected_provider_order: [
      process.env.MANUS_API_KEY ? "manus" : null,
      process.env.ANTHROPIC_API_KEY ? "claude" : null,
      process.env.GEMINI_API_KEY ? "gemini" : null,
      "prebuilt-fallback",
    ].filter(Boolean),
  });
});

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Initialize Anthropic Client
const anthropicKey = process.env.ANTHROPIC_API_KEY;
let anthropicBaseUrl = process.env.ANTHROPIC_BASE_URL || "https://neuroapi.host";
if (anthropicBaseUrl.endsWith("/v1/")) {
  anthropicBaseUrl = anthropicBaseUrl.slice(0, -4);
} else if (anthropicBaseUrl.endsWith("/v1")) {
  anthropicBaseUrl = anthropicBaseUrl.slice(0, -3);
}

const anthropic = anthropicKey
  ? new Anthropic({
      apiKey: anthropicKey,
      baseURL: anthropicBaseUrl,
    })
  : null;

// Initialize Manus client
const manusApiKey = process.env.MANUS_API_KEY;
const manusBaseUrl = (process.env.MANUS_BASE_URL || "https://api.manus.ai").replace(/\/$/, "");
const manusAgentProfile = process.env.MANUS_AGENT_PROFILE || "manus-1.6-lite";

interface ManusAuditOptions {
  prompt: string;
  pollIntervalMs?: number;
  maxWaitMs?: number;
}

async function runManusAudit({ prompt, pollIntervalMs = 2500, maxWaitMs = 50000 }: ManusAuditOptions): Promise<string | null> {
  if (!manusApiKey) return null;

  const headers = {
    "x-manus-api-key": manusApiKey,
    "Content-Type": "application/json",
  };

  const createRes = await fetch(`${manusBaseUrl}/v2/task.create`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: { content: prompt },
      agent_profile: manusAgentProfile,
      locale: "ru",
      hide_in_task_list: true,
      interactive_mode: false,
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Manus task.create failed: ${createRes.status} ${errText}`);
  }

  const createJson: any = await createRes.json();
  if (!createJson?.ok || !createJson?.task_id) {
    throw new Error(`Manus task.create returned unexpected payload: ${JSON.stringify(createJson)}`);
  }

  const taskId = createJson.task_id as string;
  const startedAt = Date.now();

  while (Date.now() - startedAt < maxWaitMs) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));

    const detailRes = await fetch(`${manusBaseUrl}/v2/task.detail?task_id=${encodeURIComponent(taskId)}`, {
      method: "GET",
      headers,
    });

    if (!detailRes.ok) continue;
    const detailJson: any = await detailRes.json();
    const status = detailJson?.task?.status;
    if (status === "stopped" || status === "waiting") break;
    if (status === "error") {
      throw new Error(`Manus task failed with status=error: ${JSON.stringify(detailJson)}`);
    }
  }

  const msgRes = await fetch(
    `${manusBaseUrl}/v2/task.listMessages?task_id=${encodeURIComponent(taskId)}&limit=50&order=desc`,
    { method: "GET", headers }
  );
  if (!msgRes.ok) {
    throw new Error(`Manus task.listMessages failed: ${msgRes.status}`);
  }
  const msgJson: any = await msgRes.json();
  const messages: any[] = msgJson?.messages || [];

  for (const m of messages) {
    if (m?.type === "assistant_message" && m?.assistant_message?.content) {
      const content = m.assistant_message.content;
      if (typeof content === "string") return content;
      if (Array.isArray(content)) {
        return content.map((c: any) => (typeof c === "string" ? c : c?.text || "")).join("\n");
      }
    }
  }
  return null;
}

// Helper to sanitize and process URLs safely
function cleanUrl(inputUrl: string): string {
  let clean = inputUrl.trim();
  if (!/^https?:\/\//i.test(clean)) {
    clean = "https://" + clean;
  }
  return clean;
}

function extractBalancedJson(text: string): string {
  const start = text.indexOf("{");
  if (start === -1) return text;

  let balance = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\") {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "{") {
        balance++;
      } else if (char === "}") {
        balance--;
        if (balance === 0) {
          return text.substring(start, i + 1);
        }
      }
    }
  }

  // Fallback to substring if match not found or unbalanced
  const end = text.lastIndexOf("}");
  if (end !== -1 && end > start) {
    return text.substring(start, end + 1);
  }
  return text;
}

// API Audit Route
app.post("/api/audit", async (req, res) => {
  const { url, vkUrl, tgUrl, instUrl } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL адрес обязателен для проверки" });
  }

  const targetUrl = cleanUrl(url);

  // Format description of targets to let LLM know we are auditing social links together with site
  let queryDetails = targetUrl;
  const linkedProfiles = [];
  if (vkUrl) linkedProfiles.push(`ВКонтакте: ${cleanUrl(vkUrl)}`);
  if (tgUrl) linkedProfiles.push(`Telegram: ${cleanUrl(tgUrl)}`);
  if (instUrl) linkedProfiles.push(`Instagram: ${cleanUrl(instUrl)}`);

  if (linkedProfiles.length > 0) {
    queryDetails += ` совместно со связанными соцсетями: ${linkedProfiles.join(", ")}`;
  }

  // Pre-fetch actual page data if auditing a website
  let ScrapedPageContext = "";
  const targetType = detectAssetType(targetUrl);
  let scrapedData: any = null;
  if (targetType === "website") {
    const scrapeRes = await scrapeWebsite(targetUrl);
    if (scrapeRes.success && scrapeRes.pageData) {
      scrapedData = scrapeRes.pageData;
      const pd = scrapeRes.pageData;
      ScrapedPageContext = `
[ФАКТИЧЕСКИЕ ДАННЫЕ О СТРАНИЦЕ (РЕЗУЛЬТАТЫ СКАНИРОВАНИЯ)]:
- Название страницы (Title): "${pd.title}"
- Мета-описание (Description): "${pd.description}"
- Ключевые слова (Keywords): "${pd.keywords}"
- Найдено чекбоксов (<input type="checkbox">): ${pd.checkboxCount}
${pd.checkboxes.length > 0 ? `Детали чекбоксов: ${JSON.stringify(pd.checkboxes)}` : "Чекбоксы не найдены"}
- Найдено форм (<form>): ${pd.formCount}
${pd.forms.length > 0 ? `Структура форм: ${JSON.stringify(pd.forms)}` : "Формы не найдены"}
- Количество полей ввода вне форм (loose inputs): ${pd.looseInputsCount}
${pd.looseInputs.length > 0 ? `Детали внешних полей: ${JSON.stringify(pd.looseInputs)}` : ""}
- Ссылки на правила/политику конфиденциальности/соглашения (найденные): ${JSON.stringify(pd.policyLinks)}
- Присутствует ли баннер или упоминание Cookie/Куки: ${pd.hasCookieBanner ? "Да" : "Нет"}
- Проанализированные заголовки H1 на странице: ${JSON.stringify(pd.h1s)}
- Количество заголовков H2: ${pd.h2Count}, H3: ${pd.h3Count}
- Всего картинок: ${pd.totalImages}, картинок без alt-атрибута: ${pd.imagesWithoutAlt}
- Обнаружены ли в тексте контакты/телефоны: ${pd.hasPhone ? "Да" : "Нет"}
- Обнаружены ли официальные реквизиты (ИНН/ОГРН): ${pd.hasLegalReqs ? "Да" : "Нет"}

КРИТИЧЕСКИ ВАЖНОЕ ТРЕБОВАНИЕ ПРИНЯТИЯ ТЕХНИКО-ЮРИДИЧЕСКИХ РЕШЕНИЙ:
1. Если Найдено чекбоксов (${pd.checkboxCount}) больше нуля, ты НЕ ДОЛЖЕН писать, что на сайте "отсутствует чекбокс" или "отсутствует согласие"! Наоборот, похвали сайт за их наличие во вкладке "Нарушения ФЗ-152" или найди другие уязвимости (например: проверить, является ли чекбокс обязательным для клика, ссылается ли он на правильный URI документа политики конфиденциальности, правильно ли сформулирован текст согласия, или на сайте полностью отсутствуют официальные реквизиты ИНН/ОГРН, что нарушает Закон о защите прав потребителей).
2. Если Ссылки на правила/политику конфиденциальности не пусты и содержат действительные документы, ты НЕ ДОЛЖЕН утверждать, что "Политика конфиденциальности отсутствует полностью". Вместо этого укажи на мелкие особенности (например: ссылка не открывается, её трудно найти в подвале, ссылка ведет на сторонние шаблоны, политика устарела, не указаны категории собираемых данных и цели сбора, или отсутствует информирование о куки-файлах).
3. Изучи реальные заголовки H1: ${JSON.stringify(pd.h1s)}. Если там ровно один осмысленный H1, то H1-ошибок НЕТ! Не придумывай их. Если их несколько (h1s.length > 1) или нет вовсе (h1s.length === 0) — укажи их реальные тексты в критике.
4. Оцени количество картинок без alt-описаний (${pd.imagesWithoutAlt} из ${pd.totalImages}). Используй именно эти цифры в процентах в отчете, чтобы пользователь видел реальную, точную аналитику его сайта!
5. Если Cookie-баннер указано "Да", похвали за это. Если "Нет" — укажи, что отсутствует компактное всплывающее уведомление о сборе Cookie.
6. Действуй строго на основе этих данных. Не выдумывай несуществующие ошибки чекбоксов, если они уже установлены на реальном сайте!`;
    } else {
      ScrapedPageContext = `
[РЕЖИМ СКАНИРОВАНИЯ САЙТА]:
Сайт не удалось полностью распарсить из-за таймаута или ошибки доступа, но ты должен провести стандартную аналитику рисков на основе структуры URL: ${targetUrl}.`;
    }
  }

  let rawAuditData: any = getPrebuiltAudit(targetUrl, scrapedData);
  // Enhance prebuilt audit if socials are configured
  if (linkedProfiles.length > 0 && rawAuditData) {
    rawAuditData.audit_summary = `КОМПЛЕКСНЫЙ ЭКОСИСТЕМНЫЙ АУДИТ: Выявлены правовые риски на сайте ${targetUrl} совместно с каналами ${linkedProfiles.join(", ")}. В лид-формах сайта и социальных сетях отсутствует сквозная обработка персональных данных по ФЗ-152, а партнерские публикации в сообществах не содержат рекламной маркировки erid.`;
    if (vkUrl && rawAuditData.legal_audit?.issues) {
      rawAuditData.legal_audit.issues.push({
        title: "VKontakte: Отсутствие согласия на обработку персональных данных в форме заявок",
        description: `В сообществе по ссылке ${vkUrl} запущены формы заявок без явного согласия и ссылки на Политику компании по ФЗ-152.`,
        severity: "critical",
        fix_step: "Перейдите во встроенный конструктор форм сообщества VK, добавьте поле обязательного согласия и разместите ссылку на Политику безопасности."
      });
    }
    if (tgUrl && rawAuditData.legal_audit?.issues) {
      rawAuditData.legal_audit.issues.push({
        title: "Telegram: Нарушение ФЗ 'О рекламе' и маркировки erid у постов",
        description: `В Telegram-канале ${tgUrl} присутствуют нативные рекламные публикации сторонних сервисов без указания erid и дисклеймера 'Реклама'.`,
        severity: "critical",
        fix_step: "Пройти регистрацию в ОРД, внести данные креатива и промаркировать каждый рекламный пост перед публикацией токеном erid."
      });
    }
  }

  let liveAuditCompleted = false;

  // Общий системный промпт для всех LLM-провайдеров — задаёт жёсткий JSON-формат.
  const auditSystemPrompt = `ROLE & OBJECTIVE:
Ты — автономный ИИ-аудитор компании DonTech. Твоя цель — провести бескомпромиссный, жесткий и точечный технико-юридический аудит переданного цифрового актива (это может быть веб-сайт, профиль Instagram, сообщество ВКонтакте или Telegram-канал). На выходе ты обязан вернуть СТРОГО валидный JSON-объект без markdown-обёрток, без пояснений до или после.

Структура JSON:
{
  "asset_info": { "type": "website|instagram|vk|telegram", "url": "...", "audit_date": "ДД.ММ.ГГГГ" },
  "audit_summary": "Жесткое экспертное заключение с потенциальными штрафами в рублях.",
  "scores": { "legal": 0-100, "optimization": 0-100, "geo": 0-100 },
  "legal_audit":        { "issues": [ { "title": "...", "description": "...", "severity": "critical|warning", "fix_step": "..." } ] },
  "optimization_audit": { "issues": [ { "title": "...", "description": "...", "severity": "critical|warning", "fix_step": "..." } ] },
  "geo_audit":          { "issues": [ { "title": "...", "description": "...", "severity": "critical|warning", "fix_step": "..." } ] }
}

Для САЙТА: legal = ФЗ-152/реклама/ЗоЗПП, optimization = SEO/мета/H-теги/alt, geo = региональная привязка/карты/телефоны.
Для СОЦСЕТЕЙ (VK/TG/Instagram): legal = оформление и реквизиты, optimization = контент/УТП/постинг, geo = виральность/Reels/CTA/маркировка erid.`;

  // Manus идёт первым: если ключ задан — пытаемся через него.
  if (manusApiKey) {
    try {
      console.log(`Connecting to Manus API (profile: ${manusAgentProfile})...`);
      const userPrompt = `${auditSystemPrompt}

Объект для анализа: ${queryDetails}

${ScrapedPageContext}

ВЕРНИ ТОЛЬКО JSON. Никакого markdown, никаких пояснений.`;
      const manusText = await runManusAudit({ prompt: userPrompt });
      if (manusText) {
        const jsonStr = extractBalancedJson(manusText);
        rawAuditData = JSON.parse(jsonStr);
        liveAuditCompleted = true;
        console.log("Manus successfully completed audit.");
      }
    } catch (manusError) {
      console.error("Manus API Error, falling back to next provider:", manusError);
    }
  }

  // If Anthropic (Claude) is configured, prioritize it
  if (!liveAuditCompleted && anthropic) {
    try {
      const model = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022";
      console.log(`Connecting to Claude for audit using model: ${model}...`);
      
      const systemPrompt = `ROLE & OBJECTIVE:
Ты — автономный ИИ-аудитор компании DonTech. Твоя цель — провести бескомпромиссный, жесткий и точечный технико-юридический аудит переданного цифрового актива (это может быть веб-сайт, профиль Instagram, сообщество ВКонтакте или Telegram-канал). Ты действуешь автономно: сам переходишь по ссылкам, скроллишь контент, анализируешь посты, био, формы и юридические документы. На выходе ты обязан вернуть строго структурированный JSON.

ИНСТРУКЦИЯ ПО АВТОНОМНОЙ НАВИГАЦИИ:
Определи тип переданной ссылки (Сайт, Instagram, VK, Telegram) и действуй по соответствующему протоколу:
- Если это Сайт: изучи главную, страницы контактов и политики. Найди все формы сбора данных.
- Если это Instagram/VK/Telegram: изучи описание профиля (био), закрепленные посты, меню, ссылки в шапке и последние 10-15 постов на предмет скрытой рекламы, оформления, контента и виральности.

КРИТЕРИИ АНАЛИЗА ПО ТИПАМ АКТИВОВ:

А) ДЛЯ ВЕБ-САЙТОВ:
1. ЮРИДИЧЕСКИЙ КОМПЛАЕНС (ФЗ-152, ФЗ "О РЕКЛАМЕ", ЗоЗПП) (legal_audit): чекбоксы согласий в лид-формах, cookie-плашки, реквизиты, защита прав потребителей. Помещается в legal_audit (оценка: scores.legal).
2. SEO ОПТИМИЗАЦИЯ (optimization_audit): мета-теги Title/Description, теги h1-h3, теги alt для картинок, битые ссылки. Помещается в optimization_audit (оценка: scores.optimization).
3. GEO-ЛОКАЛИЗАЦИЯ (geo_audit): региональная привязка, интерактивная карта, адресной блок, телефоны регионов. Помещается в geo_audit (оценка: scores.geo).

Б) ДЛЯ СОЦИАЛЬНЫХ СЕТЕЙ (VK, TELEGRAM, INSTAGRAM):
1. ОФОРМЛЕНИЕ И ДИЗАЙН (записывается в legal_audit):
   - Оценивай художественный и маркетинговый дизайн (аватар, обложка сообщества, верстка меню, закрепленные плашки, Taplink/мультиссылки, визуальный шум или перегруз деталей, адаптивность элементов под экраны телефонов). Помещается в legal_audit (оценка: scores.legal).
   - Инкорпорируй в этот раздел уязвимости в оформлении, такие как неверное указание юридических реквизитов (нарушения ст. 9 Закона о защите прав потребителей).
2. АНАЛИЗ КОНТЕНТА И СТРУКТУРЫ (записывается in optimization_audit):
   - Оценивай читаемость публикаций, логическое деление на абзацы, рубрикаторы, уникальные хэштеги для навигации, форматирование текстов (жирный/моно/цитаты), регулярность постинга, Tone of Voice (монотонный или цепляющий), наличие специального УТП. Помещается в optimization_audit (оценка: scores.optimization).
3. ВИРАЛЬНОСТЬ И ОХВАТЫ (записывается в geo_audit):
   - Оценивай использование коротких вертикальных видео (Instagram Reels, VK Клипы, Shorts), интерактивных механик (опросы, викторины, игры-тесты), посевы, хэштеги, призывы к действию (CTA), стимулы комментирования и распространения, вовлекающие лид-магниты. Помещается в geo_audit (оценка: scores.geo).
   - Сюда же прикрепляй правовые риски виральных/рекламных интеграций без маркировки (отсутствие erid у постов).

ФОРМАТ ВЫХОДНЫХ ДАННЫХ (СТРОГИЙ JSON):
Возвращай СТРОГО валидный JSON-объект на русском языке. Никаких markdown-кавычек (\`\`\`json), никаких приветствий и пояснений до или после кода. Только чистая структура:

{
  "asset_info": {
    "type": "website | instagram | vk | telegram",
    "url": "\${targetUrl}",
    "audit_date": "\${new Date().toLocaleDateString(\\"ru-RU\\")}"
  },
  "audit_summary": "Жесткое, сухое экспертное заключение. Укажи главные дыры актива, для сайтов — юридические риски, для соцсетей — проблемы оформления, контента и виральности, а также потенциальные штрафы в рублях, которые светят владельцу.",
  "scores": {
    "legal": 0,
    "optimization": 0,
    "geo": 0
  },
  "legal_audit": {
    "issues": [
      {
        "title": "Проблема по оформлению/дизайну (соцсети) или закон ФЗ-152 (сайты)",
        "description": "Что именно не так, детальный разбор ошибок.",
        "severity": "critical | warning",
        "fix_step": "Пошаговое практическое руководство по исправлению."
      }
    ]
  },
  "optimization_audit": {
    "issues": [
      {
        "title": "Проблема с контентом/УТП/постингом (соцсети) или SEO (сайты)",
        "description": "Пояснение.",
        "severity": "critical | warning",
        "fix_step": "Готовое руководство по исправлению."
      }
    ]
  },
  "geo_audit": {
    "issues": [
      {
        "title": "Уязвимость виральности/активности/маркировки (соцсети) или GEO (сайты)",
        "description": "Анализ.",
        "severity": "critical | warning",
        "fix_step": "Пошаговый план внедрения лучшей практики."
      }
    ]
  }
}`;
 
      const response = await anthropic.messages.create({
        model,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Пожалуйста, сгенерируйте комплексный аудит для актива: ${queryDetails} строго по указанной схеме JSON. Предоставьте развернутые, реалистичные и грамотные технические и юридические фиксы, адаптированные под платформу.
            
            ${ScrapedPageContext}`,
          },
        ],
      });
 
      if (response && response.content && response.content[0]) {
        const textContent = response.content[0].type === "text" ? response.content[0].text : "";
        const jsonStr = extractBalancedJson(textContent);
        rawAuditData = JSON.parse(jsonStr);
        liveAuditCompleted = true;
        console.log("Claude successfully audited site! Parsed JSON response.");
      }
    } catch (anthropicError) {
      console.error("Anthropic Claude API Error, trying fallback to Gemini:", anthropicError);
    }
  }
 
  // If Anthropic was not run (or failed) and Gemini is configured, fall back to Gemini
  if (!liveAuditCompleted && ai) {
    try {
      console.log("Connecting to Gemini for audit...");
      const prompt = `ROLE & OBJECTIVE:
Ты — автономный ИИ-аудитор компании DonTech. Твоя цель — провести бескомпромиссный, жесткий и точечный технико-юридический аудит переданного цифрового актива (это может быть веб-сайт, профиль Instagram, сообщество ВКонтакте или Telegram-канал). Ты действуешь автономно: сам переходишь по ссылкам, скроллишь контент, анализируешь посты, био, формы и юридические документы. На выходе ты обязан вернуть строго структурированный JSON.

ИНСТРУКЦИЯ ПО АВТОНОМНОЙ НАВИГАЦИИ:
Определи тип переданной ссылки (Сайт, Instagram, VK, Telegram) и действуй по соответствующему протоколу:
- Если это Сайт: изучи главную, страницы контактов и политики. Найди все формы сбора данных.
- Если это Instagram/VK/Telegram: изучи описание профиля (био), закрепленные посты, меню, ссылки в шапке и последние 10-15 постов на предмет скрытой рекламы, оформления, контента и виральности.

КРИТЕРИИ АНАЛИЗА ПО ТИПАМ АКТИВОВ:

А) ДЛЯ ВЕБ-САЙТОВ:
1. ЮРИДИЧЕСКИЙ КОМПЛАЕНС (ФЗ-152, ФЗ "О РЕКЛАМЕ", ЗоЗПП) (legal_audit): чекбоксы согласий в лид-формах, cookie-плашки, реквизиты, защита прав потребителей. Помещается в legal_audit (оценка: scores.legal).
2. SEO ОПТИМИЗАЦИЯ (optimization_audit): мета-теги Title/Description, теги h1-h3, теги alt для картинок, битые ссылки. Помещается в optimization_audit (оценка: scores.optimization).
3. GEO-ЛОКАЛИЗАЦИЯ (geo_audit): региональная привязка, интерактивная карта, адресной блок, телефоны регионов. Помещается в geo_audit (оценка: scores.geo).

Б) ДЛЯ СОЦИАЛЬНЫХ СЕТЕЙ (VK, TELEGRAM, INSTAGRAM):
1. ОФОРМЛЕНИЕ И ДИЗАЙН (записывается в legal_audit):
   - Оценивай художественный и маркетинговый дизайн (аватар, обложка сообщества, верстка меню, закрепленные плашки, Taplink/мультиссылки, визуальный шум или перегруз деталей, адаптивность элементов под экраны телефонов). Помещается в legal_audit (оценка: scores.legal).
   - Инкорпорируй в этот раздел уязвимости в оформлении, такие как неверное указание юридических реквизитов (нарушения ст. 9 Закона о защите прав потребителей).
2. АНАЛИЗ КОНТЕНТА И СТРУКТУРЫ (записывается в optimization_audit):
   - Оценивай читаемость публикаций, логическое деление на абзацы, рубрикаторы, уникальные хэштеги для навигации, форматирование текстов (жирный/моно/цитаты), регулярность постинга, Tone of Voice (монотонный или цепляющий), наличие специального УТП. Помещается в optimization_audit (оценка: scores.optimization).
3. ВИРАЛЬНОСТЬ И ОХВАТЫ (записывается в geo_audit):
   - Оценивай использование коротких вертикальных видео (Instagram Reels, VK Клипы, Shorts), интерактивных механик (опросы, викторины, игры-тесты), посевы, хэштеги, призывы к действию (CTA), стимулы комментирования и распространения, вовлекающие лид-магниты. Помещается в geo_audit (оценка: scores.geo).
   - Сюда же прикрепляй правовые риски виральных/рекламных интеграций без маркировки (отсутствие erid у постов).

ФОРМАТ ВЫХОДНЫХ ДАННЫХ (СТРОГИЙ JSON):
Возвращай СТРОГО валидный JSON-объект на русском языке.

Объект для анализа: ${queryDetails}

${ScrapedPageContext}`;
 
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              asset_info: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  url: { type: Type.STRING },
                  audit_date: { type: Type.STRING }
                },
                required: ["type", "url", "audit_date"]
              },
              audit_summary: { type: Type.STRING },
              scores: {
                type: Type.OBJECT,
                properties: {
                  legal: { type: Type.INTEGER },
                  optimization: { type: Type.INTEGER },
                  geo: { type: Type.INTEGER }
                },
                required: ["legal", "optimization", "geo"]
              },
              legal_audit: {
                type: Type.OBJECT,
                properties: {
                  issues: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        severity: { type: Type.STRING },
                        fix_step: { type: Type.STRING }
                      },
                      required: ["title", "description", "severity", "fix_step"]
                    }
                  }
                },
                required: ["issues"]
              },
              optimization_audit: {
                type: Type.OBJECT,
                properties: {
                  issues: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        severity: { type: Type.STRING },
                        fix_step: { type: Type.STRING }
                      },
                      required: ["title", "description", "severity", "fix_step"]
                    }
                  }
                },
                required: ["issues"]
              },
              geo_audit: {
                type: Type.OBJECT,
                properties: {
                  issues: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        severity: { type: Type.STRING },
                        fix_step: { type: Type.STRING }
                      },
                      required: ["title", "description", "severity", "fix_step"]
                    }
                  }
                },
                required: ["issues"]
              }
            },
            required: [
              "asset_info",
              "audit_summary",
              "scores",
              "legal_audit",
              "optimization_audit",
              "geo_audit"
            ]
          }
        }
      });
 
      if (response && response.text) {
        const jsonStr = extractBalancedJson(response.text.trim());
        rawAuditData = JSON.parse(jsonStr);
        liveAuditCompleted = true;
      }
    } catch (apiError) {
      console.error("Gemini API Error, falling back to prebuilt template:", apiError);
    }
  }

  // Transform raw data (of either format) to standard output expected by template and UI
  const auditResult = transformAudit(rawAuditData);

  const htmlContent = generateHtmlReport(auditResult, targetUrl);

  // Attempt PDF compilation using Puppeteer (ленивая загрузка, без верхнеуровневого import)
  try {
    const puppeteer = await loadPuppeteer();
    if (!puppeteer) throw new Error("Puppeteer unavailable in this environment");
    const browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm",
      },
    });

    await browser.close();

    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");
    return res.json({
      success: true,
      fallback: false,
      data: auditResult,
      html: htmlContent,
      pdfBase64,
      filename: `DonTech_Audit_${targetUrl.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
    });
  } catch (pdfError) {
    console.error("Puppeteer launch or PDF conversion failed in container environment:", pdfError);

    // Dynamic elegant fallback: return metadata + html payload
    return res.json({
      success: true,
      fallback: true,
      data: auditResult,
      html: htmlContent,
      pdfBase64: null,
      filename: `DonTech_Audit_${targetUrl.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
    });
  }
});

// Setup dev/production environment handlers
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DonTech website auditor server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
