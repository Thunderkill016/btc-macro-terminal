import React, { useState } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { formatUSD, formatFee } from '../../lib/formatters';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const AppleDeepDiveAccordion: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const locale = useTerminalStore((s) => s.locale);
  const mempool = useTerminalStore((s) => s.mempool);
  const realMining = useTerminalStore((s) => s.realMining);
  const realCyclePoints = useTerminalStore((s) => s.realCyclePoints);

  const isVi = locale === 'vi';
  const latestPoint =
    realCyclePoints.length > 0 ? realCyclePoints[realCyclePoints.length - 1] : null;

  const ahr999 = latestPoint?.ahr999 ?? 0.894;
  const mayer = latestPoint?.mayerMultiple ?? 1.04;
  const sma200d = latestPoint?.sma200d ?? 73209;
  const rsi14 = latestPoint?.rsi14 ?? 37.9;
  const hashrate = realMining?.hashrateEh ?? 782.5;
  const fee = mempool?.halfHourFee ?? 2.8;

  return (
    <div className="rounded-3xl bg-slate-900/40 border border-white/[0.08] overflow-hidden backdrop-blur-xl transition-all shadow-xl">
      {/* Toggle Button */}
      <button
        id="deep-dive-toggle"
        type="button"
        aria-expanded={isOpen}
        aria-controls="deep-dive-panel"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold shadow-sm">
            🔬
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">
              {isVi
                ? 'Dành Cho Nhà Đầu Tư Chuyên Sâu: Bảng Chỉ Số Định Lượng Toán Học'
                : 'Deep Dive: Quantitative On-Chain & Technical Metrics'}
            </h4>
            <div className="text-xs text-slate-400">
              {isVi
                ? 'Xem chi tiết AHR999, Mayer Multiple, RSI-14, Hashrate & Phí Mempool'
                : 'Inspect raw mathematical and blockchain fundamentals'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <span>{isOpen ? (isVi ? 'Thu Gọn' : 'Collapse') : (isVi ? 'Mở Rộng' : 'Expand')}</span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div
          id="deep-dive-panel"
          role="region"
          aria-labelledby="deep-dive-toggle"
          className="p-6 pt-3 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn"
        >
          {/* Metric 1 */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-1.5">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {isVi ? 'Chỉ Số AHR999' : 'AHR999 Index'}
            </span>
            <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">{ahr999.toFixed(3)}</div>
            <p className="text-xs text-slate-300 font-normal">
              {isVi ? 'Vùng giá vàng: < 0.45 • Vùng gom: 0.45 - 1.2' : 'Deep Bottom: < 0.45 • DCA: 0.45 - 1.2'}
            </p>
          </div>

          {/* Metric 2 */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-1.5">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {isVi ? 'Hệ Số Mayer (SMA 200D)' : 'Mayer Multiple'}
            </span>
            <div className="text-xl font-bold font-mono text-white tabular-nums">
              {mayer.toFixed(2)}x{' '}
              <span className="text-xs font-normal text-slate-300">
                (SMA 200D: {formatUSD(sma200d, 0)})
              </span>
            </div>
            <p className="text-xs text-slate-300 font-normal">
              {isVi ? 'Định giá hợp lý (< 1.2x). Trần bong bóng: 2.4x' : 'Fair value (< 1.2x). Bubble top: 2.4x'}
            </p>
          </div>

          {/* Metric 3 */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-1.5">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {isVi ? 'RSI(14) Khung 1D' : 'Daily RSI(14)'}
            </span>
            <div className="text-xl font-bold font-mono text-cyan-400 tabular-nums">{rsi14.toFixed(1)}</div>
            <p className="text-xs text-slate-300 font-normal">
              {isVi ? 'Vùng quá bán nhẹ, động lực phục hồi tốt' : 'Mild oversold, favorable recovery momentum'}
            </p>
          </div>

          {/* Metric 4 */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-1.5">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {isVi ? 'Bảo Mật & Phí On-Chain' : 'On-Chain Security & Fee'}
            </span>
            <div className="text-xl font-bold font-mono text-amber-400 tabular-nums">
              {hashrate} EH/s • {formatFee(fee)}
            </div>
            <p className="text-xs text-slate-300 font-normal">
              {isVi ? 'Mạng lưới an toàn nhất thế giới, phí rút cực thấp' : 'All-time high hashrate, low mempool fee'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
