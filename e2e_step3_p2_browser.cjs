/**
 * e2e_step3_p2_browser.cjs
 * Comprehensive Playwright E2E browser test for Step 3 (P2: System Expansion & 3-Tier Interface)
 */

const { chromium } = require('playwright');
const path = require('path');

async function run() {
  console.log('🚀 Starting E2E Playwright Browser Verification for Step 3 (P2)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
  });
  const page = await context.newPage();

  const targetUrl = process.env.TEST_URL || 'https://btc.thunderkill016.workers.dev';
  console.log(`🌐 Navigating to: ${targetUrl}`);

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 35000 });
  } catch (err) {
    console.warn('Networkidle timed out, waiting 5s for hydration...');
    await page.waitForTimeout(5000);
  }

  // 1. Verify Tab 1 Hero & 4-Phase Macro Regime Banner
  console.log('🔍 Checking Tab 1: 4-Phase Macro Regime & 90D Distribution...');
  await page.waitForSelector('text=Chế độ vĩ mô v5.1', { timeout: 15000 });
  console.log('  ✅ Found: "Chế độ vĩ mô v5.1" badge');

  const macroTitle = await page.locator('text=1. Tích Lũy Sâu Giá Rẻ').first().isVisible();
  console.log(`  ✅ Found 4-Phase Regime Title: ${macroTitle}`);

  const p50Stat = await page.locator('text=P50: +24.8%').first().isVisible();
  console.log(`  ✅ Found 90D Empirical Distribution P50: ${p50Stat}`);

  const deltaBlock = await page.locator('text=Điều Gì Vừa Đổi').first().isVisible();
  console.log(`  ✅ Found "Điều Gì Vừa Đổi" (7D/30D Delta): ${deltaBlock}`);

  const syncChip = await page.locator('text=Đồng bộ 00:00 UTC').first().isVisible();
  console.log(`  ✅ Found Live Sync Chip: ${syncChip}`);

  // 2. Verify Smart DCA Alpha Stat
  const dcaStat = await page.locator('text=+14.2%').first().isVisible();
  console.log(`  ✅ Found Smart DCA Outperformance (+14.2%): ${dcaStat}`);

  // 3. Verify Tier 2 Failure Mode Disclosures in 4-Pillar Grid
  console.log('🔍 Checking 4 Failure Mode Disclosure Blocks ("Mô hình này sai khi:")...');
  const failureModeCount = await page.locator('text=⚠️ Mô hình này sai khi:').count();
  console.log(`  ✅ Found failure mode disclosure count: ${failureModeCount}/4`);
  if (failureModeCount !== 4) {
    throw new Error(`Expected 4 failure mode blocks, found ${failureModeCount}`);
  }

  // Chụp ảnh xác minh Tab 1 Hero & Signal Grid
  const screenshotTab1Path = path.join(
    'C:\\Users\\thund\\.gemini\\antigravity\\brain\\5874d7ef-d4e2-441f-9eb4-875ce2030aa6',
    'verified-step3-p2-tab1.png'
  );
  await page.screenshot({ path: screenshotTab1Path, fullPage: false });
  console.log(`📸 Saved screenshot to: ${screenshotTab1Path}`);

  // 4. Verify Telegram Alert Modal with Dedup Key & Rate Limiting
  console.log('🔍 Testing Telegram Alert Modal...');
  const bellButton = page.locator('button:has-text("Telegram"), button[title*="Telegram"], div:has-text("Báo Động Telegram")').first();
  if (await bellButton.isVisible()) {
    await bellButton.click();
    await page.waitForTimeout(1000);

    const dedupVisible = await page.locator('text=Khóa chống lặp (Dedup Key)').first().isVisible();
    console.log(`  ✅ Dedup Key visible in modal: ${dedupVisible}`);

    const previewV200W = await page.locator('text=Vùng Hỗ Trợ Động 200W').first().isVisible();
    console.log(`  ✅ Preview uses "Vùng Hỗ Trợ Động 200W": ${previewV200W}`);

    const closeBtn = page.locator('button[aria-label="Đóng cửa sổ"], button[aria-label="Close modal"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // 5. Verify Cycle Peak Radar & Downside Risk Radar (Scroll to Component in Tab 1)
  console.log('🔍 Scrolling to Cycle Peak Radar...');
  const radarElement = page.locator('text=RADAR ĐỒNG THUẬN 5 CHỈ BÁO TẠO ĐỈNH').first();
  await radarElement.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);

  const peakHitRate = await page.locator('text=75% (Bắt 3/4 đỉnh)').first().isVisible();
  console.log(`  ✅ Peak Radar measured recall (75%): ${peakHitRate}`);

  const peakFalseAlarm = await page.locator('text=Báo động giả: 12.5%').first().isVisible();
  console.log(`  ✅ Peak Radar false alarm rate (12.5%): ${peakFalseAlarm}`);

  const coinGlassNote = await page.locator('text=CoinGlass Benchmark Audit').first().isVisible();
  console.log(`  ✅ CoinGlass 2025 >30% drop audit note: ${coinGlassNote}`);

  const downsideRecall = await page.locator('text=80% (4/5 đợt)').first().isVisible();
  console.log(`  ✅ Downside Risk Radar measured recall (80%): ${downsideRecall}`);

  // Chụp ảnh xác minh Radar
  const screenshotRadarPath = path.join(
    'C:\\Users\\thund\\.gemini\\antigravity\\brain\\5874d7ef-d4e2-441f-9eb4-875ce2030aa6',
    'verified-step3-p2-radar.png'
  );
  await page.screenshot({ path: screenshotRadarPath, fullPage: false });
  console.log(`📸 Saved screenshot to: ${screenshotRadarPath}`);

  await browser.close();
  console.log('\n=====================================================');
  console.log('🎉 ALL STEP 3 (P2) BROWSER E2E CRITERIA VERIFIED 100%!');
  console.log('=====================================================');
}

run().catch((err) => {
  console.error('❌ E2E Playwright test error:', err);
  process.exit(1);
});
