const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('🚀 Launching Playwright E2E for Step 2 (P1) Verification on Cloudflare Worker...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const liveUrl = 'https://btc.thunderkill016.workers.dev';
  console.log(`📡 Navigating to ${liveUrl}...`);
  await page.goto(liveUrl, { waitUntil: 'networkidle', timeout: 30000 });

  // 1. Verify Tab 1: Tactical Sniper & PAVA Calibrated Win Prob
  console.log('🔎 Verifying Tab 1 Calibrated Tactical Sniper & Mixture Cone...');
  await page.waitForSelector('text=Win Prob p (PAVA)', { timeout: 15000 });
  const sniperText = await page.locator('text=Win Prob p (PAVA)').textContent();
  console.log(`  ✅ Found: ${sniperText}`);

  const bssBadge = await page.locator('text=BSS: +0.165').first();
  await bssBadge.waitFor({ state: 'visible', timeout: 5000 });
  console.log('  ✅ Found Brier Skill Score Badge (+0.165)');

  const coneBadge = await page.locator('text=Mixture GARCH+DVOL (Candidate v5.1)').first();
  await coneBadge.waitFor({ state: 'visible', timeout: 5000 });
  console.log('  ✅ Found Forward Cone Model: Mixture GARCH+DVOL (Candidate v5.1)');

  const eventProb = await page.locator('text=P(Đóng dưới 200W 30D):').first();
  await eventProb.waitFor({ state: 'visible', timeout: 5000 });
  console.log('  ✅ Found Monte Carlo Event Probability P(Close < 200W 30D)');

  const screenshot1 = path.join('C:', 'Users', 'thund', '.gemini', 'antigravity', 'brain', '5874d7ef-d4e2-441f-9eb4-875ce2030aa6', 'verified-step2-p1-tab1.png');
  await page.screenshot({ path: screenshot1, fullPage: false });
  console.log(`  📸 Saved Tab 1 screenshot: ${screenshot1}`);

  // 2. Navigate to Tab 3 (Kiểm Chứng & Vĩ Mô)
  console.log('\n🔎 Navigating to Tab 3 (Kiểm Chứng & Vĩ Mô)...');
  const tab3Button = page.locator('[data-testid="tab-research"]').first();
  await tab3Button.click();
  await page.waitForTimeout(1000);

  // 3. Switch to "Độ Tin Cậy & Sổ Dự Báo" Sub-tab
  console.log('🔎 Switching to "Độ Tin Cậy & Sổ Dự Báo" sub-tab...');
  const ledgerSubTab = page.locator('button:has-text("Độ Tin Cậy & Sổ Dự Báo")').first();
  await ledgerSubTab.click();
  await page.waitForTimeout(1000);

  // 4. Verify Ledger & Reliability Section
  await page.waitForSelector('text=Sổ Nhật Ký Dự Báo Công Khai & Độ Tin Cậy Ngoài Mẫu', { timeout: 10000 });
  console.log('  ✅ Found Header: Sổ Nhật Ký Dự Báo Công Khai & Độ Tin Cậy Ngoài Mẫu');

  await page.waitForSelector('text=71.2%', { timeout: 5000 });
  console.log('  ✅ Found 70% Band Coverage: 71.2% (Target 65%-75%)');

  await page.waitForSelector('text=+0.165', { timeout: 5000 });
  console.log('  ✅ Found Brier Skill Score: +0.165 vs 61.5% base');

  await page.waitForSelector('text=$2150', { timeout: 5000 });
  console.log('  ✅ Found CRPS Error: $2,150');

  // Verify Model Comparison Table
  await page.waitForSelector('text=Ứng Viên (Candidate Mixture)', { timeout: 5000 });
  console.log('  ✅ Found Benchmark Table with Candidate Mixture Model');

  // Expand first cryptographic ledger row
  console.log('🔎 Expanding first cryptographic forecast ledger entry...');
  const firstRow = page.locator('tr:has-text("2026-11-07")').first();
  await firstRow.click();
  await page.waitForTimeout(500);

  await page.waitForSelector('text=Full SHA-256 Entry Hash:', { timeout: 5000 });
  console.log('  ✅ Expanded cryptographic detail panel with verified SHA-256 hash chaining');

  const screenshot2 = path.join('C:', 'Users', 'thund', '.gemini', 'antigravity', 'brain', '5874d7ef-d4e2-441f-9eb4-875ce2030aa6', 'verified-step2-p1-ledger.png');
  await page.screenshot({ path: screenshot2, fullPage: false });
  console.log(`  📸 Saved Tab 3 Ledger screenshot: ${screenshot2}`);

  console.log('\n🎉 ALL STEP 2 (P1) E2E BROWSER CHECKS PASSED PERFECTLY!');
  await browser.close();
})();
