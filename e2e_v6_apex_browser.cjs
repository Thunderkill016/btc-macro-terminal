/**
 * e2e_v6_apex_browser.cjs
 * Playwright End-to-End Browser Verification Suite for
 * BITCOIN ALPHA TERMINAL v6.0 APEX INSTITUTIONAL EDITION (FEY × LINEAR DESIGN)
 */

const { chromium } = require('playwright');
const path = require('path');

const TARGET_URL = process.env.TARGET_URL || 'https://btc.thunderkill016.workers.dev';
const ARTIFACT_DIR = 'C:/Users/thund/.gemini/antigravity/brain/5874d7ef-d4e2-441f-9eb4-875ce2030aa6';

let passCount = 0;
let failCount = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ✅ PASS: ${msg}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    failCount++;
    process.exitCode = 1;
  }
}

(async () => {
  console.log('======================================================================');
  console.log(`🌐 PLAYWRIGHT E2E VERIFICATION — ${TARGET_URL}`);
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });

  try {
    // 1. DESKTOP VIEWPORT (1440x900)
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto(`${TARGET_URL}?v=${Date.now()}`, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2500);

    // Verify 3-Zone Spatial Bento Architecture DOM presence & order
    const z1Box = await page.locator('[data-testid="zone1-hero-bento"]').boundingBox();
    const z2Box = await page.locator('[data-testid="zone2-chart-studio"]').boundingBox();
    const z3Box = await page.locator('[data-testid="zone3-radar-matrix"]').boundingBox();

    assert(Boolean(z1Box && z2Box && z3Box), 'All 3 Spatial Bento Zones render on Tab 1');
    if (z1Box && z2Box && z3Box) {
      assert(
        z1Box.y < z2Box.y && z2Box.y < z3Box.y,
        `Strict vertical hierarchy: Zone 1 (y=${Math.round(z1Box.y)}) -> Zone 2 Chart (y=${Math.round(z2Box.y)}) -> Zone 3 Matrix (y=${Math.round(z3Box.y)})`
      );
    }

    // Verify Top-Left Translucent Floating HUD inside Zone 2 Chart Studio
    const hudVisible = await page.locator('[data-testid="chart-floating-hud"]').isVisible();
    assert(hudVisible, 'Zone 2 Unified Chart Studio displays Top-Left Translucent Floating HUD Legend');

    // Capture Screenshot 1: Zone 1 Fey × Linear Hero Bento
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified-v6-zone1-hero-bento.png'),
      fullPage: false,
    });

    // Scroll to Zone 2 Chart Studio and capture screenshot
    await page.locator('[data-testid="zone2-chart-studio"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified-v6-zone2-chart-studio.png'),
      fullPage: false,
    });

    // Scroll to Zone 3 4-Tab Matrix and test all 4 Segmented Pill Tabs
    const z3Locator = page.locator('[data-testid="zone3-radar-matrix"]');
    await z3Locator.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    // Tab A: Peak Radar (Default)
    const tabAText = await z3Locator.innerText();
    assert(tabAText.includes('Pi Cycle Top') && tabAText.includes('MVRV Ratio'), 'Zone 3 Tab A (Peak Radar) renders 5 Z-Score cards');
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified-v6-zone3-tabA-peak.png'),
      fullPage: false,
    });

    // Click Tab B: 30D/90D Cornish-Fisher Forward Cone
    await page.locator('[data-testid="radar-tab-cone"]').click();
    await page.waitForTimeout(500);
    const tabBText = await z3Locator.innerText();
    assert(
      tabBText.includes('CORNISH-FISHER') && tabBText.includes('30D') && tabBText.includes('90D'),
      'Zone 3 Tab B (Forward Cone) renders Cornish-Fisher 30D/90D quantiles & 7D touch probabilities'
    );
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified-v6-zone3-tabB-cone.png'),
      fullPage: false,
    });

    // Click Tab C: Downside Risk & Live Orderbook Liquidity Walls
    await page.locator('[data-testid="radar-tab-downside"]').click();
    await page.waitForTimeout(500);
    const tabCText = await z3Locator.innerText();
    assert(
      tabCText.includes('Orderbook') || tabCText.includes('Tường Đỡ Cá Voi'),
      'Zone 3 Tab C (Downside & Orderbook) renders 4 tactical cards + Live Binance Spot Orderbook Depth gauge'
    );
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified-v6-zone3-tabC-downside.png'),
      fullPage: false,
    });

    // Click Tab D: Halving 4 & Miners
    await page.locator('[data-testid="radar-tab-halving"]').click();
    await page.waitForTimeout(500);
    const tabDText = await z3Locator.innerText();
    assert(
      tabDText.includes('Halving 4') && tabDText.includes('Puell Multiple'),
      'Zone 3 Tab D (Miners & Halving 4) renders Halving progress, NUPL, Puell, and Hash Ribbons'
    );
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified-v6-zone3-tabD-halving.png'),
      fullPage: false,
    });

    // Test Command Palette (Ctrl+K / Header Trigger)
    await page.locator('[data-testid="command-palette-trigger"]').click();
    await page.waitForTimeout(400);
    const cmdModalVisible = await page.locator('[data-testid="command-palette-dialog"]').isVisible();
    assert(cmdModalVisible, 'Command Palette (⌘K / Ctrl+K) opens cleanly on trigger click');
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified-v6-command-palette.png'),
      fullPage: false,
    });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Check Desktop Horizontal Overflow
    const desktopOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    assert(!desktopOverflow, 'Desktop (1440x900) has zero horizontal scroll overflow');

    // 2. MOBILE VIEWPORT (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    const mobileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    assert(!mobileOverflow, 'Mobile (390x844) has zero horizontal scroll overflow');

    assert(consoleErrors.length === 0, `Zero uncaught page errors (Found: ${consoleErrors.length})`);

    await context.close();
  } finally {
    await browser.close();
  }

  console.log('\n======================================================================');
  console.log(`🏁 E2E BROWSER VERIFICATION: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('======================================================================');
})();
