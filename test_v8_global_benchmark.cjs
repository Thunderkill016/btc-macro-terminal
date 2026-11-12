const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('==================================================================');
console.log('🌍 BITCOIN ALPHA TERMINAL v8.0 GLOBAL BENCHMARK VERIFICATION SUITE');
console.log('==================================================================\n');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Reason: ${err.message}`);
    failed++;
  }
}

const derivCode = fs.readFileSync(path.join(__dirname, 'src/lib/derivativesService.ts'), 'utf8');
const quantCode = fs.readFileSync(path.join(__dirname, 'src/lib/quantEngine.ts'), 'utf8');
const backtesterCode = fs.readFileSync(path.join(__dirname, 'src/lib/backtester.ts'), 'utf8');
const radarCode = fs.readFileSync(path.join(__dirname, 'src/components/apple/AppleCyclePeakRadar.tsx'), 'utf8');
const backtesterUiCode = fs.readFileSync(path.join(__dirname, 'src/components/center-column/RealReturnBacktester.tsx'), 'utf8');
const portfolioCode = fs.readFileSync(path.join(__dirname, 'src/components/tabs/PortfolioTab.tsx'), 'utf8');

// 1. Live Deribit DVOL Implied Volatility API & Volatility Risk Premium (VRP)
check('1. [Deribit DVOL & VRP] derivativesService.ts queries Deribit public get_volatility_index_data & computes VRP (IV - RV)', () => {
  assert(
    derivCode.includes('deribit.com/api/v2/public/get_volatility_index_data?currency=BTC'),
    'Must query Deribit public DVOL endpoint'
  );
  assert(
    derivCode.includes('export async function fetchLiveDeribitDvol'),
    'Must export fetchLiveDeribitDvol'
  );
  assert(
    derivCode.includes('volatilityRiskPremium') && derivCode.includes('dvolIndex - realizedVolAnn'),
    'Must compute Volatility Risk Premium (VRP = DVOL - RealizedVol)'
  );
});

// 2. Perpetual Futures Basis & Leverage Liquidation Clusters
check('2. [Perp Basis & Liquidation Clusters] derivativesService.ts computes perpBasisBps and 50x/25x Long & Short liquidation zones', () => {
  assert(
    derivCode.includes('perpBasisBps') &&
      derivCode.includes('liqLong50xPrice') &&
      derivCode.includes('liqLong25xPrice') &&
      derivCode.includes('liqShort25xPrice'),
    'Must compute perpBasisBps, liqLong50xPrice, liqLong25xPrice, and liqShort25xPrice'
  );
});

// 3. Cointime Economics (True Market Mean / AVIV Ratio / ARK Seller Exhaustion Constant)
check('3. [Cointime Economics] quantEngine.ts computes True Market Mean, AVIV Ratio, and ARK Seller Exhaustion Constant', () => {
  assert(
    quantCode.includes('export function computeCointimeAndEnergyMetrics'),
    'Must export computeCointimeAndEnergyMetrics'
  );
  assert(
    quantCode.includes('trueMarketMeanPrice') &&
      quantCode.includes('avivRatio') &&
      quantCode.includes('avivZScore') &&
      quantCode.includes('sellerExhaustionConstant'),
    'Must compute True Market Mean, AVIV Ratio, AVIV Z-Score, and ARK Seller Exhaustion Constant'
  );
});

// 4. Capriole Investments Thermodynamic Bitcoin Energy Value
check('4. [Capriole Energy Value] quantEngine.ts computes Joule-backed Bitcoin Energy Value from live network Hashrate (EH/s)', () => {
  assert(
    quantCode.includes('energyValueUsd') && quantCode.includes('energyValueDiscountPct'),
    'Must compute energyValueUsd and energyValueDiscountPct'
  );
});

// 5. Marcos López de Prado Probabilistic Sharpe Ratio (PSR) & Deflated Sharpe Ratio (DSR)
check('5. [López de Prado PSR & DSR] backtester.ts computes non-Normal skewness/kurtosis PSR and multiple-trial DSR', () => {
  assert(
    backtesterCode.includes('probabilisticSharpeRatioPct') &&
      backtesterCode.includes('deflatedSharpeRatioPct') &&
      backtesterCode.includes('skewG3') &&
      backtesterCode.includes('kurtG4'),
    'Must compute probabilisticSharpeRatioPct and deflatedSharpeRatioPct adjusting for skewness and kurtosis'
  );
});

// 6. UI Surface: Zone 3 Tab C Derivatives VRP & Liquidation Cluster Strip
check('6. [Zone 3 Tab C UI] AppleCyclePeakRadar.tsx renders derivatives-vrp-liquidation-strip', () => {
  assert(
    radarCode.includes('data-testid="derivatives-vrp-liquidation-strip"'),
    'Must render derivatives-vrp-liquidation-strip in Tab C'
  );
});

// 7. UI Surface: Zone 3 Tab D Cointime Economics & Capriole Energy Matrix
check('7. [Zone 3 Tab D UI] AppleCyclePeakRadar.tsx renders cointime-energy-matrix', () => {
  assert(
    radarCode.includes('data-testid="cointime-energy-matrix"') &&
      radarCode.includes('True Market Mean & AVIV'),
    'Must render cointime-energy-matrix in Tab D'
  );
});

// 8. UI Surface: Tab 3 RealReturnBacktester PSR & DSR Row
check('8. [Tab 3 Backtester UI] RealReturnBacktester.tsx renders backtester-psr-dsr-row', () => {
  assert(
    backtesterUiCode.includes('data-testid="backtester-psr-dsr-row"') &&
      backtesterUiCode.includes('PSR (López de Prado)'),
    'Must render backtester-psr-dsr-row in RealReturnBacktester.tsx'
  );
});

// 9. Single Source of Truth (SSOT) 200W SMA in PortfolioTab.tsx
check('9. [SSOT 200W Floor] PortfolioTab.tsx uses useUnifiedMetrics().floorSma200w instead of hardcoded 67766', () => {
  assert(
    portfolioCode.includes('useUnifiedMetrics') && portfolioCode.includes('metrics.floorSma200w'),
    'PortfolioTab.tsx must read metrics.floorSma200w from useUnifiedMetrics()'
  );
  assert(
    !portfolioCode.includes('const sma200w = 67766'),
    'PortfolioTab.tsx must not hardcode sma200w = 67766'
  );
});

console.log(`\n==================================================================`);
console.log(`🎯 SUMMARY: ${passed}/${passed + failed} CHECKS PASSED`);
console.log(`==================================================================`);

if (failed > 0) {
  process.exit(1);
}
