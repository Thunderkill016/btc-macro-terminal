import React from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { useUnifiedMetrics } from '../../lib/metricsSelector';
import { formatUSD } from '../../lib/formatters';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';

export const ExecutiveSummaryStrip: React.FC = () => {
  const locale = useTerminalStore((s) => s.locale);
  const isVi = locale === 'vi';
  const confluence = useTerminalStore((s) => s.confluenceResult);
  const liveCoinMetrics = useTerminalStore((s) => s.liveCoinMetrics);
  const setForecastLedgerModalOpen = useTerminalStore((s) => s.setForecastLedgerModalOpen);
  const metrics = useUnifiedMetrics();

  const forecastModel = metrics.forecastModel;
  const cone30P15 = forecastModel.quantiles30D.p15;
  const cone30P50 = forecastModel.quantiles30D.p50;
  const cone30P85 = forecastModel.quantiles30D.p85;

  const kelly = confluence?.kellyTactical;
  const mvrv = liveCoinMetrics?.mvrv ?? metrics.mvrv ?? 1.40;
  const scoreDelta7D = confluence?.scoreDelta7D ?? 0.3;
  const scoreDelta30D = confluence?.scoreDelta30D ?? 5.2;

  const discountVsFair = metrics.powerLawFairValue > 0
    ? Math.round(((metrics.powerLawFairValue - metrics.livePrice) / metrics.powerLawFairValue) * 100)
    : 17;

  const currentRegimeTitleVi = discountVsFair >= 15
    ? 'Vùng Tích Lũy Chu Kỳ'
    : 'Vùng Cân Bằng Chu Kỳ';

  return (
    <div
      data-testid="executive-summary-strip"
      className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-white border border-[#E1E3E3] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)] text-xs font-mono"
    >
      {/* 5 Compact Micro Ticker Capsules */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-5">
        {/* Metric 1: Regime */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-[#64748B] uppercase font-sans text-[10px] font-semibold">{isVi ? 'Định Giá:' : 'Regime:'}</span>
          <span className="text-emerald-400 font-bold">{currentRegimeTitleVi}</span>
          <span className="text-[10px] text-[#94A3B8] hidden sm:inline">(Pha 2 • MVRV {mvrv.toFixed(2)}x)</span>
        </div>

        <div className="h-4 w-px bg-white/[0.08] hidden sm:block" />

        {/* Metric 2: Calibrated Win Rate */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#64748B] uppercase font-sans text-[10px] font-semibold">{isVi ? 'Thắng PAVA:' : 'Win Rate:'}</span>
          <span className="text-cyan-300 font-bold">{((kelly?.winProbP ?? 0.66) * 100).toFixed(0)}%</span>
          <span className="text-[10px] text-[#94A3B8] hidden md:inline">(BSS +{(kelly?.brierSkillScore ?? 0.165).toFixed(3)})</span>
        </div>

        <div className="h-4 w-px bg-white/[0.08] hidden md:block" />

        {/* Metric 3: 30D Uncertainty Cone */}
        <div className="flex items-center gap-1.5 hidden md:flex">
          <span className="text-[#64748B] uppercase font-sans text-[10px] font-semibold">{isVi ? 'Bất Định 30D:' : '30D Cone:'}</span>
          <span className="text-[#191F2C] font-bold">${Math.round(cone30P15 / 1000)}k – ${Math.round(cone30P85 / 1000)}k</span>
          <span className="text-[10px] text-[#94A3B8] hidden lg:inline">(P50 = ${formatUSD(cone30P50, 0)})</span>
        </div>

        <div className="h-4 w-px bg-white/[0.08] hidden lg:block" />

        {/* Metric 4: Delta Shift */}
        <div className="flex items-center gap-1.5 hidden lg:flex">
          <span className="text-[#64748B] uppercase font-sans text-[10px] font-semibold">{isVi ? 'Quỹ Đạo:' : 'Shift:'}</span>
          <span className="text-purple-300 font-bold">Δ7D {scoreDelta7D >= 0 ? '+' : ''}{scoreDelta7D.toFixed(1)}đ</span>
          <span className="text-[10px] text-[#94A3B8]">Δ30D {scoreDelta30D >= 0 ? '+' : ''}{scoreDelta30D.toFixed(1)}đ</span>
        </div>
      </div>

      {/* Right Proof Capsule */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setForecastLedgerModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E1E3E3] text-cyan-400 hover:text-cyan-300 text-[11px] font-medium transition-all cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>OTS Block 870,800+</span>
          <span className="text-[#64748B] hidden xl:inline">• Sổ Băm 16D</span>
          <ArrowUpRight className="w-3 h-3 text-[#64748B]" />
        </button>
      </div>
    </div>
  );
};
