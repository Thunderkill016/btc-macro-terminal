import React from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { formatUSD, formatPercent } from '../../lib/formatters';
import { useUnifiedMetrics } from '../../lib/metricsSelector';
import {
  TrendingUp,
  ShieldCheck,
  Compass,
  Activity,
  Layers,
  ArrowUpRight,
  Crosshair,
  Sparkles,
} from 'lucide-react';

export const AppleSignalGrid: React.FC = () => {
  const locale = useTerminalStore((s) => s.locale);
  const ticker = useTerminalStore((s) => s.ticker);
  const derivatives = useTerminalStore((s) => s.derivatives);
  const realFutures = useTerminalStore((s) => s.realFutures);
  const realCyclePoints = useTerminalStore((s) => s.realCyclePoints);
  const liveCoinMetrics = useTerminalStore((s) => s.liveCoinMetrics);
  const macro = useTerminalStore((s) => s.macro);
  const setInstitutionalModalOpen = useTerminalStore((s) => s.setInstitutionalModalOpen);

  const isVi = locale === 'vi';
  const metrics = useUnifiedMetrics();
  const price = metrics.livePrice;

  // Extract SSOT metrics
  const realAhr999 = metrics.ahr999;
  const realFairValue = metrics.powerLawFairValue;
  const realSma200w = metrics.floorSma200w;
  const realMayer = metrics.mayerMultiple;
  const realRsi14 = realCyclePoints && realCyclePoints.length > 0
    ? realCyclePoints[realCyclePoints.length - 1].rsi14
    : 37.9;

  // Live Realized Price & MVRV via CoinMetrics (SSOT)
  const realRealizedPrice = metrics.realizedPrice;
  const realMvrv = metrics.mvrv;

  // Dual Cycle Top Targets: Pi Cycle 2x 350DMA vs Power Law Bubble Ceiling
  const piCycleTopTarget = metrics.piCycleTop;
  const powerLawBubbleTop = metrics.powerLawBubbleCeiling;

  const realFundingPct = metrics.fundingRate8h;
  const fearGreedVal = metrics.fearGreedIndex;

  // Calculations
  const discountVsFair = Math.round(((price - realFairValue) / realFairValue) * 100);
  const distanceAboveFloor = Math.round(((price - realSma200w) / realSma200w) * 100);
  const distanceToPiTop = Math.round(((piCycleTopTarget - price) / price) * 100);

  // 8h Funding Rate and Annualized Rate Calculations
  const fundingSign = realFundingPct >= 0 ? '+' : '';
  const annualizedRate = metrics.annualizedFunding.toFixed(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Power Law & MVRV Valuation (LookIntoBitcoin & Glassnode) */}
      <div
        onClick={() => setInstitutionalModalOpen(true, 'lookintobitcoin')}
        className="group rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-emerald-500/40 p-5 backdrop-blur-xl shadow-lg hover:shadow-emerald-500/10 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between space-y-4 cursor-pointer"
        title={isVi ? 'Bấm để xem phương pháp luận LookIntoBitcoin' : 'Click to view LookIntoBitcoin methodology'}
      >
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 group-hover:text-emerald-400 transition-colors">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>{isVi ? '1. Định Giá MVRV & Power Law' : '1. Power Law & MVRV'}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
              MVRV {realMvrv}x • {
                realMvrv < 1.0
                  ? (isVi ? 'Vùng Giá Vàng' : 'Deep Value')
                  : realMvrv < 2.0
                  ? (isVi ? 'Vùng Tích Lũy' : 'Accumulation')
                  : realMvrv < 3.0
                  ? (isVi ? 'Vùng Cân Bằng' : 'Fair Value')
                  : (isVi ? 'Vùng Bong Bóng' : 'Bubble')
              }
            </span>
          </div>

          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              {formatUSD(realFairValue, 0)}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {isVi ? 'Giá trị cơ bản mạng lưới (Fair Value)' : 'Network Fundamental Value'}
            </div>
          </div>

          {/* Simple Apple Visual Scale */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex relative">
              <div className="h-full bg-emerald-500" style={{ width: '40%' }} title="Vùng Giá Vàng" />
              <div className="h-full bg-cyan-500" style={{ width: '35%' }} title="Vùng Hợp Lý" />
              <div className="h-full bg-rose-500" style={{ width: '25%' }} title="Vùng Bong Bóng" />
              {/* Indicator Dot */}
              <div
                className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-lg"
                style={{ left: '32%' }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span className="text-emerald-400 font-bold">{isVi ? `Tích Lũy (${realMvrv}x)` : `Accumulate (${realMvrv}x)`}</span>
              <span className="text-slate-300 font-bold">{isVi ? 'Hợp Lý' : 'Fair'}</span>
              <span className="text-rose-400 font-bold">{isVi ? 'Đắt (>3.5)' : 'Bubble'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t border-white/[0.06] pt-3">
          <p className="text-xs text-slate-300/90 leading-relaxed flex items-center justify-between">
            <span>
              {isVi
                ? `Giá đang thấp hơn ${Math.abs(discountVsFair)}% so với giá trị thực ($${(realFairValue - price).toLocaleString()} / BTC). Vùng gom chiến lược.`
                : `Trading at a ${Math.abs(discountVsFair)}% discount ($${(realFairValue - price).toLocaleString()} below fair value). Prime zone.`}
            </span>
            <span className="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold ml-1">
              ↗
            </span>
          </p>
          {/* Tier 2: Failure Mode Disclosure */}
          <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04] text-[10px] font-mono text-slate-400 leading-tight">
            <span className="text-amber-400/90 font-bold">{isVi ? '⚠️ Mô hình này sai khi:' : '⚠️ Model failure mode:'}</span>{' '}
            {isVi
              ? 'Xảy ra thiên nga đen giao thức hoặc dòng tiền ETF tổ chức làm lệch quy luật chi phí cơ sở lịch sử.'
              : 'Severe protocol black-swans or sovereign ETF structural demand warping historic cost-basis rules.'}
          </div>
        </div>
      </div>

      {/* 2. 200-Week Floor & Realized Price (Glassnode) */}
      <div
        onClick={() => setInstitutionalModalOpen(true, 'glassnode')}
        className="group rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-cyan-500/40 p-5 backdrop-blur-xl shadow-lg hover:shadow-cyan-500/10 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between space-y-4 cursor-pointer"
        title={isVi ? 'Bấm để xem phương pháp luận Glassnode' : 'Click to view Glassnode methodology'}
      >
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 group-hover:text-cyan-400 transition-colors">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>{isVi ? '2. Sàn Đáy 200 Tuần' : '2. 200W Floor & Realized'}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              +{distanceAboveFloor}% {isVi ? 'Trên Sàn' : 'Above Floor'}
            </span>
          </div>

          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              {formatUSD(realSma200w, 0)}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {isVi ? `Sàn 200W • Giá vốn on-chain: $${realRealizedPrice.toLocaleString()}` : `200W Floor • Realized: $${realRealizedPrice.toLocaleString()}`}
            </div>
          </div>

          {/* Simple Apple Visual Scale */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex relative">
              <div className="h-full bg-cyan-500" style={{ width: '25%' }} />
              <div className="h-full bg-emerald-500" style={{ width: '50%' }} />
              <div className="h-full bg-amber-500" style={{ width: '25%' }} />
              <div
                className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-lg"
                style={{ left: '28%' }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span className="text-cyan-400 font-bold">{isVi ? 'Đáy Chu Kỳ' : 'Cycle Support'}</span>
              <span className="text-emerald-400 font-bold">{isVi ? 'Tích Lũy' : 'Accumulate'}</span>
              <span className="text-amber-400 font-bold">{isVi ? 'Mở Rộng' : 'Expansion'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t border-white/[0.06] pt-3">
          <p className="text-xs text-slate-300/90 leading-relaxed flex items-center justify-between">
            <span>
              {isVi
                ? `Vùng hỗ trợ chu kỳ lịch sử. Trong các đợt sụt giảm sâu (2022, tháng 6/2026), giá từng đóng nến tuần dưới mốc này trước khi phục hồi.`
                : `Historical cycle support zone. Severe drawdowns (2022, June 2026) have seen weekly closes below this level before reclaiming.`}
            </span>
            <span className="text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold ml-1">
              ↗
            </span>
          </p>
          {/* Tier 2: Failure Mode Disclosure */}
          <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04] text-[10px] font-mono text-slate-400 leading-tight">
            <span className="text-amber-400/90 font-bold">{isVi ? '⚠️ Mô hình này sai khi:' : '⚠️ Model failure mode:'}</span>{' '}
            {isVi
              ? 'Khủng hoảng thanh khoản vĩ mô toàn cầu kéo dài khiến giá đóng tuần dưới 200WMA nhiều tháng; đường 200W là ngưỡng hỗ trợ động có thể bị xuyên thủng, không phải điểm dừng cố định.'
              : 'Severe macro liquidity shocks keep price sub-200WMA for multiple months; 200W is a dynamic cushion that can be breached, not a rigid boundary.'}
          </div>
        </div>
      </div>

      {/* 3. Pi Cycle Top Indicator (LookIntoBitcoin / Philip Swift) */}
      <div
        onClick={() => setInstitutionalModalOpen(true, 'lookintobitcoin')}
        className="group rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-purple-500/40 p-5 backdrop-blur-xl shadow-lg hover:shadow-purple-500/10 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between space-y-4 cursor-pointer"
        title={isVi ? 'Bấm để xem chỉ báo Pi Cycle Top' : 'Click to view Pi Cycle Top indicator'}
      >
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 group-hover:text-purple-400 transition-colors">
              <Crosshair className="w-4 h-4 text-purple-400" />
              <span>{isVi ? '3. Mục Tiêu Chốt Lời (Pi Cycle)' : '3. Profit Target (Pi Cycle)'}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
              +{distanceToPiTop}% {isVi ? 'Dư Địa' : 'Headroom'}
            </span>
          </div>

          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              {formatUSD(piCycleTopTarget, 0)}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {isVi ? 'Vùng kích hoạt chốt lời chu kỳ (2× 350DMA)' : 'Cycle Exit Target (2× 350DMA)'}
            </div>
          </div>

          {/* Simple Apple Visual Scale */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex relative">
              <div className="h-full bg-emerald-500" style={{ width: '45%' }} title="Vùng Gom" />
              <div className="h-full bg-amber-500" style={{ width: '35%' }} title="Tăng Trưởng" />
              <div className="h-full bg-rose-500" style={{ width: '20%' }} title="Đỉnh Pi Cycle" />
              <div
                className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-lg"
                style={{ left: '38%' }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span className="text-emerald-400 font-bold">{isVi ? 'Tích Lũy' : 'Accumulate'}</span>
              <span className="text-amber-400 font-bold">{isVi ? 'Tăng Trưởng' : 'Run'}</span>
              <span className="text-rose-400 font-bold">{isVi ? 'Đỉnh Pi' : 'Top Cross'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t border-white/[0.06] pt-3">
          <p className="text-xs text-slate-300/90 leading-relaxed flex items-center justify-between">
            <span>
              {isVi
                ? `Chỉ báo Pi Cycle 2× 350DMA ($${piCycleTopTarget.toLocaleString()}) là mốc chốt lời chu kỳ, trong khi Trần Bong Bóng (Power Law) nằm tại $${powerLawBubbleTop.toLocaleString()}. Dư địa còn rất lớn.`
                : `Pi Cycle 2× 350DMA ($${piCycleTopTarget.toLocaleString()}) marks the profit-taking target, while Power Law Bubble Ceiling sits at $${powerLawBubbleTop.toLocaleString()}.`}
            </span>
            <span className="text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold ml-1">
              ↗
            </span>
          </p>
          {/* Tier 2: Failure Mode Disclosure */}
          <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04] text-[10px] font-mono text-slate-400 leading-tight">
            <span className="text-amber-400/90 font-bold">{isVi ? '⚠️ Mô hình này sai khi:' : '⚠️ Model failure mode:'}</span>{' '}
            {isVi
              ? 'Thị trường tạo đỉnh hụt (như 10/2025 BTC giảm >30% khi 0/30 chỉ báo on-chain chạm đỉnh theo CoinGlass).'
              : 'Market undergoes stealth distributions (e.g. Oct 2025 >30% drop with 0/30 on-chain metrics triggered).'}
          </div>
        </div>
      </div>

      {/* 4. Leverage Health & Funding Rate (Binance Futures & CoinGlass) */}
      <div
        onClick={() => setInstitutionalModalOpen(true, 'coinglass')}
        className="group rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-amber-500/40 p-5 backdrop-blur-xl shadow-lg hover:shadow-amber-500/10 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between space-y-4 cursor-pointer"
        title={isVi ? 'Bấm để xem phương pháp luận Coinglass' : 'Click to view Coinglass methodology'}
      >
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 group-hover:text-amber-400 transition-colors">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>{isVi ? '4. Rủi Ro Đòn Bẩy (Phái Sinh)' : '4. Leverage & Funding'}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {isVi ? 'Cân Bằng' : 'Healthy'}
            </span>
          </div>

          <div>
            <div className="text-2xl font-black text-white tracking-tight font-mono">
              {fundingSign}{realFundingPct.toFixed(4)}% / 8h
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {isVi
                ? `Lãi suất vay quy năm: ${fundingSign}${annualizedRate}%/năm • Tâm lý F&G: ${fearGreedVal}/100`
                : `Annualized borrow: ${fundingSign}${annualizedRate}%/yr • F&G: ${fearGreedVal}/100`}
            </div>
          </div>

          {/* Simple Apple Visual Scale */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex relative">
              <div className="h-full bg-rose-500" style={{ width: '20%' }} />
              <div className="h-full bg-emerald-500" style={{ width: '60%' }} />
              <div className="h-full bg-rose-500" style={{ width: '20%' }} />
              <div
                className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-lg"
                style={{ left: '52%' }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span className="text-slate-400">{isVi ? 'Bán Khống' : 'Short'}</span>
              <span className="text-emerald-400 font-bold">{isVi ? 'Cân Bằng' : 'Healthy'}</span>
              <span className="text-slate-400">{isVi ? 'Quá Nhiệt' : 'Euphoric'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t border-white/[0.06] pt-3">
          <p className="text-xs text-slate-300/90 leading-relaxed flex items-center justify-between">
            <span>
              {isVi
                ? `Thị trường phái sinh ở trạng thái cân bằng; rủi ro sập dây chuyền đòn bẩy tạm thời ở mức thấp.`
                : `Perpetuals are balanced; leverage cascade liquidation risks remain probabilistically low.`}
            </span>
            <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold ml-1">
              ↗
            </span>
          </p>
          {/* Tier 2: Failure Mode Disclosure */}
          <div className="p-2 rounded-xl bg-black/40 border border-white/[0.04] text-[10px] font-mono text-slate-400 leading-tight">
            <span className="text-amber-400/90 font-bold">{isVi ? '⚠️ Mô hình này sai khi:' : '⚠️ Model failure mode:'}</span>{' '}
            {isVi
              ? 'Xuất hiện giao dịch khối ngoài sổ lệnh (OTC block trades) hoặc thanh lý chéo stablecoin ngoài sàn phái sinh.'
              : 'Large off-exchange OTC blocks or cross-stablecoin depegs occurring outside public orderbooks.'}
          </div>
        </div>
      </div>
    </div>
  );
};
