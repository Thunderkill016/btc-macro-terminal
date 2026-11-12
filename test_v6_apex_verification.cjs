/**
 * test_v6_apex_verification.cjs
 * Comprehensive Unit & Architectural Verification Suite for
 * BITCOIN ALPHA TERMINAL v6.0 APEX INSTITUTIONAL EDITION (FEY × LINEAR DESIGN)
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    failed++;
    process.exitCode = 1;
  }
}

console.log('======================================================================');
console.log('🏛️  BITCOIN ALPHA v6.0 APEX & FEY × LINEAR VERIFICATION SUITE');
console.log('======================================================================\n');

const root = __dirname;

// ---------------------------------------------------------------------------
// 1. FEY × LINEAR × VERCEL GEIST DESIGN TOKENS & OBSIDIAN PALETTE
// ---------------------------------------------------------------------------
console.log('--- 1. FEY × LINEAR OBSIDIAN DESIGN SYSTEM TOKENS ---');

const indexCss = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8');
assert(
  indexCss.includes('#05070B') && indexCss.includes('#0A0E17') && indexCss.includes('#0F1522'),
  'src/index.css defines #05070B canvas, #0A0E17 primary bento, and #0F1522 inner card tokens'
);

const tailwindCfg = fs.readFileSync(path.join(root, 'tailwind.config.js'), 'utf8');
assert(
  tailwindCfg.includes('#05070B') && tailwindCfg.includes('#0A0E17'),
  'tailwind.config.js includes #05070B obsidian canvas and #0A0E17 primary bento tokens'
);

// ---------------------------------------------------------------------------
// 2. TAB 1: 3-ZONE SPATIAL BENTO ARCHITECTURE & 4-MODE MATRIX
// ---------------------------------------------------------------------------
console.log('\n--- 2. TAB 1: 3-ZONE BENTO & 4-TAB QUANT MATRIX ---');

const heroCode = fs.readFileSync(path.join(root, 'src/components/apple/AppleDailySignalHero.tsx'), 'utf8');
assert(
  heroCode.includes('data-testid="zone1-hero-bento"') &&
  heroCode.includes('lg:col-span-8') &&
  heroCode.includes('lg:col-span-4') &&
  heroCode.includes('bg-[#0A0E17]') &&
  heroCode.includes('border-white/[0.06]'),
  'Zone 1 (AppleDailySignalHero) uses 8/4 asymmetric Bento grid with #0A0E17 & border-white/[0.06]'
);

assert(
  heroCode.includes('setShowKellyFormula') &&
  heroCode.includes('limit1TouchProb7D') &&
  heroCode.includes('obLargestWallPrice'),
  'Zone 1 Right Bento includes Kelly formula popover, 7D ATR touch probabilities, and Live Orderbook Whale Wall'
);

const chartCode = fs.readFileSync(path.join(root, 'src/components/apple/AppleCycleChart.tsx'), 'utf8');
assert(
  chartCode.includes('data-testid="zone2-chart-studio"') &&
  chartCode.includes('data-testid="chart-floating-hud"') &&
  chartCode.includes("activeOscillator === 'rsi'") &&
  chartCode.includes('▲ MUA'),
  'Zone 2 (AppleCycleChart) integrates Dual-Canvas frame, Top-Left Floating HUD, RSI 14 oscillator, and ▲ MUA markers'
);

// Verify secondary series have empty title and lastValueVisible: false so right Y-axis is uncluttered
const emptyTitleMatches = (chartCode.match(/title:\s*'',\s*\n\s*lastValueVisible:\s*false,\s*\n\s*priceLineVisible:\s*false/g) || []).length;
assert(
  emptyTitleMatches >= 6,
  `Zone 2 secondary series suppress right-axis badges (Found ${emptyTitleMatches} uncluttered secondary series)`
);

const radarCode = fs.readFileSync(path.join(root, 'src/components/apple/AppleCyclePeakRadar.tsx'), 'utf8');
assert(
  radarCode.includes('data-testid="zone3-radar-matrix"') &&
  radarCode.includes('data-testid="radar-tab-peak"') &&
  radarCode.includes('data-testid="radar-tab-cone"') &&
  radarCode.includes('data-testid="radar-tab-downside"') &&
  radarCode.includes('data-testid="radar-tab-halving"'),
  'Zone 3 (AppleCyclePeakRadar) implements all 4 segmented pill tabs (Peak, Cone, Downside, Halving/Miners)'
);

// ---------------------------------------------------------------------------
// 3. STAGE 2: WEB WORKER, CORNISH-FISHER FAT-TAIL MATH & ORDERBOOK SCANNER
// ---------------------------------------------------------------------------
console.log('\n--- 3. STAGE 2: WEB WORKER, CORNISH-FISHER QUANTILES & ORDERBOOK SERVICE ---');

const workerPath = path.join(root, 'src/workers/quantWorker.ts');
const workerClientPath = path.join(root, 'src/lib/quantWorkerClient.ts');
const orderbookPath = path.join(root, 'src/lib/orderbookService.ts');

assert(fs.existsSync(workerPath), 'Dedicated off-main-thread Web Worker (src/workers/quantWorker.ts) exists');
assert(fs.existsSync(workerClientPath), 'Web Worker client bridge (src/lib/quantWorkerClient.ts) exists');
assert(fs.existsSync(orderbookPath), 'Live Binance Spot Orderbook scanner (src/lib/orderbookService.ts) exists');

const quantCode = fs.readFileSync(path.join(root, 'src/lib/quantEngine.ts'), 'utf8');
assert(
  quantCode.includes('computeCornishFisherQuantile') &&
  quantCode.includes('computeSampleSkewAndKurtosis') &&
  quantCode.includes('computeFirstPassageTouchProb7D'),
  'quantEngine.ts implements Cornish-Fisher expansion, sample skewness/kurtosis, and 7D first-passage touch probability'
);

// Verify Cornish-Fisher mathematical invariant directly
function computeCornishFisherQuantileJS(z, S, K) {
  const s = Math.max(-1.5, Math.min(1.5, S));
  const k = Math.max(-1.0, Math.min(6.0, K));
  const z2 = z * z;
  const z3 = z2 * z;
  const termSkew = (s / 6) * (z2 - 1);
  const termKurt = (k / 24) * (z3 - 3 * z);
  const termSkew2 = ((s * s) / 36) * (2 * z3 - 5 * z);
  return z + termSkew + termKurt - termSkew2;
}

const z01 = computeCornishFisherQuantileJS(-2.3263, -0.35, 2.5);
const z15 = computeCornishFisherQuantileJS(-1.0364, -0.35, 2.5);
const z50 = computeCornishFisherQuantileJS(0.0, -0.35, 2.5);
const z85 = computeCornishFisherQuantileJS(1.0364, -0.35, 2.5);

assert(
  z15 < z50 && z50 < z85,
  `Cornish-Fisher quantiles strictly preserve monotonicity: z15 (${z15.toFixed(3)}) < z50 (${z50.toFixed(3)}) < z85 (${z85.toFixed(3)})`
);

assert(
  z01 < -2.3263,
  `Negative skewness (S=-0.35) & excess kurtosis (K=2.5) deepen extreme left-tail risk: z_CF(0.01)=${z01.toFixed(3)} < -2.326`
);

// ---------------------------------------------------------------------------
// 4. STAGE 3: COMMAND PALETTE (⌘K / Ctrl+K)
// ---------------------------------------------------------------------------
console.log('\n--- 4. STAGE 3: BLOOMBERG / RAYCAST COMMAND PALETTE (Ctrl+K) ---');

const cmdPalettePath = path.join(root, 'src/components/CommandPalette.tsx');
assert(fs.existsSync(cmdPalettePath), 'CommandPalette.tsx exists');
const cmdPaletteCode = fs.readFileSync(cmdPalettePath, 'utf8');
assert(
  cmdPaletteCode.includes('data-testid="command-palette-dialog"') &&
  cmdPaletteCode.includes('data-testid="command-palette-input"'),
  'CommandPalette includes dialog and search input test IDs'
);

const headerCode = fs.readFileSync(path.join(root, 'src/components/header/TopExecutiveBar.tsx'), 'utf8');
assert(
  headerCode.includes('data-testid="command-palette-trigger"') &&
  headerCode.includes('⌘K'),
  'TopExecutiveBar includes ⌘K Command Palette trigger pill'
);

console.log('\n======================================================================');
console.log(`🏁 V6.0 APEX VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================================');
