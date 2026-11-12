const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const tabs = [
    { name: 'models', text: 'Mô Hình Chu Kỳ' },
    { name: 'candles', text: 'Biểu Đồ Nến' },
    { name: 'portfolio', text: 'Danh Mục & Ví' },
    { name: 'research', text: 'Nghiên Cứu Vĩ Mô' }
  ];

  for (const t of tabs) {
    const btn = page.locator(`nav button:has-text("${t.text}")`).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: `C:/Users/thund/.gemini/antigravity/brain/2f43d1ec-8798-4740-98c7-2a494beb94e2/tab_${t.name}.png`,
        fullPage: false
      });
      console.log(`Captured viewport for tab ${t.name}`);
    } else {
      console.log(`Button for ${t.name} not visible`);
    }
  }

  // Also take fullPage for research and portfolio to inspect bottom tables
  for (const t of ['portfolio', 'research']) {
    const tabObj = tabs.find(x => x.name === t);
    const btn = page.locator(`nav button:has-text("${tabObj.text}")`).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: `C:/Users/thund/.gemini/antigravity/brain/2f43d1ec-8798-4740-98c7-2a494beb94e2/tab_${t}_full.png`,
        fullPage: true
      });
      console.log(`Captured fullPage for tab ${t}`);
    }
  }

  await browser.close();
})();
