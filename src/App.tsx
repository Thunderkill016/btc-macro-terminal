import React, { useEffect, Suspense, lazy } from 'react';
import { useTerminalStore } from './store/useTerminalStore';
import { CryptoWebSocketManager } from './lib/websocketService';
import { TopExecutiveBar } from './components/header/TopExecutiveBar';
import { BearTrapBanner } from './components/common/BearTrapBanner';
import { ValuationTab } from './components/tabs/ValuationTab';
import { CommandPalette } from './components/CommandPalette';

// Lazy-loaded secondary tabs for instant initial paint
const PortfolioTab = lazy(() =>
  import('./components/tabs/PortfolioTab').then((m) => ({ default: m.PortfolioTab }))
);
const ResearchTab = lazy(() =>
  import('./components/tabs/ResearchTab').then((m) => ({ default: m.ResearchTab }))
);

// Lazy-loaded on-demand dialogs & modals
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
  const fetchRealData = useTerminalStore((s) => s.fetchRealData);
  const updateSpotTicker = useTerminalStore((s) => s.updateSpotTicker);
  const updateFundingRate = useTerminalStore((s) => s.updateFundingRate);
  const addLiquidation = useTerminalStore((s) => s.addLiquidation);
  const updateMempool = useTerminalStore((s) => s.updateMempool);
  const fetchBinancePortfolio = useTerminalStore((s) => s.fetchBinancePortfolio);
  const forecastLedgerModalOpen = useTerminalStore((s) => s.forecastLedgerModalOpen);
  const setForecastLedgerModalOpen = useTerminalStore((s) => s.setForecastLedgerModalOpen);

  // Auto-sync Binance Portfolio on mount (Cloudflare Server has credentials saved directly)
  useEffect(() => {
    fetchBinancePortfolio();
  }, [fetchBinancePortfolio]);

  // Initialize browser-direct WebSockets and zero-mock real data fetching
  useEffect(() => {
    // 1. Fetch 100% Real Public Data (Binance Candles + Futures + Mempool Mining + FX + News)
    fetchRealData();

    // 2. High-frequency Realtime Stream from Binance & Mempool WebSockets
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

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-textMain flex flex-col font-sans">
      {/* Top Executive Bar (Always Visible: Live Price, Verdict, DCA Order, Tab Switcher, Language) */}
      <TopExecutiveBar />

      {/* Geopolitical & War Bear-Trap Alert Banner */}
      <BearTrapBanner />

      {/* Clean 3-Tab Scientific Viewport */}
      <main className="flex-1 p-3 md:p-5 max-w-[1920px] mx-auto w-full">
        {activeTab === 'valuation' && <ValuationTab />}
        {activeTab === 'portfolio' && (
          <Suspense fallback={<div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse">Đang tải Danh Mục Tích Sản...</div>}>
            <PortfolioTab />
          </Suspense>
        )}
        {activeTab === 'research' && (
          <Suspense fallback={<div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse">Đang tải Nghiên Cứu & Backtest...</div>}>
            <ResearchTab />
          </Suspense>
        )}
      </main>

      {/* Global Bloomberg-Style Command Palette (⌘K / Ctrl+K) */}
      <CommandPalette />

      {/* High-Conversion Modals (Deferred Loading) */}
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