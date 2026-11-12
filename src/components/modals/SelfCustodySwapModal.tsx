import React, { useState, useEffect } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { formatSats, formatBtc } from '../../lib/formatters';
import { t } from '../../lib/i18n';
import { X, ArrowRightLeft, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';

export const SelfCustodySwapModal: React.FC = () => {
  const isOpen = useTerminalStore((s) => s.selfCustodyModalOpen);
  const setIsOpen = useTerminalStore((s) => s.setSelfCustodyModalOpen);
  const livePrice = useTerminalStore((s) => s.ticker.price);
  const locale = useTerminalStore((s) => s.locale);

  const [usdtAmount, setUsdtAmount] = useState('1000');
  const [recipientBtcAddress, setRecipientBtcAddress] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
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

  const isVi = locale === 'vi';
  const numericUsdt = parseFloat(usdtAmount) || 0;
  const networkFeeBtc = 0.00008; // ~8,000 sats
  const estimatedBtc =
    livePrice > 0 ? Math.max(0, numericUsdt / livePrice - networkFeeBtc) : 0;

  const handleSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientBtcAddress) return;
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsOpen(false);
    }, 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="self-custody-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="bg-[#0B101D] border border-white/[0.12] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative font-sans text-xs space-y-4">
        {/* Close Button */}
        <button
          type="button"
          aria-label={isVi ? 'Đóng cửa sổ' : 'Close modal'}
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/[0.08] transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-sm">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h3 id="self-custody-title" className="text-base font-bold text-white tracking-tight">
              {t('modalSwapTitle', locale)}
            </h3>
            <span className="text-xs text-cyan-300 font-medium">
              {t('modalSwapSubtitle', locale)}
            </span>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-sm font-bold text-white">
              {isVi ? 'Lệnh Hoán Đổi Đã Được Chuyển Tiếp!' : 'Swap Order Dispatched!'}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              {isVi
                ? `Đang chuyển tuyến ${formatBtc(estimatedBtc, 6)} BTC đến ${recipientBtcAddress.substring(0, 10)}... qua cầu thanh khoản phi lưu ký.`
                : `Routing ${formatBtc(estimatedBtc, 6)} BTC to ${recipientBtcAddress.substring(0, 10)}... via decentralized liquidity bridge.`}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSwap} className="space-y-4 mt-2">
            <div>
              <label htmlFor="swap-usdt-amount" className="text-xs font-semibold text-slate-300 uppercase block mb-1.5">
                {isVi ? 'SỐ TIỀN BẠN THANH TOÁN (USDT / USDC)' : 'YOU PAY (USDT / USDC)'}
              </label>
              <div className="relative">
                <input
                  id="swap-usdt-amount"
                  type="number"
                  min="50"
                  step="50"
                  required
                  value={usdtAmount}
                  onChange={(e) => setUsdtAmount(e.target.value)}
                  className="w-full bg-[#070A12] border border-white/[0.1] rounded-xl p-3 pr-28 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 text-sm font-bold tabular-nums"
                />
                <span className="absolute right-3.5 top-3.5 text-xs text-slate-400 font-bold font-mono">
                  USDT
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-300">
                <span>{isVi ? 'Ước tính Sats nhận được:' : 'Estimated Sats received:'}</span>
                <span className="text-amber-400 font-bold tabular-nums">
                  {formatSats(estimatedBtc)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>{isVi ? 'Quy đổi Bitcoin:' : 'Converted Bitcoin:'}</span>
                <span className="text-white font-bold tabular-nums">
                  {formatBtc(estimatedBtc, 8)} BTC
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1.5 border-t border-white/[0.06]">
                <span>{isVi ? 'Phí khai thác mạng Bitcoin:' : 'Network Mining Fee:'}</span>
                <span className="tabular-nums">~0.00008 BTC (~$6.1)</span>
              </div>
            </div>

            <div>
              <label htmlFor="swap-recipient-address" className="text-xs font-semibold text-slate-300 uppercase block mb-1.5">
                {isVi ? 'ĐỊA CHỈ NHẬN BITCOIN (NATIVE SEGWIT / TAPROOT)' : 'RECIPIENT BITCOIN ADDRESS (NATIVE SEGWIT / TAPROOT)'}
              </label>
              <input
                id="swap-recipient-address"
                type="text"
                placeholder="bc1q..."
                required
                value={recipientBtcAddress}
                onChange={(e) => setRecipientBtcAddress(e.target.value)}
                className="w-full bg-[#070A12] border border-white/[0.1] rounded-xl p-3 text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 text-xs font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1.5 block">
                {isVi
                  ? 'Tuyệt đối không dùng địa chỉ nạp sàn CEX. Hãy dùng ví lạnh Trezor, Ledger hoặc BitBox.'
                  : 'Never enter an exchange deposit address. Use Trezor, Ledger, or BitBox.'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-slate-300 flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {isVi
                  ? '100% Không lưu logs. Hoán đổi thực hiện trực tiếp ngang hàng phi tập trung.'
                  : 'Zero logs kept. Swap processed via peer-to-peer liquidity protocol.'}
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>{isVi ? 'Thực Hiện Đổi Trực Tiếp Về Ví Cứng' : 'Initiate Direct Self-Custody Swap'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
