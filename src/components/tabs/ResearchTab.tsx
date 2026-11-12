import React, { useState } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { RealReturnBacktester } from '../center-column/RealReturnBacktester';
import { LiveNewsFeed } from './LiveNewsFeed';
import { GlobalM2LiquidityTracker } from '../research/GlobalM2LiquidityTracker';
import { UsSpotEtfFlowDashboard } from '../research/UsSpotEtfFlowDashboard';
import { PublicForecastLedgerSection } from '../research/PublicForecastLedgerSection';
import { Globe, Building2, Calculator, LayoutGrid, ShieldCheck } from 'lucide-react';

type ResearchSubTab = 'ALL' | 'LEDGER' | 'M2' | 'ETF' | 'BACKTEST';

export const ResearchTab: React.FC = () => {
  const locale = useTerminalStore((s) => s.locale);
  const isVi = locale === 'vi';

  const [activeSubTab, setActiveSubTab] = useState<ResearchSubTab>('ALL');

  return (
    <div className="space-y-5">
      {/* Sub-Navigation Segmented Bar in Horizon Pill Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-full bg-white border border-[#EEF0F5] shadow-card">
        <nav
          role="tablist"
          aria-label={isVi ? 'Các phân hệ nghiên cứu vĩ mô' : 'Macro research modules'}
          className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'ALL'}
            onClick={() => setActiveSubTab('ALL')}
            className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'ALL'
                ? 'bg-[#111827] text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-[#F4F6F9]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{isVi ? 'Toàn Cảnh Vĩ Mô' : 'All Macro & Flows'}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'LEDGER'}
            onClick={() => setActiveSubTab('LEDGER')}
            className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'LEDGER'
                ? 'bg-[#111827] text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-[#F4F6F9]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isVi ? 'Độ Tin Cậy & Sổ Dự Báo' : 'Forecast Reliability & Ledger'}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'M2'}
            onClick={() => setActiveSubTab('M2')}
            className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'M2'
                ? 'bg-[#111827] text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-[#F4F6F9]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isVi ? 'Thanh Khoản M2 (MacroMicro)' : 'Global M2 Liquidity'}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'ETF'}
            onClick={() => setActiveSubTab('ETF')}
            className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'ETF'
                ? 'bg-[#111827] text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-[#F4F6F9]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{isVi ? 'Dòng Tiền US Spot ETF' : 'US Spot ETF Flows'}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'BACKTEST'}
            onClick={() => setActiveSubTab('BACKTEST')}
            className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'BACKTEST'
                ? 'bg-[#111827] text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-[#F4F6F9]'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{isVi ? 'Kiểm Chứng SJC & Bank' : 'SJC & Bank Backtest'}</span>
          </button>
        </nav>

        <div className="hidden lg:flex items-center gap-2 pr-3 text-[11px] text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>FRED & Farside Benchmark</span>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Macro & Intelligence Panes (8 of 12 cols in ALL mode, or full width if selected) */}
        <div className="lg:col-span-8 space-y-6">
          {(activeSubTab === 'ALL' || activeSubTab === 'LEDGER') && (
            <PublicForecastLedgerSection />
          )}

          {(activeSubTab === 'ALL' || activeSubTab === 'M2') && (
            <GlobalM2LiquidityTracker />
          )}

          {(activeSubTab === 'ALL' || activeSubTab === 'ETF') && (
            <UsSpotEtfFlowDashboard />
          )}

          {(activeSubTab === 'ALL' || activeSubTab === 'BACKTEST') && (
            <RealReturnBacktester />
          )}
        </div>

        {/* Real News & Macro Tape (4 of 12 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <LiveNewsFeed />
        </div>
      </div>
    </div>
  );
};
