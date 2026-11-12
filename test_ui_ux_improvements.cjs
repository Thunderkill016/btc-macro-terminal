const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testUIUX() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1536, height: 960 }
  });
  const page = await context.newPage();

  console.log('Navigating to live terminal: https://btc.thunderkill016.workers.dev ...');
  await page.goto('https://btc.thunderkill016.workers.dev', { waitUntil: 'networkidle', timeout: 30000 });

  // 1. Check title & top executive bar
  const title = await page.title();
  console.log('Page Title:', title);

  // Wait for ticker price to be visible
  await page.waitForSelector('.tabular-nums', { timeout: 10000 });

  // Capture Hero & Tab 1 Screenshot
  const heroPath = path.resolve('C:/Users/thund/.gemini/antigravity/brain/5874d7ef-d4e2-441f-9eb4-875ce2030aa6/verified-uiux-hero-refreshed.png');
  await page.screenshot({ path: heroPath, fullPage: false });
  console.log('Saved Hero Screenshot to:', heroPath);

  // 2. Expand Deep Dive Accordion
  const accordionToggle = page.locator('#deep-dive-toggle');
  if (await accordionToggle.isVisible()) {
    console.log('Opening Deep Dive Accordion...');
    await accordionToggle.click();
    await page.waitForTimeout(500);
    const accordionPath = path.resolve('C:/Users/thund/.gemini/antigravity/brain/5874d7ef-d4e2-441f-9eb4-875ce2030aa6/verified-uiux-accordion.png');
    await page.screenshot({ path: accordionPath, fullPage: false });
    console.log('Saved Accordion Screenshot to:', accordionPath);
  }

  // 3. Switch to Portfolio Tab
  console.log('Switching to Portfolio Tab...');
  const portfolioTabBtn = page.locator('#tab-portfolio');
  await portfolioTabBtn.click();
  await page.waitForTimeout(800);
  const portfolioPath = path.resolve('C:/Users/thund/.gemini/antigravity/brain/5874d7ef-d4e2-441f-9eb4-875ce2030aa6/verified-uiux-portfolio.png');
  await page.screenshot({ path: portfolioPath, fullPage: false });
  console.log('Saved Portfolio Screenshot to:', portfolioPath);

  // 4. Switch to Research Tab
  console.log('Switching to Research Tab...');
  const researchTabBtn = page.locator('#tab-research');
  await researchTabBtn.click();
  await page.waitForTimeout(800);
  const researchPath = path.resolve('C:/Users/thund/.gemini/antigravity/brain/5874d7ef-d4e2-441f-9eb4-875ce2030aa6/verified-uiux-research-backtest.png');
  await page.screenshot({ path: researchPath, fullPage: false });
  console.log('Saved Research Screenshot to:', researchPath);

  // 5. Open Methodology Modal
  console.log('Opening Methodology Modal...');
  const methodologyBtn = page.locator('header button:has-text("Mô Hình Thể Chế"), header button:has-text("Methodology")');
  if (await methodologyBtn.isVisible()) {
    await methodologyBtn.click();
    await page.waitForTimeout(600);
    const modalPath = path.resolve('C:/Users/thund/.gemini/antigravity/brain/5874d7ef-d4e2-441f-9eb4-875ce2030aa6/verified-uiux-modal-visionos.png');
    await page.screenshot({ path: modalPath, fullPage: false });
    console.log('Saved Modal Screenshot to:', modalPath);
  }

  await browser.close();
  console.log('All Playwright UI/UX tests and screenshots completed successfully!');
}

testUIUX().catch((err) => {
  console.error('Playwright Test Error:', err);
  process.exit(1);
});
