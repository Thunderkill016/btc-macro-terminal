import React, { useState, useEffect } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { formatUSD, formatVND } from '../../lib/formatters';
import {
  X,
  Plus,
  Edit3,
  Calendar,
  DollarSign,
  Coins,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AddTransactionModal: React.FC = () => {
  const isOpen = useTerminalStore((s) => s.addTransactionModalOpen);
  const setIsOpen = useTerminalStore((s) => s.setAddTransactionModalOpen);
  const editingTx = useTerminalStore((s) => s.editingTransaction);
  const addTransaction = useTerminalStore((s) => s.addTransaction);
  const editTransaction = useTerminalStore((s) => s.editTransaction);
  const livePrice = useTerminalStore((s) => s.ticker.price) || 75925;
  const p2pRate = useTerminalStore((s) => s.ticker.p2pUsdtVndRate) || 25600;
  const locale = useTerminalStore((s) => s.locale);
  const isVi = locale === 'vi';

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountBtc, setAmountBtc] = useState('');
  const [amountUsd, setAmountUsd] = useState('');
  const [priceUsd, setPriceUsd] = useState(livePrice.toString());
  const [storageLocation, setStorageLocation] = useState<'binance_spot' | 'binance_earn' | 'cold_wallet'>('binance_spot');
  const [feeUsd, setFeeUsd] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync state if editing an existing transaction
  useEffect(() => {
    if (editingTx) {
      setDate(editingTx.date);
      setAmountBtc(editingTx.amountBtc.toString());
      setPriceUsd(editingTx.priceUsd.toString());
      setAmountUsd((editingTx.amountBtc * editingTx.priceUsd).toFixed(2));
      setFeeUsd(editingTx.feeUsd.toString());
      setNotes(editingTx.notes || '');
      setStorageLocation((editingTx.storageLocation as any) || 'binance_spot');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setAmountBtc('');
      setAmountUsd('');
      setPriceUsd(livePrice ? Math.round(livePrice).toString() : '75925');
      setFeeUsd('');
      setNotes('');
      setStorageLocation('binance_spot');
    }
    setError(null);
  }, [editingTx, isOpen, livePrice]);

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

  // Bidirectional calculations:
  const handleBtcChange = (val: string) => {
    setAmountBtc(val);
    const btc = parseFloat(val);
    const pr = parseFloat(priceUsd) || livePrice;
    if (!isNaN(btc) && btc > 0 && pr > 0) {
      setAmountUsd((btc * pr).toFixed(2));
    } else {
      setAmountUsd('');
    }
  };

  const handleUsdChange = (val: string) => {
    setAmountUsd(val);
    const usd = parseFloat(val);
    const pr = parseFloat(priceUsd) || livePrice;
    if (!isNaN(usd) && usd > 0 && pr > 0) {
      setAmountBtc((usd / pr).toFixed(6));
    } else {
      setAmountBtc('');
    }
  };

  const handlePriceChange = (val: string) => {
    setPriceUsd(val);
    const pr = parseFloat(val);
    const btc = parseFloat(amountBtc);
    if (!isNaN(pr) && pr > 0 && !isNaN(btc) && btc > 0) {
      setAmountUsd((btc * pr).toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const btc = parseFloat(amountBtc);
    const pr = parseFloat(priceUsd);
    if (isNaN(btc) || btc <= 0) {
      setError(isVi ? 'Vui lòng nhập số lượng BTC hợp lệ (> 0)' : 'Please enter valid BTC amount');
      return;
    }
    if (isNaN(pr) || pr <= 0) {
      setError(isVi ? 'Vui lòng nhập giá mua USD hợp lệ (> 0)' : 'Please enter valid price in USD');
      return;
    }

    const calculatedFee = feeUsd ? parseFloat(feeUsd) : Math.round(btc * pr * 0.001 * 100) / 100;

    if (editingTx) {
      editTransaction(editingTx.id, {
        date,
        type: 'BUY',
        amountBtc: btc,
        priceUsd: pr,
        feeUsd: calculatedFee,
        storageLocation,
        notes: notes || (isVi ? 'Mua Spot Thủ Công' : 'Manual Spot Buy'),
      });
    } else {
      addTransaction({
        date,
        type: 'BUY',
        amountBtc: btc,
        priceUsd: pr,
        feeUsd: calculatedFee,
        storageLocation,
        notes: notes || (isVi ? 'Mua Spot Thủ Công' : 'Manual Spot Buy'),
      });
    }
    setIsOpen(false);
  };

  const btcNum = parseFloat(amountBtc) || 0;
  const priceNum = parseFloat(priceUsd) || 0;
  const totalUsd = btcNum * priceNum;
  const totalVnd = Math.round(totalUsd * p2pRate);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-tx-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn text-xs"
    >
      <div className="bg-white border border-[#EEF0F5] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative space-y-4">
        {/* Close Button */}
        <button
          type="button"
          aria-label={isVi ? 'Đóng cửa sổ' : 'Close modal'}
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 text-gray-400 hover:text-[#111827] p-2 rounded-xl hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 text-[#7C3AED] flex items-center justify-center font-bold shadow-xs">
            {editingTx ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </div>
          <div>
            <h3 id="add-tx-title" className="text-base font-extrabold text-[#111827] tracking-wide flex items-center gap-2">
              {editingTx
                ? isVi ? 'Chỉnh Sửa Lệnh Mua Spot' : 'Edit Spot Buy Order'
                : isVi ? 'Nhập Lệnh Mua Bitcoin Thật' : 'Add Real Spot Buy Order'}
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              {isVi
                ? 'Ghi nhận vào sổ cái nội bộ 100% riêng tư (LocalStorage trình duyệt)'
                : 'Recorded to 100% private local ledger (Browser LocalStorage)'}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Ngày Mua */}
            <div className="space-y-1">
              <label htmlFor="tx-date-input" className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1 cursor-pointer">
                <Calendar className="w-3 h-3 text-[#7C3AED]" />
                <span>{isVi ? 'Ngày Mua *' : 'Purchase Date *'}</span>
              </label>
              <input
                id="tx-date-input"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#F4F6F9] border border-[#EEF0F5] rounded-xl p-2.5 text-[#111827] text-xs font-mono focus:bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none transition-colors"
              />
            </div>

            {/* Giá Khớp USD */}
            <div className="space-y-1">
              <label htmlFor="tx-price-input" className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1 cursor-pointer">
                <DollarSign className="w-3 h-3 text-emerald-600" />
                <span>{isVi ? 'Giá Khớp BTC ($) *' : 'Execution Price ($) *'}</span>
              </label>
              <input
                id="tx-price-input"
                type="number"
                step="0.01"
                required
                placeholder="75925"
                value={priceUsd}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-full bg-[#F4F6F9] border border-[#EEF0F5] rounded-xl p-2.5 text-[#111827] text-xs font-mono font-bold focus:bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none transition-colors"
              />
            </div>

            {/* Số Lượng BTC */}
            <div className="space-y-1">
              <label htmlFor="tx-btc-input" className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1 cursor-pointer">
                <Coins className="w-3 h-3 text-amber-600" />
                <span>{isVi ? 'Số Lượng BTC *' : 'Amount BTC *'}</span>
              </label>
              <input
                id="tx-btc-input"
                type="number"
                step="0.00000001"
                required
                placeholder="0.025"
                value={amountBtc}
                onChange={(e) => handleBtcChange(e.target.value)}
                className="w-full bg-[#F4F6F9] border border-[#EEF0F5] rounded-xl p-2.5 text-[#111827] text-xs font-mono font-bold focus:bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none transition-colors"
              />
            </div>

            {/* Hoặc Số Tiền USD Đã Mua */}
            <div className="space-y-1">
              <label htmlFor="tx-usd-input" className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1 cursor-pointer">
                <DollarSign className="w-3 h-3 text-gray-400" />
                <span>{isVi ? 'Hoặc Tổng Tiền (USD)' : 'Or Total Paid (USD)'}</span>
              </label>
              <input
                id="tx-usd-input"
                type="number"
                step="0.01"
                placeholder="1898.12"
                value={amountUsd}
                onChange={(e) => handleUsdChange(e.target.value)}
                className="w-full bg-[#F4F6F9] border border-[#EEF0F5] rounded-xl p-2.5 text-[#111827] text-xs font-mono focus:bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none transition-colors"
              />
            </div>
          </div>

          {/* Nơi Lưu Trữ (Storage Location) */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-[#7C3AED]" />
              <span>{isVi ? 'Nơi Lưu Trữ BTC *' : 'Storage Location *'}</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStorageLocation('binance_spot')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  storageLocation === 'binance_spot'
                    ? 'bg-purple-50 border-purple-300 text-[#7C3AED] shadow-xs'
                    : 'bg-[#F4F6F9] border-[#EEF0F5] text-gray-600 hover:text-[#111827] hover:bg-gray-100'
                }`}
              >
                <div className="font-bold text-[11px]">Binance Spot</div>
                <div className="text-[9px] opacity-75 font-sans">{isVi ? 'Ví Giao Ngay Sàn' : 'Spot Exchange'}</div>
              </button>

              <button
                type="button"
                onClick={() => setStorageLocation('binance_earn')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  storageLocation === 'binance_earn'
                    ? 'bg-cyan-50 border-cyan-300 text-cyan-700 shadow-xs'
                    : 'bg-[#F4F6F9] border-[#EEF0F5] text-gray-600 hover:text-[#111827] hover:bg-gray-100'
                }`}
              >
                <div className="font-bold text-[11px]">Binance Earn</div>
                <div className="text-[9px] opacity-75 font-sans">{isVi ? 'Lãi Sats Linh Hoạt' : 'Simple Earn Flex'}</div>
              </button>

              <button
                type="button"
                onClick={() => setStorageLocation('cold_wallet')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  storageLocation === 'cold_wallet'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                    : 'bg-[#F4F6F9] border-[#EEF0F5] text-gray-600 hover:text-[#111827] hover:bg-gray-100'
                }`}
              >
                <div className="font-bold text-[11px]">Ví Lạnh (Cold)</div>
                <div className="text-[9px] opacity-75 font-sans">{isVi ? 'Ledger / Trezor' : 'Hardware Wallet'}</div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Phí Giao Dịch */}
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase font-semibold">
                {isVi ? 'Phí Giao Dịch ($)' : 'Fee ($)'}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder={totalUsd > 0 ? (totalUsd * 0.001).toFixed(2) : '0.1%'}
                value={feeUsd}
                onChange={(e) => setFeeUsd(e.target.value)}
                className="w-full bg-[#F4F6F9] border border-[#EEF0F5] rounded-xl p-2.5 text-[#111827] text-xs font-mono focus:bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none transition-colors"
              />
            </div>

            {/* Ghi Chú */}
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase font-semibold">
                {isVi ? 'Ghi Chú Chiến Lược' : 'Strategic Notes'}
              </label>
              <input
                type="text"
                placeholder={isVi ? 'DCA hàng tuần / Bắt đáy F&G 28' : 'Weekly DCA / Dip buy'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#F4F6F9] border border-[#EEF0F5] rounded-xl p-2.5 text-[#111827] text-xs font-mono focus:bg-white focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none transition-colors"
              />
            </div>
          </div>

          {/* Quick Summary Pill */}
          {totalUsd > 0 && (
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#EEF0F5] flex items-center justify-between text-xs">
              <span className="text-gray-500 font-sans">{isVi ? 'Quy đổi tổng vốn đầu tư:' : 'Capital Summary:'}</span>
              <span className="font-bold text-[#111827] tabular-nums">
                {formatUSD(totalUsd)} <span className="text-emerald-600 font-medium">(≈ {formatVND(totalVnd)})</span>
              </span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="py-3 px-4 rounded-xl bg-[#F4F6F9] hover:bg-gray-200 border border-[#EEF0F5] text-gray-700 font-bold text-xs transition-colors"
            >
              {isVi ? 'Hủy' : 'Cancel'}
            </button>

            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingTx ? (isVi ? 'Lưu Thay Đổi' : 'Save Changes') : (isVi ? 'Lưu Lệnh Mua Vào Sổ Cái' : 'Record Order to Ledger')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
