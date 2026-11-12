import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useTerminalStore } from './store/useTerminalStore';
import { useUnifiedMetrics } from './lib/metricsSelector';
import { CryptoWebSocketManager } from './lib/websocketService';
import { Header } from './components/dashboard/Header';
import { HeroBanner } from './components/dashboard/HeroBanner';
import { MetricCards } from './components/dashboard/MetricCards';
import { PerformanceOverview } from './components/dashboard/PerformanceOverview';
import { RecentTrades } from './components/dashboard/RecentTrades';
import { Watchlist } from './components/dashboard/Watchlist';
import { LiveSignalsView } from './components/dashboard/LiveSignalsView';
import { QuickTradeModal } from './components/dashboard/QuickTradeModal';
import { GenerateSignalModal } from './components/dashboard/GenerateSignalModal';
import { TradeDetailModal } from './components/dashboard/TradeDetailModal';
import { INITIAL_TRADES, INITIAL_WATCHLIST, INITIAL_SIGNALS } from './components/dashboard/mockData';
import type { Trade, AISignal } from './components/dashboard/types';

// Lazy-load existing deep analysis tabs & modals
const ValuationTab = lazy(() =>
  import('./components/tabs/ValuationTab').then((m) => ({ default: m.ValuationTab }))
);
const PortfolioTab = lazy(() =>
  import('./components/tabs/PortfolioTab').then((m) => ({ default: m.PortfolioTab }))
);
const ResearchTab = lazy(() =>
  import('./components/tabs/ResearchTab').then((m) => ({ default: m.ResearchTab }))
);

// Lazy-loaded modals
const ShareCardModal = lazy(() =>
  import('./components/modals/ShareCardModal').then((m) => ({ default: m.ShareCardModal }))
);
const TelegramAlertModal = lazy(() =>
  import('./components/modals/TelegramAlertModal').then((m) => ({ default: m.TelegramAlertModal }))
);
const SelfCustodySwapModal = lazy(() =>
  import('./components/modals/SelfCustodySwapModal').then((m) => ({ default: m.SelfCustodySwapModal }))
);
const BinanceApiModal = lazy(() =>
  import('./components/modals/BinanceApiModal').then((m) => ({ default: m.BinanceApiModal }))
);
const AddTransactionModal = lazy(() =>
  import('./components/modals/AddTransactionModal').then((m) => ({ default: m.AddTransactionModal }))
);
const InstitutionalPlaybookModal = lazy(() =>
  import('./components/modals/InstitutionalPlaybookModal').then((m) => ({
    default: m.InstitutionalPlaybookModal,
  }))
);
const ForecastLedgerModal = lazy(() =>
  import('./components/modals/ForecastLedgerModal').then((m) => ({
    default: m.ForecastLedgerModal,
  }))
);

export const App: React.FC = () => {
  const activeTab = useTerminalStore((s) => s.activeTab);
  const setActiveTab = useTerminalStore((s) => s.setActiveTab);
  const fetchRealData = useTerminalStore((s) => s.fetchRealData);
  const updateSpotTicker = useTerminalStore((s) => s.updateSpotTicker);
  const updateFundingRate = useTerminalStore((s) => s.updateFundingRate);
  const addLiquidation = useTerminalStore((s) => s.addLiquidation);
  const updateMempool = useTerminalStore((s) => s.updateMempool);
  const fetchBinancePortfolio = useTerminalStore((s) => s.fetchBinancePortfolio);
  const forecastLedgerModalOpen = useTerminalStore((s) => s.forecastLedgerModalOpen);
  const setForecastLedgerModalOpen = useTerminalStore((s) => s.setForecastLedgerModalOpen);

  const metrics = useUnifiedMetrics();

  // Local state for dashboard interactions
  const [trades, setTrades] = useState<Trade[]>(INITIAL_TRADES);
  const [signals, setSignals] = useState<AISignal[]>(INITIAL_SIGNALS);
  const [watchlist] = useState(INITIAL_WATCHLIST);

  // Modals state
  const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);
  const [quickTradePair, setQuickTradePair] = useState('BTC/USDT');
  const [isGenerateSignalOpen, setIsGenerateSignalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  useEffect(() => {
    fetchBinancePortfolio();
  }, [fetchBinancePortfolio]);

  useEffect(() => {
    fetchRealData();
    const wsManager = new CryptoWebSocketManager({
      onSpotTicker: (tickerUpdate) => {
        updateSpotTicker(tickerUpdate);
      },
      onFundingRate: (markPrice, fundingRate) => {
        updateFundingRate(markPrice, fundingRate);
      },
      onLiquidation: (order) => {
        addLiquidation(order);
      },
      onMempoolUpdate: (mempoolUpdate) => {
        updateMempool(mempoolUpdate);
      },
    });

    wsManager.connectAll();

    return () => {
      wsManager.disconnectAll();
    };
  }, [fetchRealData, updateSpotTicker, updateFundingRate, addLiquidation, updateMempool]);

  const handleOpenQuickTrade = (pair = 'BTC/USDT') => {
    setQuickTradePair(pair);
    setIsQuickTradeOpen(true);
  };

  const handleTradeExecuted = (newTrade: Trade) => {
    setTrades((prev) => [newTrade, ...prev]);
  };

  const handleApplySignal = (newSignal: AISignal) => {
    setSignals((prev) => [newSignal, ...prev]);
    handleOpenQuickTrade(newSignal.pair);
  };

  return (
    <div className="min-h-screen py-5 px-3 sm:px-6 lg:px-10 flex flex-col items-center justify-start transition-colors duration-300">
      {/* Main Board Container matching the giant rounded card in user images */}
      <main className="w-full max-w-[1440px] bg-white dark:bg-[#121623] rounded-[32px] lg:rounded-[40px] p-5 sm:p-7 lg:p-9 main-board-shadow border border-black/4 dark:border-white/5 transition-colors duration-300">
        {/* Top Header Navigation */}
        <Header
          currentTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenQuickTrade={() => handleOpenQuickTrade('BTC/USDT')}
          unreadNotifications={3}
        />

        {/* Tab 1: Main Dashboard matching the user's provided images */}
        {activeTab === 'dashboard' && (
          <section aria-label="Dashboard Overview" className="animate-in fade-in duration-200">
            {/* Iridescent Hero Welcome Banner */}
            <HeroBanner
              onQuickTrade={() => handleOpenQuickTrade('BTC/USDT')}
              onGenerateSignal={() => setIsGenerateSignalOpen(true)}
              opportunitiesCount={47}
            />

            {/* Metric Cards Row 1: Total P/L, Win Rate, Active Signals, AI Accuracy */}
            <MetricCards 
              onFilterSignals={() => {
                setActiveTab('signals');
              }}
            />

            {/* Metric Cards Row 2: Performance Overview, Recent Trades, Watchlist */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-stretch">
              {/* Left: Performance Overview (Stepped Skyline chart with dot grid) */}
              <div className="md:col-span-12 lg:col-span-4 min-h-[340px]">
                <PerformanceOverview />
              </div>

              {/* Middle: Recent Trades table */}
              <div className="md:col-span-12 lg:col-span-5 min-h-[340px]">
                <RecentTrades
                  trades={trades}
                  onSelectTrade={setSelectedTrade}
                />
              </div>

              {/* Right: Watchlist */}
              <div className="md:col-span-12 lg:col-span-3 min-h-[340px]">
                <Watchlist
                  watchlist={watchlist}
                  onSelectPair={handleOpenQuickTrade}
                />
              </div>
            </div>
          </section>
        )}

        {/* Tab 2: Market Overview (Cycle Valuation, Multi-cycle chart, Power Law, Risk Radar) */}
        {activeTab === 'valuation' && (
          <Suspense fallback={<div className="p-12 text-center text-slate-400 font-mono text-xs">Đang tải Dữ Liệu Thị Trường & Chu Kỳ...</div>}>
            <ValuationTab />
          </Suspense>
        )}

        {/* Tab 3: Live Signals */}
        {activeTab === 'signals' && (
          <LiveSignalsView
            signals={signals}
            onQuickTrade={handleOpenQuickTrade}
          />
        )}

        {/* Tab 4: AI Risk Analyzer (Portfolio, VaR, Half-Kelly DCA Engine) */}
        {activeTab === 'portfolio' && (
          <Suspense fallback={<div className="p-12 text-center text-slate-400 font-mono text-xs">Đang tải Danh Mục & Quản Trị Rủi Ro...</div>}>
            <PortfolioTab />
          </Suspense>
        )}

        {/* Tab 5: Research & Backtesting */}
        {activeTab === 'research' && (
          <Suspense fallback={<div className="p-12 text-center text-slate-400 font-mono text-xs">Đang tải Nghiên Cứu & Backtest...</div>}>
            <ResearchTab />
          </Suspense>
        )}
      </main>

      {/* Footer Branding Note */}
      <footer className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400 select-none">
        BTC Signal AI Trading Terminal · Powered by Real-time Binance Streams & Deep Confluence Models
      </footer>

      {/* Quick Trade Modal */}
      <QuickTradeModal
        isOpen={isQuickTradeOpen}
        onClose={() => setIsQuickTradeOpen(false)}
        onTradeExecuted={handleTradeExecuted}
        defaultPair={quickTradePair}
        liveBtcPrice={metrics.livePrice}
      />

      {/* Generate AI Signal Modal */}
      <GenerateSignalModal
        isOpen={isGenerateSignalOpen}
        onClose={() => setIsGenerateSignalOpen(false)}
        onApplySignal={handleApplySignal}
        currentBtcPrice={metrics.livePrice || 67245}
      />

      {/* Trade Detail Modal */}
      <TradeDetailModal
        trade={selectedTrade}
        onClose={() => setSelectedTrade(null)}
      />

      {/* Terminal Modals */}
      <Suspense fallback={null}>
        <ShareCardModal />
        <TelegramAlertModal />
        <SelfCustodySwapModal />
        <BinanceApiModal />
        <AddTransactionModal />
        <InstitutionalPlaybookModal />
        <ForecastLedgerModal
          isOpen={forecastLedgerModalOpen}
          onClose={() => setForecastLedgerModalOpen(false)}
        />
      </Suspense>
    </div>
  );
};

export default App;
