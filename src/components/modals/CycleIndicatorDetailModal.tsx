import React, { useEffect } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Compass,
  Activity,
  Layers,
  Sparkles,
  Target,
  ArrowRight,
  Calculator,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export interface IndicatorDetailInfo {
  id: string;
  nameVi: string;
  nameEn: string;
  shortVi: string;
  shortEn: string;
  author: string;
  currentDisplay: string;
  line1Display?: string;
  line2Display?: string;
  currentNum: number;
  floorDisplay: string;
  floorNum: number;
  neutralDisplay: string;
  topDisplay: string;
  topNum: number;
  progressPct: number; // Min-Max normalized
  rawRatioFromZeroPct?: number; // The old naive division from 0
  distancePct: number;
  triggered: boolean;
  formula: string;
  whyMinMaxVi: string;
  whyMinMaxEn: string;
  backtestVi: string;
  backtestEn: string;
  actionVi: string;
  actionEn: string;
  plainMeaningVi?: string;
  plainMeaningEn?: string;
}

interface Props {
  indicator: IndicatorDetailInfo | null;
  onClose: () => void;
}

export const CycleIndicatorDetailModal: React.FC<Props> = ({ indicator, onClose }) => {
  const locale = useTerminalStore((s) => s.locale);
  const isVi = locale === 'vi';

  // Handle ESC key press & body scroll lock
  useEffect(() => {
    if (!indicator) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [indicator, onClose]);

  if (!indicator) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="indicator-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#050811]/85 backdrop-blur-xl transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#0B101D] border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 font-sans">
        {/* Ambient Glow */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative p-5 sm:p-6 pb-4 border-b border-white/[0.08] flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[11px] font-semibold font-mono">
                <Compass className="w-3 h-3" />
                {indicator.author}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                  indicator.triggered
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {indicator.triggered ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    {isVi ? 'ĐÃ KÍCH HOẠT CẢNH BÁO ĐỈNH' : 'CYCLE TOP TRIGGERED'}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    {isVi ? 'DƯỚI NGƯỠNG CẢNH BÁO ĐỈNH' : 'BELOW PEAK THRESHOLD'}
                  </>
                )}
              </span>
            </div>
            <h2 id="indicator-modal-title" className="text-lg sm:text-xl font-black text-white tracking-tight">
              {isVi ? indicator.nameVi : indicator.nameEn}
            </h2>
          </div>

          <button
            type="button"
            aria-label={isVi ? 'Đóng cửa sổ' : 'Close modal'}
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            title="Đóng (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar text-xs sm:text-sm">
          {/* Plain-Language Meaning Box for Everyday Users */}
          {(indicator.plainMeaningVi || indicator.plainMeaningEn) && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-slate-200 leading-relaxed">
              <strong className="text-emerald-300 font-bold">
                {isVi ? '💡 Hiểu đơn giản cho người mới:' : '💡 Plain-Language Meaning:'}
              </strong>{' '}
              {isVi ? indicator.plainMeaningVi : indicator.plainMeaningEn}
            </div>
          )}

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                {isVi ? 'Đáy Chu Kỳ (Floor)' : 'Cycle Floor'}
              </div>
              <div className="text-base sm:text-lg font-bold text-cyan-400 font-mono mt-0.5">
                {indicator.floorDisplay}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                {isVi ? 'Hiện Tại (Live)' : 'Current Reading'}
              </div>
              <div className="text-base sm:text-lg font-extrabold text-white font-mono mt-0.5">
                {indicator.currentDisplay}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                {isVi ? 'Ngưỡng Đỉnh (Top)' : 'Peak Target'}
              </div>
              <div className="text-base sm:text-lg font-bold text-rose-400 font-mono mt-0.5">
                {indicator.topDisplay}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                {isVi ? 'Tiến Trình Chu Kỳ' : 'Cycle Progress'}
              </div>
              <div className="text-base sm:text-lg font-extrabold text-emerald-400 font-mono mt-0.5">
                {indicator.progressPct}%
              </div>
            </div>
          </div>

          {/* Interactive 3-Stage Normalization Visual Gauge */}
          <div className="space-y-2 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/20 via-slate-900/60 to-rose-950/20 border border-white/[0.08]">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isVi ? 'Đáy Chu Kỳ' : 'Cycle Floor'} ({indicator.floorDisplay})
              </span>
              <span className="text-slate-400 hidden sm:inline">
                {isVi ? 'Vùng Cân Bằng / Tích Sản' : 'Fair Accumulation'} ({indicator.neutralDisplay})
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <Target className="w-3.5 h-3.5" />
                {isVi ? 'Đỉnh Bong Bóng' : 'Euphoria Top'} ({indicator.topDisplay})
              </span>
            </div>

            {/* Visual Multi-Segment Bar */}
            <div className="relative h-4 w-full bg-slate-950 rounded-full border border-white/[0.1] overflow-hidden">
              {/* Zone 1: Floor to Neutral (Green) */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/40 to-teal-500/40 border-r border-teal-500/50"
                style={{ width: '40%' }}
              />
              {/* Zone 2: Neutral to High (Yellow/Amber) */}
              <div
                className="absolute inset-y-0 left-[40%] bg-gradient-to-r from-amber-500/30 to-orange-500/30 border-r border-orange-500/50"
                style={{ width: '35%' }}
              />
              {/* Zone 3: Euphoric Peak (Red) */}
              <div
                className="absolute inset-y-0 left-[75%] bg-rose-500/30"
                style={{ width: '25%' }}
              />

              {/* Current Value Pointer */}
              <div
                className="absolute top-0 bottom-0 w-2.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] rounded-full -ml-1 transition-all duration-500 border border-slate-900"
                style={{ left: `${Math.max(2, Math.min(98, indicator.progressPct))}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>0% (Đáy thực tế)</span>
              <span className="text-emerald-400 font-bold">
                {isVi ? 'Vị thế hiện tại:' : 'Current:'} {indicator.progressPct}%
              </span>
              <span>100% (Đỉnh chu kỳ)</span>
            </div>
          </div>

          {/* Mathematical Rigor Explanation */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-900/70 border border-cyan-500/20">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Calculator className="w-4 h-4" />
              <span>{isVi ? 'Công Thức Toán Học Chuẩn Định Lượng' : 'Quantitative Mathematical Formula'}</span>
            </div>

            <div className="p-3 rounded-xl bg-black/60 border border-white/[0.06] font-mono text-xs sm:text-sm text-cyan-200 overflow-x-auto">
              {indicator.formula}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              {isVi ? indicator.whyMinMaxVi : indicator.whyMinMaxEn}
            </p>
          </div>

          {/* Historical Backtest Section */}
          <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <span>{isVi ? 'Kiểm Chứng Lịch Sử 3 Chu Kỳ (2013, 2017, 2021)' : 'Historical 3-Cycle Backtest'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              {isVi ? indicator.backtestVi : indicator.backtestEn}
            </p>
          </div>

          {/* Actionable Strategy Advice */}
          <div className="space-y-2 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>{isVi ? 'Khuyến Nghị Hành Động Thể Chế Hiện Tại' : 'Institutional Action Playbook'}</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-normal">
              {isVi ? indicator.actionVi : indicator.actionEn}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-black/30 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 font-mono">
            {isVi ? 'Dữ liệu thời gian thực • Nguồn: Binance & On-Chain' : 'Real-time On-Chain & Binance Stream'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-bold transition-colors"
          >
            {isVi ? 'Đóng cửa sổ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
