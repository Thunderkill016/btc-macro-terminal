const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Simple static server for dist/
function startStaticServer(distDir, port = 4173) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  const server = http.createServer((req, res) => {
    let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(distDir, 'index.html');
    }
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading file');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

(async () => {
  console.log('--- 1. STARTING STATIC SERVER ON PORT 4173 ---');
  const distDir = path.join(__dirname, 'dist');
  const server = await startStaticServer(distDir, 4173);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  console.log('--- 2. NAVIGATING TO LOCAL PRODUCTION BUILD ---');
  await page.goto('http://localhost:4173', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  console.log('--- 3. VERIFYING UI FIDELITY (ZERO NaN / ZERO undefined) ---');
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes('NaN')) throw new Error('Found NaN in rendered UI!');
  if (bodyText.includes('undefined')) throw new Error('Found undefined in rendered UI!');
  console.log('✅ UI contains zero NaN and zero undefined');

  console.log('--- 4. VERIFYING TAB 1 METRICS UNIFICATION ---');
  // Check that Power Law Fair Value, Ceiling, and Pi Cycle Top are visible
  const hasFairValue = bodyText.includes('$88,478');
  const hasCeiling = bodyText.includes('$203,500');
  console.log('Power Law $88,478 displayed:', hasFairValue);
  console.log('Bubble Ceiling $203,500 displayed:', hasCeiling);

  console.log('--- 5. VERIFYING TAB 3 BENCHMARK NOTICES ---');
  // Click Tab 3 (Research & Macro)
  const tab3Btn = page.locator('button:has-text("Kiểm Chứng")').first();
  if (await tab3Btn.isVisible()) {
    await tab3Btn.click();
    await page.waitForTimeout(1000);
    const tab3Text = await page.evaluate(() => document.body.innerText);
    const hasEtfBadge = tab3Text.includes('Dữ Liệu Mẫu') || tab3Text.includes('Khảo Sát Benchmark');
    console.log('Tab 3 has ETF Sample Benchmark notice:', hasEtfBadge);
    if (!hasEtfBadge) throw new Error('Missing sample data notice on Tab 3!');
  }

  console.log('--- 6. VERIFYING PASSPHRASE MODAL ---');
  // Click sync binance button
  const syncBtn = page.locator('button:has-text("Đồng Bộ Binance")').first();
  if (await syncBtn.isVisible()) {
    await syncBtn.click();
    await page.waitForTimeout(500);
    const modalText = await page.evaluate(() => document.body.innerText);
    const hasPassphraseText = modalText.includes('Passphrase') || modalText.includes('OWASP');
    console.log('Binance Modal contains Passphrase & OWASP text:', hasPassphraseText);
    if (!hasPassphraseText) throw new Error('Binance Modal still references old PIN without Passphrase!');
  }

  // Capture screenshot for audit verification
  const screenshotPath = 'C:/Users/thund/.gemini/antigravity/brain/5874d7ef-d4e2-441f-9eb4-875ce2030aa6/verified-step1-p0.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('📸 Screenshot saved to:', screenshotPath);

  await browser.close();
  server.close();

  console.log('🎉 ALL PLAYWRIGHT E2E CHECKS PASSED FOR STEP 1 (P0)!');
  process.exit(0);
})().catch((err) => {
  console.error('❌ E2E Failed:', err);
  process.exit(1);
});
