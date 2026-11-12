import React, { useState } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import {
  US_SPOT_BITCOIN_ETFS,
  RECENT_ETF_DAILY_FLOWS,
  ETF_AGGREGATE_SUMMARY,
  ETF_PROVENANCE_TAG,
  SpotEtfFundDetail,
} from '../../data/macroEtfData';
import {
  Building2,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  PieChart,
  RefreshCw,
} from 'lucide-react';

export const UsSpotEtfFlowDashboard: React.FC = () => {
  const locale = useTerminalStore((s) => s.locale);
  const livePrice = useTerminalStore((s) => s.ticker.price) || 75925;
  const fetchRealData = useTerminalStore((s) => s.fetchRealData);
  const isLoadingRealData = useTerminalStore((s) => s.isLoadingRealData);
  const isVi = locale === 'vi';

  // Benchmark execution metrics (Fixed execution price on reporting session + Live Market Cap AUM)
  const dynamicBtcAbsorbed = ETF_AGGREGATE_SUMMARY.dayBtcAbsorbed;
  const dynamicAbsorptionMultiple = ETF_AGGREGATE_SUMMARY.absorptionMultiple;
  const dynamicTotalAumB = parseFloat(((ETF_AGGREGATE_SUMMARY.totalBtcHeld * livePrice) / 1e9).toFixed(2));

  const [sortField, setSortField] = useState<keyof SpotEtfFundDetail>('btcHoldings');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedFund, setSelectedFund] = useState<string | null>('IBIT');

  const sortedFunds = [...US_SPOT_BITCOIN_ETFS].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return 0;
  });

  const handleSort = (field: keyof SpotEtfFundDetail) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Bar chart scale calculation
  const maxFlow = Math.max(...RECENT_ETF_DAILY_FLOWS.map((f) => Math.abs(f.netFlowMillionsUSD)), 900);

  return (
    <section
      aria-label={isVi ? 'Bảng Dòng Tiền US Spot Bitcoin ETF' : 'US Spot Bitcoin ETF Flow Dashboard'}
      className="rounded-2xl bg-white border border-[#E1E3E3] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl p-5 sm:p-6 text-[#191F2C] font-sans relative overflow-hidden"
    >
      {/* Ambient background glow */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-[#E1E3E3]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>{isVi ? 'Dòng Tiền US Spot Bitcoin ETF' : 'US Spot Bitcoin ETF Institutional Flows'}</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Farside & Newhedge Benchmark (T+1)
              </span>
            </div>
            <p className="text-xs text-[#64748B] font-normal mt-0.5">
              {isVi
                ? 'Theo dõi 11 quỹ ETF Phố Wall, lượng BTC bảo chứng thực tế và áp lực hấp thụ thợ đào'
                : '11 Wall Street Spot ETFs, verifiable on-chain custodian reserves and miner absorption'}
            </p>
          </div>
        </div>

        {/* Live Indicator Pill & Refresh */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-1.5 text-[11px] text-amber-300 font-mono">
            <span>📊</span>
            <span>{isVi ? 'Dữ Liệu Mẫu / Benchmark' : 'Sample Benchmark Data'}</span>
            <span className="text-[#64748B]">({ETF_PROVENANCE_TAG.lastUpdated})</span>
          </div>
          <button
            type="button"
            onClick={() => fetchRealData()}
            disabled={isLoadingRealData}
            className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none disabled:opacity-50"
            title={isVi ? 'Cập nhật dòng tiền ETF và giá live' : 'Refresh ETF flows & live price'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRealData ? 'animate-spin' : ''}`} />
            <span>{isVi ? 'Cập Nhật Dòng Tiền' : 'Refresh ETF'}</span>
          </button>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-300">
              {isVi
                ? `Phiên gần nhất: +$${ETF_AGGREGATE_SUMMARY.dayNetInflowMillionsUSD}M (~${dynamicBtcAbsorbed.toLocaleString()} BTC)`
                : `Latest Session: +$${ETF_AGGREGATE_SUMMARY.dayNetInflowMillionsUSD}M (~${dynamicBtcAbsorbed.toLocaleString()} BTC)`}
            </span>
          </div>
        </div>
      </div>

      {/* Data Provenance Transparency Notice */}
      <div className="mt-3.5 p-3 rounded-2xl bg-amber-950/20 border border-amber-500/25 flex items-center gap-2.5 text-xs text-amber-200/90 font-sans">
        <span className="text-base shrink-0">⚠️</span>
        <div className="leading-relaxed">
          <span className="font-semibold text-amber-300 font-mono">[📊 Dữ Liệu Mẫu / Khảo Sát Benchmark - Chưa Có Feed API Trực Tiếp]: </span>
          <span>
            {isVi
              ? `Bảng theo dõi 11 quỹ ETF hiện hiển thị snapshot khảo sát chuẩn Farside & Arkham chốt ngày ${ETF_PROVENANCE_TAG.lastUpdated} (Tổng ~1.25M BTC trong US ETF; Newhedge ghi nhận ~1.69M BTC toàn cầu). Chưa kết nối API tự động trực tiếp theo thời gian thực.`
              : `The 11 ETF table currently presents a benchmark survey snapshot dated ${ETF_PROVENANCE_TAG.lastUpdated} (~1.25M BTC in US ETFs; Newhedge records ~1.69M BTC globally). Direct live real-time API feed is pending.`}
          </span>
        </div>
      </div>

      {/* 4 High-Level Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-5">
        {/* Total BTC Held */}
        <div className="p-3.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E1E3E3] hover:border-indigo-500/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all">
          <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            {isVi ? 'Tổng BTC Các Quỹ Nắm Giữ' : 'Total BTC In ETF Reserves'}
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {ETF_AGGREGATE_SUMMARY.totalBtcHeld.toLocaleString()}
            </span>
            <span className="text-xs text-amber-400 font-mono">BTC</span>
          </div>
          <span className="text-[10px] text-indigo-300 font-mono font-medium block mt-0.5">
            {ETF_AGGREGATE_SUMMARY.pctOfCirculating}% {isVi ? 'Tổng cung lưu hành' : 'of circulating supply'}
          </span>
        </div>

        {/* Total AUM (Dynamic at live BTC price) */}
        <div className="p-3.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E1E3E3] hover:border-cyan-500/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all">
          <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            {isVi ? 'Tổng Tài Sản Quản Lý (AUM Live)' : 'Total ETF AUM (Live)'}
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-cyan-300 tabular-nums">
              ${dynamicTotalAumB}B
            </span>
            <span className="text-xs text-[#64748B] font-mono">USD</span>
          </div>
          <span className="text-[10px] text-cyan-400/80 font-mono font-medium block mt-0.5">
            {isVi ? 'Vốn ròng lũy kế' : 'Cumulative Inflow'}: +${ETF_AGGREGATE_SUMMARY.cumulativeInflowsBillionsUSD}B
          </span>
        </div>

        {/* Miner Issuance Absorption Multiple (Dynamic) */}
        <div className="p-3.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E1E3E3] hover:border-amber-500/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all">
          <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            {isVi ? 'Bội Số Hấp Thụ Thợ Đào' : 'Miner Supply Absorption'}
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-300 tabular-nums">
              {dynamicAbsorptionMultiple}x
            </span>
            <span className="text-xs text-[#64748B] font-mono">Lần</span>
          </div>
          <span className="text-[10px] text-amber-300/80 font-mono font-medium block mt-0.5">
            {isVi
              ? `Hấp thụ ${dynamicBtcAbsorbed.toLocaleString()} BTC vs 450 BTC đào mới/ngày`
              : `Absorbed ${dynamicBtcAbsorbed.toLocaleString()} BTC vs 450 mined/day`}
          </span>
        </div>

        {/* BlackRock Dominance */}
        <div className="p-3.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E1E3E3] hover:border-emerald-500/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all">
          <span className="text-[11px] font-medium text-[#64748B] flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-emerald-400" />
            {isVi ? 'Thị Phần BlackRock (IBIT)' : 'BlackRock IBIT Dominance'}
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-400 tabular-nums">
              {ETF_AGGREGATE_SUMMARY.blackRockDominationPct}%
            </span>
          </div>
          <span className="text-[10px] text-emerald-300/80 font-mono font-medium block mt-0.5">
            {isVi ? 'Quỹ ETF lớn nhất lịch sử tài chính' : 'Fastest-growing ETF in history'}
          </span>
        </div>
      </div>

      {/* 20-Day Daily Net Inflows / Outflows Bar Chart */}
      <div className="rounded-xl bg-[#F8FAFC] border border-[#E1E3E3] p-4 sm:p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#343B43] flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
              {isVi ? 'Dòng Tiền Mua/Bán Ròng Hàng Ngày ($ Triệu USD)' : 'Daily Net Inflow / Outflow ($ Millions USD)'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
              <span className="text-[#343B43] text-[11px]">{isVi ? 'Mua Ròng (Inflow)' : 'Net Inflow'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
              <span className="text-[#343B43] text-[11px]">{isVi ? 'Bán Ròng (Outflow)' : 'Net Outflow'}</span>
            </div>
          </div>
        </div>

        {/* Visual Bars Container */}
        <div className="w-full overflow-x-auto no-scrollbar">
          <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-44 pt-4 px-2 min-w-[580px]">
            {RECENT_ETF_DAILY_FLOWS.map((item, idx) => {
              const isInflow = item.netFlowMillionsUSD >= 0;
              const barHeightPct = Math.max(8, Math.min(100, (Math.abs(item.netFlowMillionsUSD) / maxFlow) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 pointer-events-none whitespace-nowrap bg-slate-800 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono shadow-xl text-center">
                    <div className="text-[#343B43]">{item.date}</div>
                    <div className={isInflow ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {isInflow ? `+$${item.netFlowMillionsUSD}M` : `-$${Math.abs(item.netFlowMillionsUSD)}M`}
                    </div>
                    <div className="text-[9px] text-[#64748B]">
                      {item.btcAbsorbed > 0 ? `+${item.btcAbsorbed} BTC` : `${item.btcAbsorbed} BTC`}
                    </div>
                  </div>

                  {/* Flow Bar */}
                  <div
                    style={{ height: `${barHeightPct}%` }}
                    className={`w-full max-w-[20px] rounded-t-sm transition-all duration-200 group-hover:brightness-125 ${
                      isInflow
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        : 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                    }`}
                  />

                  {/* Date Label */}
                  <span className="text-[9px] font-mono text-[#64748B] mt-2 truncate w-full text-center group-hover:text-[#191F2C]">
                    {item.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 11 ETF Holdings & Breakdown Table (Responsive-table standard) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#343B43] flex items-center gap-2">
            <PieChart className="w-4 h-4 text-cyan-400" />
            <span>{isVi ? 'Bảng Chi Tiết 11 Quỹ Spot ETF (Sắp Xếp Theo Thị Phần)' : '11 Spot ETFs Breakdown by Holdings'}</span>
          </h3>
          <span className="text-[11px] text-[#64748B] font-mono">
            {isVi ? 'Nhấp vào tiêu đề để sắp xếp' : 'Click header to sort'}
          </span>
        </div>

        {/* Scrollable Container with Accessibility Semantics */}
        <div
          tabIndex={0}
          role="region"
          aria-label={isVi ? 'Bảng chi tiết các quỹ US Spot Bitcoin ETF' : 'US Spot Bitcoin ETF Breakdown Table'}
          className="overflow-auto max-h-[460px] rounded-2xl border border-[#E1E3E3] bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <table className="w-full text-left border-collapse border-spacing-0 text-xs font-mono">
            {/* Sticky Table Header */}
            <thead className="sticky top-0 z-10 bg-[#E1E3E3]/95 backdrop-blur-md border-b border-[#E1E3E3] text-[#64748B] text-[11px]">
              <tr>
                <th
                  scope="col"
                  className="py-3 px-3.5 font-semibold cursor-pointer hover:text-[#191F2C] transition-colors"
                  onClick={() => handleSort('ticker')}
                >
                  Ticker
                </th>
                <th scope="col" className="py-3 px-3 font-semibold">
                  {isVi ? 'Nhà Quản Lý (Issuer)' : 'Issuer'}
                </th>
                <th
                  scope="col"
                  className="py-3 px-3 text-right font-semibold cursor-pointer hover:text-[#191F2C] transition-colors"
                  onClick={() => handleSort('btcHoldings')}
                >
                  {isVi ? 'BTC Nắm Giữ' : 'BTC Held'} {sortField === 'btcHoldings' && (sortAsc ? '↑' : '↓')}
                </th>
                <th
                  scope="col"
                  className="py-3 px-3 text-right font-semibold cursor-pointer hover:text-[#191F2C] transition-colors"
                  onClick={() => handleSort('aumMillionsUSD')}
                >
                  AUM ($M) {sortField === 'aumMillionsUSD' && (sortAsc ? '↑' : '↓')}
                </th>
                <th
                  scope="col"
                  className="py-3 px-3 text-right font-semibold cursor-pointer hover:text-[#191F2C] transition-colors"
                  onClick={() => handleSort('flow24hMillionsUSD')}
                >
                  24h Flow ($M) {sortField === 'flow24hMillionsUSD' && (sortAsc ? '↑' : '↓')}
                </th>
                <th
                  scope="col"
                  className="py-3 px-3 text-right font-semibold cursor-pointer hover:text-[#191F2C] transition-colors"
                  onClick={() => handleSort('expenseRatio')}
                >
                  {isVi ? 'Phí Phạt' : 'Fee'} (%)
                </th>
                <th scope="col" className="py-3 px-3.5 font-semibold">
                  {isVi ? 'Lưu Ký (Custodian)' : 'Custodian'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E3E3]">
              {sortedFunds.map((fund) => {
                const isSelected = selectedFund === fund.ticker;
                const isPositive24h = fund.flow24hMillionsUSD >= 0;
                const fundAumM = Math.round((fund.btcHoldings * livePrice) / 1e6);

                return (
                  <tr
                    key={fund.ticker}
                    onClick={() => setSelectedFund(fund.ticker)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/30 text-white'
                        : 'hover:bg-slate-800/40 text-[#343B43]'
                    }`}
                  >
                    {/* Ticker & Share */}
                    <td className="py-2.5 px-3.5 font-bold text-[#191F2C] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>{fund.ticker}</span>
                      <span className="text-[10px] font-normal text-[#64748B]">({fund.sharePct}%)</span>
                    </td>

                    {/* Issuer */}
                    <td className="py-2.5 px-3 font-sans text-[#191F2C]">
                      <span className="font-medium">{fund.issuer}</span>
                      <span className="block text-[10px] text-[#64748B] truncate max-w-[140px]">{fund.name}</span>
                    </td>

                    {/* BTC Holdings */}
                    <td className="py-2.5 px-3 text-right font-bold text-amber-300 tabular-nums">
                      {fund.btcHoldings.toLocaleString()} <span className="text-[10px] text-[#64748B]">BTC</span>
                    </td>

                    {/* AUM (Dynamic at live BTC price) */}
                    <td className="py-2.5 px-3 text-right text-[#191F2C] tabular-nums">
                      ${fundAumM.toLocaleString()}M
                    </td>

                    {/* 24h Flow */}
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      <span
                        className={`inline-flex items-center gap-0.5 font-semibold ${
                          isPositive24h ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive24h ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {isPositive24h ? `+$${fund.flow24hMillionsUSD}M` : `-$${Math.abs(fund.flow24hMillionsUSD)}M`}
                      </span>
                    </td>

                    {/* Expense Ratio */}
                    <td className="py-2.5 px-3 text-right text-[#343B43] tabular-nums">
                      {fund.expenseRatio.toFixed(2)}%
                    </td>

                    {/* Custodian */}
                    <td className="py-2.5 px-3.5 text-[#64748B] font-sans text-[11px]">
                      {fund.custodian}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer with Summary Aggregation */}
            <tfoot className="sticky bottom-0 bg-[#E1E3E3]/95 backdrop-blur-md border-t border-[#E1E3E3] font-bold text-[#191F2C]">
              <tr>
                <td className="py-2.5 px-3.5 text-white">
                  {isVi ? 'Tổng 11 Quỹ ETF' : 'Total 11 ETFs'}
                </td>
                <td className="py-2.5 px-3 font-sans text-[#64748B] text-[11px]">
                  US Wall Street
                </td>
                <td className="py-2.5 px-3 text-right text-amber-300 tabular-nums">
                  {ETF_AGGREGATE_SUMMARY.totalBtcHeld.toLocaleString()} BTC
                </td>
                <td className="py-2.5 px-3 text-right text-cyan-300 tabular-nums">
                  ${(dynamicTotalAumB * 1000).toLocaleString()}M
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-400 tabular-nums">
                  +${ETF_AGGREGATE_SUMMARY.dayNetInflowMillionsUSD}M
                </td>
                <td className="py-2.5 px-3 text-right text-[#64748B]">Avg 0.25%</td>
                <td className="py-2.5 px-3.5 text-[#64748B] text-[11px]">Coinbase / Fidelity</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Institutional Supply Squeeze Commentary */}
      <div className="mt-5 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-[#343B43] leading-relaxed flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-indigo-200 font-semibold block mb-0.5">
            {isVi
              ? 'Áp lực Cung - Cầu Hậu Halving: "Cơn Khát Nguồn Cung" (Supply Crunch)'
              : 'Post-Halving Supply Crunch Dynamic: Wall Street vs Miners'}
          </strong>
          <p>
            {isVi
              ? 'Kể từ sự kiện Bitcoin Halving tháng 4/2024, toàn bộ mạng lưới thợ đào toàn cầu chỉ khai thác ra 450 BTC/ngày. Khi 11 quỹ ETF Phố Wall ghi nhận mức mua ròng trung bình 3,000–5,000 BTC/ngày (gấp 7x–11x tổng sản lượng thợ đào đào ra), lượng Bitcoin trôi nổi trên các sàn giao dịch (OTC & Exchange Reserves) buộc phải co lại nhanh chóng, tạo động lực tăng giá cấu trúc dài hạn.'
              : 'Since the April 2024 Halving, global miners produce only 450 BTC per day. With US spot ETFs accumulating an average of 3,000 to 5,000 BTC per day (7x to 11x miner issuance), OTC desks and exchange reserves face continuous structural depletion, driving the macro supply squeeze.'}
          </p>
        </div>
      </div>
    </section>
  );
};
