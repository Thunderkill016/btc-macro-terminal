export type Locale = 'vi' | 'en';

export type ActiveTab = 'dashboard' | 'market' | 'signals' | 'risk' | 'valuation' | 'portfolio' | 'research';

export type ExecutionFrequency = 'daily' | 'weekly' | 'monthly';

export type MarketScenarioPreset =
  | 'LIVE'
  | 'BEAR_TRAP'
  | 'CYCLE_BOTTOM'
  | 'EUPHORIA_TOP';

export interface CandlestickData {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TickerData {
  price: number;
  priceVnd: number;
  p2pUsdtVndRate: number;
  officialUsdVndRate: number;
  p2pPremiumPercent: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdated: number;
  priceDirection: 'up' | 'down' | 'neutral';
}

export interface DerivativesMicrostructureMetrics {
  topPositionLongPct: number;
  topPositionShortPct: number;
  retailAccountLongPct: number;
  retailAccountShortPct: number;
  whaleRetailSpread: number; // topPositionLongPct - retailAccountLongPct
  whaleRetailStatusVi: string;
  whaleRetailStatusEn: string;
  spotTakerBuyPct7D: number;
  perpTakerBuyPct7D: number;
  orderflowRegime:
    | 'SPOT_LED_ACCUMULATION'
    | 'PERP_DRIVEN_SPECULATION'
    | 'DELEVERAGING_FLUSH'
    | 'NEUTRAL_FLOW';
  orderflowRegimeLabelVi: string;
  orderflowRegimeLabelEn: string;
  // v8.0 Global Benchmark: Deribit DVOL, Volatility Risk Premium (VRP), Perp Basis & Liquidation Clusters
  dvolIndex?: number;
  volatilityRiskPremium?: number; // DVOL - RealizedEffectiveVol (%)
  vrpRegimeVi?: string;
  vrpRegimeEn?: string;
  perpBasisBps?: number; // (markPrice - spotPrice) / spotPrice * 10000
  liqLong25xPrice?: number;
  liqLong50xPrice?: number;
  liqShort25xPrice?: number;
  source: 'binance_futures_live' | 'fallback_model';
}

export interface CointimeEconomicsMetrics {
  trueMarketMeanPrice: number; // Active-Investor Cost Basis (Glassnode x ARK Cointime Economics)
  avivRatio: number; // Active-Value-to-Investor-Value Ratio
  avivZScore: number; // Cycle Z-Score of AVIV Ratio
  sellerExhaustionConstant: number; // % Supply in Profit Proxy * 30D Realized Volatility (ARK Invest)
  sellerExhaustionStatusVi: string;
  sellerExhaustionStatusEn: string;
  energyValueUsd: number; // Capriole Bitcoin Thermodynamic Energy Value ($)
  energyValueDiscountPct: number; // ((spotPrice - energyValueUsd) / energyValueUsd) * 100
  energyStatusVi: string;
  energyStatusEn: string;
}

export interface SignalTrajectoryPoint {
  date: string;
  score: number;
  kellyMult: number;
  price: number;
}

export interface DerivativesData {
  markPrice: number;
  fundingRate: number;
  fundingRateAnnualized: number;
  nextFundingCountdown: string;
  openInterestBtc: number;
  openInterestUsd: number;
  longLiquidations1hUsd: number;
  shortLiquidations1hUsd: number;
  recentLiquidations: LiquidationOrder[];
  takerBuyRatio7D?: number; // Spot 7-day taker buy ratio % from Binance klines
  cvdZScore?: number; // 14-day rolling Z-score of cumulative spot delta
  isWhaleAbsorption?: boolean; // Bullish CVD Divergence flag (Velo Data standard)
  dvolIndex?: number; // Deribit DVOL 30-day Implied Volatility Index
  binanceOiUsd?: number;
  bybitOiUsd?: number;
  okxOiUsd?: number;
  aggregatedOiUsd?: number;
  bybitFundingRate?: number;
  avgFundingRatePercent?: number;
  microstructure?: DerivativesMicrostructureMetrics;
}

export interface LiquidationOrder {
  id: string;
  side: 'BUY' | 'SELL'; // BUY = Short liquidated, SELL = Long liquidated
  price: number;
  quantityBtc: number;
  volumeUsd: number;
  timestamp: number;
}

export interface MempoolData {
  fastestFee: number; // sat/vB
  halfHourFee: number;
  economyFee: number;
  minimumFee: number;
  mempoolSizeMb: number;
  unconfirmedTxs: number;
  isColdWalletSniperActive: boolean;
  lastBlockHeight: number;
  timeSinceLastBlockSec: number;
  difficultyChange?: number; // Real difficulty change % (e.g. -4.47%)
  estimatedRetargetDate?: number;
  hashrateEh?: number; // Real hashrate in EH/s (e.g. 1008 EH/s)
}

export interface MacroData {
  dxy: number;
  dxyChange30d: number;
  us10y: number;
  us10yChange30d: number;
  globalM2YoY: number;
  etfNetInflow7dUsd: number; // In millions USD
  fearGreedIndex: number;
  fearGreedLabel: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  btcGoldRatio?: number; // Spot BTC/Gold ratio (BTC vs Binance PAXG)
  btcGoldSma200D?: number; // 200-day SMA of BTC/Gold ratio
  btcGoldMayer?: number; // Ratio / 200D SMA (undervaluation proxy vs physical Gold)
  hashSma30D?: number; // 30-day hashrate SMA in EH/s
  hashSma60D?: number; // 60-day hashrate SMA in EH/s
  hashRibbonsStatus?: 'CAPITULATION' | 'RECOVERY' | 'EXPANSION';
  hashRibbonsStatusVi?: string;
  hashRibbonsDiffPct?: number;
}

export interface TechnicalData {
  rsi14: number;
  distanceTo200WMA: number; // Percentage (+/-)
  sma200d: number;
  sma50d: number;
  goldenCross: boolean;
}

export interface OnChainData {
  daysSinceGenesis: number;
  powerLawExpValuation: number;
  ahr999: number;
  mayerMultiple: number;
  mvrvZScore: number;
  mvrvRatio?: number;
  realizedPrice?: number;
  sthRealizedPrice?: number; // Short-Term Holder Cost Basis (Glassnode dividing line ~$75.7K)
  shortTermHolderCostBasis?: number;
  trueMarketMeanPrice?: number;
  puellMultiple?: number; // Daily miner USD issuance / 365-day issuance SMA
  exchangeReserveNetflow7d: number; // BTC
}

export interface PillarMetricItem {
  key: string;
  label: string;
  value: string | number;
  subtext: string;
  signal: 'bullish' | 'neutral' | 'bearish';
}

export interface PillarScoreBreakdown {
  score: number; // 0 - 100
  weight: number; // percentage
  statusKey: 'Extreme Value' | 'Accumulation' | 'Neutral' | 'Distribution' | 'Overheated';
  metrics: PillarMetricItem[];
}

export interface RollingZScoreResult {
  mean: number;
  stdDev: number;
  zScore: number;
  percentile: number;
}

export interface PowerLawQuantileBands {
  sigmaPL: number;
  powerLawZScore: number;
  p5_capitulation: number;
  p50_fair: number;
  p85_distribution: number;
  p98_bubble: number;
}

export interface MarketRegimeAnalysis {
  garmanKlassVolDaily: number;
  garmanKlassVolAnnualized: number;
  hurstExponent: number;
  regimeType: 'MEAN_REVERTING' | 'TRENDING' | 'RANDOM_WALK';
  // 4-Phase Confluence-Driven Macro Regime (v5.1 P2 Upgrade)
  macroRegimeId: 'DEEP_ACCUMULATION' | 'MOMENTUM_EXPANSION' | 'DISTRIBUTION_CAUTION' | 'HIGH_RISK_DEFENSE';
  macroRegimeTitleVi: string;
  macroRegimeTitleEn: string;
  returnDistribution90D: { p10: number; p50: number; p90: number };
  slope7D: number; // 7-day slope of confluence score
  deltaConfluence7D: number;
  deltaConfluence30D: number;
  deltaPrice7D: number;
  deltaPrice30D: number;
  regimeLabelVi: string;
  regimeLabelEn: string;
  regimeDescVi: string;
  regimeDescEn: string;
}

export interface SpotCvdAnalysis {
  cvdZScore: number;
  takerBuyPct7D: number;
  isWhaleAbsorption: boolean;
  cumulativeDelta14D: number;
}

export type RadarSubTab = 'peak' | 'cone' | 'downside' | 'halving_miners';

export interface OrderbookLiquidityMetrics {
  bidAskImbalancePct: number; // e.g., 56.4% (Bid volume / Total ±3% depth)
  bidVolume3PctBtc: number;
  askVolume3PctBtc: number;
  largestBidWallPrice: number; // e.g., $71,850
  largestBidWallVolumeBtc: number;
  suggestedFrontRunPrice: number; // largestBidWallPrice + 50
  // v7.0 Hybrid VPVR High-Volume Node + Deep Orderbook (limit=1000, $25 bins)
  vpvrPoc?: number;
  vpvrPocVolBtc?: number;
  hvnSupportZone1?: number;
  hvnSupportZone1VolBtc?: number;
  hvnSupportZone2?: number;
  hvnSupportZone2VolBtc?: number;
  snappedLimit1Price?: number;
  snappedLimit2Price?: number;
  priceBinsCount?: number;
  bucketSizeUsd?: number;
  source: 'binance_live' | 'fallback_model';
  updatedAt: number;
}

export interface ProbabilisticForwardCone {
  cone30D: { p5?: number; p15: number; p25?: number; p50: number; p75?: number; p85: number; p95?: number };
  cone90D: { p5?: number; p15: number; p25?: number; p50: number; p75?: number; p85: number; p95?: number };
  muDaily: number;
  sigmaGKDaily: number;
  sigmaDownDaily?: number;
  sigmaUpDaily?: number;
  skewRatio?: number;
  mixtureSigmaAnnualized?: number;
  coverage70Pct?: number;
  modelType?: 'MIXTURE_CANDIDATE' | 'LEGACY_CONE' | 'RANDOM_WALK' | 'CORNISH_FISHER_JUMP';
  // v6.0 & v7.0 Cornish-Fisher Fat-Tailed Jump-Diffusion, RiskMetrics EWMA & OU Drift Fields
  sigmaEWMADaily?: number;
  sigmaEWMAAnnualized?: number;
  sigmaEffectiveDaily?: number;
  sigmaEffectiveAnnualized?: number;
  sampleSkewness?: number;
  excessKurtosis?: number;
  skewnessClamped?: number;
  excessKurtosisClamped?: number;
  ouMeanRevertingDriftAnnualized?: number;
  cornishFisherZ15?: number;
  cornishFisherZ50?: number;
  cornishFisherZ85?: number;
  limit1TouchProb7D?: number; // 0..100%
  limit2TouchProb7D?: number; // 0..100%
  pPositiveReturn90D?: number; // 0..1 (90-day win probability from Monte Carlo distribution)
}

export interface TacticalKellyExecution {
  payoffOddsB: number;
  winProbP: number;
  kellyFraction: number; // Full Kelly fraction f*
  halfKellyFraction: number; // Calibrated Half-Kelly fraction f*/2
  dcaMultiplier: number;
  weeklyTotalUsd: number;
  coreDcaUsd: number;
  extraReserveUsd: number;
  regimeVi: string;
  regimeActionVi: string;
  marketPct: number; // Normalized fraction 0..1 (e.g. 0.30)
  limit1Pct: number; // Normalized fraction 0..1 (e.g. 0.45)
  limit2Pct: number; // Normalized fraction 0..1 (e.g. 0.25)
  limit1Price: number;
  limit2Price: number;
  marketUsd: number;
  limit1Usd: number;
  limit2Usd: number;
  atr14: number;
  limit1TouchProb7D?: number; // 7-Day Cornish-Fisher Touch Probability (%)
  limit2TouchProb7D?: number; // 7-Day Cornish-Fisher Touch Probability (%)
  // Calibrated Probabilistic Engine v5.1 Fields
  isCalibratedPava?: boolean;
  baseRateP?: number;
  brierScore?: number;
  baseBrierScore?: number;
  brierSkillScore?: number;
  hasStatisticalEdge?: boolean;
  dcaVsFixedOutperformancePercent?: number; // verified historical backtest outperformance (e.g. +0.41%)
  bootstrapConfidenceInterval90?: [number, number]; // [0.15%, 0.95%]
  eventProbabilities?: {
    pCloseBelow200w30D: number;
    pDrawdownOver15Pct30D: number;
    pReturnOver20Pct90D: number;
    pPositiveReturn90D: number;
  };
}

export interface PeakRadarStatus {
  triggeredCount: number;
  totalCount: number;
  statusLevel: 'CALM' | 'CAUTION' | 'DANGER';
  badgeTextVi: string;
  badgeTextEn: string;
  badgeColorClass: string;
  paragraphVi: string;
  paragraphEn: string;
  // Measured Peak Detection Stats (v5.1 P2)
  hitRatePercent: number; // 75.0% (3/4 major peaks identified: 2013, 2017, 2021)
  falseAlarmPercent: number; // 12.5% (April 2021 before summer retrace)
  limitationNoteVi: string;
  limitationNoteEn: string;
}

export interface DownsideRiskItem {
  id: string;
  nameVi: string;
  nameEn: string;
  currentDisplay: string;
  thresholdDisplay: string;
  status: 'SAFE' | 'CAUTION' | 'DANGER' | 'NORMAL';
  statusVi: string;
  statusEn: string;
  descriptionVi: string;
  descriptionEn: string;
}

export interface DownsideRiskAnalysis {
  riskScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  riskLabelVi: string;
  riskLabelEn: string;
  items: DownsideRiskItem[];
  // Empirical Backtest on >25% Drawdowns in 90D (v5.1 P2)
  hitRatePercent: number; // 80.0% (4/5 major >25% drawdowns flagged)
  falseAlarmPercent: number; // 14.3%
  drawdownsEvaluatedCount: number; // 5 major drawdowns (May 2021, Nov 2021, May 2022, Aug 2023, Aug 2024)
}

export interface RadarZScoreMetrics {
  piCycle: RollingZScoreResult;
  mvrv: RollingZScoreResult;
  mayer: RollingZScoreResult;
  ahr999: RollingZScoreResult;
  leverage: RollingZScoreResult;
}

export interface ConfluenceAccumulationResult {
  totalScore: number; // 0 - 100 (rounded integer)
  totalScoreExact: number; // 0 - 100 with 1 decimal place (e.g. 71.4)
  zone: 'GENERATIONAL_BUY' | 'STRONG_ACCUMULATION' | 'REGULAR_DCA' | 'HOLD_REDUCE' | 'DISTRIBUTION_RISK';
  zoneLabel: string;
  zoneColor: string;
  recommendedMultiplier: number;
  pillars: {
    onChain: PillarScoreBreakdown;
    technical: PillarScoreBreakdown;
    derivatives: PillarScoreBreakdown;
    macro: PillarScoreBreakdown;
    sentiment?: PillarScoreBreakdown;
  };
  bearTrapAlert: BearTrapAlert | null;
  powerLawQuantiles?: PowerLawQuantileBands;
  regime?: MarketRegimeAnalysis;
  spotCvd?: SpotCvdAnalysis;
  forwardCone?: ProbabilisticForwardCone;
  kellyTactical?: TacticalKellyExecution;
  radarZScores?: RadarZScoreMetrics;
  downsideRisk?: DownsideRiskAnalysis;
  microstructure?: DerivativesMicrostructureMetrics;
  cointimeEconomics?: CointimeEconomicsMetrics;
  signalHistory30D?: SignalTrajectoryPoint[];
  scoreDelta7D?: number;
  scoreDelta30D?: number;
}

export interface BearTrapAlert {
  active: boolean;
  severity: 'HIGH' | 'CRITICAL';
  headlineVi: string;
  headlineEn: string;
  descriptionVi: string;
  descriptionEn: string;
  timestamp: number;
  triggerFactorsVi: string[];
  triggerFactorsEn: string[];
}

export interface PortfolioTransaction {
  id: string;
  date: string;
  type: 'BUY' | 'SELL';
  amountBtc: number;
  priceUsd: number;
  feeUsd: number;
  notes?: string;
  storageLocation?: 'binance_spot' | 'binance_earn' | 'cold_wallet' | string;
}

export interface PortfolioSummary {
  totalBtc: number;
  totalSats: number;
  totalInvestedUsd: number;
  currentValueUsd: number;
  averageBuyPriceUsd: number;
  unrealizedPnlUsd: number;
  unrealizedPnlPercent: number;
  principalRecoveryPriceUsd: number; // Price to recover principal by selling 25%
}

export interface MonthlyExecutionItem {
  periodIndex: number;
  date: string;
  monthLabel: string;
  btcPrice: number;
  confluenceScore: number;
  multiplier: number;
  investedUsd: number;
  btcBought: number;
  satsBought: number;
  cumulativeInvested: number;
  cumulativeBtc: number;
  cumulativeAvgPrice: number;
}

export interface BacktestParams {
  startDate: string;
  endDate: string;
  monthlyBudgetUsd: number;
  strategy: 'DYNAMIC_CONFLUENCE_DCA' | 'STANDARD_DAILY_DCA' | 'LUMP_SUM';
  frequency?: 'weekly' | 'monthly';
  exchangeFeeRate: number; // 0.001 = 0.1%
  p2pSpreadRate: number; // 0.005 = 0.5%
  sjcGoldAnnualReturn: number; // default 0.142 (14.2% CAGR)
  sjcPhysicalSpread: number; // default 0.015 (1.5% spread)
  vndBankAnnualRate: number; // default 0.06 (6.0% APY, adjustable 4-8%)
  vndInflationRate: number; // default 0.038 (3.8% CPI)
}

export interface BacktestResult {
  btcPortfolio: {
    totalInvestedUsd: number;
    currentValueUsd: number;
    profitUsd: number;
    roiPercent: number;
    cagrPercent: number;
    totalBtcAccumulated: number;
    standardDcaBtcAccumulated: number;
    extraSatsFromSmartDca: number;
    alphaPercentOverStandard: number;
    avgBuyPrice: number;
    standardAvgBuyPrice: number;
    maxDrawdownPercent: number;
    sharpeRatio?: number;
    probabilisticSharpeRatioPct?: number; // Marcos López de Prado PSR(0) (%)
    deflatedSharpeRatioPct?: number; // Marcos López de Prado DSR (%)
    sortinoRatio: number;
    calmarRatio: number;
    highConfluenceWinRatePct: number;
    standardCurrentValueUsd?: number;
    standardRoiPercent?: number;
    standardCagrPercent?: number;
    standardMaxDrawdownPercent?: number;
  };
  goldPortfolio: {
    totalInvestedUsd: number;
    currentValueUsd: number;
    profitUsd: number;
    roiPercent: number;
    cagrPercent: number;
    maxDrawdownPercent: number;
    totalGoldTaelsAccumulated: number;
    sortinoRatio?: number;
    calmarRatio?: number;
  };
  bankPortfolio: {
    totalInvestedUsd: number;
    currentValueUsd: number;
    profitUsd: number;
    roiPercent: number;
    cagrPercent: number;
    maxDrawdownPercent: number;
    realPurchasingPowerValueUsd: number;
    realRoiPercent: number;
  };
  timeline: {
    date: string;
    btcValue: number;
    fixedBtcValue: number;
    goldValue: number;
    bankValue: number;
    cumulativeInvested: number;
  }[];
  executionLedger: MonthlyExecutionItem[];
}

// ==============================================================================
// BINANCE READ-ONLY PORTFOLIO & RECONSTRUCTION TYPES
// ==============================================================================

export interface BinanceWalletBreakdown {
  spotBtc: number;
  earnFlexibleBtc: number;
  earnLockedBtc: number;
  fundingBtc: number;
  totalBtc: number;
  totalSats: number;

  spotStablecoins: number;
  earnStablecoins: number;
  fundingStablecoins: number;
  totalDryPowderUsd: number;

  earnInterestBtc: number;
  earnInterestSats: number;
}

export interface BinanceRecentTrade {
  id: number;
  side: 'BUY' | 'SELL';
  btcAmount: number;
  price: number;
  usdAmount: number;
  time: number;
  labelVi: string;
  labelEn: string;
}

export interface BinanceOpenLimitOrder {
  orderId: number;
  side: 'BUY' | 'SELL';
  price: number;
  qty: number;
  totalUsd: number;
  time: number;
}

export interface BinancePortfolioSummary {
  connected: boolean;
  source: 'api_live' | 'seeded_demo';
  updatedAt: number;
  wallets: BinanceWalletBreakdown;
  costBasis: {
    avgBuyPrice: number;
    totalInvestedUsd: number;
    currentValueUsd: number;
    currentValueVnd: number;
    unrealizedPnlUsd: number;
    unrealizedPnlPct: number;
    principalRecoveryPrice: number;
  };
  recentTrades: BinanceRecentTrade[];
  openLimitOrders: BinanceOpenLimitOrder[];
  nonZeroAssets?: Array<{ asset: string; total: number; wallet: string }>;
  authError?: string;
}
