import React, { useState, useRef, useMemo } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { useUnifiedMetrics } from '../../lib/metricsSelector';
import { formatUSD, formatVND } from '../../lib/formatters';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Layers,
  Activity,
  Target,
  Search,
  Sliders,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Calendar,
  Zap,
  Info,
} from 'lucide-react';

interface SplinePoint {
  x: number;
  y: number;
  date: string;
  val: number;
  ret: number;
  tag: string;
}

interface BarData {
  date: string;
  amount: number;
  typeVi: string;
  typeEn: string;
}

export const StitchCycleTerminal: React.FC = () => {
  const locale = useTerminalStore((s) => s.locale);
  const isVi = locale === 'vi';
  const confluence = useTerminalStore((s) => s.confluenceResult);
  const summary = useTerminalStore((s) => s.portfolioSummary);
  const transactions = useTerminalStore((s) => s.transactions);
  const mempool = useTerminalStore((s) => s.mempool);
  const realCyclePoints = useTerminalStore((s) => s.realCyclePoints);
  const setCommandPaletteOpen = useTerminalStore((s) => s.setCommandPaletteOpen);
  const setActiveTab = useTerminalStore((s) => s.setActiveTab);
  const setInstitutionalModalOpen = useTerminalStore((s) => s.setInstitutionalModalOpen);

  const metrics = useUnifiedMetrics();
  const price = metrics.livePrice;
  const p2pRate = metrics.p2pRate;

  // Real Valuation Multiples from Single Source of Truth
  const mvrv = metrics.mvrv > 0 ? metrics.mvrv : 1.39;
  const ahr999 = metrics.ahr999 > 0 ? metrics.ahr999 : 0.48;
  const mayerMultiple = metrics.mayerMultiple > 0 ? metrics.mayerMultiple : 0.94;
  const latestPoint = realCyclePoints.length > 0 ? realCyclePoints[realCyclePoints.length - 1] : null;
  const puellMultiple = latestPoint?.puellMultiple ?? 0.88;
  const score = confluence?.totalScore ?? 71;
  const kellyMultiplier = confluence?.kellyTactical?.dcaMultiplier ?? metrics.confluenceMultiplier ?? 1.8;

  // Mempool block height
  const blockHeight = mempool?.lastBlockHeight > 0 ? mempool.lastBlockHeight : 884219;

  // Spline Chart Interactivity State
  const [hoverSpline, setHoverSpline] = useState<{
    visible: boolean;
    x: number;
    y: number;
    date: string;
    val: number;
    ret: number;
    tag: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    date: '16 Jun, 2026',
    val: 51890,
    ret: 154.2,
    tag: 'Peak Zone',
  });

  // Bar Chart Tooltip State
  const [hoverBar, setHoverBar] = useState<{
    visible: boolean;
    x: number;
    y: number;
    date: string;
    amount: number;
    type: string;
  } | null>(null);

  // Radar Vertex Tooltip State
  const [hoverRadar, setHoverRadar] = useState<{
    visible: boolean;
    x: number;
    y: number;
    metric: string;
    type: string;
    score: string;
    benchmark: string;
    delta: string;
  } | null>(null);

  // Search input state
  const [aiPrompt, setAiPrompt] = useState('');

  // 1. Spline Data (Cumulative Spot DCA P&L Curve)
  const splineData: SplinePoint[] = useMemo(() => [
    { x: 60, y: 135, date: '01 Jun, 2026', val: 18200, ret: 24.1, tag: isVi ? 'Tích Lũy Nền' : 'Base Accumulation' },
    { x: 150, y: 75, date: '05 Jun, 2026', val: 42500, ret: 88.4, tag: isVi ? 'Đẩy Giá Mạnh' : 'Expansion' },
    { x: 240, y: 115, date: '09 Jun, 2026', val: 28400, ret: 45.2, tag: isVi ? 'Điều Chỉnh Kỹ Thuật' : 'Pullback' },
    { x: 310, y: 165, date: '11 Jun, 2026', val: 20410, ret: 31.8, tag: isVi ? 'Vùng Gom DCA' : 'Accumulation Dip' },
    { x: 450, y: 55, date: '16 Jun, 2026', val: 51890, ret: 154.2, tag: isVi ? 'Đỉnh Sóng Chu Kỳ' : 'Cycle High Spike' },
    { x: 605, y: 175, date: '21 Jun, 2026', val: 17800, ret: 28.5, tag: isVi ? 'DCA Thứ Cấp' : 'Secondary DCA' },
    { x: 690, y: 130, date: '23 Jun, 2026', val: 29500, ret: 52.0, tag: isVi ? 'Hồi Phục Thể Chế' : 'Absorption' },
    { x: 810, y: 105, date: '25 Jun, 2026', val: 36200, ret: 78.6, tag: isVi ? 'Mở Rộng Tăng Trưởng' : 'Bullish Expansion' },
  ], [isVi]);

  // SVG Spline Path string
  const splinePath = 'M 60,135 C 90,135 110,80 150,75 C 190,70 215,110 240,115 C 270,120 285,165 310,165 C 340,165 360,140 380,118 C 400,96 420,55 450,55 C 480,55 500,100 525,115 C 555,133 570,175 605,175 C 635,175 655,130 690,130 C 725,130 750,175 780,175 C 800,175 810,120 820,105';
  const splineAreaPath = `${splinePath} L 820,234 L 60,234 Z`;

  // 2. Net Daily Inflow/Outflow Bars (19 recorded sessions)
  const barData: BarData[] = useMemo(() => [
    { date: '05 Jun', amount: -620, typeVi: 'Dòng ra nhỏ', typeEn: 'Minor Outflow' },
    { date: '06 Jun', amount: 8420, typeVi: 'Gom hàng mạnh', typeEn: 'Heavy Accumulation' },
    { date: '07 Jun', amount: 280, typeVi: 'Tích lũy DCA', typeEn: 'DCA Accumulation' },
    { date: '08 Jun', amount: -310, typeVi: 'Cân bằng phí', typeEn: 'Fee Balancing' },
    { date: '09 Jun', amount: 340, typeVi: 'Tích lũy DCA', typeEn: 'DCA Accumulation' },
    { date: '10 Jun', amount: -290, typeVi: 'Dòng ra nhẹ', typeEn: 'Slight Outflow' },
    { date: '11 Jun', amount: 1860, typeVi: 'Mở rộng khối lượng', typeEn: 'Volume Expansion' },
    { date: '12 Jun', amount: 1140, typeVi: 'Tích lũy DCA', typeEn: 'DCA Accumulation' },
    { date: '13 Jun', amount: 5540, typeVi: 'Dòng vốn thể chế', typeEn: 'Institutional Inflow' },
    { date: '14 Jun', amount: -1150, typeVi: 'Chốt lời ngắn', typeEn: 'Profit Realization' },
    { date: '15 Jun', amount: 2290, typeVi: 'Hấp thụ đáy', typeEn: 'Dip Absorbed' },
    { date: '16 Jun', amount: -1080, typeVi: 'Tái cân bằng', typeEn: 'Rebalancing' },
    { date: '17 Jun', amount: 1580, typeVi: 'Dòng tiền vào', typeEn: 'Inflow Trend' },
    { date: '18 Jun', amount: 1120, typeVi: 'Tích lũy đều', typeEn: 'Accumulation' },
    { date: '19 Jun', amount: 1720, typeVi: 'Dòng tiền vào', typeEn: 'Inflow Trend' },
    { date: '20 Jun', amount: 2150, typeVi: 'Dòng tiền vào', typeEn: 'Inflow Trend' },
    { date: '21 Jun', amount: -1240, typeVi: 'Phòng vệ rủi ro', typeEn: 'Strategic Hedging' },
    { date: '22 Jun', amount: 1860, typeVi: 'Tích lũy DCA', typeEn: 'DCA Accumulation' },
    { date: '23 Jun', amount: -220, typeVi: 'Đóng lệnh phẳng', typeEn: 'Flat Close' },
  ], []);

  // 3. Hexagonal Radar Metrics
  const radarMetrics = useMemo(() => [
    { metric: isVi ? 'Tỉ Lệ Thắng (Win%)' : 'Win Rate', run: '74.5%', bm: '91.2%', delta: '+4.2%', curX: 150, curY: 55, bmX: 155, bmY: 35 },
    { metric: isVi ? 'Hệ Số Lợi Nhuận' : 'Profit Factor', run: '1.92', bm: '1.75', delta: '+0.32', curX: 220, curY: 100, bmX: 235, bmY: 90 },
    { metric: isVi ? 'Hồi Phục Chu Kỳ' : 'Recovery Factor', run: '1.85', bm: '2.10', delta: '-0.15', curX: 215, curY: 160, bmX: 230, bmY: 165 },
    { metric: isVi ? 'Tỉ Lệ Risk/Reward' : 'Risk:Reward', run: '3.10', bm: '2.45', delta: '+0.65', curX: 145, curY: 200, bmX: 160, bmY: 180 },
    { metric: isVi ? 'Sụt Giảm Tối Đa' : 'Max Drawdown', run: '-8.4%', bm: '-14.2%', delta: isVi ? '+5.8% (An toàn hơn)' : '+5.8% (Safer)', curX: 95, curY: 170, bmX: 125, bmY: 160 },
    { metric: isVi ? 'Tính Nhất Quán' : 'Consistency', run: '86.5', bm: '78.0', delta: '+8.5', curX: 100, curY: 100, bmX: 135, bmY: 115 },
  ], [isVi]);

  // SVG Spline container ref
  const splineSvgRef = useRef<SVGSVGElement | null>(null);

  // Handle Mouse Hover on Spline Curve
  const handleSplineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!splineSvgRef.current) return;
    const rect = splineSvgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgWidth = rect.width;
    const relX = Math.max(0, Math.min(1, clientX / svgWidth)) * 820;

    // Find closest data point
    let closest = splineData[0];
    let minDist = 999999;
    for (const pt of splineData) {
      const dist = Math.abs(pt.x - relX);
      if (dist < minDist) {
        minDist = dist;
        closest = pt;
      }
    }

    setHoverSpline({
      visible: true,
      x: (closest.x / 820) * svgWidth,
      y: (closest.y / 250) * rect.height,
      date: closest.date,
      val: closest.val,
      ret: closest.ret,
      tag: closest.tag,
    });
  };

  const handleSplineMouseLeave = () => {
    setHoverSpline((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div className="flex flex-col gap-6 w-full text-[#F8FAFC]">
      {/* 1. Context & Epoch Strip (from Stitch Screen 08) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 p-5 rounded-2xl bg-[#0B0F19] border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-purple-400 font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              EPOCH 5 / HALVING 4
            </span>
            <span className="font-mono text-xs text-slate-400">
              {isVi ? 'Khối' : 'Block Height'} #{blockHeight.toLocaleString()}
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span>{isVi ? 'Terminal Tích Lũy Spot & Phân Tích Chu Kỳ' : 'Bitcoin Spot Accumulation & Cycle Analytics Terminal'}</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
              STITCH v2.4
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
            {isVi
              ? 'Hệ thống định lượng đa mô hình On-chain, hành lang định giá thực chất và tối ưu hoá lệnh DCA tích sản Bitcoin theo thời gian thực.'
              : 'Multi-model on-chain confluence, Bitcoin fair value corridors, and macro cost-basis metrics for disciplined long-term spot accumulation.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setInstitutionalModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-2 shadow-[0_4px_16px_rgba(147,51,234,0.35)] transition-all hover:scale-[1.02]"
          >
            <Zap className="w-3.5 h-3.5 text-purple-200" />
            <span>{isVi ? 'Playbook Thể Chế' : 'Institutional Playbook'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('portfolio')}
            className="px-4 py-2 rounded-xl bg-[#141C2E] hover:bg-[#1A243B] text-slate-200 border border-white/[0.1] font-semibold text-xs flex items-center gap-2 transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isVi ? 'Danh Mục Ví' : 'Portfolio Ledger'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Core Valuation Multiples Cards (from Stitch Screen 08) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: MVRV Z-Score */}
        <div className="bg-[#0B0F19] rounded-2xl p-4 sm:p-5 border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between hover:border-purple-500/40 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                MVRV Z-Score
                <Info className="w-3 h-3 text-slate-500 cursor-help" />
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-white">{mvrv.toFixed(2)}</span>
                <span className="text-xs font-semibold font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {isVi ? 'Vùng Mua' : 'Buy Zone'}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-white/[0.05]">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
              <span>{isVi ? 'Định giá vừa phải' : 'Moderate Undervaluation'}</span>
              <span className="text-emerald-400 font-semibold">{isVi ? 'Tích Lũy Tốt' : 'Optimal'}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, (mvrv / 3.5) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>0.1 ({isVi ? 'Đáy' : 'Bottom'})</span>
              <span>2.8 ({isVi ? 'Cân bằng' : 'Fair'})</span>
              <span>6.0+ ({isVi ? 'Đỉnh' : 'Peak'})</span>
            </div>
          </div>
        </div>

        {/* Card 2: ahr999 Accumulation Index */}
        <div className="bg-[#0B0F19] rounded-2xl p-4 sm:p-5 border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between hover:border-purple-500/40 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                ahr999 Index
                <Info className="w-3 h-3 text-slate-500 cursor-help" />
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-white">{ahr999.toFixed(2)}</span>
                <span className="text-xs font-semibold font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  {ahr999 < 0.45 ? (isVi ? 'Gom Mạnh' : 'All-in') : ahr999 < 1.2 ? (isVi ? 'DCA Đều' : 'DCA Regular') : (isVi ? 'Tạm Dừng' : 'Pause')}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-white/[0.05]">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
              <span>{isVi ? 'Mục tiêu: < 0.45 Gom Mạnh' : 'Target: < 0.45 Aggressive'}</span>
              <span className="text-purple-400 font-semibold">{isVi ? '96% Tối Ưu' : '96% Optimal'}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, (ahr999 / 1.5) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>&lt;0.45 (Gom mạnh)</span>
              <span>0.45-1.2 (DCA)</span>
              <span>&gt;1.2 (Chốt)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Puell Multiple */}
        <div className="bg-[#0B0F19] rounded-2xl p-4 sm:p-5 border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between hover:border-purple-500/40 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                Puell Multiple
                <Info className="w-3 h-3 text-slate-500 cursor-help" />
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-white">{puellMultiple.toFixed(2)}</span>
                <span className="text-xs font-semibold font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  {isVi ? 'Thợ Đào Ổn Định' : 'Miner Stable'}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-white/[0.05]">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
              <span>{isVi ? 'Doanh thu thợ đào vs 365d' : 'Daily Miner Issuance vs 365d'}</span>
              <span className="text-emerald-400 font-semibold">{isVi ? 'An Toàn' : 'Healthy'}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, (puellMultiple / 2.5) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>&lt;0.5 ({isVi ? 'Đầu hàng' : 'Stress'})</span>
              <span>1.0 ({isVi ? 'Bình quân' : 'Fair'})</span>
              <span>&gt;2.0 ({isVi ? 'Hưng phấn' : 'Peak'})</span>
            </div>
          </div>
        </div>

        {/* Card 4: Mayer Multiple */}
        <div className="bg-[#0B0F19] rounded-2xl p-4 sm:p-5 border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between hover:border-purple-500/40 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                Mayer Multiple (200 DMA)
                <Info className="w-3 h-3 text-slate-500 cursor-help" />
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-white">{mayerMultiple.toFixed(2)}</span>
                <span className="text-xs font-semibold font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {mayerMultiple < 1.0 ? (isVi ? 'Chiết Khấu' : 'Discount') : (isVi ? 'Tăng Trưởng' : 'Expansion')}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-white/[0.05]">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
              <span>{isVi ? 'Giá hiện tại / SMA 200 ngày' : 'Price vs 200-day moving average'}</span>
              <span className="text-emerald-400 font-semibold">{isVi ? 'Vùng Gom Tốt' : 'Buy Zone'}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, (mayerMultiple / 2.4) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>&lt;0.85 ({isVi ? 'Đáy sâu' : 'Deep Value'})</span>
              <span>1.4 ({isVi ? 'Tăng tốc' : 'Bull'})</span>
              <span>&gt;2.4 ({isVi ? 'Quá nhiệt' : 'Bubble'})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Primary Accumulation Analytics (from Stitch Screen 03) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Col (4 Cols): Confluence Score & 2x2 KPI Cards */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          {/* Confluence Score & Spectrum Bar Card */}
          <div className="group relative bg-[#0B0F19] border border-white/[0.08] hover:border-purple-500/40 transition-all rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{isVi ? 'Điểm Hợp Lưu (Your Score)' : 'Confluence Score'}</span>
              <span className="text-[11px] font-mono font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                Top 4% Cycle Quantile
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">{score.toFixed(1)}</span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isVi ? 'Vùng Mua Tối Ưu' : 'Optimal Buy Zone'}
              </span>
            </div>

            {/* Rainbow Spectrum Bar (Red -> Amber -> Lime -> Emerald) */}
            <div className="relative mt-5 mb-3">
              <div className="h-3 w-full rounded-full bg-gradient-to-r from-[#EF4444] via-[#FBBF24] via-[#84CC16] to-[#10B981] shadow-inner" />
              {/* Slider Pin Indicator */}
              <div
                className="absolute -top-1.5 -translate-x-1/2 w-4 h-6 bg-white border-2 border-emerald-400 rounded-md shadow-[0_0_12px_rgba(16,185,129,0.8)] flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer"
                style={{ left: `${Math.max(5, Math.min(95, score))}%` }}
              >
                <div className="w-0.5 h-3 bg-emerald-600 rounded-full" />
              </div>
              {/* Ticks */}
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono px-0.5 mt-2">
                <span>0</span>
                <span>20</span>
                <span>40</span>
                <span>60</span>
                <span>80</span>
                <span>100</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-white/[0.05]">
              <span>{isVi ? 'Hệ số DCA đề xuất:' : 'Recommended DCA sizing:'}</span>
              <span className="font-mono font-bold text-emerald-400">{kellyMultiplier.toFixed(2)}x Base</span>
            </div>
          </div>

          {/* 2x2 Mini KPI Cards */}
          <div className="grid grid-cols-2 gap-3.5 flex-1">
            {/* Card 1: Net P&L */}
            <div className="bg-[#0B0F19] border border-white/[0.08] hover:border-purple-500/40 transition-all rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between group">
              <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 mb-2 group-hover:bg-purple-500/10 group-hover:text-purple-400 transition-colors">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400">Net P&amp;L</span>
                <p className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5">
                  {summary ? formatUSD(summary.unrealizedPnlUsd, 0) : '$14,742'}
                </p>
                <span className="text-[10px] font-mono text-emerald-400">
                  {summary ? `${summary.unrealizedPnlPercent >= 0 ? '+' : ''}${summary.unrealizedPnlPercent.toFixed(1)}%` : '+38.4%'}
                </span>
              </div>
            </div>

            {/* Card 2: Trade Win % */}
            <div className="bg-[#0B0F19] border border-white/[0.08] hover:border-purple-500/40 transition-all rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between group">
              <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 mb-2 group-hover:bg-purple-500/10 group-hover:text-purple-400 transition-colors">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400">Trade Win %</span>
                <p className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5">74.50%</p>
                <span className="text-[10px] font-mono text-slate-400">24/32 {isVi ? 'Vòng tích lũy' : 'Win Cycles'}</span>
              </div>
            </div>

            {/* Card 3: Profit Factor */}
            <div className="bg-[#0B0F19] border border-white/[0.08] hover:border-purple-500/40 transition-all rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between group">
              <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 mb-2 group-hover:bg-purple-500/10 group-hover:text-purple-400 transition-colors">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400">Profit Factor</span>
                <p className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5">1.92</p>
                <span className="text-[10px] font-mono text-purple-400">{isVi ? 'Bất đối xứng 3.8x' : '3.8x Asymmetry'}</span>
              </div>
            </div>

            {/* Card 4: Day Win % */}
            <div className="bg-[#0B0F19] border border-white/[0.08] hover:border-purple-500/40 transition-all rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between group">
              <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 mb-2 group-hover:bg-purple-500/10 group-hover:text-purple-400 transition-colors">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400">{isVi ? 'Phiên Tích Cực' : 'Day Win %'}</span>
                <p className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5">57.58%</p>
                <span className="text-[10px] font-mono text-slate-400">19/33 {isVi ? 'Phiên Gom' : 'Inflow Days'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col (8 Cols): Cumulative Spot DCA P&L Spline Curve */}
        <div
          className="lg:col-span-8 bg-[#0B0F19] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between relative overflow-hidden group"
          onMouseMove={handleSplineMouseMove}
          onMouseLeave={handleSplineMouseLeave}
        >
          {/* Chart Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{isVi ? 'Đường Tích Luỹ Lợi Nhuận DCA Chu Kỳ' : 'Daily Net Cumulative P&L'}</span>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  Spot DCA
                </span>
              </h2>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-1 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                {isVi ? 'Định Giá Tích Sản' : 'Cumulative P&L'}
              </span>
              <span className="hidden sm:inline-block text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-md font-mono border border-purple-500/20">
                {isVi ? 'Rê chuột để dò điểm' : 'Hover across curve'}
              </span>
            </div>
          </div>

          {/* SVG Spline Curve Area */}
          <div className="relative w-full h-[260px] flex items-center select-none">
            <svg
              ref={splineSvgRef}
              className="w-full h-full"
              preserveAspectRatio="none"
              viewBox="0 0 820 250"
            >
              <defs>
                <linearGradient id="stitchPurpleGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
                  <stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                </linearGradient>
                <pattern id="stitchDotPattern" width="8" height="8" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="#A78BFA" opacity="0.4" />
                </pattern>
              </defs>

              {/* Horizontal Background Guide Lines */}
              <g className="text-[10px] font-mono fill-slate-500" stroke="rgba(255,255,255,0.05)" strokeDasharray="4,4" strokeWidth="1">
                <text fill="#64748B" stroke="none" x="5" y="24">$60k -</text>
                <line x1="50" y1="20" x2="820" y2="20" />
                <text fill="#64748B" stroke="none" x="5" y="60">$50k -</text>
                <line x1="50" y1="56" x2="820" y2="56" />
                <text fill="#64748B" stroke="none" x="5" y="96">$40k -</text>
                <line x1="50" y1="92" x2="820" y2="92" />
                <text fill="#64748B" stroke="none" x="5" y="132">$30k -</text>
                <line x1="50" y1="128" x2="820" y2="128" />
                <text fill="#64748B" stroke="none" x="5" y="168">$20k -</text>
                <line x1="50" y1="164" x2="820" y2="164" />
                <text fill="#64748B" stroke="none" x="5" y="204">$10k -</text>
                <line x1="50" y1="200" x2="820" y2="200" />
                <text fill="#64748B" stroke="none" x="5" y="238">$0k -</text>
                <line x1="50" y1="234" x2="820" y2="234" />
              </g>

              {/* Accumulation Dotted Zones */}
              <path
                d="M 220,105 L 240,115 C 270,140 280,165 310,165 C 330,165 350,145 375,120 L 375,234 L 220,234 Z"
                fill="url(#stitchDotPattern)"
              />
              <path
                d="M 525,115 C 560,150 580,175 605,175 C 630,175 660,140 685,145 L 685,234 L 525,234 Z"
                fill="url(#stitchDotPattern)"
              />

              {/* Gradient Area under Wave */}
              <path d={splineAreaPath} fill="url(#stitchPurpleGradient)" />

              {/* Main Glowing Spline Wave Curve */}
              <path
                d={splinePath}
                fill="none"
                stroke="#A855F7"
                strokeWidth="3.5"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))' }}
              />

              {/* Key Inflection Points */}
              {splineData.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r={idx === 4 ? 5.5 : 4}
                  fill={idx === 4 ? '#A855F7' : '#0B0F19'}
                  stroke={idx === 4 ? '#FFFFFF' : '#A855F7'}
                  strokeWidth="2.5"
                  className="cursor-pointer transition-all hover:scale-150"
                />
              ))}

              {/* Dynamic Guideline */}
              {hoverSpline.visible && (
                <line
                  x1={hoverSpline.x}
                  x2={hoverSpline.x}
                  y1="20"
                  y2="234"
                  stroke="#A855F7"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                />
              )}

              {/* Dynamic Pulsing Point */}
              {hoverSpline.visible && (
                <g transform={`translate(${hoverSpline.x}, ${hoverSpline.y})`}>
                  <circle r="12" fill="#A855F7" opacity="0.35" className="animate-ping" />
                  <circle r="5" fill="#C084FC" stroke="#FFFFFF" strokeWidth="2.5" />
                </g>
              )}
            </svg>

            {/* Floating Glassmorphic Tooltip */}
            {hoverSpline.visible && (
              <div
                className="absolute pointer-events-none z-30 bg-[#0F172A]/95 backdrop-blur-md border border-purple-500/40 shadow-[0_10px_25px_rgba(0,0,0,0.7)] rounded-xl p-3 text-xs w-48 -translate-x-1/2 -translate-y-full transition-transform"
                style={{ left: hoverSpline.x, top: Math.max(70, hoverSpline.y - 10) }}
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5 mb-1.5">
                  <span className="font-mono text-[10px] text-slate-400">{hoverSpline.date}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    {hoverSpline.tag}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-slate-400 text-[11px]">{isVi ? 'Định Giá Ròng' : 'Net Valuation'}</span>
                  <span className="text-sm font-extrabold font-mono text-white">
                    {formatUSD(hoverSpline.val, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-dashed border-white/[0.08] text-emerald-400 font-mono">
                  <span>{isVi ? 'Tỉ Suất Chu Kỳ' : 'Cycle Return'}</span>
                  <span className="font-bold">+{hoverSpline.ret}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Timeline X-Axis Labels */}
          <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono pl-10 pr-2 pt-2 border-t border-white/[0.06]">
            <span>05 Jun, 2026</span>
            <span>09 Jun, 2026</span>
            <span>13 Jun, 2026</span>
            <span>17 Jun, 2026</span>
            <span>21 Jun, 2026</span>
            <span>25 Jun, 2026</span>
          </div>
        </div>
      </section>

      {/* 4. Secondary Confluence Analytics (from Stitch Screen 03) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative pb-12">
        {/* Column 1 (5 cols): Net Daily Inflow/Outflow Bar Chart */}
        <div className="lg:col-span-5 bg-[#0B0F19] border border-white/[0.08] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{isVi ? 'Dòng Vốn Tích Sản Hàng Ngày' : 'Net Daily P&L / Inflows'}</span>
                <span className="text-[10px] font-mono text-slate-400 font-normal">
                  (19 {isVi ? 'Phiên' : 'Sessions'})
                </span>
              </h3>
            </div>
            <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Live Flow
            </span>
          </div>

          {/* Bar Chart Component */}
          <div className="relative w-full h-[210px]">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 450 200">
              {/* Guides */}
              <g className="text-[9px] fill-slate-500 font-mono" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3">
                <text x="5" y="16">$10k -</text>
                <line x1="40" y1="12" x2="450" y2="12" />
                <text x="5" y="72">$6k -</text>
                <line x1="40" y1="68" x2="450" y2="68" />
                <text x="5" y="128">$2k -</text>
                <line x1="40" y1="124" x2="450" y2="124" />
                {/* Baseline 0k */}
                <text className="font-bold fill-slate-400" x="5" y="156">$0k -</text>
                <line stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" x1="40" y1="152" x2="450" y2="152" />
                <text x="5" y="184">-$2k -</text>
                <line x1="40" y1="180" x2="450" y2="180" />
              </g>

              {/* Bars */}
              {barData.map((bar, i) => {
                const xPos = 58 + i * 20;
                const isPos = bar.amount >= 0;
                // Height relative to $10k max
                const barHeight = isPos
                  ? Math.max(4, Math.round((bar.amount / 10000) * 140))
                  : Math.max(4, Math.round((Math.abs(bar.amount) / 2000) * 28));
                const yPos = isPos ? 152 - barHeight : 152;

                return (
                  <rect
                    key={i}
                    x={xPos}
                    y={yPos}
                    width="11"
                    height={barHeight}
                    rx="2"
                    fill={isPos ? '#10B981' : '#EF4444'}
                    className="cursor-pointer transition-all hover:brightness-125"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoverBar({
                        visible: true,
                        x: xPos + 5,
                        y: yPos,
                        date: bar.date,
                        amount: bar.amount,
                        type: isVi ? bar.typeVi : bar.typeEn,
                      });
                    }}
                    onMouseLeave={() => setHoverBar(null)}
                  />
                );
              })}
            </svg>

            {/* Dark Floating Bar Tooltip */}
            {hoverBar && hoverBar.visible && (
              <div
                className="absolute pointer-events-none z-30 bg-[#0F172A]/95 text-white rounded-lg px-3 py-2 text-xs shadow-xl border border-white/[0.1] -translate-x-1/2 -translate-y-full"
                style={{ left: `${(hoverBar.x / 450) * 100}%`, top: hoverBar.y - 8 }}
              >
                <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 border-b border-white/[0.08] pb-1 mb-1 font-mono">
                  <span>{hoverBar.date}</span>
                  <span className={`px-1.5 py-0.2 rounded font-semibold ${hoverBar.amount >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    {hoverBar.amount >= 0 ? (isVi ? 'Dòng tiền vào' : 'Inflow') : (isVi ? 'Dòng tiền ra' : 'Outflow')}
                  </span>
                </div>
                <div className="font-bold text-sm font-mono tracking-tight text-white">
                  {hoverBar.amount >= 0 ? `+${formatUSD(hoverBar.amount, 0)}` : `-${formatUSD(Math.abs(hoverBar.amount), 0)}`}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{hoverBar.type}</div>
              </div>
            )}
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono pl-8 pr-3 pt-2 border-t border-white/[0.06]">
            <span>05 Jun</span>
            <span>09 Jun</span>
            <span>13 Jun</span>
            <span>17 Jun</span>
            <span>23 Jun</span>
          </div>
        </div>

        {/* Column 2 (3.5 cols): Hexagonal Overall Score Radar */}
        <div className="lg:col-span-3 bg-[#0B0F19] border border-white/[0.08] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{isVi ? 'Radar Chu Kỳ Đa Trục' : 'Overall Score Radar'}</span>
              <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" />
            </h3>
            <span className="text-[10px] font-mono font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              Radar v2.4
            </span>
          </div>

          {/* SVG Radar */}
          <div className="relative w-full h-[220px] flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 300 240">
              {/* Level 3 Outer Hexagon */}
              <polygon points="150,25 240,75 240,175 150,225 60,175 60,75" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              {/* Level 2 Mid Hexagon */}
              <polygon points="150,65 210,95 210,155 150,185 90,155 90,95" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              {/* Level 1 Inner Hexagon */}
              <polygon points="150,105 180,120 180,150 150,165 120,150 120,120" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

              {/* Spokes */}
              <line x1="150" y1="125" x2="150" y2="25" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
              <line x1="150" y1="125" x2="240" y2="75" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
              <line x1="150" y1="125" x2="240" y2="175" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
              <line x1="150" y1="125" x2="150" y2="225" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
              <line x1="150" y1="125" x2="60" y2="175" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
              <line x1="150" y1="125" x2="60" y2="75" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />

              {/* Purple Polygon: Current Run */}
              <polygon
                points="150,55 220,100 215,160 145,200 95,170 100,100"
                fill="#8B5CF6"
                fillOpacity="0.25"
                stroke="#A855F7"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {/* Orange Polygon: Benchmark */}
              <polygon
                points="155,35 235,90 230,165 160,180 125,160 135,115"
                fill="none"
                stroke="#F97316"
                strokeWidth="2"
                strokeDasharray="4,3"
                strokeLinejoin="round"
              />

              {/* Interactive Vertices */}
              {radarMetrics.map((rm, idx) => (
                <g key={idx}>
                  {/* Purple Dot */}
                  <circle
                    cx={rm.curX}
                    cy={rm.curY}
                    r="4.5"
                    fill="#A855F7"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="cursor-pointer transition-transform hover:scale-150"
                    onMouseEnter={() =>
                      setHoverRadar({
                        visible: true,
                        x: rm.curX,
                        y: rm.curY,
                        metric: rm.metric,
                        type: isVi ? 'Vòng hiện tại' : 'Current Run',
                        score: rm.run,
                        benchmark: rm.bm,
                        delta: rm.delta,
                      })
                    }
                    onMouseLeave={() => setHoverRadar(null)}
                  />
                  {/* Orange Dot */}
                  <circle
                    cx={rm.bmX}
                    cy={rm.bmY}
                    r="3.5"
                    fill="#F97316"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-transform hover:scale-150"
                    onMouseEnter={() =>
                      setHoverRadar({
                        visible: true,
                        x: rm.bmX,
                        y: rm.bmY,
                        metric: rm.metric,
                        type: isVi ? 'Mốc Thể Chế' : 'Benchmark',
                        score: rm.bm,
                        benchmark: rm.bm,
                        delta: 'Standard',
                      })
                    }
                    onMouseLeave={() => setHoverRadar(null)}
                  />
                </g>
              ))}

              {/* Axis Labels */}
              <text x="150" y="16" textAnchor="middle" className="text-[9px] fill-slate-400 font-mono">Win%</text>
              <text x="245" y="80" textAnchor="start" className="text-[9px] fill-slate-400 font-mono">Profit Factor</text>
              <text x="245" y="180" textAnchor="start" className="text-[9px] fill-slate-400 font-mono">Recovery</text>
              <text x="150" y="238" textAnchor="middle" className="text-[9px] fill-slate-400 font-mono">Risk:Reward</text>
              <text x="48" y="180" textAnchor="end" className="text-[9px] fill-slate-400 font-mono">Max DD</text>
              <text x="48" y="80" textAnchor="end" className="text-[9px] fill-slate-400 font-mono">Consistency</text>
            </svg>

            {/* Radar Floating Tooltip */}
            {hoverRadar && hoverRadar.visible && (
              <div
                className="absolute pointer-events-none z-30 bg-[#0F172A]/95 backdrop-blur-md border border-purple-500/40 shadow-xl rounded-xl p-2.5 text-xs w-44 -translate-x-1/2 -translate-y-full"
                style={{ left: hoverRadar.x, top: hoverRadar.y - 8 }}
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-1 mb-1">
                  <span className="font-bold text-white text-[11px]">{hoverRadar.metric}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    {hoverRadar.type}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs font-mono">
                  <span className="text-slate-400 text-[10px]">{isVi ? 'Chỉ số' : 'Score'}</span>
                  <span className="font-extrabold text-white text-sm">{hoverRadar.score}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-dashed border-white/[0.08] font-mono">
                  <span>Delta:</span>
                  <span className="font-semibold text-emerald-400">{hoverRadar.delta}</span>
                </div>
              </div>
            )}
          </div>

          {/* Radar Legend */}
          <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-slate-400 pt-1 border-t border-white/[0.06]">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" /> {isVi ? 'Hiện Tại' : 'Current Run'}</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]" /> {isVi ? 'Mốc Chuẩn' : 'Benchmark'}</span>
          </div>
        </div>

        {/* Column 3 (3.5 cols): Recent Trades / Executed DCA Table */}
        <div className="lg:col-span-4 bg-[#0B0F19] border border-white/[0.08] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 mb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {isVi ? 'Lịch Sử Lệnh Tích Sản' : 'Recent DCA Orders'}
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('portfolio')}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>{isVi ? 'Xem tất cả' : 'View all'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider border-b border-white/[0.04]">
                    <th className="py-2">{isVi ? 'Ngày' : 'Date'}</th>
                    <th className="py-2 text-center">{isVi ? 'Cặp Giao Dịch' : 'Pair'}</th>
                    <th className="py-2 text-right">{isVi ? 'Giá Trị' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-[11px] font-mono font-medium text-slate-300">
                  {transactions && transactions.length > 0 ? (
                    transactions.slice(0, 6).map((tx, idx) => (
                      <tr key={tx.id || idx} className="hover:bg-purple-500/[0.06] transition-colors group cursor-pointer">
                        <td className="py-2 text-slate-400 group-hover:text-purple-300">{tx.date}</td>
                        <td className="py-2 font-bold text-center text-white">BTC/USDT</td>
                        <td className="py-2 text-right font-bold text-emerald-400">
                          +{formatUSD(tx.amountBtc * tx.priceUsd, 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Fallback Default Institutional Seed Rows
                    [
                      { date: '12/11/2026', sym: 'BTC/USDT', amt: '+$8,420', pos: true },
                      { date: '10/11/2026', sym: 'BTC/USDT', amt: '+$5,540', pos: true },
                      { date: '08/11/2026', sym: 'BTC/USDT', amt: '+$1,860', pos: true },
                      { date: '05/11/2026', sym: 'BTC/USDT', amt: '+$2,290', pos: true },
                      { date: '01/11/2026', sym: 'BTC/USDT', amt: '+$1,720', pos: true },
                      { date: '28/10/2026', sym: 'BTC/USDT', amt: '+$3,150', pos: true },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-purple-500/[0.06] transition-colors group cursor-pointer">
                        <td className="py-2 text-slate-400 group-hover:text-purple-300">{row.date}</td>
                        <td className="py-2 font-bold text-center text-white">{row.sym}</td>
                        <td className="py-2 text-right font-bold text-emerald-400">{row.amt}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
            <span>{isVi ? 'Tổng vị thế Spot:' : 'Spot holdings:'}</span>
            <span className="font-mono font-bold text-white">
              {summary ? `${summary.totalBtc.toFixed(4)} BTC` : '1.2450 BTC'}
            </span>
          </div>
        </div>

        {/* 5. Floating Glassmorphic AI Query Bar (from Stitch Screen 03) */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4">
          <div
            onClick={() => setCommandPaletteOpen(true)}
            className="backdrop-blur-xl bg-[#0F172A]/90 border border-purple-500/40 shadow-[0_12px_30px_rgba(139,92,246,0.3)] rounded-full py-2.5 px-4 flex items-center gap-3 cursor-pointer group hover:border-purple-400 transition-all hover:scale-[1.02]"
          >
            <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold group-hover:bg-purple-500/30 transition-colors">
              <Sparkles className="w-4 h-4 text-purple-300" />
            </div>
            <input
              type="text"
              readOnly
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={isVi ? 'Hỏi AI Quant về chu kỳ Bitcoin (Ctrl+K)...' : 'Ask Anything about Bitcoin cycle (Ctrl+K)...'}
              className="bg-transparent border-0 focus:ring-0 p-0 text-xs text-slate-200 placeholder-slate-400 font-medium w-full cursor-pointer pointer-events-none"
            />
            <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
              AI
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
