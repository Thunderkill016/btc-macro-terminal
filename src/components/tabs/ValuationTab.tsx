import React, { useState } from 'react';
import { AppleDailySignalHero } from '../apple/AppleDailySignalHero';
import { AppleCycleChart } from '../apple/AppleCycleChart';
import { AppleCyclePeakRadar } from '../apple/AppleCyclePeakRadar';
import { StitchCycleTerminal } from '../stitch/StitchCycleTerminal';
import { useTerminalStore } from '../../store/useTerminalStore';
import { Sparkles, BarChart2, Zap } from 'lucide-react';

export const ValuationTab: React.FC = () => {
  const locale = useTerminalStore((s) => s.locale);
  const isVi = locale === 'vi';
  const [viewMode, setViewMode] = useState<'stitch' | 'institutional'>('stitch');

  return (
    <div className="space-y-6">
      {/* Top View Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-[#0A0E17]/80 backdrop-blur-md rounded-2xl border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-1.5 p-1 bg-[#06080E] rounded-xl border border-white/[0.05]">
          <button
            type="button"
            onClick={() => setViewMode('stitch')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'stitch'
                ? 'bg-purple-600 text-white shadow-[0_2px_12px_rgba(147,51,234,0.4)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-200" />
            <span>{isVi ? 'Giao Diện Stitch Interactive (Mới)' : 'Stitch Interactive Terminal'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">
              v2.4
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('institutional')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'institutional'
                ? 'bg-[#141C2E] text-white border border-white/[0.12] shadow-[0_2px_10px_rgba(0,0,0,0.5)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isVi ? 'Phân Tích Thể Chế Chuyên Sâu' : 'Institutional Deep-Dive'}</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 px-3 hidden sm:flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{isVi ? 'Đồng bộ WebSocket trực tiếp Binance & Mempool' : 'Live WebSocket Stream Connected'}</span>
        </div>
      </div>

      {/* View Mode Rendering */}
      {viewMode === 'stitch' ? (
        <StitchCycleTerminal />
      ) : (
        <div className="space-y-6">
          {/* Block 1: Institutional Hero (Objective Cycle Positioning, Kelly Execution & 30D/90D Cone) */}
          <AppleDailySignalHero />

          {/* Block 2: Full-Width Multi-Cycle Chart & Oscillator (TradingView Pro & Multi-Cycle Quantitative Models 2011-2026) */}
          <div className="w-full">
            <AppleCycleChart />
          </div>

          {/* Block 3: Consolidated Quantitative Radar Matrix (3 Segmented Sub-Tabs: Peak Radar, Downside Tactical, Halving & Miners) */}
          <AppleCyclePeakRadar />
        </div>
      )}
    </div>
  );
};
