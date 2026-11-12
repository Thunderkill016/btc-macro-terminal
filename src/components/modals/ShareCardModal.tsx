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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="bg-[#0B101D] border border-white/[0.12] rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative font-sans">
        <button
          type="button"
          aria-label={locale === 'vi' ? 'Đóng' : 'Close'}
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/[0.08] transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 id="share-modal-title" className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-amber-400" />
          <span>{t('modalShareTitle', locale)}</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          {t('modalShareDesc', locale)}
        </p>

        {/* The Viral Card Container (Rendered to PNG) */}
        <div
          ref={cardRef}
          className="w-full bg-[#070A12] border-2 border-slate-700/80 rounded-xl p-6 text-slate-100 font-mono shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Cyber Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-25 pointer-events-none" />

          {/* Header of Card */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500 text-amber-400 flex items-center justify-center font-black text-lg">
                ₿
              </div>
              <div>
                <div className="font-black text-sm tracking-wider text-white">
                  {t('appTitle', locale)}
                </div>
                <div className="text-[10px] text-slate-400">
                  btc.thunderkill016.workers.dev
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase">{t('spotPriceUsd', locale)}</div>
              <div className="text-base font-black text-emerald-400 tabular-nums">
                {formatUSD(ticker.price, 0)}
              </div>
            </div>
          </div>

          {/* Main Hero Metric: ROI Comparison */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 mb-4 relative z-10">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>{locale === 'vi' ? 'KẾT QUẢ KIỂM CHỨNG LỢI NHUẬN THỰC' : 'REAL-RETURN BACKTEST OUTCOME'}</span>
              <span className="text-amber-400 font-bold">
                {params.strategy === 'DYNAMIC_CONFLUENCE_DCA'
                  ? t('strategySmartDca', locale)
                  : params.strategy === 'STANDARD_DAILY_DCA'
                  ? t('strategyStandardDca', locale)
                  : t('strategyLumpSum', locale)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center my-3">
              <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/40">
                <div className="text-[10px] text-emerald-300 uppercase font-bold">{t('btcCardTitle', locale)}</div>
                <div className="text-xl font-black text-emerald-400 mt-1">
                  {formatPercent(btc.roiPercent)}
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5 font-bold">
                  {formatUSD(btc.currentValueUsd)}
                </div>
              </div>

              <div className="p-2.5 rounded bg-amber-950/40 border border-amber-500/40">
                <div className="text-[10px] text-amber-300 uppercase font-bold">{t('sjcCardTitle', locale)}</div>
                <div className="text-xl font-black text-amber-400 mt-1">
                  {formatPercent(gold.roiPercent)}
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5">
                  {formatUSD(gold.currentValueUsd)}
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-800/40 border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase font-bold">{t('bankCardTitle', locale)}</div>
                <div className="text-xl font-black text-slate-300 mt-1">
                  {formatPercent(bank.roiPercent)}
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5">
                  {formatUSD(bank.currentValueUsd)}
                </div>
              </div>
            </div>

            {btc.extraSatsFromSmartDca > 0 && (
              <div className="mb-2 p-1.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-300 flex items-center justify-between">
                <span className="flex items-center gap-1 font-semibold">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{t('smartDcaAlphaNote', locale)}:</span>
                </span>
                <strong className="text-amber-300">
                  +{btc.extraSatsFromSmartDca.toLocaleString()} sats (+{btc.alphaPercentOverStandard}%)
                </strong>
              </div>
            )}

            <div className="flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-800 pt-2 mt-1">
              <span>{locale === 'vi' ? 'Đã tích lũy:' : 'Accumulated:'} <strong className="text-amber-400">{formatSats(btc.totalBtcAccumulated)}</strong></span>
              <span>{locale === 'vi' ? 'Tổng vốn:' : 'Total Invested:'} <strong className="text-white">{formatUSD(btc.totalInvestedUsd)}</strong></span>
            </div>
          </div>

          {/* Quant Accumulation Matrix Badge */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/60 border border-slate-800 relative z-10 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <div>
                <div className="font-bold text-white">{t('confluenceEngineTitle', locale)}</div>
                <div className="text-[10px] text-slate-400">
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
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 relative z-10">
            <span>{locale === 'vi' ? 'Thiết kế cho Nhà Tích Sản Bitcoin Thế Hệ' : 'Built for Sovereign Bitcoin Wealth Accumulators'}</span>
            <span>{locale === 'vi' ? 'Mô Hình Toán Học Đã Kiểm Chứng' : 'Verified Mathematical Model'}</span>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-3 mt-5 font-sans text-xs">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-4 py-2.5 min-h-[40px] rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-300 hover:text-white flex items-center gap-2 transition-colors font-semibold focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (locale === 'vi' ? 'Đã sao chép link!' : 'Link Copied!') : (locale === 'vi' ? 'Sao Chép Link' : 'Copy Terminal Link')}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isExporting}
            className="px-5 py-2.5 min-h-[40px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? (locale === 'vi' ? 'Đang tạo PNG...' : 'Generating PNG...') : (locale === 'vi' ? 'Tải Ảnh Xuất Bản (PNG)' : 'Download Image (PNG)')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
