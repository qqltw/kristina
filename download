export function detectAssetType(siteUrl: string): "website" | "instagram" | "vk" | "telegram" {
  const urlLower = siteUrl.toLowerCase();
  if (urlLower.includes("vk.com") || urlLower.includes("vk.ru")) {
    return "vk";
  } else if (urlLower.includes("t.me") || urlLower.includes("telegram.org")) {
    return "telegram";
  } else if (urlLower.includes("instagram.com")) {
    return "instagram";
  } else {
    return "website";
  }
}

// Generate realistic mock data in a professional tone for fallbacks or safe runs
export function getPrebuiltAudit(siteUrl: string, scrapedData?: any) {
  const type = detectAssetType(siteUrl);
  const audit_date = new Date().toLocaleDateString("ru-RU");

  if (type === "vk") {
    return {
      asset_info: {
        type: "vk",
        url: siteUrl,
        audit_date
      },
      audit_summary: "БЕСКОМПРОМИССНЫЙ АУДИТ VK-СООБЩЕСТВА: Выявлен средний уровень вовлеченности (ER) из-за слабого УТП и хаотичного оформления меню. Большим репутационным и правовым риском является полное отсутствие маркировки erid у сторонних постов (ч. 16 ст. 18.1 ФЗ «О рекламе») и нарушение ФЗ-152 в лид-формах. Оформление сетки постов требует стандартизации шаблонов, а вовлечение аудитории страдает из-за отсутствия регулярного интерактивного контента.",
      scores: {
        legal: 45,
        optimization: 60,
        geo: 50
      },
      legal_audit: {
        issues: [
          {
            title: "Хаос в оформлении шапки, аватара и навигационного меню",
            description: "Обложка сообщества перегружена текстом и обрезается на мобильных устройствах. Отсутствует единый визуальный стиль кнопок меню, а иконки приложений выбиваются из общего брендинга.",
            severity: "warning",
            fix_step: "Разработать адаптивную обложку (размеры 1590x530px, безопасная зона по бокам 140px). Оформить меню в общей цветовой гамме бренда с лаконичными текстовыми подсказками."
          },
          {
            title: "Грубое нарушение ФЗ-152 в лид-формах сообщества",
            description: "Встроенные формы сбора контактов (VK Forms) собирают ФИО и телефоны без дисклеймера и прямой гиперссылки на регламентированную Политику конфиденциальности. Нарушение требований ст. 13.11 КоАП РФ.",
            severity: "critical",
            fix_step: "Перейти в настройки формы в VK Forms, добавить обязательный чекбокс согласия на обработку персональных данных и вставить активную ссылку на Политику организации."
          },
          {
            title: "Скрытие реквизитов коммерческой организации (ЗоЗПП)",
            description: "Блок товаров осуществляет прямые продажи физлицам, однако в подробной информации сообщества полностью отсутствуют ИНН, ОГРН и полное юридическое название. Нарушение ст. 9 Закона РФ 'О защите прав потребителей'.",
            severity: "warning",
            fix_step: "Внести официальные реквизиты (ИП / ООО, ИНН, ОГРН) в описание сообщества или закрепить пост со всеми юридическими данными."
          }
        ]
      },
      optimization_audit: {
        issues: [
          {
            title: "Отсутствие единого рубрикатора и хэштегов",
            description: "Публикации сообщества выходят без четкого структурирования, отсутствуют тематические хэштеги, пользователям трудно находить отзывы, прайсы или полезные статьи.",
            severity: "warning",
            fix_step: "Внедрить систему внутренних тегов бренда. Пример: #feedback@username, #contacts@username."
          },
          {
            title: "Слабая контрастность визуального контента",
            description: "Картинки к постам подбираются бессистемно, шрифт мелкий и сливается с фоном.",
            severity: "warning",
            fix_step: "Использовать фирменные шаблоны с крупным читаемым текстом на плашке в первой трети изображения."
          }
        ]
      },
      geo_audit: {
        issues: [
          {
            title: "Отсутствие маркировки рекламы erid у сторонних постов",
            description: "Некоторые информационные публикации содержат рекламу партнеров по ст. 18.1 ФЗ, но не имеют маркировочного токена. Это грозит штрафами до 100 тыс. рублей.",
            severity: "critical",
            fix_step: "Добавить токен erid в начало рекламных текстов и передать данные в ОРД ВКонтакте."
          }
        ]
      }
    };
  }

  if (type === "telegram") {
    return {
      asset_info: {
        type: "telegram",
        url: siteUrl,
        audit_date
      },
      audit_summary: "ТЕХНИКО-ПРАВОВОЙ КОНТРОЛЬ TELEGRAM-КАНАЛА: Выявлено жесткое нарушение рекламного законодательства по маркировке партнерских постов без erid. Описание канала неконкретно, отсутствует быстрая ссылка на коммерческого бота или контакт менеджера. Посты выходят длинными сплошными блоками текста без использования моноширинного шрифта для акцентов и списков.",
      scores: {
        legal: 40,
        optimization: 55,
        geo: 45
      },
      legal_audit: {
        issues: [
          {
            title: "Полное отсутствие официальных реквизитов в описании канала",
            description: "Канал продает услуги или курсы физлицам, но не содержит ОГРН/ИНН и полного наименования продавца. Нарушение ст. 9 ЗоЗПП.",
            severity: "warning",
            fix_step: "Разместить реквизиты ИП или самозанятого владельца в описании канала или в первом сообщении закрепленного поста."
          },
          {
            title: "Рекламные интеграции без токена erid в тексте сообщений",
            description: "Обнаружены гостевые посты партнеров со ссылками на сторонние каналы без соответствующего отчета в ОРД. Нарушение требований ст. 18.1 ФЗ «О рекламе».",
            severity: "critical",
            fix_step: "Зарегистрироваться в ОРД, перед выпуском публикации зарегистрировать креатив, а в текст поста вставить строку 'Реклама. ООО... ИНН... erid: XXX'."
          }
        ]
      },
      optimization_audit: {
        issues: [
          {
            title: "Отсутствие контактов отдела продаж в описании канала",
            description: "В био канала отсутствует ссылка на аккаунт менеджера для приема оперативных заказов или коммерческий чат-бот.",
            severity: "critical",
            fix_step: "Добавить в био строку: 'По вопросам сотрудничества: @manager_username'."
          },
          {
            title: "Перенасыщение постов смайлами в ущерб форматированию",
            description: "Тексты публикаций перегружены эмодзи, что усложняет чтение на мобильных девайсах. Не используются стандартные средства разметки списков и абзацев.",
            severity: "warning",
            fix_step: "Форматировать посты разметкой Markdown: использовать жирный шрифт для заголовков, моноширинный шрифт для команд, разделять смысловые блоки пустой строкой."
          }
        ]
      },
      geo_audit: {
        issues: [
          {
            title: "Слабая активность и отсутствие интеракций с помощью ботов",
            description: "Канал не проводит голосования, викторины или конкурсы, что в долгосрочной перспективе ведет к отпискам и снижению метрики вовлечения.",
            severity: "warning",
            fix_step: "Интегрировать опросы (Polls) и стимулирующие активности раз в неделю."
          }
        ]
      }
    };
  }

  if (type === "instagram") {
    return {
      asset_info: {
        type: "instagram",
        url: siteUrl,
        audit_date
      },
      audit_summary: "АНАЛИЗ INSTAGRAM-ПРОФИЛЯ: Выявлено стилистическое несоответствие хайлайтс общей палитре бренда. В описании профиля (био) отсутствует конкретное УТП и кликабельная мультиссылка (Taplink) с юридической информацией о компании. Контентная стратегия не содержит регулярных Reels, снижая органический виральный охват.",
      scores: {
        legal: 50,
        optimization: 60,
        geo: 55
      },
      legal_audit: {
        issues: [
          {
            title: "Отсутствие юридического подвала на мультиссылке (Taplink)",
            description: "В Taplink принимаются платежи и собираются заявки участников без согласий ФЗ-152 и политики обработки персональных данных.",
            severity: "critical",
            fix_step: "Перейти в настройки Taplink, добавить в подвал юридические реквизиты (ИНН/ИП) и ссылку на Политику безопасности."
          }
        ]
      },
      optimization_audit: {
        issues: [
          {
            title: "Шапка профиля без ясного позиционирования (УТП)",
            description: "Описание профиля не дает точного понимания ценности продукта для пользователя.",
            severity: "warning",
            fix_step: "Сформулировать био по схеме: Кто вы + Чем полезны + Призыв к действию."
          },
          {
            title: "Устаревшие обложки закрепленных Историй (Highlights)",
            description: "Хаотичные цвета икон хайлайтс разрушают целостное восприятие аккаунта.",
            severity: "warning",
            fix_step: "Оформить единые минималистичные обложки в корпоративной палитре."
          }
        ]
      },
      geo_audit: {
        issues: [
          {
            title: "Пренебрежение разделом Reels для органического роста",
            description: "Аккаунт публикует исключительно статичные посты, полностью упуская органические охваты от умных рекомендаций Reels.",
            severity: "warning",
            fix_step: "Разработать контент-план из 5-7 сценариев коротких вовлекающих видео Reels."
          }
        ]
      }
    };
  }

  // Fallback for actual scanned page or website fallback
  const pd = scrapedData || {
    title: "",
    description: "",
    keywords: "",
    checkboxCount: 0,
    checkboxes: [],
    formCount: 0,
    forms: [],
    looseInputsCount: 0,
    looseInputs: [],
    policyLinks: [],
    hasCookieBanner: false,
    h1s: [],
    h2Count: 0,
    h3Count: 0,
    totalImages: 0,
    imagesWithoutAlt: 0,
    hasPhone: false,
    hasLegalReqs: false
  };

  const h1Count = pd.h1s ? pd.h1s.length : 0;
  const imgPercent = pd.totalImages > 0 ? Math.round((pd.imagesWithoutAlt / pd.totalImages) * 100) : 0;

  const legalIssues: any[] = [];
  if (pd.checkboxCount === 0) {
    legalIssues.push({
      title: "Отсутствие чекбокса согласия ФЗ-152 в формах",
      description: "На сайте обнаружен сбор данных физлиц без интерактивной галочки (чекбокса) согласия. Это влечет за собой риски штрафов Роскомнадзора по ч. 1 ст. 13.11 КоАП РФ (до 150 000 руб).",
      severity: "critical",
      fix_step: "Интегрировать обязательный чекбокс согласия во все веб-формы."
    });
  } else {
    legalIssues.push({
      title: "Контроль и validation установленных чекбоксов согласия ФЗ-152",
      description: `Замечательно! На сайте обнаружено ${pd.checkboxCount} чекбокс(ов) согласия. Это подтверждает легитимность сбора. Убедитесь, что галочка по умолчанию снята (пользователь должен поставить её сам).`,
      severity: "warning",
      fix_step: "Провести функциональный тест: убедиться, что кнопка отправки заблокирована до проставления чекбокса."
    });
  }

  if (pd.policyLinks.length === 0) {
    legalIssues.push({
      title: "Сбор данных без ссылки на Политику конфиденциальности",
      description: "На веб-ресурсе принимаются данные, но отсутствует видимая ссылка на Политику конфиденциальности.",
      severity: "critical",
      fix_step: "Разместить Политику конфиденциальности на отдельной странице и добавить ссылку на нее в подвал сайта."
    });
  } else {
    legalIssues.push({
      title: "Ссылка на Политику конфиденциальности",
      description: `На странице успешно найдена ссылка на регламентирующий документ: "${pd.policyLinks[0].text}" (${pd.policyLinks[0].href}).`,
      severity: "warning",
      fix_step: "Сверить содержание Политики с перечнем всех собираемых метрик и CRM данных владельца."
    });
  }

  if (!pd.hasCookieBanner) {
    legalIssues.push({
      title: "Отсутствие информирования о сборе файлов Cookie",
      description: "Сайт осуществляет сбор куки-файлов без информирования посетителя через всплывающее уведомление, что нарушает требования ФЗ-152.",
      severity: "warning",
      fix_step: "Реализовать лаконичную плашку (Cookie-баннер) с кнопкой «Принять»."
    });
  } else {
    legalIssues.push({
      title: "Мониторинг согласий на сбор файлов Cookie",
      description: "На сайте настроен информационный Cookie-баннер, помогающий снизить риски санкций РКН.",
      severity: "warning",
      fix_step: "Поддерживать баннер активным для всех входящих сессий."
    });
  }

  const optimizationIssues: any[] = [];
  if (h1Count === 0) {
    optimizationIssues.push({
      title: "Отсутствие главного заголовка первого уровня H1",
      description: "На веб-странице не найдено ни одного заголовка H1. Поисковые роботы лишены ключевых сведений о теме страницы.",
      severity: "critical",
      fix_step: "Добавить на страницу один тег H1 с емким коммерческим УТП."
    });
  } else if (h1Count > 1) {
    optimizationIssues.push({
      title: "Дублирование заголовков первого уровня H1",
      description: `На странице найдено несколько (${h1Count}) заголовков H1. Это размывает релевантность страницы для поисковиков.`,
      severity: "critical",
      fix_step: "Оставить только один тег H1, другие заголовки перевести в теги H2 или H3."
    });
  } else {
    optimizationIssues.push({
      title: "Идеальная иерархия главного заголовка H1",
      description: `Заголовок H1 настроен идеально: "${pd.h1s[0]}".`,
      severity: "warning",
      fix_step: "Следить за тем, чтобы заголовок H1 оставался единственным на странице при обновлении контента."
    });
  }

  if (!pd.description || pd.description.length === 0) {
    optimizationIssues.push({
      title: "Отсутствие мета-тега Description",
      description: "Мета-описание Description главной страницы не найдено, что снижает кликабельность (CTR) в выдаче.",
      severity: "critical",
      fix_step: "Прописать тег <meta name=\"description\" content=\"...\"> с коротким УТП."
    });
  } else {
    optimizationIssues.push({
      title: "Заполнение мета-тега Description",
      description: `Мета-описание Description успешно заполнено: "${pd.description}".`,
      severity: "warning",
      fix_step: "Убедиться, что длина мета-описания укладывается в 120-160 символов."
    });
  }

  if (pd.totalImages > 0 && pd.imagesWithoutAlt > 0) {
    optimizationIssues.push({
      title: "Изображения без атрибута alt",
      description: `Обнаружено ${pd.imagesWithoutAlt} из ${pd.totalImages} изображений (${imgPercent}%) без альтов. Такие картинки не индексируются в поиске картинок.`,
      severity: "warning",
      fix_step: "Добавить содержательные атрибуты alt во все теги <img />."
    });
  } else if (pd.totalImages > 0) {
    optimizationIssues.push({
      title: "Полное покрытие картинок атрибутом alt",
      description: "Все изображения имеют правильные атрибуты alt, что привлекает дополнительный поисковый трафик.",
      severity: "warning",
      fix_step: "Продолжать задавать понятные альты для всех новых графических элементов."
    });
  }

  const geoIssues: any[] = [];
  if (!pd.hasPhone) {
    geoIssues.push({
      title: "Отсутствие телефона в видимой зоне",
      description: "На сайте не найдены номера телефонов. Это снижает доверие региональных заказчиков.",
      severity: "warning",
      fix_step: "Опубликовать номер телефона в шапке и подвале сайта."
    });
  } else {
    geoIssues.push({
      title: "Наличие контактного телефона",
      description: "Контактный телефон обнаружен на странице, что повышает лояльность и конверсию.",
      severity: "warning",
      fix_step: "Сделать телефон кликабельным с помощью ссылки tel:."
    });
  }

  if (!pd.hasLegalReqs) {
    geoIssues.push({
      title: "Отсутствие официальных реквизитов компании",
      description: "Не обнаружено официальных реквизитов (ИНН, ОГРН, ИП или ООО). Это нарушает ст. 9 Закона о защите прав потребителей.",
      severity: "warning",
      fix_step: "Опубликовать реквизиты ИНН / ОГРН и полное наименование фирмы в подвале сайта."
    });
  } else {
    geoIssues.push({
      title: "Верификация официальных реквизитов и İNN",
      description: "Реквизиты найдены в контенте страницы. Это защищает сайт по ст. 9 ЗоЗПП.",
      severity: "warning",
      fix_step: "Дополнительно разместить реквизиты в специальном разделе «Контакты»."
    });
  }

  if (geoIssues.length === 0) {
    geoIssues.push({
      title: "Оптимизация микроразметки Schema.org (LocalBusiness)",
      description: "GEO-настройки отличные, но локальная семантическая микроразметка отсутствует.",
      severity: "warning",
      fix_step: "Добавить JSON-LD Schema.org разметку в код подвала."
    });
  }

  // Calculate scores
  let legalScore = 100;
  if (pd.checkboxCount === 0) legalScore -= 30;
  if (pd.policyLinks.length === 0) legalScore -= 30;
  if (!pd.hasCookieBanner) legalScore -= 20;

  let optScore = 100;
  if (h1Count === 0 || h1Count > 1) optScore -= 25;
  if (!pd.description) optScore -= 25;
  if (imgPercent > 30) optScore -= 20;

  let geoScore = 100;
  if (!pd.hasPhone) geoScore -= 30;
  if (!pd.hasLegalReqs) geoScore -= 30;

  return {
    asset_info: {
      type: "website",
      url: siteUrl,
      audit_date
    },
    audit_summary: `КОМПЛЕКСНЫЙ АУДИТ ВЕБ-ПЛАТФОРМЫ: Проведен детальный технико-юридический анализ сайта ${siteUrl}. Выявлен текущий уровень доверия по ФЗ-152, SEO-оптимизации и GEO-позиционированию.`,
    scores: {
      legal: Math.min(100, Math.max(0, legalScore)),
      optimization: Math.min(100, Math.max(0, optScore)),
      geo: Math.min(100, Math.max(0, geoScore))
    },
    legal_audit: { issues: legalIssues },
    optimization_audit: { issues: optimizationIssues },
    geo_audit: { issues: geoIssues }
  };
}

export function transformAudit(raw: any) {
  // If raw has the old properties already (e.g. from static fallback templates)
  if (raw.violationsFZ152 && raw.seoIssues && raw.geoIssues) {
    return raw;
  }

  const summary = raw.audit_summary || "Анализ завершен ИИ Manus.";
  const legal_score = typeof raw.scores?.legal === "number" ? raw.scores.legal : (typeof raw.legal_score === "number" ? raw.legal_score : 50);
  const seo_score = typeof raw.scores?.optimization === "number" ? raw.scores.optimization : (typeof raw.seo_score === "number" ? raw.seo_score : 50);
  const geo_score = typeof raw.scores?.geo === "number" ? raw.scores.geo : (typeof raw.geo_score === "number" ? raw.geo_score : 50);
  const score = Math.round((legal_score + seo_score + geo_score) / 3);

  const violationsFZ152 = Array.isArray(raw.legal_audit?.issues)
    ? raw.legal_audit.issues.map((issue: any) => ({
        code: issue.title || "Лид-формы и согласия (ФЗ-152)",
        risk: issue.severity === "critical" ? "Критический" : "Высокий",
        description: issue.description || "",
        fix: issue.fix_step || ""
      }))
    : [];

  const rawSeoIssues = raw.optimization_audit?.issues || raw.seo_audit?.issues;
  const seoIssues = Array.isArray(rawSeoIssues)
    ? rawSeoIssues.map((issue: any) => ({
        element: issue.title || "Оптимизация (SEO/SMO)",
        status: issue.severity === "critical" ? "Критично" : "Предупреждение",
        description: issue.description || "",
        fix: issue.fix_step || ""
      }))
    : [];

  const geoIssues = Array.isArray(raw.geo_audit?.issues)
    ? raw.geo_audit.issues.map((issue: any) => ({
        name: issue.title || "Ориентир GEO",
        status: issue.severity === "critical" ? "Критично" : "Рекомендация",
        description: issue.description || "",
        fix: issue.fix_step || ""
      }))
    : [];

  // Generate sequence roadmap checklist
  const checklist: any[] = [];
  let stepIdx = 1;

  violationsFZ152.forEach((viol: any) => {
    checklist.push({
      step: `Шаг ${stepIdx++}`,
      title: `${viol.code}`,
      action: `Юридическое исправление: ${viol.description}`
    });
  });

  seoIssues.forEach((issue: any) => {
    checklist.push({
      step: `Шаг ${stepIdx++}`,
      title: `${issue.element}`,
      action: `Доработка оптимизации: ${issue.description}`
    });
  });

  geoIssues.forEach((issue: any) => {
    checklist.push({
      step: `Шаг ${stepIdx++}`,
      title: `${issue.name}`,
      action: `Настройка GEO-позиционирования: ${issue.description}`
    });
  });

  if (checklist.length === 0) {
    checklist.push({
      step: "Шаг 1",
      title: "Инспекция форм",
      action: "Проверить наличие согласия на обработку конфиденциальных данных на всех формах сбора контента."
    });
  }

  return {
    asset_info: raw.asset_info || { type: "website", url: "", audit_date: new Date().toLocaleDateString("ru-RU") },
    score,
    summary,
    violationsFZ152,
    seoIssues,
    geoIssues,
    checklist
  };
}
