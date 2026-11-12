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
    <div className="w-full bg-purple-50 border-b border-purple-200 py-2.5 shadow-sm relative z-30 text-xs font-mono">
      <div className="ml-20 sm:ml-24 mr-4 sm:mr-6 lg:mr-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-purple-100 border border-purple-200 text-[#7C3AED] shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5 text-[#7C3AED]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#7C3AED] text-white tracking-wider">
                QUANT ALERT • PHASE 2
              </span>
              <span className="font-bold text-sm text-[#111827]">
                {headline}
              </span>
            </div>
            <p className="text-gray-700 text-xs font-medium mt-1 leading-relaxed font-sans">
              {description}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-gray-600">
              {factors.map((factor, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-white border border-purple-200 px-2 py-0.5 rounded-full shadow-sm"
                >
                  <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                  {factor}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-center shadow-sm">
            <div className="text-[9px] uppercase tracking-wider text-emerald-600">
              {t('multiplierBadge', locale)}
            </div>
            <div className="text-base font-extrabold font-mono">2.0X DEPLOY</div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setDismissed(true)}
            title="Đóng thông báo"
            className="p-1.5 rounded-full bg-white hover:bg-gray-100 border border-purple-200 text-gray-500 hover:text-gray-900 transition-colors shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
