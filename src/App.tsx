import React, { useEffect, Suspense, lazy, useState } from 'react';
import { useTerminalStore } from './store/useTerminalStore';
import { CryptoWebSocketManager } from './lib/websocketService';
import { CommandPalette } from './components/CommandPalette';
import { LoqoDashboard } from './components/stitch/LoqoDashboard';

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
  const fetchRealData = useTerminalStore((s) => s.fetchRealData);
  const updateSpotTicker = useTerminalStore((s) => s.updateSpotTicker);
  const updateFundingRate = useTerminalStore((s) => s.updateFundingRate);
  const addLiquidation = useTerminalStore((s) => s.addLiquidation);
  const updateMempool = useTerminalStore((s) => s.updateMempool);
  const fetchBinancePortfolio = useTerminalStore((s) => s.fetchBinancePortfolio);
  const forecastLedgerModalOpen = useTerminalStore((s) => s.forecastLedgerModalOpen);
  const setForecastLedgerModalOpen = useTerminalStore((s) => s.setForecastLedgerModalOpen);

  // Auto-sync Binance Portfolio on mount
  useEffect(() => {
    fetchBinancePortfolio();
  }, [fetchBinancePortfolio]);

  // Initialize browser-direct WebSockets and zero-mock real data fetching
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
    <div className="min-h-screen bg-appBg text-gray-900 font-sans antialiased">
      {/* 100% Faithful Stitch Interactive Terminal Dashboard */}
      <LoqoDashboard />

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
