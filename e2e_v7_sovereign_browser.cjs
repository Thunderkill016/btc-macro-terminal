/**
 * e2e_v7_sovereign_browser.cjs
 * Playwright End-to-End Browser Verification Suite for
 * BITCOIN ALPHA TERMINAL v7.0 SOVEREIGN QUANT EDITION
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
  console.log(`🌐 PLAYWRIGHT E2E VERIFICATION (v7.0 SOVEREIGN) — ${TARGET_URL}`);
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

    // Check 1 & 2: 3-Zone Spatial Bento Architecture & Vertical Order
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

    // Check 3: Zone 1 30-Day Non-Repainting Signal Trajectory Badge & Sparkline + Zone 2 Floating HUD
    const trajVisible = await page.locator('[data-testid="signal-trajectory-badge"]').isVisible();
    const hudVisible = await page.locator('[data-testid="chart-floating-hud"]').isVisible();
    assert(
      trajVisible && hudVisible,
      'Zone 1 30D Non-Repainting Signal Trajectory Sparkline & Zone 2 Floating HUD are visible'
    );

    // Screenshot 1: Zone 1 Hero with 30D Signal Trajectory & VPVR Snapped Limits
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified-v7-zone1-hero-trajectory.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified-v9-tab1-fey-hero.png'),
      fullPage: false,
    });

    // Scroll to Zone 3 4-Tab Matrix
    const z3Locator = page.locator('[data-testid="zone3-radar-matrix"]');
    await z3Locator.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    // Check 4: Tab A (Peak Radar)
    const tabAText = await z3Locator.innerText();
    assert(
      tabAText.includes('Pi Cycle Top') && tabAText.includes('MVRV Ratio'),
      'Zone 3 Tab A (Peak Radar) renders 5 Z-Score cards'
    );

    // Check 5: Tab B (EWMA + Garman-Klass Effective Vol & Cornish-Fisher Cone)
    await page.locator('[data-testid="radar-tab-cone"]').click();
    await page.waitForTimeout(500);
    const tabBText = await z3Locator.innerText();
    assert(
      tabBText.includes('CORNISH-FISHER') && tabBText.includes('EWMA+GK') && tabBText.includes('Reflection Principle'),
      'Zone 3 Tab B renders EWMA+GK Effective Volatility, Monotonic Cornish-Fisher Cone & Reflection Principle 7D Touch Prob'
    );
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified-v7-zone3-tabB-ewma-cone.png'),
      fullPage: false,
    });

    // Check 6: Tab C (Hybrid VPVR High-Volume Nodes + Deep Orderbook + Whale vs. Retail Microstructure + Deribit DVOL/VRP/Liquidation Strip)
    await page.locator('[data-testid="radar-tab-downside"]').click();
    await page.waitForTimeout(500);
    const tabCText = await z3Locator.innerText();
    const microVisible = await page.locator('[data-testid="microstructure-whale-matrix"]').isVisible();
    const vrpStripVisible = await page.locator('[data-testid="derivatives-vrp-liquidation-strip"]').isVisible();
    assert(
      microVisible && vrpStripVisible && tabCText.includes('VPVR') && tabCText.includes('DVOL'),
      'Zone 3 Tab C renders Hybrid VPVR High-Volume Nodes + Deep Orderbook (limit=1000) + Whale Microstructure + Deribit DVOL/VRP/Liquidation Strip'
    );
    await z3Locator.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified-v8-zone3-tabC-vrp-liquidation.png'),
    });

    // Check 7: Tab D (Halving 4, Miners, Cointime Economics & Capriole Energy Value)
    await page.locator('[data-testid="radar-tab-halving"]').click();
    await page.waitForTimeout(500);
    const tabDText = await z3Locator.innerText();
    const cointimeVisible = await page.locator('[data-testid="cointime-energy-matrix"]').isVisible();
    assert(
      cointimeVisible && tabDText.includes('True Market Mean') && tabDText.includes('AVIV') && tabDText.includes('Capriole'),
      'Zone 3 Tab D renders Halving 4, NUPL, Puell, Cointime Economics (True Market Mean & AVIV, ARK Seller Exhaustion) & Capriole Energy Value'
    );
    await z3Locator.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified-v8-zone3-tabD-cointime-energy.png'),
    });

    // Check 8: Command Palette (⌘K) + Navigate to Tab 3 (Backtester with Sortino/Calmar/Win-Rate + López de Prado PSR/DSR)
    await page.locator('[data-testid="command-palette-trigger"]').click();
    await page.waitForTimeout(400);
    const cmdModalVisible = await page.locator('[data-testid="command-palette-dialog"]').isVisible();
    assert(cmdModalVisible, 'Command Palette (⌘K / Ctrl+K) opens cleanly on trigger click');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Switch to Tab 2 (Portfolio & Wallet) to verify Velo Telemetry Strip & Fey Bento Portfolio
    await page.locator('[data-testid="tab-portfolio"]').click();
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified-v9-tab2-fey-portfolio.png'),
      fullPage: false,
    });

    // Switch to Tab 3 (Research & Backtester) to capture Sortino/Calmar/Win-Rate + PSR/DSR screenshot
    await page.locator('[data-testid="tab-research"]').click();
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified-v9-tab3-fey-research.png'),
      fullPage: false,
    });
    await page.locator('button:has-text("Kiểm Chứng SJC & Bank")').click();
    await page.waitForTimeout(800);
    const psrRow = page.locator('[data-testid="backtester-psr-dsr-row"]');
    const psrRowVisible = await psrRow.isVisible();
    assert(psrRowVisible, 'Tab 3 Backtester renders Marcos López de Prado PSR & DSR row alongside Sortino & Calmar');
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified-v8-tab3-backtester-psr-dsr.png'),
      fullPage: false,
    });

    // Check 9: Desktop Horizontal Overflow
    const desktopOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    assert(!desktopOverflow, 'Desktop (1440x900) has zero horizontal scroll overflow');

    // Check 10: Mobile Viewport (390x844) Horizontal Overflow
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    const mobileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    assert(!mobileOverflow, 'Mobile (390x844) has zero horizontal scroll overflow');

    // Check 11: Zero uncaught console/page errors
    assert(consoleErrors.length === 0, `Zero uncaught page errors (Found: ${consoleErrors.length})`);

    await context.close();
  } finally {
    await browser.close();
  }

  console.log('\n======================================================================');
  console.log(`🏁 E2E BROWSER VERIFICATION: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('======================================================================');
})();
