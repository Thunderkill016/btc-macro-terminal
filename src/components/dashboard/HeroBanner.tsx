import React, { useState } from 'react';
import { ArrowLeftRight, Sparkles, ShieldCheck, X, ChevronRight, Zap } from 'lucide-react';
import { useUnifiedMetrics } from '../../lib/metricsSelector';
import { useTerminalStore } from '../../store/useTerminalStore';

interface HeroBannerProps {
  onQuickTrade: () => void;
  onGenerateSignal: () => void;
  opportunitiesCount?: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onQuickTrade,
  onGenerateSignal,
  opportunitiesCount = 47
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const metrics = useUnifiedMetrics();
  const confluence = useTerminalStore((s) => s.confluenceResult);
  
  const score = metrics.confluenceScore || 71;
  const regimeName = confluence?.regime?.macroRegimeTitleEn || confluence?.regime?.regimeLabelEn || 'Deep Accumulation';
  const tacticalMultiplier = metrics.confluenceMultiplier || 1.35;

  if (isDismissed) {
    return (
      <div className="w-full mb-6 py-2 px-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/30 flex items-center justify-between text-xs text-blue-700 dark:text-blue-300">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>AI Confluence Engine Active · Score: <strong>{score}/100</strong> ({regimeName}) · Half-Kelly: <strong>{tacticalMultiplier}x</strong></span>
        </div>
        <button 
          onClick={() => setIsDismissed(false)}
          className="font-medium hover:underline flex items-center gap-1 cursor-pointer"
        >
          Expand Banner <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full mb-7 flex items-stretch gap-3 select-none">
      {/* Left Collapsible Strip with Cross '✕' Icon */}
      <div className="w-12 lg:w-14 rounded-3xl bg-gradient-to-b from-[#E6EEFF] via-[#EBF4FF] to-[#DCE9FF] dark:from-[#1E293B] dark:via-[#1A2234] dark:to-[#0F172A] border border-white/60 dark:border-white/5 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-white/20 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-all cursor-pointer"
          title="Dismiss banner"
          aria-label="Dismiss banner"
        >
          <X className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>

      {/* Main Iridescent Hero Card matching the user's provided images */}
      <div className="flex-1 rounded-3xl relative overflow-hidden p-6 lg:p-8 bg-gradient-to-r from-[#EAE8FE] via-[#E2F0FE] to-[#E9F3FE] dark:from-[#1A1C35] dark:via-[#16253B] dark:to-[#152336] border border-white/80 dark:border-white/10 shadow-sm">
        {/* Subtle Checkered Mosaic Pattern Overlay */}
        <div className="absolute inset-0 checker-mosaic opacity-60 dark:opacity-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left Column: Badges & Title */}
          <div className="flex flex-col items-start">
            {/* Badges Row */}
            <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
              {/* AI Active Pill with subtle rainbow/amber gradient border */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/95 dark:bg-[#1E293B]/95 shadow-sm border border-amber-300/80 dark:border-amber-400/40 text-xs font-semibold text-[#1F2937] dark:text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>AI Confluence: {score}/100</span>
              </div>

              {/* Pro Plan / Institutional Pill */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/95 dark:bg-[#1E293B]/95 shadow-sm border border-gray-200/80 dark:border-gray-700 text-xs font-medium text-[#374151] dark:text-gray-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Calibrated v5.1 · Pro Plan</span>
              </div>

              {/* Tactical Regime Badge */}
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300/50 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                <Zap className="w-3 h-3 text-emerald-600" />
                <span>{regimeName}</span>
              </div>
            </div>

            {/* Title & Subtitle */}
            <h1 className="text-2xl lg:text-[28px] font-bold text-[#111827] dark:text-white tracking-tight leading-snug">
              Good Morning, Macro Investor!
            </h1>
            <p className="text-xs lg:text-[13.5px] text-[#6B7280] dark:text-[#94A3B8] font-normal mt-1">
              Your AI has analyzed <span className="font-semibold text-gray-800 dark:text-gray-200">{opportunitiesCount} multi-pillar quantitative BTC indicators</span> overnight · Kelly DCA multiplier is <span className="font-bold text-emerald-600 dark:text-emerald-400">{tacticalMultiplier}x</span>.
            </p>
          </div>

          {/* Right Column: Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Quick Trade / DCA Button */}
            <button
              type="button"
              onClick={onQuickTrade}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/90 hover:bg-white dark:bg-[#253046] dark:hover:bg-[#2E3C57] text-[#1E2024] dark:text-white text-[13.5px] font-medium shadow-sm hover:shadow transition-all border border-gray-200/60 dark:border-gray-700 cursor-pointer active:scale-95"
            >
              <ArrowLeftRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span>Quick Trade</span>
            </button>

            {/* Generate Signal Button */}
            <button
              type="button"
              onClick={onGenerateSignal}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#18181B] hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-[13.5px] font-medium shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 group"
            >
              <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
              <span>Generate Signal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
