import React, { useEffect, Suspense, lazy } from 'react';
import { useTerminalStore } from './store/useTerminalStore';
import { CryptoWebSocketManager } from './lib/websocketService';
import { TopExecutiveBar } from './components/header/TopExecutiveBar';
import { ValuationTab } from './components/tabs/ValuationTab';
import { CommandPalette } from './components/CommandPalette';

// Lazy-loaded secondary tabs
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
  const fetchRealData = useTerminalStore((s) => s.fetchRealData);
  const updateSpotTicker = useTerminalStore((s) => s.updateSpotTicker);
  const updateFundingRate = useTerminalStore((s) => s.updateFundingRate);
  const addLiquidation = useTerminalStore((s) => s.addLiquidation);
  const updateMempool = useTerminalStore((s) => s.updateMempool);
  const fetchBinancePortfolio = useTerminalStore((s) => s.fetchBinancePortfolio);
  const forecastLedgerModalOpen = useTerminalStore((s) => s.forecastLedgerModalOpen);
  const setForecastLedgerModalOpen = useTerminalStore((s) => s.setForecastLedgerModalOpen);

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

  return (
    <div className="min-h-screen bg-white text-[#343B43] flex flex-col font-sans">
      {/* Top Navigation Bar (LookIntoBitcoin Style) */}
      <TopExecutiveBar />

      {/* Main Content Area (LookInto Exact 1140px Container) */}
      <main className="flex-1 max-w-[1140px] mx-auto w-full px-4 py-8 space-y-8">
        {activeTab === 'valuation' && <ValuationTab />}
        {activeTab === 'portfolio' && (
          <Suspense fallback={<div className="p-12 text-center text-slate-400 font-mono text-xs">Đang tải Danh Mục Tích Sản...</div>}>
            <PortfolioTab />
          </Suspense>
        )}
        {activeTab === 'research' && (
          <Suspense fallback={<div className="p-12 text-center text-slate-400 font-mono text-xs">Đang tải Nghiên Cứu & Backtest...</div>}>
            <ResearchTab />
          </Suspense>
        )}
      </main>

      {/* Footer (LookIntoBitcoin Style) */}
      <footer className="border-t border-[#E1E3E3] py-6 text-center text-xs text-[#64748B] mt-12 bg-[#F8FAFC]">
        <div className="max-w-[1240px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© 2026 Look Into Bitcoin & Macro Terminal. All live data cryptographically audited.</span>
          <div className="flex items-center gap-4 text-[#3C75D5]">
            <span className="hover:underline cursor-pointer">Phương Pháp Luận</span>
            <span className="hover:underline cursor-pointer">Sổ Cái Băm Khối 870,800+</span>
            <span className="hover:underline cursor-pointer">API Dữ Liệu</span>
          </div>
        </div>
      </footer>

      {/* Command Palette */}
      <CommandPalette />

      {/* Modals */}
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