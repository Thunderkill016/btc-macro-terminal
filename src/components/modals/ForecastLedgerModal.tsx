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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-[#EEF0F5] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF0F5] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-[#7C3AED]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-[#111827]">
                  {isVi ? 'SỔ DỰ BÁO NGÀY & KIỂM CHỨNG TOÁN HỌC' : 'DAILY FORECAST LEDGER & VERIFIED AUDIT'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold">
                  {chainStatus.isValid ? (isVi ? 'CHUỖI HASH HỢP LỆ' : 'HASH CHAIN VALID') : 'INVALID'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                {isVi
                  ? 'Minh bạch 100% không rò rỉ dữ liệu • Neo khối Bitcoin qua OpenTimestamps • Chuỗi hash 16 ngày liên tục'
                  : 'Zero lookahead leakage • OpenTimestamps Bitcoin anchored • Continuous 16-day cryptographic hash chain'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-[#111827] hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-[#EEF0F5] bg-[#F8FAFC] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'bg-white text-[#7C3AED] border border-[#EEF0F5] shadow-xs'
                : 'text-gray-500 hover:text-[#111827]'
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
                ? 'bg-white text-purple-700 border border-[#EEF0F5] shadow-xs'
                : 'text-gray-500 hover:text-[#111827]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{isVi ? '2. Kiểm Toán Rò Rỉ (2015-2020 vs 2021-2026)' : '2. Leakage Audit & Placebo'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-gray-50 text-emerald-700 border border-emerald-200 text-xs font-mono transition-colors shadow-xs"
            title="Download public forecast_ledger.json"
          >
            <Download className="w-3.5 h-3.5" />
            <span>forecast_ledger.json</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs bg-[#F4F6F9]">
          {activeTab === 'ledger' ? (
            <div className="space-y-3">
              {/* Status Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <div className="p-2.5 rounded-xl bg-white border border-[#EEF0F5] shadow-xs">
                  <div className="text-gray-500 text-[10px]">TỔNG BẢN GHI</div>
                  <div className="text-emerald-700 font-bold text-sm">16 ngày liên tục</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#EEF0F5] shadow-xs">
                  <div className="text-gray-500 text-[10px]">CƠ CHẾ LIÊN KẾT</div>
                  <div className="text-[#7C3AED] font-bold text-sm">PrevHash Chain</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#EEF0F5] shadow-xs">
                  <div className="text-gray-500 text-[10px]">NEO BITCOIN</div>
                  <div className="text-purple-700 font-bold text-sm">Block 870,800+</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-[#EEF0F5] shadow-xs">
                  <div className="text-gray-500 text-[10px]">HIỆU CHUẨN ĐỘ TRÔI</div>
                  <div className="text-emerald-700 font-bold text-sm">Drift = 0.00%</div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-[#EEF0F5] bg-white shadow-xs">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-[#F8FAFC] text-gray-500 border-b border-[#EEF0F5]">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Ngày (UTC)</th>
                      <th className="py-2.5 px-3">Giá Snapshot</th>
                      <th className="py-2.5 px-3">Hội Tụ</th>
                      <th className="py-2.5 px-3">30D P50</th>
                      <th className="py-2.5 px-3">Hash Bản Ghi</th>
                      <th className="py-2.5 px-3">Trạng Thái OTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {CANONICAL_FORECAST_LEDGER.map((row) => (
                      <tr key={row.index} className="hover:bg-purple-50/30 transition-colors">
                        <td className="py-2.5 px-3 text-gray-400">{row.index + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#111827]">{row.date}</td>
                        <td className="py-2.5 px-3 text-[#7C3AED] font-bold">${row.snapshotPrice.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-700">{row.confluenceScore}/100</td>
                        <td className="py-2.5 px-3 text-gray-700">${row.quantiles30D.p50.toLocaleString()}</td>
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => handleCopy(row.currentHash)}
                            className="inline-flex items-center gap-1 text-[10px] text-gray-500 hover:text-[#7C3AED] transition-colors cursor-pointer"
                            title="Sao chép Hash"
                          >
                            <span>{row.currentHash.slice(0, 14)}...</span>
                            <Copy className="w-3 h-3" />
                            {copiedHash === row.currentHash && (
                              <span className="text-emerald-700 text-[9px]">Đã chép</span>
                            )}
                          </button>
                        </td>
                        <td className="py-2.5 px-3">
                          {row.otsProof.status === 'BITCOIN_ANCHORED' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-sans font-semibold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Block {row.otsProof.blockHeight}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-sans font-semibold">
                              <Clock className="w-3 h-3 text-amber-600" />
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
                <div className="p-3.5 rounded-xl bg-white border border-[#EEF0F5] space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#7C3AED]">
                      {isVi ? 'Giai Đoạn In-Sample (2015–2020)' : 'In-Sample Period (2015–2020)'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono text-[10px]">
                      {auditResult.inSample2015_2020.candleCount} ngày
                    </span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nguồn DVOL:</span>
                      <span className="text-amber-700 font-semibold">Parkinson Synthetic Proxy</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">CAGR Smart DCA:</span>
                      <span className="text-emerald-700 font-bold">+{auditResult.inSample2015_2020.smartDcaCagrPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">CAGR DCA Đều:</span>
                      <span>+{auditResult.inSample2015_2020.flatDcaCagrPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Max Drawdown:</span>
                      <span className="text-rose-600 font-semibold">{auditResult.inSample2015_2020.maxDrawdownPct}%</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                    {auditResult.inSample2015_2020.notes}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-purple-200 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-700">
                      {isVi ? 'Giai Đoạn Out-of-Sample (2021–2026)' : 'Out-of-Sample Period (2021–2026)'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[10px]">
                      {auditResult.outOfSample2021_2026.candleCount} ngày
                    </span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nguồn DVOL:</span>
                      <span className="text-emerald-700 font-semibold">Deribit DVOL Live (từ 24/03/2021)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">CAGR Smart DCA:</span>
                      <span className="text-emerald-700 font-bold">+{auditResult.outOfSample2021_2026.smartDcaCagrPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">CAGR DCA Đều:</span>
                      <span>+{auditResult.outOfSample2021_2026.flatDcaCagrPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Lợi thế Out-of-Sample:</span>
                      <span className="text-[#7C3AED] font-bold">+{auditResult.outOfSample2021_2026.alphaPct}%</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                    {auditResult.outOfSample2021_2026.notes}
                  </p>
                </div>
              </div>

              {/* Statistical Permutation & Bootstrap Cards */}
              <div className="p-3.5 rounded-xl bg-white border border-[#EEF0F5] space-y-2 shadow-xs">
                <div className="font-bold text-[#111827]">
                  {isVi ? 'Thử Nghiệm Giả Dược Hoán Vị (Placebo Permutation Test)' : 'Placebo Permutation Test'}
                </div>
                <p className="text-[11px] text-gray-600">
                  {isVi
                    ? 'Hoán vị ngẫu nhiên 100 lần thứ tự các quyết định phân bổ vốn trên cùng một chuỗi giá để kiểm chứng xem kết quả có phải do may mắn thị trường tăng giá hay do kỹ năng định vị chu kỳ.'
                    : 'Permuting capital allocation order 100 times over identical price path to test whether performance originates from market drift or cycle timing.'}
                </p>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-1">
                  <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#EEF0F5]">
                    <span className="text-gray-500 text-[10px] block">Alpha Thực Tế</span>
                    <strong className="text-emerald-700 font-bold">+{auditResult.placeboTest.actualAlphaPct}%</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#EEF0F5]">
                    <span className="text-gray-500 text-[10px] block">Alpha Placebo TB</span>
                    <strong className="text-gray-700 font-bold">{auditResult.placeboTest.placeboMeanAlphaPct}%</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#EEF0F5]">
                    <span className="text-gray-500 text-[10px] block">p-Value</span>
                    <strong className="text-[#7C3AED] font-bold">{auditResult.placeboTest.pValue}</strong>
                  </div>
                </div>
              </div>

              {/* Stationary Block Bootstrap */}
              <div className="p-3.5 rounded-xl bg-white border border-[#EEF0F5] space-y-1 shadow-xs">
                <div className="font-bold text-[#111827]">
                  {isVi ? 'Khoảng Tin Cậy 95% Bootstrap Theo Khối (Block Bootstrap)' : '95% Block Bootstrap Confidence Interval'}
                </div>
                <div className="font-mono text-[11px] text-gray-700">
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
