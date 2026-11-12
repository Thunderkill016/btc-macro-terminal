/**
 * e2e_tab1_declutter_verification.cjs
 * Comprehensive Playwright E2E verification of Tab 1 Declutter & 3-Block Hierarchy
 */

const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');

async function run() {
  console.log('🚀 Starting E2E Playwright Verification for Tab 1 Declutter...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const targetUrl = process.env.TEST_URL || 'https://btc.thunderkill016.workers.dev';
  console.log(`🌐 Navigating to: ${targetUrl}`);

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 35000 });
  } catch (err) {
    console.warn('Networkidle timed out, waiting 5s for hydration...');
    await page.waitForTimeout(5000);
  }

  // =========================================================================
  // 1. VERIFY BLOCK 1: TOP HERO SECTION
  // =========================================================================
  console.log('🔍 Checking Block 1: Top Hero Section...');
  await page.waitForSelector('text=Bitcoin đang trong', { timeout: 15000 });
  console.log('  ✅ Found H1 Thesis');

  const anchor1 = await page.locator('text=Hỗ Trợ 200W').first().isVisible();
  const anchor2 = await page.locator('text=Định Giá Power Law').first().isVisible();
  const anchor3 = await page.locator('text=Mục Tiêu Chốt Lời (Pi Cycle)').first().isVisible();
  console.log(`  ✅ 3 Price Anchors visible: ${anchor1 && anchor2 && anchor3}`);
  assert(anchor1 && anchor2 && anchor3, 'All 3 price anchors must be visible');

  const compass = await page.locator('text=La Bàn Phân Khúc Thị Trường').first().isVisible();
  console.log(`  ✅ 5-Phase Compass visible: ${compass}`);
  assert(compass, '5-Phase Compass must be visible');

  const forwardCone = await page.locator('text=NÓN XÁC SUẤT GIÁ TƯƠNG LAI').first().isVisible();
  console.log(`  ✅ Forward Cone visible: ${forwardCone}`);
  assert(forwardCone, 'Forward Cone must be visible');

  const kellyCondensed = await page.locator('text=Kelly:').first().isVisible();
  console.log(`  ✅ Condensed Kelly badge row visible: ${kellyCondensed}`);
  assert(kellyCondensed, 'Condensed Kelly badge row must be visible');

  const smartDcaAlpha = await page.locator('text=+14.2%').first().isVisible();
  console.log(`  ✅ Smart DCA +14.2% alpha note visible: ${smartDcaAlpha}`);
  assert(smartDcaAlpha, 'Smart DCA alpha note must be visible');

  const screenshotHero = path.join(
    'C:\\Users\\thund\\.gemini\\antigravity\\brain\\5874d7ef-d4e2-441f-9eb4-875ce2030aa6',
    'verified-declutter-tab1-hero.png'
  );
  await page.screenshot({ path: screenshotHero, fullPage: false });
  console.log(`📸 Saved screenshot Hero: ${screenshotHero}`);

  // =========================================================================
  // 2. VERIFY BLOCK 2: MULTI-CYCLE CHART & OSCILLATOR DIRECTLY BELOW HERO
  // =========================================================================
  console.log('🔍 Checking Block 2: Multi-Cycle Chart & Oscillator...');
  const chartHeader = page.locator('text=BIỂU ĐỒ TOÀN DIỆN').first();
  await chartHeader.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  const chartVisible = await chartHeader.isVisible();
  console.log(`  ✅ Main Multi-Cycle Chart visible directly below Hero: ${chartVisible}`);
  assert(chartVisible, 'Main Multi-Cycle Chart must be visible');

  const subChartOscillator = await page.locator('text=Chỉ Báo Dao Động').first().isVisible();
  console.log(`  ✅ Sub-Chart Oscillator visible: ${subChartOscillator}`);
  assert(subChartOscillator, 'Sub-Chart Oscillator must be visible');

  const screenshotChart = path.join(
    'C:\\Users\\thund\\.gemini\\antigravity\\brain\\5874d7ef-d4e2-441f-9eb4-875ce2030aa6',
    'verified-declutter-tab1-chart.png'
  );
  await page.screenshot({ path: screenshotChart, fullPage: false });
  console.log(`📸 Saved screenshot Chart: ${screenshotChart}`);

  // =========================================================================
  // 3. VERIFY BLOCK 3: TRẠM RADAR ĐỊNH LƯỢNG ĐA TẦNG WITH 3 SUB-TABS
  // =========================================================================
  console.log('🔍 Checking Block 3: TRẠM RADAR ĐỊNH LƯỢNG ĐA TẦNG...');
  const radarHeader = page.locator('text=TRẠM RADAR ĐỊNH LƯỢNG ĐA TẦNG').first();
  await radarHeader.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  const radarVisible = await radarHeader.isVisible();
  console.log(`  ✅ Unified Radar Matrix visible: ${radarVisible}`);
  assert(radarVisible, 'Unified Radar Matrix must be visible');

  // Sub-Tab 1: Peak Radar (Default)
  const peakCardPi = await page.locator('text=Pi Cycle Top').first().isVisible();
  const peakCardMvrv = await page.locator('text=MVRV Ratio').first().isVisible();
  const peakCardMayer = await page.locator('text=Mayer Multiple').first().isVisible();
  console.log(`  ✅ Peak cards visible: Pi=${peakCardPi}, MVRV=${peakCardMvrv}, Mayer=${peakCardMayer}`);
  assert(peakCardPi && peakCardMvrv && peakCardMayer, 'Peak radar cards must be visible in Sub-Tab 1');

  const screenshotSubTab1 = path.join(
    'C:\\Users\\thund\\.gemini\\antigravity\\brain\\5874d7ef-d4e2-441f-9eb4-875ce2030aa6',
    'verified-declutter-subtab1-peak.png'
  );
  await page.screenshot({ path: screenshotSubTab1, fullPage: false });
  console.log(`📸 Saved screenshot Sub-Tab 1 (Peak): ${screenshotSubTab1}`);

  // Switch to Sub-Tab 2: Downside Risk
  console.log('🔄 Switching to Sub-Tab 2: Rủi Ro Ngắn Hạn & Cá Voi...');
  const subTab2Btn = page.locator('button:has-text("Rủi Ro Ngắn Hạn")').first();
  await subTab2Btn.scrollIntoViewIfNeeded();
  await subTab2Btn.click();
  await page.waitForTimeout(1500);

  const sthCard = await page.locator('text=Giá Vốn STH').first().isVisible();
  const ma200Card = await page.locator('text=200DMA').first().isVisible();
  const cvdCard = await page.locator('text=Dòng Khớp Lệnh Spot 7 Ngày').first().isVisible();
  const fundingCard = await page.locator('text=Rủi Ro Rũ Bỏ Đòn Bẩy').first().isVisible();
  console.log(`  ✅ Downside cards visible: STH=${sthCard}, 200DMA=${ma200Card}, CVD=${cvdCard}, Funding=${fundingCard}`);
  assert(sthCard && ma200Card && cvdCard && fundingCard, 'All 4 downside tactical cards must be visible in Sub-Tab 2');

  const screenshotSubTab2 = path.join(
    'C:\\Users\\thund\\.gemini\\antigravity\\brain\\5874d7ef-d4e2-441f-9eb4-875ce2030aa6',
    'verified-declutter-subtab2-downside.png'
  );
  await page.screenshot({ path: screenshotSubTab2, fullPage: false });
  console.log(`📸 Saved screenshot Sub-Tab 2 (Downside): ${screenshotSubTab2}`);

  // Switch to Sub-Tab 3: Halving & Miners
  console.log('🔄 Switching to Sub-Tab 3: Chu Kỳ Thợ Đào & Halving 4...');
  const subTab3Btn = page.locator('button:has-text("Chu Kỳ Thợ Đào")').first();
  await subTab3Btn.scrollIntoViewIfNeeded();
  await subTab3Btn.click();
  await page.waitForTimeout(1500);

  const halvingProgress = await page.locator('text=Tiến Trình Chu Kỳ Halving 4').first().isVisible();
  const puellCard = await page.locator('text=Puell Multiple').first().isVisible();
  const paxgCard = await page.locator('text=PAXG').first().isVisible();
  const hashCard = await page.locator('text=Hash Ribbons').first().isVisible();
  console.log(`  ✅ Halving/Miner items visible: Halving=${halvingProgress}, Puell=${puellCard}, PAXG=${paxgCard}, Hash=${hashCard}`);
  assert(halvingProgress && puellCard && paxgCard && hashCard, 'All halving & miner indicators must be visible in Sub-Tab 3');

  const screenshotSubTab3 = path.join(
    'C:\\Users\\thund\\.gemini\\antigravity\\brain\\5874d7ef-d4e2-441f-9eb4-875ce2030aa6',
    'verified-declutter-subtab3-halving.png'
  );
  await page.screenshot({ path: screenshotSubTab3, fullPage: false });
  console.log(`📸 Saved screenshot Sub-Tab 3 (Halving & Miners): ${screenshotSubTab3}`);

  // =========================================================================
  // 4. VERIFY ABSENCE OF DUPLICATE CARDS ON TAB 1
  // =========================================================================
  console.log('🔍 Verifying NO duplicate cards or misallocated widgets on Tab 1...');
  
  // Gold SJC should NOT be on Tab 1
  const goldSjcCount = await page.locator('text=Lượng Vàng SJC').count();
  console.log(`  ✅ SJC Gold card count on Tab 1: ${goldSjcCount} (Must be 0)`);
  assert.strictEqual(goldSjcCount, 0, 'SJC Gold must not exist on Tab 1');

  // Standalone 4 Trụ Cột banner should NOT be on Tab 1
  const fourPillarsCount = await page.locator('text=4 Trụ Cột Định Chế').count();
  console.log(`  ✅ 4 Trụ Cột card count on Tab 1: ${fourPillarsCount} (Must be 0)`);
  assert.strictEqual(fourPillarsCount, 0, '4 Trụ Cột row must not exist on Tab 1');

  // Bottom Accordion Drawer should NOT be on Tab 1
  const accordionCount = await page.locator('text=Dành Cho Nhà Đầu Tư Chuyên Sâu').count();
  console.log(`  ✅ Bottom Accordion count on Tab 1: ${accordionCount} (Must be 0)`);
  assert.strictEqual(accordionCount, 0, 'Bottom Accordion must not exist on Tab 1');

  // Verify Zero Console Errors
  console.log(`🔍 Console error count: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors found:', consoleErrors);
  }
  assert.strictEqual(consoleErrors.length, 0, 'Must have zero console errors');

  await browser.close();
  console.log('🎉 ALL PLAYWRIGHT E2E CHECKS PASSED FOR TAB 1 DECLUTTER & CONSOLIDATION!');
}

run().catch((err) => {
  console.error('❌ E2E Playwright Error:', err);
  process.exit(1);
});
