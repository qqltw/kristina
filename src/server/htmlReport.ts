import { detectAssetType } from "./auditFallbacks";

// Generate styled HTML template for export (Apple Premium Aesthetic)
export function generateHtmlReport(data: any, siteUrl: string): string {
  const isSocial = detectAssetType(siteUrl) !== "website";
  const geoTitle = isSocial ? "Региональные маркеры" : "Региональные факторы (GEO)";
  const optTitle = isSocial ? "Поисковая SMO оптимизация" : "Поисковое сканирование (SEO)";

  const violationsFZ152Html = data.violationsFZ152
    .map(
      (v: any) => `
    <div class="card bg-white border border-[#e8e4dc] rounded-2xl p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#f3efe6] pb-3 mb-4">
        <span class="text-xs font-semibold uppercase tracking-wider text-[#706b64]">${v.code}</span>
        <span class="px-2.5 py-1 text-xs font-medium rounded-full ${
          v.risk === "Критический" || v.risk === "Высокий"
            ? "bg-red-50 text-red-700 border border-red-100"
            : "bg-[#f3efe6] text-[#706b64]"
        }">${v.risk} риск</span>
      </div>
      <p class="text-[15px] font-medium text-[#2c2a27] mb-3 leading-relaxed">${v.description}</p>
      <div class="bg-[#fdfbf7] border border-[#e8e4dc] rounded-xl p-4 mt-3">
        <div class="text-xs font-semibold text-[#706b64] uppercase tracking-wider mb-2">Руководство по исправлению</div>
        <pre class="text-xs font-mono text-[#4a4641] overflow-x-auto whitespace-pre-wrap leading-relaxed">${v.fix}</pre>
      </div>
    </div>`
    )
    .join("");

  const seoIssuesHtml = data.seoIssues
    .map(
      (v: any) => `
    <div class="card bg-white border border-[#e8e4dc] rounded-2xl p-6 mb-6 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#f3efe6] pb-3 mb-4">
        <span class="text-xs font-semibold uppercase tracking-wider text-[#706b64]">${v.element}</span>
        <span class="px-2.5 py-1 text-xs font-medium rounded-full ${
          v.status === "Критично"
            ? "bg-red-50 text-red-700 border border-red-100"
            : "bg-amber-50 text-amber-700 border border-amber-100"
        }">${v.status}</span>
      </div>
      <p class="text-[15px] text-[#2c2a27] mb-3 leading-relaxed">${v.description}</p>
      <div class="bg-[#fdfbf7] border border-[#e8e4dc] rounded-xl p-4 mt-3">
        <pre class="text-xs font-mono text-[#4a4641] overflow-x-auto whitespace-pre-wrap leading-relaxed">${v.fix}</pre>
      </div>
    </div>`
    )
    .join("");

  const geoIssuesHtml = data.geoIssues
    .map(
      (v: any) => `
    <div class="card bg-white border border-[#e8e4dc] rounded-2xl p-6 mb-6 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#f3efe6] pb-3 mb-4">
        <span class="text-xs font-semibold uppercase tracking-wider text-[#706b64]">${v.name}</span>
        <span class="px-2.5 py-1 text-xs font-medium rounded-full ${
          v.status === "Критично"
            ? "bg-red-50 text-red-700 border border-red-100"
            : "bg-[#f3efe6] text-[#706b64]"
        }">${v.status}</span>
      </div>
      <p class="text-[15px] text-[#2c2a27] mb-3 leading-relaxed">${v.description}</p>
      <div class="bg-[#fdfbf7] border border-[#e8e4dc] rounded-xl p-4 mt-3 text-xs font-mono text-[#4a4641] whitespace-pre-wrap leading-relaxed">${v.fix}</div>
    </div>`
    )
    .join("");

  const checklistHtml = data.checklist
    .map(
      (v: any) => `
    <div class="step-item" style="display: flex; gap: 16px; padding: 16px 0; border-bottom: 1px solid #f3efe6;">
      <div class="step-badge" style="width: 28px; height: 28px; border-radius: 50%; background: #f3efe6; color: #706b64; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; font-family: monospace;">${v.step}</div>
      <div>
        <h4 class="step-title" style="font-size: 14px; font-weight: 600; color: #2c2a27; margin: 0 0 4px 0;">${v.title}</h4>
        <p class="step-action" style="font-size: 13px; color: #706b64; margin: 0;">${v.action}</p>
      </div>
    </div>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Отчет технико-юридического аудита - ${siteUrl}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
      body {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        background-color: #fbfbf9;
        color: #2c2a27;
        margin: 0;
        padding: 40px;
        line-height: 1.5;
      }
      .container {
        max-width: 850px;
        margin: 0 auto;
        background: #ffffff;
        border: 1px solid #e8e4dc;
        border-radius: 24px;
        padding: 48px;
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.02);
      }
      .header {
        border-bottom: 1px solid #f3efe6;
        padding-bottom: 32px;
        margin-bottom: 32px;
      }
      .title {
        font-size: 28px;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: #1c1a17;
        margin: 0 0 8px 0;
      }
      .subtitle {
        font-size: 15px;
        color: #706b64;
        margin: 0;
      }
      .score-box {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        background: #fdfbf7;
        border: 1px solid #e8e4dc;
        padding: 12px 20px;
        border-radius: 16px;
        margin-top: 16px;
      }
      .score-circle {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #2c2a27;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
      }
      .score-text {
        font-size: 14px;
        font-weight: 600;
        color: #2c2a27;
      }
      .summary-box {
        background: #fdfbf7;
        border-left: 3px solid #1c1a17;
        padding: 20px;
        border-radius: 0 16px 16px 0;
        margin-bottom: 32px;
        font-size: 15px;
        color: #2c2a27;
        line-height: 1.6;
      }
      .section-title {
        font-size: 18px;
        font-weight: 700;
        color: #1c1a17;
        border-bottom: 1px solid #f3efe6;
        padding-bottom: 12px;
        margin: 32px 0 20px 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .card {
        background: #ffffff;
        border: 1px solid #e8e4dc;
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 20px;
      }
      .card-desc {
        font-size: 14px;
        color: #2c2a27;
        margin: 0 0 16px 0;
        line-height: 1.6;
      }
      .footer {
        margin-top: 48px;
        border-top: 1px solid #f3efe6;
        padding-top: 24px;
        text-align: center;
        font-size: 11px;
        color: #706b64;
      }
    </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">Аудит цифрового актива</h1>
      <p class="subtitle">Отчет подготовлен ИИ-аудитором DonTech для ресурса: <strong>${siteUrl}</strong></p>
      <div class="score-box">
        <div class="score-circle">${data.score || 0}</div>
        <div class="score-text">Общий показатель комплаенса</div>
      </div>
    </div>

    <div class="summary-box">
      <strong>Резюме аудита:</strong><br/>
      ${data.summary || ""}
    </div>

    <div class="section-title">Правовой аудит (ФЗ-152, Закон о рекламе, ЗоЗПП)</div>
    ${violationsFZ152Html || '<div class="card"><p class="card-desc">Критических несоответствий не обнаружено.</p></div>'}

    <div class="section-title">${optTitle}</div>
    ${seoIssuesHtml || '<div class="card"><p class="card-desc">Замечаний по оптимизации не выявлено.</p></div>'}

    <div class="section-title">${geoTitle}</div>
    ${geoIssuesHtml || '<div class="card"><p class="card-desc">Факторы настроены корректно.</p></div>'}

    <div class="section-title">Инструкция по устранению замечаний</div>
    <div class="card" style="padding: 12px 24px;">
      ${checklistHtml}
    </div>

    <div class="footer">
      ООО "ДонТех" &copy; ${new Date().getFullYear()} &bull; Все права защищены &bull; Конфиденциальный отчет
    </div>
  </div>
</body>
</html>
  `;
}
