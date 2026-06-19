import puppeteer from "puppeteer";

// Helper to scrape website elements via Puppeteer for high fidelity audit
export async function scrapeWebsite(url: string) {
  let browser;
  try {
    console.log(`Auditor launching Puppeteer to scrape: ${url}`);
    browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      headless: true,
    });
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 DonTechAuditor/1.0");
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigating with a 15-second timeout
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    const pageData = await page.evaluate(() => {
      // Find all checkboxes
      const checkboxElems = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      const checkboxes = checkboxElems.map(cb => {
        const id = cb.id || '';
        const name = cb.getAttribute('name') || '';
        const isRequired = cb.hasAttribute('required');
        const isChecked = (cb as HTMLInputElement).checked;
        const parentText = cb.parentElement ? cb.parentElement.innerText.substring(0, 150).trim() : '';
        return { id, name, isRequired, isChecked, text: parentText };
      });

      // Find forms
      const formElems = Array.from(document.querySelectorAll('form'));
      const forms = formElems.map(form => {
        const action = form.getAttribute('action') || '';
        const method = form.getAttribute('method') || '';
        const inputs = Array.from(form.querySelectorAll('input, textarea, select')).map(inp => {
          return {
            type: inp.getAttribute('type') || inp.tagName.toLowerCase(),
            name: inp.getAttribute('name') || '',
            required: inp.hasAttribute('required')
          };
        });
        return { action, method, inputCount: inputs.length, inputs };
      });

      // Look for custom loose inputs (like an input without form wrapper)
      const allInputs = Array.from(document.querySelectorAll('input, textarea'));
      const looseInputs = allInputs
        .filter(inp => !inp.closest('form'))
        .map(inp => {
          return {
            type: inp.getAttribute('type') || inp.tagName.toLowerCase(),
            name: inp.getAttribute('name') || '',
            placeholder: inp.getAttribute('placeholder') || ''
          };
        });

      // Find all policy/privacy/agreement links
      const links = Array.from(document.querySelectorAll('a'));
      const policyKeywords = ['privacy', 'policy', 'oferta', 'agreement', 'согласие', 'политик', 'оферт', 'персональн', 'конфиденциальн'];
      const policyLinks = links
        .map(link => {
          return {
            text: link.innerText.trim(),
            href: link.getAttribute('href') || ''
          };
        })
        .filter(linkObj => {
          const t = linkObj.text.toLowerCase();
          const h = linkObj.href.toLowerCase();
          return policyKeywords.some(kw => t.includes(kw) || h.includes(kw));
        })
        .slice(0, 10); // cap to 10 links

      // Detect common cookie banners/preferences words
      const pageTextLower = document.body.innerText.toLowerCase();
      const hasCookieBanner = pageTextLower.includes('cookie') || pageTextLower.includes('куки') || pageTextLower.includes('файлы куки') || !!document.querySelector('[id*="cookie"i], [class*="cookie"i]');

      // Find headings
      const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.innerText.trim()).filter(Boolean);
      const h2Count = document.querySelectorAll('h2').length;
      const h3Count = document.querySelectorAll('h3').length;

      // Images
      const images = Array.from(document.querySelectorAll('img'));
      const totalImages = images.length;
      const imagesWithoutAlt = images.filter(img => !img.getAttribute('alt')?.trim()).length;

      // Phone detector inside text body
      const phoneRegex = /(\+7|8)\s?\(?\d{3}\)?\s?\d{3}-?\d{2}-?\d{2}/i;
      const hasPhone = phoneRegex.test(document.body.innerText);

      // Official legal info (OGRN / INN)
      const hasLegalReqs = /\b(\d{10}|\d{12}|\d{13}|\d{15})\b/.test(document.body.innerText) && (pageTextLower.includes('инн') || pageTextLower.includes('огрн') || pageTextLower.includes('ип') || pageTextLower.includes('ооо'));

      return {
        title: document.title || '',
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '',
        checkboxCount: checkboxes.length,
        checkboxes,
        formCount: forms.length,
        forms,
        looseInputsCount: looseInputs.length,
        looseInputs,
        policyLinks,
        hasCookieBanner,
        h1s,
        h2Count,
        h3Count,
        totalImages,
        imagesWithoutAlt,
        hasPhone,
        hasLegalReqs
      };
    });

    await browser.close();
    return { success: true, pageData };
  } catch (err: any) {
    console.error(`Puppeteer scrape failed for ${url}:`, err.message);
    if (browser) await browser.close();
    return { success: false, error: err.message };
  }
}
