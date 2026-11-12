import React, { useState } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { t } from '../../lib/i18n';
import { ShieldAlert, CheckCircle2, X } from 'lucide-react';

export const BearTrapBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const confluence = useTerminalStore((s) => s.confluenceResult);
  const locale = useTerminalStore((s) => s.locale);
  const alert = confluence.bearTrapAlert;

  // Strict check: ONLY render when alert exists, is active, and not dismissed
  if (!alert || !alert.active || dismissed) return null;

  const headline = locale === 'vi' ? alert.headlineVi : alert.headlineEn;
  const description = locale === 'vi' ? alert.descriptionVi : alert.descriptionEn;
  const factors = locale === 'vi' ? alert.triggerFactorsVi : alert.triggerFactorsEn;

  return (
    <div className="w-full bg-[#1A0B2E] border-y border-purple-500/50 px-4 py-3 shadow-lg relative z-30 text-xs font-mono">
      <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-purple-500/20 border border-purple-400 text-purple-300 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-[10px] uppercase px-2 py-0.5 rounded bg-purple-600 text-white tracking-wider">
                QUANT ALERT • PHASE 2
              </span>
              <span className="font-extrabold text-sm text-purple-200">
                {headline}
              </span>
            </div>
            <p className="text-purple-100 text-xs font-medium mt-1 leading-relaxed font-sans">
              {description}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-slate-300">
              {factors.map((factor, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-black/50 border border-purple-700/60 px-2 py-0.5 rounded"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {factor}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <div className="px-3.5 py-1.5 rounded bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 font-bold text-center">
            <div className="text-[9px] uppercase tracking-wider text-emerald-400">
              {t('multiplierBadge', locale)}
            </div>
            <div className="text-base font-black">2.0X DEPLOY</div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setDismissed(true)}
            title="Đóng thông báo"
            className="p-1.5 rounded bg-black/40 hover:bg-black/70 border border-purple-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
