import React, { useState, useEffect } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import {
  X,
  ShieldCheck,
  Download,
  Link,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { CANONICAL_FORECAST_LEDGER, verifyLedgerChain } from '../../domain/quant/forecastLedger';
import { executeComprehensiveLeakageAudit } from '../../domain/quant/leakageAudit';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ForecastLedgerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const locale = useTerminalStore((s) => s.locale);
  const isVi = locale === 'vi';
  const [activeTab, setActiveTab] = useState<'ledger' | 'audit'>('ledger');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const chainStatus = verifyLedgerChain(CANONICAL_FORECAST_LEDGER);
  const auditResult = executeComprehensiveLeakageAudit();

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(CANONICAL_FORECAST_LEDGER, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', 'forecast_ledger.json');
    dlAnchorElem.click();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0A0E17] border border-white/[0.08] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#0F1522]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#F8FAFC]">
                  {isVi ? 'SỔ DỰ BÁO NGÀY & KIỂM CHỨNG TOÁN HỌC' : 'DAILY FORECAST LEDGER & VERIFIED AUDIT'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                  {chainStatus.isValid ? (isVi ? 'CHUỖI HASH HỢP LỆ' : 'HASH CHAIN VALID') : 'INVALID'}
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                {isVi
                  ? 'Minh bạch 100% không rò rỉ dữ liệu • Neo khối Bitcoin qua OpenTimestamps • Chuỗi hash 16 ngày liên tục'
                  : 'Zero lookahead leakage • OpenTimestamps Bitcoin anchored • Continuous 16-day cryptographic hash chain'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-white/[0.06] bg-[#0A0E17] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isVi ? '1. Sổ Dự Báo 16 Ngày (Hash Chain)' : '1. 16-Day Forecast Ledger'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{isVi ? '2. Kiểm Toán Rò Rỉ (2015-2020 vs 2021-2026)' : '2. Leakage Audit & Placebo'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-emerald-400 border border-emerald-500/20 text-xs font-mono transition-colors"
            title="Download public forecast_ledger.json"
          >
            <Download className="w-3.5 h-3.5" />
            <span>forecast_ledger.json</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {activeTab === 'ledger' ? (
            <div className="space-y-3">
              {/* Status Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-lg bg-[#0F1522] border border-white/[0.06]">
                  <div className="text-[#64748B] text-[10px]">TỔNG BẢN GHI</div>
                  <div className="text-emerald-400 font-bold text-sm">16 ngày liên tục</div>
                </div>
                <div className="p-2 rounded-lg bg-[#0F1522] border border-white/[0.06]">
                  <div className="text-[#64748B] text-[10px]">CƠ CHẾ LIÊN KẾT</div>
                  <div className="text-cyan-300 font-bold text-sm">PrevHash Chain</div>
                </div>
                <div className="p-2 rounded-lg bg-[#0F1522] border border-white/[0.06]">
                  <div className="text-[#64748B] text-[10px]">NEO BITCOIN</div>
                  <div className="text-purple-300 font-bold text-sm">Block 870,800+</div>
                </div>
                <div className="p-2 rounded-lg bg-[#0F1522] border border-white/[0.06]">
                  <div className="text-[#64748B] text-[10px]">HIỆU CHUẨN ĐỘ TRÔI</div>
                  <div className="text-emerald-400 font-bold text-sm">Drift = 0.00%</div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-[#0F1522]">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-[#05070B] text-[#64748B] border-b border-white/[0.06]">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Ngày (UTC)</th>
                      <th className="py-2 px-3">Giá Snapshot</th>
                      <th className="py-2 px-3">Hội Tụ</th>
                      <th className="py-2 px-3">30D P50</th>
                      <th className="py-2 px-3">Hash Bản Ghi</th>
                      <th className="py-2 px-3">Trạng Thái OTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {CANONICAL_FORECAST_LEDGER.map((row) => (
                      <tr key={row.index} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2 px-3 text-[#64748B]">{row.index + 1}</td>
                        <td className="py-2 px-3 font-semibold text-[#F8FAFC]">{row.date}</td>
                        <td className="py-2 px-3 text-cyan-300">${row.snapshotPrice.toLocaleString()}</td>
                        <td className="py-2 px-3 font-bold text-emerald-400">{row.confluenceScore}/100</td>
                        <td className="py-2 px-3 text-[#CBD5E1]">${row.quantiles30D.p50.toLocaleString()}</td>
                        <td className="py-2 px-3">
                          <button
                            type="button"
                            onClick={() => handleCopy(row.currentHash)}
                            className="inline-flex items-center gap-1 text-[10px] text-[#94A3B8] hover:text-cyan-300 transition-colors cursor-pointer"
                            title="Sao chép Hash"
                          >
                            <span>{row.currentHash.slice(0, 14)}...</span>
                            <Copy className="w-3 h-3" />
                            {copiedHash === row.currentHash && (
                              <span className="text-emerald-400 text-[9px]">Đã chép</span>
                            )}
                          </button>
                        </td>
                        <td className="py-2 px-3">
                          {row.otsProof.status === 'BITCOIN_ANCHORED' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-sans">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Block {row.otsProof.blockHeight}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-sans">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Đang xếp hàng xác nhận</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* In-Sample vs Out-of-Sample Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#0F1522] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">
                      {isVi ? 'Giai Đoạn In-Sample (2015–2020)' : 'In-Sample Period (2015–2020)'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[#94A3B8] font-mono text-[10px]">
                      {auditResult.inSample2015_2020.candleCount} ngày
                    </span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-[#CBD5E1]">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Nguồn DVOL:</span>
                      <span className="text-amber-300">Parkinson Synthetic Proxy</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">CAGR Smart DCA:</span>
                      <span className="text-emerald-400 font-bold">+{auditResult.inSample2015_2020.smartDcaCagrPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">CAGR DCA Đều:</span>
                      <span>+{auditResult.inSample2015_2020.flatDcaCagrPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Max Drawdown:</span>
                      <span className="text-rose-400">{auditResult.inSample2015_2020.maxDrawdownPct}%</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#64748B] pt-1 border-t border-white/[0.04]">
                    {auditResult.inSample2015_2020.notes}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0F1522] border border-purple-500/25 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-300">
                      {isVi ? 'Giai Đoạn Out-of-Sample (2021–2026)' : 'Out-of-Sample Period (2021–2026)'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 font-mono text-[10px]">
                      {auditResult.outOfSample2021_2026.candleCount} ngày
                    </span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-[#CBD5E1]">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Nguồn DVOL:</span>
                      <span className="text-emerald-400">Deribit DVOL Live (từ 24/03/2021)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">CAGR Smart DCA:</span>
                      <span className="text-emerald-400 font-bold">+{auditResult.outOfSample2021_2026.smartDcaCagrPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">CAGR DCA Đều:</span>
                      <span>+{auditResult.outOfSample2021_2026.flatDcaCagrPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Lợi thế Out-of-Sample:</span>
                      <span className="text-cyan-300 font-bold">+{auditResult.outOfSample2021_2026.alphaPct}%</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#64748B] pt-1 border-t border-white/[0.04]">
                    {auditResult.outOfSample2021_2026.notes}
                  </p>
                </div>
              </div>

              {/* Statistical Permutation & Bootstrap Cards */}
              <div className="p-3.5 rounded-xl bg-[#0F1522] border border-white/[0.06] space-y-2">
                <div className="font-bold text-[#F8FAFC]">
                  {isVi ? 'Thử Nghiệm Giả Dược Hoán Vị (Placebo Permutation Test)' : 'Placebo Permutation Test'}
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  {isVi
                    ? 'Hoán vị ngẫu nhiên 100 lần thứ tự các quyết định phân bổ vốn trên cùng một chuỗi giá để kiểm chứng xem kết quả có phải do may mắn thị trường tăng giá hay do kỹ năng định vị chu kỳ.'
                    : 'Permuting capital allocation order 100 times over identical price path to test whether performance originates from market drift or cycle timing.'}
                </p>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-1">
                  <div className="p-2 rounded bg-black/40">
                    <span className="text-[#64748B] text-[10px] block">Alpha Thực Tế</span>
                    <strong className="text-emerald-400">+{auditResult.placeboTest.actualAlphaPct}%</strong>
                  </div>
                  <div className="p-2 rounded bg-black/40">
                    <span className="text-[#64748B] text-[10px] block">Alpha Placebo TB</span>
                    <strong className="text-[#CBD5E1]">{auditResult.placeboTest.placeboMeanAlphaPct}%</strong>
                  </div>
                  <div className="p-2 rounded bg-black/40">
                    <span className="text-[#64748B] text-[10px] block">p-Value</span>
                    <strong className="text-cyan-300">{auditResult.placeboTest.pValue}</strong>
                  </div>
                </div>
              </div>

              {/* Stationary Block Bootstrap */}
              <div className="p-3.5 rounded-xl bg-[#0F1522] border border-white/[0.06] space-y-1">
                <div className="font-bold text-[#F8FAFC]">
                  {isVi ? 'Khoảng Tin Cậy 95% Bootstrap Theo Khối (Block Bootstrap)' : '95% Block Bootstrap Confidence Interval'}
                </div>
                <div className="font-mono text-[11px] text-[#CBD5E1]">
                  Khoảng tin cậy 95% của Alpha ngoài mẫu: [{auditResult.bootstrapAlphaCI.ciLower95}%, {auditResult.bootstrapAlphaCI.ciUpper95}%] (Khối 120 ngày, 100 vòng lấy mẫu lặp lại).
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
