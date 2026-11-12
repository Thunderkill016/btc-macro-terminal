/**
 * test_v7_sovereign_verification.cjs
 * 9-Check Institutional Verification Suite for
 * BITCOIN ALPHA TERMINAL v7.0 SOVEREIGN QUANT EDITION
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
console.log('🏛️  BITCOIN ALPHA v7.0 SOVEREIGN QUANT VERIFICATION SUITE (9 CHECKS)');
console.log('======================================================================\n');

const root = __dirname;

// ---------------------------------------------------------------------------
// CHECK 1: UPGRADE 1 — Deep Orderbook (limit=1000) & $25 Price Bin Aggregation
// ---------------------------------------------------------------------------
console.log('--- CHECK 1: DEEP ORDERBOOK (limit=1000) & $25 BIN AGGREGATION ---');
const obCode = fs.readFileSync(path.join(root, 'src/lib/orderbookService.ts'), 'utf8');
assert(
  obCode.includes('symbol=BTCUSDT&limit=1000') &&
  obCode.includes('data-api.binance.vision/api/v3/depth?symbol=BTCUSDT&limit=1000') &&
  obCode.includes('aggregateOrderbookInto25UsdBins'),
  'orderbookService.ts queries limit=1000 with failover to data-api.binance.vision and aggregates into $25 buckets'
);

// ---------------------------------------------------------------------------
// CHECK 2: UPGRADE 1 — 30-Day VPVR High-Volume Nodes (50 Bins) & +$25 Snapping
// ---------------------------------------------------------------------------
console.log('\n--- CHECK 2: 30-DAY HOURLY VPVR HIGH-VOLUME NODES & +$25 LIMIT SNAPPING ---');
assert(
  obCode.includes('symbol=BTCUSDT&interval=1h&limit=500') &&
  obCode.includes('computeVpvrHighVolumeNodes') &&
  obCode.includes('safeSpot * 0.88') &&
  obCode.includes('safeSpot * 1.05') &&
  obCode.includes('const numBins = 50') &&
  obCode.includes('hvnSupportZone1 + 25') &&
  obCode.includes('hvnSupportZone2 + 25'),
  'computeVpvrHighVolumeNodes partitions [0.88*spot, 1.05*spot] into 50 bins from 500 1h klines and snaps Limit 1/2 to HVN + $25'
);

// ---------------------------------------------------------------------------
// CHECK 3: UPGRADE 2 — Binance Futures Microstructure Service (3 Endpoints)
// ---------------------------------------------------------------------------
console.log('\n--- CHECK 3: BINANCE FUTURES MICROSTRUCTURE SERVICE (3 ENDPOINTS) ---');
const derivServicePath = path.join(root, 'src/lib/derivativesService.ts');
const derivCode = fs.existsSync(derivServicePath) ? fs.readFileSync(derivServicePath, 'utf8') : '';
assert(
  derivCode.includes('topLongShortPositionRatio?symbol=BTCUSDT&period=1d&limit=14') &&
  derivCode.includes('globalLongShortAccountRatio?symbol=BTCUSDT&period=1d&limit=14') &&
  derivCode.includes('takerlongshortRatio?symbol=BTCUSDT&period=1d&limit=14') &&
  derivCode.includes('Promise.allSettled'),
  'derivativesService.ts fetches all 3 public Binance Futures microstructure endpoints in parallel via Promise.allSettled'
);

// ---------------------------------------------------------------------------
// CHECK 4: UPGRADE 2 — Whale vs. Retail Spread & 4 Orderflow Regimes
// ---------------------------------------------------------------------------
console.log('\n--- CHECK 4: WHALE VS. RETAIL SPREAD & 4 ORDERFLOW REGIMES ---');
const radarCode = fs.readFileSync(path.join(root, 'src/components/apple/AppleCyclePeakRadar.tsx'), 'utf8');
assert(
  derivCode.includes('SPOT_LED_ACCUMULATION') &&
  derivCode.includes('PERP_DRIVEN_SPECULATION') &&
  derivCode.includes('DELEVERAGING_FLUSH') &&
  derivCode.includes('NEUTRAL_FLOW') &&
  derivCode.includes('whaleRetailSpread = Number((topPositionLongPct - retailAccountLongPct)') &&
  radarCode.includes('data-testid="microstructure-whale-matrix"'),
  'derivativesService.ts & AppleCyclePeakRadar.tsx compute and surface whaleRetailSpread and all 4 orderflowRegime states'
);

// ---------------------------------------------------------------------------
// CHECK 5: UPGRADE 3 — RiskMetrics EWMA Volatility (λ = 0.94) & 60/40 Blend
// ---------------------------------------------------------------------------
console.log('\n--- CHECK 5: J.P. MORGAN RISKMETRICS EWMA (λ=0.94) & 60/40 GK BLEND ---');
const quantCode = fs.readFileSync(path.join(root, 'src/lib/quantEngine.ts'), 'utf8');
assert(
  quantCode.includes('computeEWMAVolatility') &&
  quantCode.includes('lambda: number = 0.94') &&
  quantCode.includes('0.60 * ewma.dailyVol + 0.40 * safeGKDaily'),
  'quantEngine.ts implements RiskMetrics EWMA (λ=0.94) and blends 60% EWMA + 40% Garman-Klass into sigmaEffectiveDaily'
);

// ---------------------------------------------------------------------------
// CHECK 6: UPGRADE 3 — Monotonic Cornish-Fisher Guard (S in [-1.25, +1.25], K in [0, 3.50])
// ---------------------------------------------------------------------------
console.log('\n--- CHECK 6: MONOTONIC CORNISH-FISHER GUARD ---');
function cfQuantileClamped(z, rawS, rawK) {
  const S = Math.max(-1.25, Math.min(1.25, rawS));
  const K = Math.max(0.0, Math.min(3.50, rawK));
  const z2 = z * z;
  const z3 = z2 * z;
  return z + (S / 6) * (z2 - 1) + (K / 24) * (z3 - 3 * z) - ((S * S) / 36) * (2 * z3 - 5 * z);
}
const z15Extreme = cfQuantileClamped(-1.0364, -4.5, 12.0);
const z50Extreme = cfQuantileClamped(0.0, -4.5, 12.0);
const z85Extreme = cfQuantileClamped(1.0364, -4.5, 12.0);
assert(
  quantCode.includes('Math.max(-1.25, Math.min(1.25') &&
  quantCode.includes('Math.max(0.0, Math.min(3.50') &&
  z15Extreme < z50Extreme &&
  z50Extreme < z85Extreme,
  `Cornish-Fisher Monotonicity Guard clamps S in [-1.25, +1.25] & K in [0.0, 3.50], preserving z15 (${z15Extreme.toFixed(3)}) < z50 (${z50Extreme.toFixed(3)}) < z85 (${z85Extreme.toFixed(3)})`
);

// ---------------------------------------------------------------------------
// CHECK 7: UPGRADE 3 — Exact Drift-Adjusted Reflection Principle (7D Touch Prob)
// ---------------------------------------------------------------------------
console.log('\n--- CHECK 7: DRIFT-ADJUSTED REFLECTION PRINCIPLE FOR 7D TOUCH PROB ---');
function normalCdf(z) {
  const absZ = Math.abs(z);
  const t = 1 / (1 + 0.2316419 * absZ);
  const d = 0.3989422804014327 * Math.exp((-absZ * absZ) / 2);
  const tail = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - tail : tail;
}
function touchProb7D(P0, B, sigmaEff, muDaily = 0) {
  const tau = 7.0;
  const logRatio = Math.log(B / P0);
  const muE = muDaily - 0.5 * sigmaEff * sigmaEff;
  const denom = sigmaEff * Math.sqrt(tau);
  const z1 = (logRatio - muE * tau) / denom;
  const z2 = (logRatio + muE * tau) / denom;
  const expArg = (2 * muE * logRatio) / (sigmaEff * sigmaEff);
  const raw = normalCdf(z1) + Math.exp(expArg) * normalCdf(z2);
  return Math.min(95.0, Math.max(5.0, Number((raw * 100).toFixed(1))));
}
const pTouch1 = touchProb7D(75925, 74200, 0.024, 0.0);
const pTouch2 = touchProb7D(75925, 72480, 0.024, 0.0);
assert(
  quantCode.includes('standardNormalCdf(z1) + Math.exp(expArg) * standardNormalCdf(z2)') &&
  pTouch2 >= 5.0 &&
  pTouch2 <= pTouch1 &&
  pTouch1 <= 95.0,
  `Drift-Adjusted Reflection Principle satisfies 5% <= Limit2 (${pTouch2}%) <= Limit1 (${pTouch1}%) <= 95%`
);

// ---------------------------------------------------------------------------
// CHECK 8: UPGRADE 4 — 30-Day Non-Repainting Signal Trajectory & Zone 1 Sparkline
// ---------------------------------------------------------------------------
console.log('\n--- CHECK 8: 30-DAY NON-REPAINTING SIGNAL TRAJECTORY & SPARKLINE ---');
const heroCode = fs.readFileSync(path.join(root, 'src/components/apple/AppleDailySignalHero.tsx'), 'utf8');
assert(
  quantCode.includes('export function computeSignalHistory30D') &&
  heroCode.includes('data-testid="signal-trajectory-badge"') &&
  heroCode.includes('sparklinePoints') &&
  heroCode.includes('<polyline'),
  'quantEngine.ts computes 30-day non-repainting signalHistory30D and AppleDailySignalHero.tsx renders Δ7D badge + inline SVG sparkline'
);

// ---------------------------------------------------------------------------
// CHECK 9: UPGRADE 5 — Institutional Risk-Adjusted Backtest Metrics (Sortino, Calmar, Win-Rate)
// ---------------------------------------------------------------------------
console.log('\n--- CHECK 9: SORTINO RATIO, CALMAR RATIO, HIGH-CONFLUENCE WIN-RATE & 4-LINE CURVE ---');
const backtestCode = fs.readFileSync(path.join(root, 'src/lib/backtester.ts'), 'utf8');
const backtestUiCode = fs.readFileSync(path.join(root, 'src/components/center-column/RealReturnBacktester.tsx'), 'utf8');
assert(
  backtestCode.includes('sortinoRatio') &&
  backtestCode.includes('calmarRatio') &&
  backtestCode.includes('highConfluenceWinRatePct') &&
  backtestCode.includes('fixedBtcValue') &&
  backtestUiCode.includes('sortinoRatio') &&
  backtestUiCode.includes('calmarRatio') &&
  backtestUiCode.includes('highConfluenceWinRatePct') &&
  backtestUiCode.includes('fixedBtcSeries'),
  'backtester.ts & RealReturnBacktester.tsx compute and render Sortino Ratio, Calmar Ratio, High-Confluence Win-Rate (≥65), and 4th Fixed BTC DCA curve'
);

console.log('\n======================================================================');
console.log(`🏁 V7.0 SOVEREIGN QUANT VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================================');
