import React, { useState } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import {
  GLOBAL_M2_SERIES,
  CURRENT_GLOBAL_M2_STATS,
  M2_PROVENANCE_TAG,
} from '../../data/macroEtfData';
import {
  Globe,
  TrendingUp,
  Activity,
  Layers,
  ArrowUpRight,
  Info,
  Building2,
  Calendar,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const GlobalM2LiquidityTracker: React.FC = () => {
  const locale = useTerminalStore((s) => s.locale);
  const fetchRealData = useTerminalStore((s) => s.fetchRealData);
  const isLoadingRealData = useTerminalStore((s) => s.isLoadingRealData);
  const isVi = locale === 'vi';

  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(GLOBAL_M2_SERIES.length - 1);
  const activePoint = GLOBAL_M2_SERIES[selectedPointIndex];

  // SVG Chart bounds
  const svgWidth = 720;
  const svgHeight = 260;
  const paddingX = 42;
  const paddingTop = 24;
  const paddingBottom = 34;

  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingTop - paddingBottom;

  // Max and min for M2 YoY
  const minYoY = -6;
  const maxYoY = 22;

  // Max and min for BTC Price (log-scale feel)
  const minPrice = 5000;
  const maxPrice = 95000;

  const pointsCount = GLOBAL_M2_SERIES.length;
  const getX = (idx: number) => paddingX + (idx / Math.max(1, pointsCount - 1)) * chartW;
  const getYoYY = (yoy: number) =>
    paddingTop + chartH - ((yoy - minYoY) / (maxYoY - minYoY)) * chartH;
  const getPriceY = (price: number) => {
    // Log scale interpolation for price
    const logMin = Math.log10(minPrice);
    const logMax = Math.log10(maxPrice);
    const logVal = Math.log10(price);
    const ratio = (logVal - logMin) / (logMax - logMin);
    return paddingTop + chartH - ratio * chartH;
  };

  // Build SVG Paths
  const yoyPoints = GLOBAL_M2_SERIES.map((pt, i) => `${getX(i)},${getYoYY(pt.m2YoYGrowth)}`).join(' ');
  const pricePoints = GLOBAL_M2_SERIES.map((pt, i) => `${getX(i)},${getPriceY(pt.btcPrice)}`).join(' ');
  const zeroYoYY = getYoYY(0);

  return (
    <section
      aria-label={isVi ? 'Thanh Khoản M2 Toàn Cầu' : 'Global M2 Liquidity Tracker'}
      className="rounded-2xl bg-white border border-[#EEF0F5] shadow-card p-5 sm:p-6 text-[#111827] font-sans relative overflow-hidden"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-[#EEF0F5]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#7C3AED] shrink-0 shadow-xs">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#111827] flex items-center gap-2">
                <span>{isVi ? 'Thanh Khoản M2 Toàn Cầu & Chu Kỳ BTC' : 'Global M2 Liquidity & BTC Cycle'}</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-[#7C3AED] border border-purple-200">
                MacroMicro & FRED Benchmark
              </span>
            </div>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              {isVi
                ? 'Tổng cung tiền M2 (Fed, ECB, PBoC, BoJ) tương quan với chu kỳ Bitcoin (~60-90 ngày độ trễ quan sát, ràng buộc bởi DXY & US10Y)'
                : 'Aggregated M2 Money Supply of 4 major CBs correlated with Bitcoin (~60–90 day lead, constrained by DXY & Real Yields)'}
            </p>
          </div>
        </div>

        {/* Live Status Pill & Refresh */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-1.5 text-[11px] text-amber-800 font-mono">
            <span>📊</span>
            <span>{isVi ? 'Dữ Liệu Mẫu / Khảo Sát' : 'Sample Survey Data'}</span>
            <span className="text-gray-500">(Mốc cuối: {M2_PROVENANCE_TAG.lastUpdated})</span>
          </div>
          <button
            type="button"
            onClick={() => fetchRealData()}
            disabled={isLoadingRealData}
            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#7C3AED] text-xs font-semibold flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none disabled:opacity-50"
            title={isVi ? 'Cập nhật lại dữ liệu vĩ mô và on-chain' : 'Refresh macro & on-chain data'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRealData ? 'animate-spin' : ''}`} />
            <span>{isVi ? 'Cập Nhật Dữ Liệu M2' : 'Refresh M2'}</span>
          </button>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700">
              {isVi ? 'Mở Rộng (+1.2% YoY • 108.6T)' : 'Expansion (+1.2% YoY • 108.6T)'}
            </span>
          </div>
        </div>
      </div>

      {/* Data Provenance Transparency Notice */}
      <div className="mt-3.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center gap-2.5 text-xs text-amber-900 font-sans">
        <span className="text-base shrink-0">⚠️</span>
        <div className="leading-relaxed">
          <span className="font-semibold text-amber-800 font-mono">[📊 Dữ Liệu Mẫu / Khảo Sát FRED Benchmark]: </span>
          <span>
            {isVi
              ? `Chuỗi M2 toàn cầu hiển thị 25 mốc khảo sát benchmark từ 2020 đến mốc chốt gần nhất ${M2_PROVENANCE_TAG.lastUpdated} ($108.6T USD). Mối quan hệ dẫn dắt chịu ảnh hưởng bởi sức mạnh chỉ số DXY (hiện 104.2) và lợi suất thực US10Y (hiện 1.85%), không phải một quy luật cơ học tuyệt đối.`
              : `Global M2 series displays 25 benchmark survey points from 2020 through latest point ${M2_PROVENANCE_TAG.lastUpdated} ($108.6T USD). Lead-lag dynamics are constrained by the DXY index (104.2) and US10Y real yields (1.85%), not a deterministic rule.`}
          </span>
        </div>
      </div>

      {/* 4 High-Level Key Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-5">
        {/* Total M2 */}
        <div className="p-3.5 rounded-xl bg-[#F4F6F9] hover:bg-white border border-[#EEF0F5] hover:border-purple-300 shadow-xs transition-all">
          <span className="text-[11px] font-medium text-gray-600 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#7C3AED]" />
            {isVi ? 'Tổng M2 Toàn Cầu' : 'Total Global M2'}
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#111827] tabular-nums">
              ${CURRENT_GLOBAL_M2_STATS.totalM2Trillions}T
            </span>
            <span className="text-xs text-gray-500 font-mono">USD</span>
          </div>
          <span className="text-[10px] text-[#7C3AED] font-mono font-medium block mt-0.5">
            ATH Lịch Sử (Fed + PBoC + ECB + BoJ)
          </span>
        </div>

        {/* YoY Growth */}
        <div className="p-3.5 rounded-xl bg-[#F4F6F9] hover:bg-white border border-[#EEF0F5] hover:border-emerald-300 shadow-xs transition-all">
          <span className="text-[11px] font-medium text-gray-600 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            {isVi ? 'Tốc Độ Tăng M2 YoY' : 'M2 YoY Growth'}
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-700 tabular-nums">
              +{CURRENT_GLOBAL_M2_STATS.yoyGrowthPct}%
            </span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[10px] text-emerald-800 font-mono font-medium block mt-0.5">
            {isVi ? 'Bơm thanh khoản dương liên tục' : 'Net positive expansionary wave'}
          </span>
        </div>

        {/* Lead Lag Horizon */}
        <div className="p-3.5 rounded-xl bg-[#F4F6F9] hover:bg-white border border-[#EEF0F5] hover:border-amber-300 shadow-xs transition-all">
          <span className="text-[11px] font-medium text-gray-600 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-600" />
            {isVi ? 'Độ Trễ Dẫn Dắt (Lead)' : 'Historical Lead Horizon'}
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-800 tabular-nums">
              ~70-90
            </span>
            <span className="text-xs text-gray-500 font-mono">{isVi ? 'Ngày' : 'Days'}</span>
          </div>
          <span className="text-[10px] text-amber-800 font-mono font-medium block mt-0.5">
            {isVi ? 'Tương quan 0.88 với đà tăng BTC' : '0.88 cycle correlation with BTC'}
          </span>
        </div>

        {/* Macro Regime Status */}
        <div className="p-3.5 rounded-xl bg-[#F4F6F9] hover:bg-white border border-[#EEF0F5] hover:border-purple-300 shadow-xs transition-all">
          <span className="text-[11px] font-medium text-gray-600 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
            {isVi ? 'Trạng Thái Vĩ Mô' : 'Macro Regime'}
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-bold font-mono tracking-tight text-purple-700">
              {isVi ? 'ĐỒNG PHA NỚI LỎNG' : 'GLOBAL EASING'}
            </span>
          </div>
          <span className="text-[10px] text-purple-800 font-mono font-medium block mt-0.5">
            {isVi ? 'Giai đoạn siêu thanh khoản' : 'Macro tailwind cycle'}
          </span>
        </div>
      </div>

      {/* Dual Axis Interactive Visual Chart */}
      <div className="rounded-xl bg-white border border-[#EEF0F5] shadow-xs p-4 sm:p-5 relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#111827] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#7C3AED]" />
              {isVi ? 'Tương Quan M2 YoY (%) vs Giá BTC ($)' : 'M2 YoY (%) vs BTC Price Correlation'}
            </span>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-[#7C3AED] rounded-full" />
              <span className="text-gray-700 text-[11px]">{isVi ? 'M2 YoY (%)' : 'M2 YoY (%)'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-amber-500 rounded-full" />
              <span className="text-gray-700 text-[11px]">{isVi ? 'Giá BTC ($)' : 'BTC Price ($)'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500/40" />
              <span className="text-gray-500 text-[10px]">{isVi ? 'Vùng Bơm Tiền (>0%)' : 'Expansion (>0%)'}</span>
            </div>
          </div>
        </div>

        {/* SVG Visualization */}
        <div className="w-full overflow-x-auto no-scrollbar">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[620px] select-none"
            aria-label="Biểu đồ tương quan M2 và Bitcoin"
            role="img"
          >
            {/* Background Expansion Zone (YoY > 0) */}
            <rect
              x={paddingX}
              y={paddingTop}
              width={chartW}
              height={zeroYoYY - paddingTop}
              fill="rgba(16, 185, 129, 0.05)"
            />
            {/* Contraction Zone (YoY < 0) */}
            <rect
              x={paddingX}
              y={zeroYoYY}
              width={chartW}
              height={paddingTop + chartH - zeroYoYY}
              fill="rgba(244, 63, 94, 0.05)"
            />

            {/* Zero Line for YoY */}
            <line
              x1={paddingX}
              y1={zeroYoYY}
              x2={paddingX + chartW}
              y2={zeroYoYY}
              stroke="#EEF0F5"
              strokeDasharray="4 4"
              strokeWidth="1.5"
            />
            <text
              x={paddingX - 6}
              y={zeroYoYY + 3}
              fill="#64748B"
              fontSize="9"
              textAnchor="end"
              fontFamily="monospace"
            >
              0%
            </text>

            {/* Left Y Axis Labels (YoY %) */}
            <text x={paddingX - 6} y={getYoYY(20) + 3} fill="#7C3AED" fontSize="9" textAnchor="end" fontFamily="monospace">
              +20%
            </text>
            <text x={paddingX - 6} y={getYoYY(10) + 3} fill="#7C3AED" fontSize="9" textAnchor="end" fontFamily="monospace">
              +10%
            </text>
            <text x={paddingX - 6} y={getYoYY(-5) + 3} fill="#F43F5E" fontSize="9" textAnchor="end" fontFamily="monospace">
              -5%
            </text>

            {/* Right Y Axis Labels (BTC Price) */}
            <text x={paddingX + chartW + 6} y={getPriceY(80000) + 3} fill="#D97706" fontSize="9" textAnchor="start" fontFamily="monospace">
              $80k
            </text>
            <text x={paddingX + chartW + 6} y={getPriceY(40000) + 3} fill="#D97706" fontSize="9" textAnchor="start" fontFamily="monospace">
              $40k
            </text>
            <text x={paddingX + chartW + 6} y={getPriceY(10000) + 3} fill="#D97706" fontSize="9" textAnchor="start" fontFamily="monospace">
              $10k
            </text>

            {/* Area under M2 YoY curve */}
            <polygon
              points={`${paddingX},${zeroYoYY} ${yoyPoints} ${paddingX + chartW},${zeroYoYY}`}
              fill="url(#m2AreaGradient)"
              opacity="0.3"
            />
            <defs>
              <linearGradient id="m2AreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* M2 YoY Line */}
            <polyline
              fill="none"
              stroke="#7C3AED"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={yoyPoints}
            />

            {/* BTC Price Line */}
            <polyline
              fill="none"
              stroke="#D97706"
              strokeWidth="2"
              strokeDasharray="2 1"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pricePoints}
            />

            {/* Interactive Data Points */}
            {GLOBAL_M2_SERIES.map((pt, i) => {
              const cx = getX(i);
              const cyYoY = getYoYY(pt.m2YoYGrowth);
              const isSelected = i === selectedPointIndex;
              return (
                <g key={pt.date} className="cursor-pointer" onClick={() => setSelectedPointIndex(i)}>
                  {/* Invisible touch target */}
                  <rect
                    x={cx - 14}
                    y={paddingTop}
                    width={28}
                    height={chartH}
                    fill="transparent"
                  />
                  {/* Indicator Line on select */}
                  {isSelected && (
                    <line
                      x1={cx}
                      y1={paddingTop}
                      x2={cx}
                      y2={paddingTop + chartH}
                      stroke="#7C3AED"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                  )}
                  {/* Point */}
                  <circle
                    cx={cx}
                    cy={cyYoY}
                    r={isSelected ? 5.5 : 3}
                    fill={isSelected ? '#FFFFFF' : '#7C3AED'}
                    stroke={isSelected ? '#7C3AED' : '#FFFFFF'}
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />
                  {/* X Axis Date Label */}
                  {(i % 3 === 0 || i === pointsCount - 1) && (
                    <text
                      x={cx}
                      y={svgHeight - 12}
                      fill="#64748B"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {pt.date}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Data Point Detail Strip */}
        <div className="mt-3 pt-3 border-t border-[#EEF0F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F4F6F9] p-3 rounded-xl border border-[#EEF0F5]">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-[#7C3AED] font-mono text-xs font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {activePoint.date}
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-gray-700">
                M2: <strong className="text-[#111827]">${activePoint.m2TrillionsUSD}T</strong>
              </span>
              <span className="text-gray-700">
                YoY:{' '}
                <strong className={activePoint.m2YoYGrowth >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                  {activePoint.m2YoYGrowth > 0 ? `+${activePoint.m2YoYGrowth}%` : `${activePoint.m2YoYGrowth}%`}
                </strong>
              </span>
              <span className="text-gray-700">
                BTC:{' '}
                <strong className="text-amber-800">${activePoint.btcPrice.toLocaleString()}</strong>
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-500 italic flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
            <span>{activePoint.leadSignal}</span>
          </div>
        </div>
      </div>

      {/* Major Central Bank Breakdown Grid */}
      <div className="mt-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#7C3AED]" />
          <span>
            {isVi
              ? 'Phân Rã Cung Tiền M2 Toàn Cầu ($108.6T = Top 4 $92.7T + Thế Giới $15.9T)'
              : 'Global M2 Breakdown ($108.6T = Top 4 $92.7T + Rest of World $15.9T)'}
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {CURRENT_GLOBAL_M2_STATS.centralBankBreakdown.map((cb) => {
            const pct = ((cb.m2EqUSDTrillions / CURRENT_GLOBAL_M2_STATS.totalM2Trillions) * 100).toFixed(1);
            return (
              <div
                key={cb.bank}
                className="p-3 rounded-xl bg-[#F4F6F9] border border-[#EEF0F5] hover:border-purple-300 transition-colors shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#111827]">{cb.bank}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      cb.trend === 'UP'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {cb.trend === 'UP' ? '↗ Nới Lỏng' : '→ Ổn Định'}
                  </span>
                </div>
                <div className="mt-1.5 font-mono text-sm font-bold text-[#111827] flex items-baseline justify-between">
                  <span>~${cb.m2EqUSDTrillions}T <span className="text-[10px] text-gray-500 font-normal">USD</span></span>
                  <span className="text-[10px] text-gray-500 font-mono font-medium">{pct}%</span>
                </div>
                <p className="mt-1 text-[11px] text-gray-500 line-clamp-1">{cb.status}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Institutional Insight Quote Box */}
      <div className="mt-5 p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-xs text-[#111827] leading-relaxed flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-[#7C3AED] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#7C3AED] font-semibold block mb-0.5">
            {isVi ? 'Quy luật Vĩ mô: Bitcoin là chiếc "Miếng Bọt Biển" thanh khoản lớn nhất hành tinh' : 'Macro Law: Bitcoin as the Ultimate High-Beta Liquidity Sponge'}
          </strong>
          <p className="text-gray-700">
            {isVi
              ? 'Lịch sử 14 năm chứng minh giá Bitcoin không phản ứng với lạm phát giá tiêu dùng (CPI) mà phản ứng cực nhạy với tốc độ tăng trưởng cung tiền M2 của các ngân hàng trung ương. Khi M2 toàn cầu bứt phá ngưỡng 0% YoY và mở rộng mạnh, Bitcoin luôn bước vào các đợt tăng giá parabol sau độ trễ trung bình 60–90 ngày.'
              : 'Over 14 years of market cycles, Bitcoin responds not to CPI inflation, but directly to global central bank balance sheet expansion. When aggregate Global M2 YoY turns firmly positive, Bitcoin consistently launches its macro expansion waves with a 60–90 day lead-lag horizon.'}
          </p>
        </div>
      </div>
    </section>
  );
};
