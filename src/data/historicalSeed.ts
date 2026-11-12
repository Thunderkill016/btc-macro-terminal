import { MacroData } from '../types';
export {
  BITCOIN_GENESIS_EPOCH,
  getDaysSinceGenesis,
  calculatePowerLawAtDate,
  getMonotonic200WMA,
} from '../lib/cycleModelMath';

/**
 * Realistic Macro & Liquidity seed data
 */
export const SEED_MACRO_DATA: MacroData = {
  dxy: 104.1,
  dxyChange30d: -0.9,
  us10y: 4.36,
  us10yChange30d: -0.12,
  globalM2YoY: 5.6, // Percentage expansion
  etfNetInflow7dUsd: 1420.5, // +$1.42B net inflow
  fearGreedIndex: 28, // Fear / Accumulation zone
  fearGreedLabel: 'Fear',
  btcGoldRatio: 18.3,
  btcGoldSma200D: 17.09,
  btcGoldMayer: 1.07,
  hashSma30D: 1035.3,
  hashSma60D: 996.5,
  hashRibbonsStatus: 'EXPANSION',
  hashRibbonsStatusVi: 'Mạng Lưới Mở Rộng Ổn Định',
  hashRibbonsDiffPct: 3.9,
};

/**
 * Historical Vietnam Financial Benchmarks (SJC Gold & Bank Savings)
 */
export const VIETNAM_FINANCIAL_BENCHMARKS = {
  sjcGoldPriceTrieuVndPerLuong: 89.5, // 89.5 triệu VND / lượng
  sjcGoldAnnualCagr: 0.142, // ~14.2% historical annualized return
  sjcPhysicalSpreadRate: 0.015, // 1.5% buy-sell spread deduction
  vndBankSavingsAnnualRateDefault: 0.06, // 6.0% default APY
  vndInflationRateAnnual: 0.038, // 3.8% annual CPI inflation rate
  p2pUsdtVndRate: 25603,
  officialUsdVndRate: 25603,
};
