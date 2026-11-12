import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { useTerminalStore } from '../../store/useTerminalStore';
import {
  formatUSD,
  formatPercent,
  formatSats,
} from '../../lib/formatters';
import { t } from '../../lib/i18n';
import { X, Download, Share2, Sparkles, Check, Copy, Zap } from 'lucide-react';

export const ShareCardModal: React.FC = () => {
  const isOpen = useTerminalStore((s) => s.shareCardModalOpen);
  const setIsOpen = useTerminalStore((s) => s.setShareCardModalOpen);
  const result = useTerminalStore((s) => s.backtestResult);
  const ticker = useTerminalStore((s) => s.ticker);
  const confluence = useTerminalStore((s) => s.confluenceResult);
  const params = useTerminalStore((s) => s.backtestParams);
  const locale = useTerminalStore((s) => s.locale);

  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  const btc = result.btcPortfolio;
  const gold = result.goldPortfolio;
  const bank = result.bankPortfolio;

  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `BTC_Macro_Alpha_Card_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export PNG', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-white border border-[#EEF0F5] rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative font-sans">
        <button
          type="button"
          aria-label={locale === 'vi' ? 'Đóng' : 'Close'}
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 text-gray-400 hover:text-[#111827] p-2 rounded-xl hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 id="share-modal-title" className="text-sm font-extrabold text-[#111827] uppercase tracking-wider mb-1 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-[#7C3AED]" />
          <span>{t('modalShareTitle', locale)}</span>
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          {t('modalShareDesc', locale)}
        </p>

        {/* The Viral Card Container (Rendered to PNG) */}
        <div
          ref={cardRef}
          className="w-full bg-white border-2 border-[#EEF0F5] rounded-2xl p-6 text-[#111827] font-mono shadow-xl relative overflow-hidden"
        >
          {/* Subtle Horizon Pattern */}
          <div className="absolute inset-0 bg-radial-[at_top_right] from-purple-50/40 via-transparent to-transparent opacity-80 pointer-events-none" />

          {/* Header of Card */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-[#7C3AED] flex items-center justify-center font-black text-lg">
                ₿
              </div>
              <div>
                <div className="font-black text-sm tracking-wider text-[#111827]">
                  {t('appTitle', locale)}
                </div>
                <div className="text-[10px] text-gray-500 font-sans">
                  btc.thunderkill016.workers.dev
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-gray-500 uppercase">{t('spotPriceUsd', locale)}</div>
              <div className="text-base font-black text-emerald-700 tabular-nums">
                {formatUSD(ticker.price, 0)}
              </div>
            </div>
          </div>

          {/* Main Hero Metric: ROI Comparison */}
          <div className="bg-[#F8FAFC] border border-[#EEF0F5] rounded-xl p-4 mb-4 relative z-10">
            <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>{locale === 'vi' ? 'KẾT QUẢ KIỂM CHỨNG LỢI NHUẬN THỰC' : 'REAL-RETURN BACKTEST OUTCOME'}</span>
              <span className="text-[#7C3AED] font-bold">
                {params.strategy === 'DYNAMIC_CONFLUENCE_DCA'
                  ? t('strategySmartDca', locale)
                  : params.strategy === 'STANDARD_DAILY_DCA'
                  ? t('strategyStandardDca', locale)
                  : t('strategyLumpSum', locale)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center my-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-[10px] text-emerald-800 uppercase font-bold">{t('btcCardTitle', locale)}</div>
                <div className="text-xl font-black text-emerald-700 mt-1">
                  {formatPercent(btc.roiPercent)}
                </div>
                <div className="text-[10px] text-gray-700 mt-0.5 font-bold">
                  {formatUSD(btc.currentValueUsd)}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <div className="text-[10px] text-amber-800 uppercase font-bold">{t('sjcCardTitle', locale)}</div>
                <div className="text-xl font-black text-amber-700 mt-1">
                  {formatPercent(gold.roiPercent)}
                </div>
                <div className="text-[10px] text-gray-700 mt-0.5">
                  {formatUSD(gold.currentValueUsd)}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-gray-100 border border-gray-200">
                <div className="text-[10px] text-gray-600 uppercase font-bold">{t('bankCardTitle', locale)}</div>
                <div className="text-xl font-black text-gray-800 mt-1">
                  {formatPercent(bank.roiPercent)}
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5">
                  {formatUSD(bank.currentValueUsd)}
                </div>
              </div>
            </div>

            {btc.extraSatsFromSmartDca > 0 && (
              <div className="mb-2 p-1.5 rounded-lg bg-purple-50 border border-purple-200 text-[10px] text-[#7C3AED] flex items-center justify-between">
                <span className="flex items-center gap-1 font-semibold">
                  <Zap className="w-3 h-3 text-[#7C3AED]" />
                  <span>{t('smartDcaAlphaNote', locale)}:</span>
                </span>
                <strong className="text-purple-800 font-bold">
                  +{btc.extraSatsFromSmartDca.toLocaleString()} sats (+{btc.alphaPercentOverStandard}%)
                </strong>
              </div>
            )}

            <div className="flex justify-between items-center text-[11px] text-gray-600 border-t border-gray-200 pt-2 mt-1">
              <span>{locale === 'vi' ? 'Đã tích lũy:' : 'Accumulated:'} <strong className="text-[#7C3AED] font-bold">{formatSats(btc.totalBtcAccumulated)}</strong></span>
              <span>{locale === 'vi' ? 'Tổng vốn:' : 'Total Invested:'} <strong className="text-[#111827] font-bold">{formatUSD(btc.totalInvestedUsd)}</strong></span>
            </div>
          </div>

          {/* Quant Accumulation Matrix Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#EEF0F5] relative z-10 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7C3AED]" />
              <div>
                <div className="font-bold text-[#111827]">{t('confluenceEngineTitle', locale)}</div>
                <div className="text-[10px] text-gray-500 font-sans">
                  On-Chain (35%) • Macro (25%) • Technicals (25%) • Sentiment (15%)
                </div>
              </div>
            </div>
            <div className="text-right">
              <span
                className="text-lg font-black"
                style={{ color: confluence.zoneColor }}
              >
                {confluence.totalScore}/100
              </span>
              <div
                className="text-[10px] font-bold"
                style={{ color: confluence.zoneColor }}
              >
                {confluence.zone === 'GENERATIONAL_BUY'
                  ? t('zoneGenerationalBuy', locale)
                  : confluence.zone === 'STRONG_ACCUMULATION'
                  ? t('zoneStrongAccumulation', locale)
                  : confluence.zone === 'REGULAR_DCA'
                  ? t('zoneRegularDca', locale)
                  : confluence.zone === 'HOLD_REDUCE'
                  ? t('zoneDefensive', locale)
                  : t('zoneEuphoria', locale)}
              </div>
            </div>
          </div>

          {/* Footer Watermark */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 relative z-10 font-sans">
            <span>{locale === 'vi' ? 'Thiết kế cho Nhà Tích Sản Bitcoin Thế Hệ' : 'Built for Sovereign Bitcoin Wealth Accumulators'}</span>
            <span>{locale === 'vi' ? 'Mô Hình Toán Học Đã Kiểm Chứng' : 'Verified Mathematical Model'}</span>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-3 mt-5 font-sans text-xs">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-4 py-2.5 min-h-[40px] rounded-xl bg-[#F4F6F9] hover:bg-gray-200 border border-[#EEF0F5] text-gray-700 flex items-center gap-2 transition-colors font-semibold focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:outline-none"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (locale === 'vi' ? 'Đã sao chép link!' : 'Link Copied!') : (locale === 'vi' ? 'Sao Chép Link' : 'Copy Terminal Link')}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isExporting}
            className="px-5 py-2.5 min-h-[40px] rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:outline-none disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? (locale === 'vi' ? 'Đang tạo PNG...' : 'Generating PNG...') : (locale === 'vi' ? 'Tải Ảnh Xuất Bản (PNG)' : 'Download Image (PNG)')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
