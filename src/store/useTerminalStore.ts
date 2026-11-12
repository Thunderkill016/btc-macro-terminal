import { create } from 'zustand';
import {
  ActiveTab,
  BacktestParams,
  BacktestResult,
  BinancePortfolioSummary,
  CandlestickData,
  ConfluenceAccumulationResult,
  DerivativesData,
  ExecutionFrequency,
  LiquidationOrder,
  Locale,
  MacroData,
  MarketScenarioPreset,
  MempoolData,
  OnChainData,
  OrderbookLiquidityMetrics,
  PortfolioSummary,
  PortfolioTransaction,
  RadarSubTab,
  TechnicalData,
  TickerData,
} from '../types';
import {
  getDefaultOrderbookMetrics,
  fetchLiveBinanceOrderbook,
} from '../lib/orderbookService';
import {
  getDefaultDerivativesMicrostructure,
  fetchDerivativesMicrostructure,
} from '../lib/derivativesService';
import {
  RealCyclePoint,
  RealFuturesData,
  RealMempoolMiningData,
  RealFxCryptoPrices,
  RealNewsItem,
  RealCoinMetricsData,
  fetchRealBinanceCandles,
  fetchRealFuturesData,
  fetchRealMempoolMiningData,
  fetchRealFxAndPrices,
  fetchRealLiveNews,
  fetchLiveCoinMetrics,
  INITIAL_REAL_NEWS,
} from '../lib/realDataService';
import {
  SEED_MACRO_DATA,
  VIETNAM_FINANCIAL_BENCHMARKS,
} from '../data/historicalSeed';
import {
  HISTORICAL_DAILY_CANDLES,
  HISTORICAL_WEEKLY_CANDLES,
} from '../data/historicalMultiCycleCandles';
import { computePortfolioSummaryWAC } from '../domain/models/portfolio';
import {
  calculateOnChainMetrics,
  calculateTechnicalMetrics,
  computeConfluenceScore,
  getScenarioPresetState,
} from '../lib/quantEngine';
import { runBacktest } from '../lib/backtester';
import {
  saveEncryptedBinanceVault,
  getEncryptedBinanceVaultMeta,
  unlockBinanceVault,
  deleteBinanceVault,
} from '../lib/cryptoVault';
import { syncBinancePortfolioClientSide } from '../lib/binanceClientSync';
import { useTickerStore } from './useTickerStore';
import { useQuantTerminalStore } from './useQuantTerminalStore';

const STORAGE_PORTFOLIO_KEY = 'btc_terminal_portfolio_ledger_v1';
const STORAGE_LOCALE_KEY = 'btc_terminal_locale_v3';
const STORAGE_BINANCE_KEYS = 'btc_terminal_binance_keys_v1';

let lastQuantRecalcTime = 0;
let quantRecalcTimer: number | null = null;

function loadInitialBinanceKeys(): { apiKey: string; apiSecret: string } {
  try {
    const raw = localStorage.getItem(STORAGE_BINANCE_KEYS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
          apiSecret: '', // In-memory session only, never restored unencrypted
        };
      }
    }
  } catch {}
  return { apiKey: '', apiSecret: '' };
}

function loadInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_LOCALE_KEY);
    if (saved === 'en' || saved === 'vi') return saved;
  } catch {}
  return 'vi'; // Default to Vietnamese
}

function loadInitialPortfolio(): PortfolioTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_PORTFOLIO_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return []; // Pure zero-mock default: empty array
}

interface TerminalState {
  // Navigation Tabs
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Real Public Data Streams (Zero-Mock)
  realCyclePoints: RealCyclePoint[];
  realFutures: RealFuturesData | null;
  realMining: RealMempoolMiningData | null;
  realPrices: RealFxCryptoPrices | null;
  realNews: RealNewsItem[];
  isLoadingRealData: boolean;
  fetchRealData: () => Promise<void>;

  // Localization
  locale: Locale;
  setLocale: (locale: Locale) => void;

  // Scenario Simulator
  activeScenario: MarketScenarioPreset;
  setActiveScenario: (scenario: MarketScenarioPreset) => void;

  // Live Data
  candles: CandlestickData[];
  ticker: TickerData;
  derivatives: DerivativesData;
  mempool: MempoolData;
  macro: MacroData;

  // Computed Quant State
  confluenceResult: ConfluenceAccumulationResult;

  // Local Portfolio
  transactions: PortfolioTransaction[];
  portfolioSummary: PortfolioSummary;

  // Binance Read-Only Live Portfolio
  binancePortfolio: BinancePortfolioSummary | null;
  binanceApiConfig: { apiKey: string; apiSecret: string };
  binanceModalOpen: boolean;
  isBinanceSyncing: boolean;
  liveCoinMetrics: RealCoinMetricsData | null;

  // DCA Advisor Settings
  dcaBudget: number;
  dcaCurrency: 'USD' | 'VND';
  dcaFrequency: ExecutionFrequency; // 'daily' | 'weekly' | 'monthly'
  dryPowderRatio: number; // default 0.30 (30%)

  // Backtester
  backtestParams: BacktestParams;
  backtestResult: BacktestResult;

  // Modals & UI Controls
  isLiveConnected: boolean;
  telegramModalOpen: boolean;
  selfCustodyModalOpen: boolean;
  shareCardModalOpen: boolean;
  institutionalModalOpen: boolean;
  forecastLedgerModalOpen: boolean;
  commandPaletteOpen: boolean;
  activeRadarSubTab: RadarSubTab;
  orderbookDepth: OrderbookLiquidityMetrics;
  selectedPlaybookTab: 'lookintobitcoin' | 'glassnode' | 'coinglass' | 'swan';
  selectedPillarKey: 'onChain' | 'technical' | 'derivatives' | 'macro' | 'sentiment';

  // Actions
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveRadarSubTab: (tab: RadarSubTab) => void;
  fetchOrderbookLiquidity: () => Promise<void>;
  updateSpotTicker: (tickerUpdate: Partial<TickerData>) => void;
  updateFundingRate: (markPrice: number, fundingRate: number) => void;
  addLiquidation: (order: LiquidationOrder) => void;
  updateMempool: (mempoolUpdate: Partial<MempoolData>) => void;
  updateMacro: (macroUpdate: Partial<MacroData>) => void;

  // Portfolio actions
  addTransaction: (tx: Omit<PortfolioTransaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  editTransaction: (id: string, updated: Partial<PortfolioTransaction>) => void;
  exportPortfolioJson: () => string;
  exportPortfolioCsv: () => string;
  importPortfolioJson: (jsonStr: string) => boolean;
  manualDryPowderUsd: number;
  setManualDryPowderUsd: (amount: number) => void;
  addTransactionModalOpen: boolean;
  setAddTransactionModalOpen: (open: boolean) => void;
  editingTransaction: PortfolioTransaction | null;
  setEditingTransaction: (tx: PortfolioTransaction | null) => void;

  // Binance Portfolio actions
  setBinanceModalOpen: (open: boolean) => void;
  setBinanceApiConfig: (config: { apiKey: string; apiSecret: string }) => void;
  vaultMeta: { hasVault: boolean; apiKey: string; createdAt: number | null };
  isVaultLocked: boolean;
  saveVaultWithPin: (apiKey: string, apiSecret: string, pin: string) => Promise<void>;
  unlockVaultWithPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  deleteVault: () => void;
  fetchBinancePortfolio: (overrideKeys?: {
    apiKey?: string;
    apiSecret?: string;
    saveToServer?: boolean;
    useWorkerDefault?: boolean;
  }) => Promise<{ success: boolean; portfolio?: BinancePortfolioSummary; error?: string }>;

  // DCA & Backtest actions
  setDcaBudget: (budget: number) => void;
  setDcaCurrency: (currency: 'USD' | 'VND') => void;
  setDcaFrequency: (freq: ExecutionFrequency) => void;
  setBacktestParams: (params: Partial<BacktestParams>) => void;
  triggerBacktest: () => void;

  // Modal actions
  setTelegramModalOpen: (open: boolean) => void;
  setSelfCustodyModalOpen: (open: boolean) => void;
  setShareCardModalOpen: (open: boolean) => void;
  setInstitutionalModalOpen: (open: boolean, tab?: 'lookintobitcoin' | 'glassnode' | 'coinglass' | 'swan') => void;
  setForecastLedgerModalOpen: (open: boolean) => void;
  setSelectedPillarKey: (key: 'onChain' | 'technical' | 'derivatives' | 'macro' | 'sentiment') => void;
  recalculateQuantState: () => void;
}

export const useTerminalStore = create<TerminalState>((set, get) => {
  const initialCandles = HISTORICAL_DAILY_CANDLES;
  const initialCurrentPrice = initialCandles[initialCandles.length - 1].close; // $75,925
  const initialTransactions = loadInitialPortfolio();
  const initialLocale = loadInitialLocale();

  const initialTicker: TickerData = {
    price: initialCurrentPrice,
    priceVnd: Math.round(initialCurrentPrice * VIETNAM_FINANCIAL_BENCHMARKS.p2pUsdtVndRate),
    p2pUsdtVndRate: VIETNAM_FINANCIAL_BENCHMARKS.p2pUsdtVndRate,
    officialUsdVndRate: VIETNAM_FINANCIAL_BENCHMARKS.officialUsdVndRate,
    p2pPremiumPercent: parseFloat(
      (
        ((VIETNAM_FINANCIAL_BENCHMARKS.p2pUsdtVndRate -
          VIETNAM_FINANCIAL_BENCHMARKS.officialUsdVndRate) /
          VIETNAM_FINANCIAL_BENCHMARKS.officialUsdVndRate) *
        100
      ).toFixed(2)
    ),
    change24h: 1.45,
    high24h: 76800,
    low24h: 74900,
    volume24h: 92000,
    lastUpdated: Date.now(),
    priceDirection: 'neutral',
  };

  const initialDerivatives: DerivativesData = {
    markPrice: initialCurrentPrice,
    fundingRate: 0.000085,
    fundingRateAnnualized: 9.31,
    takerBuyRatio7D: 49.83,
    microstructure: getDefaultDerivativesMicrostructure(49.83, 0.000085),
    nextFundingCountdown: '03:42:15',
    openInterestBtc: 384000,
    openInterestUsd: 384000 * initialCurrentPrice,
    longLiquidations1hUsd: 14200000,
    shortLiquidations1hUsd: 4800000,
    recentLiquidations: [
      {
        id: 'liq-seed-1',
        side: 'SELL',
        price: initialCurrentPrice * 0.992,
        quantityBtc: 8.4,
        volumeUsd: 8.4 * initialCurrentPrice,
        timestamp: Date.now() - 1000 * 45,
      },
      {
        id: 'liq-seed-2',
        side: 'SELL',
        price: initialCurrentPrice * 0.988,
        quantityBtc: 14.2,
        volumeUsd: 14.2 * initialCurrentPrice,
        timestamp: Date.now() - 1000 * 120,
      },
      {
        id: 'liq-seed-3',
        side: 'BUY',
        price: initialCurrentPrice * 1.008,
        quantityBtc: 4.8,
        volumeUsd: 4.8 * initialCurrentPrice,
        timestamp: Date.now() - 1000 * 240,
      },
    ],
  };

  const initialMempool: MempoolData = {
    fastestFee: 4.2,
    halfHourFee: 2.8, // Strictly formatted (max 1 decimal)
    economyFee: 1.5,
    minimumFee: 1.0,
    mempoolSizeMb: 114.5,
    unconfirmedTxs: 44320,
    isColdWalletSniperActive: true,
    lastBlockHeight: 896420,
    timeSinceLastBlockSec: 320,
  };

  const initialMacro = SEED_MACRO_DATA;

  // Initial Calibrated Quant calculation
  const onChainMetrics = calculateOnChainMetrics(initialCurrentPrice);
  const technicalMetrics = calculateTechnicalMetrics(initialCandles, initialCurrentPrice);
  const initialConfluence = computeConfluenceScore(
    onChainMetrics,
    initialMacro,
    technicalMetrics,
    initialDerivatives,
    [],
    initialTicker.change24h,
    0,
    initialCandles,
    []
  );

  // Compute portfolio summary helper (GAAP / Wealthfolio Weighted-Average Cost)
  const computeSummary = (
    txs: PortfolioTransaction[],
    price: number
  ): PortfolioSummary => {
    return computePortfolioSummaryWAC(txs, price);
  };

  const initialPortfolioSummary = computeSummary(initialTransactions, initialCurrentPrice);

  const initialBacktestParams: BacktestParams = {
    startDate: '2023-01-01',
    endDate: '2026-11-08',
    monthlyBudgetUsd: 500,
    strategy: 'DYNAMIC_CONFLUENCE_DCA',
    exchangeFeeRate: 0.001,
    p2pSpreadRate: 0.005,
    sjcGoldAnnualReturn: VIETNAM_FINANCIAL_BENCHMARKS.sjcGoldAnnualCagr, // 14.2% default
    sjcPhysicalSpread: VIETNAM_FINANCIAL_BENCHMARKS.sjcPhysicalSpreadRate, // 1.5%
    vndBankAnnualRate: VIETNAM_FINANCIAL_BENCHMARKS.vndBankSavingsAnnualRateDefault, // 6.0% default
    vndInflationRate: VIETNAM_FINANCIAL_BENCHMARKS.vndInflationRateAnnual, // 3.8% CPI
  };

  const initialBacktestResult = runBacktest(initialBacktestParams, initialCandles);

  return {
    activeTab: 'dashboard',
    realCyclePoints: [],
    realFutures: null,
    realMining: null,
    realPrices: null,
    realNews: INITIAL_REAL_NEWS,
    isLoadingRealData: false,
    locale: initialLocale,
    activeScenario: 'LIVE',
    candles: initialCandles,
    ticker: initialTicker,
    derivatives: initialDerivatives,
    mempool: initialMempool,
    macro: initialMacro,
    confluenceResult: initialConfluence,
    transactions: initialTransactions,
    portfolioSummary: initialPortfolioSummary,
    binancePortfolio: null,
    binanceApiConfig: loadInitialBinanceKeys(),
    vaultMeta: getEncryptedBinanceVaultMeta(),
    isVaultLocked: getEncryptedBinanceVaultMeta().hasVault,
    binanceModalOpen: false,
    isBinanceSyncing: false,
    manualDryPowderUsd: 0,
    addTransactionModalOpen: false,
    editingTransaction: null,
    liveCoinMetrics: {
      realizedPrice: 53950,
      mvrv: 1.40,
      priceUsd: 75724,
      time: '2026-11-08T00:00:00Z',
    },
    dcaBudget: 500,
    dcaCurrency: 'USD',
    dcaFrequency: 'weekly', // Default to weekly
    dryPowderRatio: 0.3,
    backtestParams: initialBacktestParams,
    backtestResult: initialBacktestResult,
    isLiveConnected: false,
    telegramModalOpen: false,
    selfCustodyModalOpen: false,
    shareCardModalOpen: false,
    institutionalModalOpen: false,
    forecastLedgerModalOpen: false,
    commandPaletteOpen: false,
    activeRadarSubTab: 'peak',
    orderbookDepth: getDefaultOrderbookMetrics(initialCurrentPrice),
    selectedPlaybookTab: 'lookintobitcoin',
    selectedPillarKey: 'onChain',

    setCommandPaletteOpen: (open) => {
      useQuantTerminalStore.getState().setCommandPaletteOpen(open);
      set({ commandPaletteOpen: open });
    },
    setActiveRadarSubTab: (tab) => {
      useQuantTerminalStore.getState().setActiveRadarSubTab(tab);
      set({ activeRadarSubTab: tab });
    },

    fetchOrderbookLiquidity: async () => {
      try {
        await useQuantTerminalStore.getState().fetchOrderbookLiquidity();
        set({ orderbookDepth: useQuantTerminalStore.getState().orderbookDepth });
      } catch {}
    },

    setLocale: (newLocale) => {
      try {
        localStorage.setItem(STORAGE_LOCALE_KEY, newLocale);
      } catch {}
      useQuantTerminalStore.getState().setLocale(newLocale);
      set({ locale: newLocale });
    },

    setActiveTab: (tab) => {
      useQuantTerminalStore.getState().setActiveTab(tab);
      set({ activeTab: tab });
    },

    fetchRealData: async () => {
      set({ isLoadingRealData: true });
      try {
        get().fetchOrderbookLiquidity();
        const [candlesData, futuresData, mempoolMining, fxPrices, liveNews, coinMetricsResult, microResult] =
          await Promise.allSettled([
            fetchRealBinanceCandles(),
            fetchRealFuturesData(),
            fetchRealMempoolMiningData(),
            fetchRealFxAndPrices(),
            fetchRealLiveNews(),
            fetchLiveCoinMetrics(),
            fetchDerivativesMicrostructure(
              get().derivatives.takerBuyRatio7D || 49.83,
              get().derivatives.fundingRate || 0.000085
            ),
          ]);

        const state = get();
        let updatedCandles = state.candles;
        let updatedCyclePoints = state.realCyclePoints;
        let latestMetrics = null;
        let liveCoinMetricsData = state.liveCoinMetrics;
        if (coinMetricsResult.status === 'fulfilled' && coinMetricsResult.value) {
          liveCoinMetricsData = coinMetricsResult.value;
        }

        if (candlesData.status === 'fulfilled') {
          // Intelligently merge live daily candles into the 3,371+ multi-cycle history without truncating
          const liveMap = new Map(candlesData.value.dailyCandles.map((c) => [c.time, c]));
          const merged = state.candles.map((hist) => {
            if (liveMap.has(hist.time)) {
              const live = liveMap.get(hist.time)!;
              return {
                time: live.time,
                open: live.open,
                high: live.high,
                low: live.low,
                close: live.close,
                volume: live.volume,
              };
            }
            return hist;
          });

          // Append any newly closed daily candles not yet present in history
          const existingTimes = new Set(state.candles.map((c) => c.time));
          for (const c of candlesData.value.dailyCandles) {
            if (!existingTimes.has(c.time)) {
              merged.push({
                time: c.time,
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
                volume: c.volume,
              });
            }
          }

          updatedCandles = merged;
          updatedCyclePoints = candlesData.value.cyclePoints;
          latestMetrics = candlesData.value.latestMetrics;
        }

        const futures =
          futuresData.status === 'fulfilled' ? futuresData.value : state.realFutures;
        const mining =
          mempoolMining.status === 'fulfilled' ? mempoolMining.value : state.realMining;
        const prices =
          fxPrices.status === 'fulfilled' ? fxPrices.value : state.realPrices;
        const news =
          liveNews.status === 'fulfilled' ? liveNews.value : state.realNews;

        const currentPrice =
          prices?.btcUsd ||
          (updatedCandles.length > 0 ? updatedCandles[updatedCandles.length - 1].close : 75925);
        const usdtVndRate = prices?.usdtVnd || 25559;
        const officialVndRate = prices?.officialUsdVnd || 25603;
        const spreadPct = prices?.p2pSpreadPercent !== undefined
          ? prices.p2pSpreadPercent
          : parseFloat((((usdtVndRate - officialVndRate) / officialVndRate) * 100).toFixed(2));

        const priceVnd = Math.round(currentPrice * usdtVndRate);

        const updatedTicker: TickerData = {
          ...state.ticker,
          price: currentPrice,
          priceVnd,
          p2pUsdtVndRate: usdtVndRate,
          officialUsdVndRate: officialVndRate,
          p2pPremiumPercent: spreadPct,
          lastUpdated: Date.now(),
        };

        const updatedDerivatives: DerivativesData = {
          ...state.derivatives,
          markPrice: futures?.markPrice || currentPrice,
          fundingRate: (futures?.fundingRate !== undefined && !isNaN(futures.fundingRate)) ? futures.fundingRate : 0.000085,
          fundingRateAnnualized: (futures?.fundingRateAnnualized !== undefined && !isNaN(futures.fundingRateAnnualized)) ? futures.fundingRateAnnualized : 9.31,
          openInterestBtc: futures?.openInterestBtc || 88500,
          openInterestUsd: futures?.openInterestUsd || 88500 * currentPrice,
          binanceOiUsd: futures?.binanceOiUsd || futures?.openInterestUsd || 88500 * currentPrice,
          bybitOiUsd: futures?.bybitOiUsd,
          okxOiUsd: futures?.okxOiUsd,
          aggregatedOiUsd: futures?.aggregatedOiUsd || (futures?.openInterestUsd ? futures.openInterestUsd * 2.15 : undefined),
          bybitFundingRate: futures?.bybitFundingRate,
          avgFundingRatePercent: futures?.avgFundingRatePercent,
          takerBuyRatio7D: latestMetrics?.takerBuyRatio7D || 49.83,
          cvdZScore: latestMetrics?.cvdZScore || 0.15,
          isWhaleAbsorption: latestMetrics?.isWhaleAbsorption || false,
          dvolIndex:
            microResult.status === 'fulfilled' && microResult.value.dvolIndex
              ? microResult.value.dvolIndex
              : 39.4,
          microstructure:
            microResult.status === 'fulfilled'
              ? {
                  ...microResult.value,
                  perpBasisBps: Number(
                    (
                      (((futures?.markPrice || currentPrice) - currentPrice) /
                        Math.max(1000, currentPrice)) *
                      10000
                    ).toFixed(1)
                  ),
                  liqLong50xPrice: Math.round(currentPrice * (1 - 1 / 50 + 0.004)),
                  liqLong25xPrice: Math.round(currentPrice * (1 - 1 / 25 + 0.004)),
                  liqShort25xPrice: Math.round(currentPrice * (1 + 1 / 25 - 0.004)),
                }
              : getDefaultDerivativesMicrostructure(
                  latestMetrics?.takerBuyRatio7D || 49.83,
                  futures?.fundingRate ?? 0.000085
                ),
        };

        const updatedMempool: MempoolData = {
          ...state.mempool,
          fastestFee: mining?.fastestFee || 3.5,
          halfHourFee: mining?.halfHourFee || 2.8,
          economyFee: mining?.economyFee || 1.9,
          difficultyChange: mining?.difficultyChange || -4.47,
          estimatedRetargetDate: mining?.estimatedRetargetDate || Date.now() + 86400000 * 5,
          hashrateEh: mining?.hashrateEh || 1008,
          isColdWalletSniperActive: (mining?.halfHourFee || 2.8) <= 10,
        };

        const sma200d = latestMetrics?.sma200d || 73209;
        const fairValue = latestMetrics?.powerLawFairValue || 88478;
        const geom200d = latestMetrics?.geom200d || 72733;
        const realFloor200w = latestMetrics?.sma200w || 68033;

        // Dynamic metrics recalculated directly from live spot price:
        const realMayer = parseFloat((currentPrice / sma200d).toFixed(3));
        const realAhr999 = parseFloat(((currentPrice / fairValue) * (currentPrice / geom200d)).toFixed(3));
        const realRsi = latestMetrics?.rsi14 || 36.8;

        const realRealizedPrice = liveCoinMetricsData?.realizedPrice || Math.round(realFloor200w * 0.82) || 55568;
        const realMvrvRatio = parseFloat((currentPrice / realRealizedPrice).toFixed(3));
        const realMvrvZScore = parseFloat((1.0 + (realMvrvRatio - 1.0) * 2.33).toFixed(2));

        const onChain: OnChainData = {
          daysSinceGenesis: Math.floor(
            (Date.now() - new Date('2009-01-03T18:15:05Z').getTime()) / 86400000
          ),
          powerLawExpValuation: fairValue,
          ahr999: realAhr999,
          mayerMultiple: realMayer,
          mvrvZScore: realMvrvZScore,
          mvrvRatio: realMvrvRatio,
          realizedPrice: realRealizedPrice,
          puellMultiple: latestMetrics?.puellMultiple || 0.98,
          exchangeReserveNetflow7d: 0,
        };

        const sma50d = updatedCandles.length >= 50
          ? Math.round(updatedCandles.slice(-50).reduce((a, b) => a + b.close, 0) / 50)
          : Math.round(currentPrice * 0.98);

        const technical: TechnicalData = {
          rsi14: Math.round(realRsi),
          distanceTo200WMA: parseFloat(
            (
              ((currentPrice - realFloor200w) / realFloor200w) *
              100
            ).toFixed(1)
          ),
          sma200d,
          sma50d,
          goldenCross: sma50d > sma200d,
        };

        const macro: MacroData = {
          ...state.macro,
          fearGreedIndex: state.macro.fearGreedIndex,
          btcGoldRatio: prices?.btcGoldRatio || 18.3,
          btcGoldSma200D: prices?.btcGoldSma200D || 17.09,
          btcGoldMayer: prices?.btcGoldMayer || 1.07,
          hashSma30D: mining?.hashSma30D || 1035.3,
          hashSma60D: mining?.hashSma60D || 996.5,
          hashRibbonsStatus: mining?.hashRibbonsStatus || 'EXPANSION',
          hashRibbonsStatusVi: mining?.hashRibbonsStatusVi || 'Mạng Lưới Mở Rộng Ổn Định',
          hashRibbonsDiffPct: mining?.hashRibbonsDiffPct || 3.9,
        };

        const weeklyBaseDca = (state.dcaBudget * 0.70) / 4.33;
        const confluence = computeConfluenceScore(
          onChain,
          macro,
          technical,
          updatedDerivatives,
          [],
          state.ticker.change24h,
          0,
          updatedCandles,
          updatedCyclePoints,
          weeklyBaseDca
        );

        const updatedBacktest = runBacktest(state.backtestParams, updatedCandles);

        const isLive = state.activeScenario === 'LIVE';
        const finalTicker = isLive ? updatedTicker : state.ticker;
        const finalSummary = computeSummary(state.transactions, finalTicker.price);

        set({
          candles: updatedCandles,
          realCyclePoints: updatedCyclePoints,
          realFutures: futures,
          realMining: mining,
          realPrices: prices,
          realNews: news,
          ticker: finalTicker,
          portfolioSummary: finalSummary,
          derivatives: updatedDerivatives,
          mempool: updatedMempool,
          confluenceResult: confluence,
          backtestResult: updatedBacktest,
          liveCoinMetrics: liveCoinMetricsData,
          isLoadingRealData: false,
        });
        get().fetchOrderbookLiquidity();
      } catch (err) {
        console.error('Failed to load real data', err);
        set({ isLoadingRealData: false });
      }
    },

    setActiveScenario: (scenario) => {
      const state = get();
      const presetData = getScenarioPresetState(scenario);

      // Apply preset values
      const updatedTicker: TickerData = {
        ...state.ticker,
        price: presetData.price,
        change24h: presetData.change24h,
        priceVnd: Math.round(presetData.price * state.ticker.p2pUsdtVndRate),
      };

      const updatedDerivatives: DerivativesData = {
        ...state.derivatives,
        fundingRate: presetData.fundingRate,
        longLiquidations1hUsd: presetData.longLiquidations1h,
        fundingRateAnnualized: parseFloat((presetData.fundingRate * 3 * 365 * 100).toFixed(2)),
      };

      const updatedMacro: MacroData = {
        ...state.macro,
        fearGreedIndex: presetData.fearGreed,
        fearGreedLabel: presetData.fearGreedLabel,
      };

      const updatedMempool: MempoolData = {
        ...state.mempool,
        halfHourFee: presetData.mempoolFee,
        isColdWalletSniperActive: presetData.mempoolFee <= 10,
      };

      const onChain = calculateOnChainMetrics(presetData.price);
      const technical = calculateTechnicalMetrics(state.candles, presetData.price);
      const confluence = computeConfluenceScore(
        onChain,
        updatedMacro,
        technical,
        updatedDerivatives,
        [],
        presetData.change24h,
        presetData.pctChange1h,
        state.candles,
        state.realCyclePoints
      );

      const summary = computeSummary(state.transactions, presetData.price);

      set({
        activeScenario: scenario,
        ticker: updatedTicker,
        derivatives: updatedDerivatives,
        macro: updatedMacro,
        mempool: updatedMempool,
        confluenceResult: confluence,
        portfolioSummary: summary,
      });
    },

    updateSpotTicker: (tickerUpdate) => {
      useTickerStore.getState().updateTicker(tickerUpdate);
      const state = get();
      // Ignore websocket override if in simulated scenario
      if (state.activeScenario !== 'LIVE' && !tickerUpdate.lastUpdated) return;

      const oldPrice = state.ticker.price;
      const newPrice = tickerUpdate.price ?? oldPrice;
      const direction = newPrice > oldPrice ? 'up' : newPrice < oldPrice ? 'down' : 'neutral';

      const updatedTicker: TickerData = {
        ...state.ticker,
        ...tickerUpdate,
        priceDirection: direction,
        priceVnd:
          tickerUpdate.priceVnd ??
          Math.round(newPrice * (tickerUpdate.p2pUsdtVndRate ?? state.ticker.p2pUsdtVndRate)),
      };

      const updatedSummary = computeSummary(state.transactions, newPrice);

      set({
        ticker: updatedTicker,
        portfolioSummary: updatedSummary,
        isLiveConnected: true,
      });

      useQuantTerminalStore.getState().recalculatePortfolioSummary(newPrice);

      if (Math.abs(newPrice - oldPrice) / (oldPrice || 1) > 0.0002) {
        const now = Date.now();
        if (now - lastQuantRecalcTime > 500) {
          lastQuantRecalcTime = now;
          if (quantRecalcTimer !== null) {
            window.clearTimeout(quantRecalcTimer);
            quantRecalcTimer = null;
          }
          get().recalculateQuantState();
        } else if (quantRecalcTimer === null) {
          quantRecalcTimer = window.setTimeout(() => {
            lastQuantRecalcTime = Date.now();
            quantRecalcTimer = null;
            get().recalculateQuantState();
          }, 500);
        }
      }
    },

    updateFundingRate: (markPrice, fundingRate) => {
      const state = get();
      if (state.activeScenario !== 'LIVE') return;
      if (isNaN(fundingRate)) return;
      const fundingRateAnnualized = parseFloat((fundingRate * 3 * 365 * 100).toFixed(2));
      const fundingRatePercent = parseFloat((fundingRate * 100).toFixed(4));
      const updatedDerivatives: DerivativesData = {
        ...state.derivatives,
        markPrice,
        fundingRate,
        fundingRateAnnualized,
      };
      const updatedRealFutures: RealFuturesData | null = state.realFutures ? {
        ...state.realFutures,
        markPrice,
        fundingRate,
        fundingRatePercent,
        fundingRateAnnualized,
      } : null;
      set({ derivatives: updatedDerivatives, realFutures: updatedRealFutures });
      get().recalculateQuantState();
    },

    addLiquidation: (order) => {
      const state = get();
      const updatedList = [order, ...state.derivatives.recentLiquidations.slice(0, 24)];
      let longLiq = state.derivatives.longLiquidations1hUsd;
      let shortLiq = state.derivatives.shortLiquidations1hUsd;

      if (order.side === 'SELL') {
        longLiq += order.volumeUsd;
      } else {
        shortLiq += order.volumeUsd;
      }

      set({
        derivatives: {
          ...state.derivatives,
          recentLiquidations: updatedList,
          longLiquidations1hUsd: longLiq,
          shortLiquidations1hUsd: shortLiq,
        },
      });
    },

    updateMempool: (mempoolUpdate) => {
      const state = get();
      if (state.activeScenario !== 'LIVE') return;
      const halfHourFee = mempoolUpdate.halfHourFee !== undefined
        ? Math.round(mempoolUpdate.halfHourFee * 10) / 10
        : state.mempool.halfHourFee;

      set({
        mempool: {
          ...state.mempool,
          ...mempoolUpdate,
          halfHourFee,
          isColdWalletSniperActive: halfHourFee <= 10,
        },
      });
    },

    updateMacro: (macroUpdate) => {
      set((state) => ({
        macro: { ...state.macro, ...macroUpdate },
      }));
      get().recalculateQuantState();
    },

    addTransaction: (tx) => {
      useQuantTerminalStore.getState().addTransaction(tx);
      const q = useQuantTerminalStore.getState();
      set({ transactions: q.transactions, portfolioSummary: q.portfolioSummary, addTransactionModalOpen: false });
    },

    deleteTransaction: (id) => {
      useQuantTerminalStore.getState().deleteTransaction(id);
      const q = useQuantTerminalStore.getState();
      set({ transactions: q.transactions, portfolioSummary: q.portfolioSummary });
    },

    editTransaction: (id, updated) => {
      useQuantTerminalStore.getState().editTransaction(id, updated);
      const q = useQuantTerminalStore.getState();
      set({ transactions: q.transactions, portfolioSummary: q.portfolioSummary, editingTransaction: null, addTransactionModalOpen: false });
    },

    setManualDryPowderUsd: (amount) => {
      useQuantTerminalStore.getState().setManualDryPowderUsd(amount);
      set({ manualDryPowderUsd: amount });
    },
    setAddTransactionModalOpen: (open) => {
      useQuantTerminalStore.getState().setAddTransactionModalOpen(open);
      set({ addTransactionModalOpen: open, editingTransaction: open ? get().editingTransaction : null });
    },
    setEditingTransaction: (tx) => {
      useQuantTerminalStore.getState().setEditingTransaction(tx);
      set({ editingTransaction: tx, addTransactionModalOpen: !!tx });
    },

    exportPortfolioJson: () => {
      return useQuantTerminalStore.getState().exportPortfolioJson();
    },

    exportPortfolioCsv: () => {
      return useQuantTerminalStore.getState().exportPortfolioCsv();
    },

    importPortfolioJson: (jsonStr) => {
      const ok = useQuantTerminalStore.getState().importPortfolioJson(jsonStr);
      if (ok) {
        const q = useQuantTerminalStore.getState();
        set({ transactions: q.transactions, portfolioSummary: q.portfolioSummary });
      }
      return ok;
    },

    setBinanceModalOpen: (open) => {
      useQuantTerminalStore.getState().setBinanceModalOpen(open);
      set({ binanceModalOpen: open });
    },

    setBinanceApiConfig: (config) => {
      useQuantTerminalStore.getState().setBinanceApiConfig(config);
      set({ binanceApiConfig: config });
    },

    saveVaultWithPin: async (apiKey: string, apiSecret: string, pin: string) => {
      await useQuantTerminalStore.getState().saveVaultWithPin(apiKey, apiSecret, pin);
      const q = useQuantTerminalStore.getState();
      set({ vaultMeta: q.vaultMeta, isVaultLocked: q.isVaultLocked, binanceApiConfig: q.binanceApiConfig, binancePortfolio: q.binancePortfolio });
    },

    unlockVaultWithPin: async (pin: string) => {
      const res = await useQuantTerminalStore.getState().unlockVaultWithPin(pin);
      const q = useQuantTerminalStore.getState();
      set({ binanceApiConfig: q.binanceApiConfig, isVaultLocked: q.isVaultLocked, binancePortfolio: q.binancePortfolio });
      return res;
    },

    deleteVault: () => {
      useQuantTerminalStore.getState().deleteVault();
      const q = useQuantTerminalStore.getState();
      set({
        vaultMeta: q.vaultMeta,
        isVaultLocked: q.isVaultLocked,
        binancePortfolio: q.binancePortfolio,
        binanceApiConfig: q.binanceApiConfig,
      });
    },

    fetchBinancePortfolio: async (overrideKeys?: {
      apiKey?: string;
      apiSecret?: string;
      saveToServer?: boolean;
      useWorkerDefault?: boolean;
    }) => {
      set({ isBinanceSyncing: true });
      const res = await useQuantTerminalStore.getState().fetchBinancePortfolio(overrideKeys);
      const q = useQuantTerminalStore.getState();
      set({ binancePortfolio: q.binancePortfolio, isBinanceSyncing: false });
      return res;
    },

    setDcaBudget: (budget) => {
      useQuantTerminalStore.getState().setDcaBudget(budget);
      const q = useQuantTerminalStore.getState();
      set({
        dcaBudget: budget,
        backtestParams: q.backtestParams,
        backtestResult: q.backtestResult,
        confluenceResult: q.confluenceResult,
      });
    },
    setDcaCurrency: (currency) => {
      useQuantTerminalStore.getState().setDcaCurrency(currency);
      set({ dcaCurrency: currency });
    },
    setDcaFrequency: (freq) => {
      useQuantTerminalStore.getState().setDcaFrequency(freq);
      set({ dcaFrequency: freq });
    },

    setBacktestParams: (params) => {
      useQuantTerminalStore.getState().setBacktestParams(params);
      const q = useQuantTerminalStore.getState();
      set({ backtestParams: q.backtestParams, backtestResult: q.backtestResult });
    },

    triggerBacktest: () => {
      useQuantTerminalStore.getState().triggerBacktest();
      set({ backtestResult: useQuantTerminalStore.getState().backtestResult });
    },

    setTelegramModalOpen: (open) => {
      useQuantTerminalStore.getState().setTelegramModalOpen(open);
      set({ telegramModalOpen: open });
    },
    setSelfCustodyModalOpen: (open) => {
      useQuantTerminalStore.getState().setSelfCustodyModalOpen(open);
      set({ selfCustodyModalOpen: open });
    },
    setShareCardModalOpen: (open) => {
      useQuantTerminalStore.getState().setShareCardModalOpen(open);
      set({ shareCardModalOpen: open });
    },
    setInstitutionalModalOpen: (open, tab) => {
      useQuantTerminalStore.getState().setInstitutionalModalOpen(open, tab);
      set((s) => ({
        institutionalModalOpen: open,
        selectedPlaybookTab: tab || s.selectedPlaybookTab,
      }));
    },
    setForecastLedgerModalOpen: (open) => {
      useQuantTerminalStore.getState().setForecastLedgerModalOpen(open);
      set({ forecastLedgerModalOpen: open });
    },
    setSelectedPillarKey: (key) => {
      useQuantTerminalStore.getState().setSelectedPillarKey(key);
      set({ selectedPillarKey: key });
    },

    recalculateQuantState: () => {
      useQuantTerminalStore.getState().recalculateQuantState(get().ticker.price);
      set({ confluenceResult: useQuantTerminalStore.getState().confluenceResult });
    },
  };
});

// Bi-directional synchronization between isolated stores and unified facade
useTickerStore.subscribe((tickerState) => {
  useTerminalStore.setState({
    ticker: tickerState.ticker,
    isLiveConnected: tickerState.isLiveConnected,
  });
});

useQuantTerminalStore.subscribe((quantState) => {
  useTerminalStore.setState({
    ...quantState,
  });
});

export { useTickerStore } from './useTickerStore';
export { useQuantTerminalStore } from './useQuantTerminalStore';
