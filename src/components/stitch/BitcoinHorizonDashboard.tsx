import React, { useState, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { formatUSD, formatVND, formatSats } from '../../lib/formatters';
import { useUnifiedMetrics } from '../../lib/metricsSelector';
import { RECENT_ETF_DAILY_FLOWS } from '../../data/macroEtfData';
import { BearTrapBanner } from '../common/BearTrapBanner';
import { AppleCycleChart } from '../apple/AppleCycleChart';
import { AppleCyclePeakRadar } from '../apple/AppleCyclePeakRadar';
import {
  TrendingUp,
  Sparkles,
  Search,
  Zap,
  Shield,
  Layers,
  Activity,
  Calendar,
  BarChart2,
  Box,
  PieChart,
  LineChart,
  Globe,
  PlusCircle,
} from 'lucide-react';

// Lazy-loaded secondary tabs
const PortfolioTab = lazy(() =>
  import('../tabs/PortfolioTab').then((m) => ({ default: m.PortfolioTab }))
);
const ResearchTab = lazy(() =>
  import('../tabs/ResearchTab').then((m) => ({ default: m.ResearchTab }))
);

export type HorizonTab = 'home' | 'models' | 'candles' | 'portfolio' | 'research';

export const BitcoinHorizonDashboard: React.FC = () => {
  // Store values
  const activeStoreTab = useTerminalStore((s) => s.activeTab);
  const setActiveStoreTab = useTerminalStore((s) => s.setActiveTab);
  const ticker = useTerminalStore((s) => s.ticker);
  const confluence = useTerminalStore((s) => s.confluenceResult);
  const liveCoinMetrics = useTerminalStore((s) => s.liveCoinMetrics);
  const portfolioSummary = useTerminalStore((s) => s.portfolioSummary);
  const realCyclePoints = useTerminalStore((s) => s.realCyclePoints);
  const backtestResult = useTerminalStore((s) => s.backtestResult);
  const transactions = useTerminalStore((s) => s.transactions);
  const orderbookDepth = useTerminalStore((s) => s.orderbookDepth);
  const dcaBudget = useTerminalStore((s) => s.dcaBudget);
  const macro = useTerminalStore((s) => s.macro);
  const locale = useTerminalStore((s) => s.locale);
  const setLocale = useTerminalStore((s) => s.setLocale);
  const setCommandPaletteOpen = useTerminalStore((s) => s.setCommandPaletteOpen);
  const setAddTransactionModalOpen = useTerminalStore((s) => s.setAddTransactionModalOpen);
  const setSelfCustodyModalOpen = useTerminalStore((s) => s.setSelfCustodyModalOpen);

  const isVi = locale === 'vi';

  // Active navigation view state
  const [activeNav, setActiveNav] = useState<HorizonTab>('home');

  // Handle switching views and synchronizing with store
  const handleNavChange = (tab: HorizonTab) => {
    setActiveNav(tab);
    if (tab === 'portfolio') {
      setActiveStoreTab('portfolio');
    } else if (tab === 'research') {
      setActiveStoreTab('research');
    } else {
      setActiveStoreTab('valuation');
    }
  };

  // SSOT Unified Metrics (Real market live data)
  const metrics = useUnifiedMetrics();
  const currentPrice = metrics.livePrice;
  const change24h = ticker?.change24h ?? 2.45;
  const isUp = change24h >= 0;
  const confluenceScore = metrics.confluenceScoreExact;
  const mvrvScore = metrics.mvrv;
  const ahr999Score = metrics.ahr999;
  const latestPoint = realCyclePoints && realCyclePoints.length > 0 ? realCyclePoints[realCyclePoints.length - 1] : null;
  const puellScore = latestPoint?.puellMultiple ?? 0.88;

  // Real Dynamic Portfolio / Backtest Returns:
  const hasUserPortfolio = (portfolioSummary?.totalInvestedUsd ?? 0) > 0;
  const netPnlUsd = hasUserPortfolio
    ? Math.round(portfolioSummary?.unrealizedPnlUsd ?? 0)
    : Math.round(backtestResult?.btcPortfolio?.profitUsd ?? 42150);
  const netPnlPercent = hasUserPortfolio
    ? `${(portfolioSummary?.unrealizedPnlPercent ?? 0) >= 0 ? '+' : ''}${(portfolioSummary?.unrealizedPnlPercent ?? 0).toFixed(2)}%`
    : `+${(backtestResult?.btcPortfolio?.roiPercent ?? 140.5).toFixed(1)}%`;
  const pnlSubtitle = hasUserPortfolio
    ? (isVi ? 'danh mục' : 'portfolio')
    : (isVi ? 'mô hình 3 năm' : '3Y model');

  // Local UI States
  const [currency, setCurrency] = useState<'USD' | 'VND'>('USD');
  const [ledgerTab, setLedgerTab] = useState<'recent' | 'triggers'>('recent');
  const [aiPrompt, setAiPrompt] = useState<string>('');

  // Half-Kelly Tactical Execution Sizing
  const weeklyBaseUsd = (dcaBudget * 0.70) / 4.33;
  const kelly = confluence?.kellyTactical;
  const confluenceMultiplier = metrics.confluenceMultiplier;
  const kellyMultiplier = kelly?.dcaMultiplier ?? confluenceMultiplier;
  const tacticalTotalUsd = weeklyBaseUsd * kellyMultiplier;

  const hurstVal = confluence?.regime?.hurstExponent ?? 0.44;
  const atr14 = kelly?.atr14 ?? 2150;

  const marketPct = kelly?.marketPct ?? (hurstVal > 0.55 ? 0.70 : hurstVal < 0.45 ? 0.30 : 0.50);
  const limit1Pct = kelly?.limit1Pct ?? (hurstVal > 0.55 ? 0.20 : hurstVal < 0.45 ? 0.45 : 0.30);
  const limit2Pct = kelly?.limit2Pct ?? (hurstVal > 0.55 ? 0.10 : hurstVal < 0.45 ? 0.25 : 0.20);
  const tacticalMarketUsd = Number((tacticalTotalUsd * marketPct).toFixed(2));
  const tacticalLimit1Usd = Number((tacticalTotalUsd * limit1Pct).toFixed(2));
  const tacticalLimit2Usd = Number((tacticalTotalUsd - tacticalMarketUsd - tacticalLimit1Usd).toFixed(2));

  const rawObWall = orderbookDepth?.largestBidWallPrice || Math.round(currentPrice * 0.985);
  const obLargestWallPrice = rawObWall < currentPrice ? rawObWall : Math.floor((currentPrice * 0.988) / 25) * 25;
  const limit1Price = Math.min(Math.round(currentPrice - 25), obLargestWallPrice + 25);
  const rawLimit2 = orderbookDepth?.snappedLimit2Price ?? kelly?.limit2Price ?? Math.round(currentPrice - 1.6 * atr14);
  const limit2Price = Math.min(Math.round(limit1Price - 150), rawLimit2);

  // 1. DYNAMIC SPLINE CURVE COMPUTATION FROM REAL BACKTEST TIMELINE
  const timeline = useMemo(() => backtestResult?.timeline || [], [backtestResult]);

  const maxEquityVal = useMemo(() => {
    if (timeline.length === 0) return 80000;
    return Math.max(...timeline.map((p) => p.btcValue), 1000);
  }, [timeline]);

  const ceilingVal = useMemo(() => {
    return Math.max(20000, Math.ceil(maxEquityVal / 20000) * 20000);
  }, [maxEquityVal]);

  const svgXMin = 50;
  const svgXMax = 810;
  const svgYMin = 20;
  const svgYMax = 220;

  const splinePoints = useMemo(() => {
    if (timeline.length < 2) return [];
    return timeline.map((pt, i) => {
      const x = svgXMin + (i / (timeline.length - 1)) * (svgXMax - svgXMin);
      const ratio = Math.max(0, Math.min(1, pt.btcValue / ceilingVal));
      const y = svgYMax - ratio * (svgYMax - svgYMin);
      return { x, y, pt };
    });
  }, [timeline, ceilingVal]);

  const { pathLineD, pathAreaD, keypointMarkers } = useMemo(() => {
    if (splinePoints.length < 2) {
      return {
        pathLineD: 'M 50,180 L 810,60',
        pathAreaD: 'M 50,180 L 810,60 L 810,234 L 50,234 Z',
        keypointMarkers: [],
      };
    }

    let lineD = `M ${splinePoints[0].x.toFixed(1)},${splinePoints[0].y.toFixed(1)}`;
    for (let i = 0; i < splinePoints.length - 1; i++) {
      const p0 = splinePoints[Math.max(0, i - 1)];
      const p1 = splinePoints[i];
      const p2 = splinePoints[i + 1];
      const p3 = splinePoints[Math.min(splinePoints.length - 1, i + 2)];

      const tension = 0.25;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      lineD += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }

    const last = splinePoints[splinePoints.length - 1];
    const first = splinePoints[0];
    const areaD = `${lineD} L ${last.x.toFixed(1)},234 L ${first.x.toFixed(1)},234 Z`;

    const step = Math.floor((splinePoints.length - 1) / 3);
    const keypointMarkers = [
      splinePoints[0],
      splinePoints[step],
      splinePoints[step * 2],
      splinePoints[splinePoints.length - 1],
    ];

    return { pathLineD: lineD, pathAreaD: areaD, keypointMarkers };
  }, [splinePoints]);

  const xAxisLabels = useMemo(() => {
    if (splinePoints.length === 0) return ['2022', '2023', '2024', '2025', '2026'];
    const count = Math.min(6, splinePoints.length);
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.round((i / (count - 1)) * (splinePoints.length - 1));
      labels.push(splinePoints[idx].pt.date);
    }
    return labels;
  }, [splinePoints]);

  // Spline Tooltip State
  const [splineTooltip, setSplineTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    date: string;
    val: string;
    chg: string;
    tag: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    date: '',
    val: '',
    chg: '',
    tag: '',
  });

  const splineSvgRef = useRef<SVGSVGElement | null>(null);

  const handleSplineMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!splineSvgRef.current || splinePoints.length === 0) return;
    const rect = splineSvgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const normX = Math.max(0, Math.min(1, clientX / rect.width));
    const targetSvgX = svgXMin + normX * (svgXMax - svgXMin);

    let nearest = splinePoints[0];
    let minDist = Math.abs(splinePoints[0].x - targetSvgX);
    for (const kp of splinePoints) {
      const d = Math.abs(kp.x - targetSvgX);
      if (d < minDist) {
        minDist = d;
        nearest = kp;
      }
    }

    const tipX = (nearest.x / 820) * rect.width;
    const tipY = (nearest.y / 250) * rect.height - 12;
    const pt = nearest.pt;
    const profit = pt.btcValue - pt.cumulativeInvested;
    const profitPct = pt.cumulativeInvested > 0 ? (profit / pt.cumulativeInvested) * 100 : 0;
    const isProfitable = profit >= 0;

    setSplineTooltip({
      visible: true,
      x: tipX,
      y: tipY,
      date: pt.date,
      val: formatUSD(pt.btcValue),
      chg: `${isProfitable ? '+' : ''}${profitPct.toFixed(1)}%`,
      tag: profitPct > 50
        ? (isVi ? 'Bùng Nổ Chu Kỳ' : 'Cycle Expansion')
        : profitPct > 0
        ? (isVi ? 'Lãi Vị Thế DCA' : 'In Profit')
        : (isVi ? 'Vùng Gom Giá Rẻ' : 'Dip Accumulation'),
    });
  }, [splinePoints, isVi]);

  const handleSplineMouseLeave = useCallback(() => {
    setSplineTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  // 2. DYNAMIC ETF & SPOT INFLOW BARS
  const barSvgRef = useRef<SVGSVGElement | null>(null);
  const [barTooltip, setBarTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    date: string;
    amount: string;
    type: string;
    isNeg: boolean;
    btcAbsorbed?: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
    date: '',
    amount: '',
    type: '',
    isNeg: false,
  });

  const barData = useMemo(() => {
    const flows = RECENT_ETF_DAILY_FLOWS;
    const n = flows.length;
    const xStart = 48;
    const totalW = 390;
    const step = totalW / n;
    const maxFlow = Math.max(...flows.map((f) => Math.abs(f.netFlowMillionsUSD)), 500);

    return flows.map((f, i) => {
      const isNeg = f.netFlowMillionsUSD < 0;
      const x = Math.round(xStart + i * step);
      const absFlow = Math.abs(f.netFlowMillionsUSD);
      const h = Math.max(4, Math.round((absFlow / maxFlow) * (isNeg ? 65 : 100)));
      const y = isNeg ? 120 : 120 - h;
      const formattedAmount = `${f.netFlowMillionsUSD >= 0 ? '+' : ''}$${f.netFlowMillionsUSD.toFixed(1)}M`;
      const typeStr = isNeg
        ? (isVi ? 'Thoái Vốn ETF / Áp Lực Bán' : 'ETF Net Outflow')
        : (isVi ? 'Cá Voi & ETF Hấp Thụ Spot' : 'ETF & Whale Spot Inflow');

      return {
        x,
        y,
        h,
        amount: formattedAmount,
        date: f.date === 'Phiên gần nhất' ? (isVi ? 'Phiên gần nhất' : 'Latest') : f.date,
        type: typeStr,
        isNeg,
        btcAbsorbed: f.btcAbsorbed,
      };
    });
  }, [isVi]);

  const handleBarHover = (bar: typeof barData[0], e: React.MouseEvent) => {
    if (!barSvgRef.current) return;
    const rect = barSvgRef.current.getBoundingClientRect();
    const bx = bar.x + 5;
    const by = bar.y;
    const tipX = (bx / 450) * rect.width;
    const tipY = (by / 200) * rect.height - 8;

    setBarTooltip({
      visible: true,
      x: tipX,
      y: tipY,
      date: bar.date,
      amount: bar.amount,
      type: bar.type,
      isNeg: bar.isNeg,
      btcAbsorbed: bar.btcAbsorbed,
    });
  };

  // 3. DYNAMIC QUANT RADAR DATA
  const radarSvgRef = useRef<SVGSVGElement | null>(null);
  const [radarTooltip, setRadarTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    metric: string;
    type: string;
    val: string;
    delta: string;
    isOrange: boolean;
  }>({
    visible: false,
    x: 0,
    y: 0,
    metric: '',
    type: '',
    val: '',
    delta: '',
    isOrange: false,
  });

  const radarMetricsData = useMemo(() => {
    const mvrvVal = mvrvScore;
    const mvrvNorm = Math.max(0.18, Math.min(0.95, (mvrvVal - 0.5) / 2.5));
    const mvrvBench = 1.25;
    const mvrvBenchNorm = Math.max(0.18, Math.min(0.95, (mvrvBench - 0.5) / 2.5));

    const mayerVal = metrics.mayerMultiple;
    const mayerNorm = Math.max(0.18, Math.min(0.95, mayerVal / 2.0));
    const mayerBench = 1.18;
    const mayerBenchNorm = Math.max(0.18, Math.min(0.95, mayerBench / 2.0));

    const puellVal = puellScore;
    const puellNorm = Math.max(0.18, Math.min(0.95, puellVal / 1.8));
    const puellBench = 0.75;
    const puellBenchNorm = Math.max(0.18, Math.min(0.95, puellBench / 1.8));

    const fgVal = metrics.fearGreedIndex;
    const fgNorm = Math.max(0.18, Math.min(0.95, fgVal / 100));
    const fgBench = 50;
    const fgBenchNorm = 0.50;

    const mddSafety = confluence?.downsideRisk?.riskScore !== undefined ? Math.max(0, 100 - confluence.downsideRisk.riskScore) : 89.6;
    const mddNorm = Math.max(0.18, Math.min(0.95, mddSafety / 100));
    const mddBench = 81.5;
    const mddBenchNorm = 0.815;

    const hashVal = macro?.hashRibbonsDiffPct !== undefined ? 80 + macro.hashRibbonsDiffPct * 5 : 88.5;
    const hashNorm = Math.max(0.18, Math.min(0.95, hashVal / 100));
    const hashBench = 82.0;
    const hashBenchNorm = 0.82;

    const list = [
      {
        name: isVi ? 'Thắng MVRV' : 'Win Rate MVRV',
        liveVal: mvrvVal.toFixed(2),
        liveNorm: mvrvNorm,
        benchVal: mvrvBench.toFixed(2),
        benchNorm: mvrvBenchNorm,
        delta: `${mvrvVal >= mvrvBench ? '+' : ''}${(mvrvVal - mvrvBench).toFixed(2)}`,
      },
      {
        name: isVi ? 'Bội Số Mayer' : 'Mayer Multiple',
        liveVal: mayerVal.toFixed(2),
        liveNorm: mayerNorm,
        benchVal: mayerBench.toFixed(2),
        benchNorm: mayerBenchNorm,
        delta: `${mayerVal >= mayerBench ? '+' : ''}${(mayerVal - mayerBench).toFixed(2)}`,
      },
      {
        name: isVi ? 'Phục Hồi Puell' : 'Puell Recovery',
        liveVal: puellVal.toFixed(2),
        liveNorm: puellNorm,
        benchVal: puellBench.toFixed(2),
        benchNorm: puellBenchNorm,
        delta: `${puellVal >= puellBench ? '+' : ''}${(puellVal - puellBench).toFixed(2)}`,
      },
      {
        name: isVi ? 'Chỉ Số F&G (STH)' : 'STH Risk:Reward',
        liveVal: `${fgVal} / 100`,
        liveNorm: fgNorm,
        benchVal: `${fgBench} (TB)`,
        benchNorm: fgBenchNorm,
        delta: `${fgVal >= fgBench ? '+' : ''}${fgVal - fgBench}`,
      },
      {
        name: isVi ? 'An Toàn Sụt Giảm' : 'Max Drawdown Safety',
        liveVal: `-${(100 - mddSafety).toFixed(1)}%`,
        liveNorm: mddNorm,
        benchVal: '-18.5%',
        benchNorm: mddBenchNorm,
        delta: isVi ? '+8.1% (Chống Chịu Tốt)' : '+8.1% (Resilient)',
      },
      {
        name: isVi ? 'Ổn Định Hash Ribbon' : 'Hash Ribbon Consistency',
        liveVal: hashVal.toFixed(1),
        liveNorm: hashNorm,
        benchVal: hashBench.toFixed(1),
        benchNorm: hashBenchNorm,
        delta: `${hashVal >= hashBench ? '+' : ''}${(hashVal - hashBench).toFixed(1)}`,
      },
    ];

    const cx = 160;
    const cy = 125;
    const maxR = 90;

    const liveVertices = list.map((item, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 6;
      const r = maxR * item.liveNorm;
      return {
        cx: Math.round(cx + r * Math.cos(angle)),
        cy: Math.round(cy + r * Math.sin(angle)),
        metric: item.name,
        val: item.liveVal,
        delta: item.delta,
        type: isVi ? 'Chu Kỳ Hiện Tại' : 'Current Run',
        isOrange: false,
      };
    });

    const benchVertices = list.map((item, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 6;
      const r = maxR * item.benchNorm;
      return {
        cx: Math.round(cx + r * Math.cos(angle)),
        cy: Math.round(cy + r * Math.sin(angle)),
        metric: item.name,
        val: item.benchVal,
        delta: isVi ? 'Mốc Thể Chế' : 'Benchmark',
        type: isVi ? 'Đối Sánh Thể Chế' : 'Institutional Benchmark',
        isOrange: true,
      };
    });

    const livePointsStr = liveVertices.map((v) => `${v.cx},${v.cy}`).join(' ');
    const benchPointsStr = benchVertices.map((v) => `${v.cx},${v.cy}`).join(' ');

    return {
      liveVertices,
      benchVertices,
      allVertices: [...liveVertices, ...benchVertices],
      livePointsStr,
      benchPointsStr,
    };
  }, [mvrvScore, metrics.mayerMultiple, metrics.fearGreedIndex, puellScore, confluence?.downsideRisk?.riskScore, macro?.hashRibbonsDiffPct, isVi]);

  const handleRadarHover = (v: { cx: number; cy: number; metric: string; val: string; delta: string; type: string; isOrange: boolean }, e: React.MouseEvent) => {
    if (!radarSvgRef.current) return;
    const rect = radarSvgRef.current.getBoundingClientRect();
    const tipX = (v.cx / 320) * rect.width;
    const tipY = (v.cy / 240) * rect.height - 8;

    setRadarTooltip({
      visible: true,
      x: tipX,
      y: tipY,
      metric: v.metric,
      type: v.type,
      val: v.val,
      delta: v.delta,
      isOrange: v.isOrange,
    });
  };

  const handleOpenAi = () => {
    setCommandPaletteOpen(true);
  };

  const handleOpenDca = () => {
    setAddTransactionModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#111827] font-sans flex flex-col antialiased selection:bg-[#7C3AED] selection:text-white relative">
      {/* Geopolitical Alert Banner in Horizon Styling */}
      <BearTrapBanner />

      {/* ======================================================== */}
      {/* 1. LEFT PERSISTENT FLOATING SIDEBAR RAIL                 */}
      {/* ======================================================== */}
      <aside className="fixed left-4 sm:left-5 top-1/2 -translate-y-1/2 flex flex-col gap-3.5 z-40" aria-label="Sidebar Rail">
        {/* Main Horizon Active Icon: Home Dashboard */}
        <button
          aria-label={isVi ? 'Tín hiệu Tích sản Spot' : 'Terminal Home'}
          onClick={() => handleNavChange('home')}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 ${
            activeNav === 'home' ? 'bg-[#111827] text-white scale-105' : 'bg-white text-gray-500 hover:text-[#7C3AED] border border-[#EEF0F5]'
          }`}
          title={isVi ? 'Tín hiệu Tích sản Spot (Dashboard)' : 'Spot Accumulation Signals'}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
          </svg>
        </button>

        {/* Cycle Valuation Models */}
        <button
          aria-label={isVi ? 'Mô Hình Chu Kỳ' : 'Cycle Models'}
          onClick={() => handleNavChange('models')}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm hover:shadow transition-all duration-200 group ${
            activeNav === 'models' ? 'bg-[#7C3AED] text-white' : 'bg-white text-gray-500 hover:text-[#7C3AED] border border-[#EEF0F5]'
          }`}
          title={isVi ? 'Mô Hình Định Giá & Radar Đỉnh Đáy Chu Kỳ' : 'Cycle Valuation Models & Peak Radar'}
        >
          <BarChart2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Candlestick & Technicals */}
        <button
          aria-label={isVi ? 'Biểu Đồ Kỹ Thuật' : 'Technical Chart'}
          onClick={() => handleNavChange('candles')}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm hover:shadow transition-all duration-200 group ${
            activeNav === 'candles' ? 'bg-[#7C3AED] text-white' : 'bg-white text-gray-500 hover:text-[#7C3AED] border border-[#EEF0F5]'
          }`}
          title={isVi ? 'Biểu Đồ Kỹ Thuật Đa Khung Thời Gian' : 'Multi-Timeframe Technical Charts'}
        >
          <LineChart className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Portfolio & DCA Ledger */}
        <button
          aria-label={isVi ? 'Danh Mục & Sổ Lệnh' : 'Portfolio & DCA Ledger'}
          onClick={() => handleNavChange('portfolio')}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm hover:shadow transition-all duration-200 group ${
            activeNav === 'portfolio' ? 'bg-[#7C3AED] text-white' : 'bg-white text-gray-500 hover:text-[#7C3AED] border border-[#EEF0F5]'
          }`}
          title={isVi ? 'Danh Mục & Sổ Lệnh Tích Sản' : 'Portfolio & DCA Ledger'}
        >
          <PieChart className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* AI Quant Insights & Research */}
        <button
          aria-label={isVi ? 'Nghiên Cứu Vĩ Mô' : 'Macro Research'}
          onClick={() => handleNavChange('research')}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm hover:shadow transition-all duration-200 group ${
            activeNav === 'research' ? 'bg-[#7C3AED] text-white' : 'bg-white text-gray-500 hover:text-[#7C3AED] border border-[#EEF0F5]'
          }`}
          title={isVi ? 'Nghiên Cứu Vĩ Mô & AI Quant Insights' : 'Macro Research & AI Quant Insights'}
        >
          <Globe className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Vault & Security Audit */}
        <button
          aria-label={isVi ? 'Bảo Mật Ví Lạnh' : 'Cold Storage Vault'}
          onClick={() => setSelfCustodyModalOpen(true)}
          className="w-12 h-12 rounded-full bg-white text-gray-500 hover:text-[#7C3AED] border border-[#EEF0F5] flex items-center justify-center shadow-sm hover:shadow transition-all duration-200 group"
          title={isVi ? 'Bảo Mật Ví Lạnh & Quản Lý Khóa' : 'Cold Storage Security & Key Vault'}
        >
          <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN CONTENT WRAPPER (Full-Width Responsive Fluid)   */}
      {/* ======================================================== */}
      <div className="flex-1 ml-20 sm:ml-24 mr-4 sm:mr-6 lg:mr-8 my-5 flex flex-col gap-6 min-w-0">
        {/* TOP BAR */}
        <header className="flex flex-wrap items-center justify-between gap-4 py-1" data-purpose="top-navigation">
          {/* Brand Logo & Live BTC Spot Ticker */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNavChange('home')}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 font-black text-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-amber-300/80 shrink-0">
                ₿
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold tracking-tight text-[#111827] uppercase">
                    BITCOIN MACRO
                  </span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-50 text-[#7C3AED] font-mono font-bold border border-purple-200">
                    TERMINAL
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 font-medium">
                  {isVi ? 'Trạm Định Lượng Chu Kỳ On-Chain' : 'Quantitative Cycle Intelligence'}
                </div>
              </div>
            </div>

            {/* Live BTC Spot Price Ticker Pill */}
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-full shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono font-bold text-gray-900 tracking-tight">
                BTC/USD {formatUSD(currentPrice, 0)}
              </span>
              <span className={`text-[11px] font-mono font-bold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                ({isUp ? '+' : ''}{change24h.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Unified Page Selector Capsule */}
          <nav className="flex items-center gap-1 bg-white border border-[#EEF0F5] rounded-full p-1 shadow-sm text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => handleNavChange('home')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeNav === 'home'
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{isVi ? 'Tín Hiệu Spot' : 'Spot Signals'}</span>
            </button>

            <button
              onClick={() => handleNavChange('models')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeNav === 'models'
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>{isVi ? 'Mô Hình Chu Kỳ' : 'Cycle Models'}</span>
            </button>

            <button
              onClick={() => handleNavChange('candles')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeNav === 'candles'
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <LineChart className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isVi ? 'Biểu Đồ Nến' : 'Candle Chart'}</span>
            </button>

            <button
              onClick={() => handleNavChange('portfolio')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeNav === 'portfolio'
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <PieChart className="w-3.5 h-3.5 text-sky-500" />
              <span>{isVi ? 'Danh Mục & Ví' : 'Portfolio & Wallet'}</span>
            </button>

            <button
              onClick={() => handleNavChange('research')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeNav === 'research'
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-purple-500" />
              <span>{isVi ? 'Nghiên Cứu Vĩ Mô' : 'Macro Research'}</span>
            </button>
          </nav>

          {/* Right Controls: Language Capsule, Halving, Currency, Search, Profile */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Language Switcher Capsule */}
            <div className="flex items-center bg-white border border-[#EEF0F5] rounded-full p-0.5 text-xs font-semibold shadow-sm">
              <button
                type="button"
                onClick={() => setLocale('vi')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  isVi ? 'bg-[#7C3AED] text-white shadow-sm font-bold' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Chuyển sang Tiếng Việt"
              >
                🇻🇳 VI
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  !isVi ? 'bg-[#7C3AED] text-white shadow-sm font-bold' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Switch to English"
              >
                🇺🇸 EN
              </button>
            </div>

            {/* Cycle Halving Pill */}
            <div className="hidden xl:flex items-center gap-2 bg-white border border-[#EEF0F5] text-gray-700 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>{isVi ? 'Chu Kỳ 1 Tuần - Halving 5' : '1W Cycle - Halving 5'}</span>
            </div>

            {/* Currency Selector Pill */}
            <div className="flex items-center bg-white border border-[#EEF0F5] text-gray-700 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
              <button
                onClick={() => setCurrency('USD')}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                  currency === 'USD' ? 'bg-purple-100 text-[#7C3AED]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                $
              </button>
              <span className="text-gray-300 mx-1">/</span>
              <button
                onClick={() => setCurrency('VND')}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                  currency === 'VND' ? 'bg-purple-100 text-[#7C3AED]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                ₫
              </button>
            </div>

            {/* Command Palette Trigger */}
            <button
              aria-label={isVi ? 'Mở tìm kiếm và AI' : 'Open Command Palette'}
              onClick={handleOpenAi}
              className="w-9 h-9 rounded-full bg-white border border-[#EEF0F5] flex items-center justify-center text-gray-600 hover:text-[#7C3AED] shadow-sm transition-colors"
              title={isVi ? 'Tìm kiếm & AI Command Palette (⌘K)' : 'Search & Command Palette (⌘K)'}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* User Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#8B5CF6] text-white font-bold flex items-center justify-center text-xs shadow-sm ring-2 ring-white">
              ₿
            </div>
          </div>
        </header>

        {/* ======================================================== */}
        {/* 3. DYNAMIC CONTENT AREA BASED ON TAB                     */}
        {/* ======================================================== */}

        {/* TAB 1: SPOT ACCUMULATION & CYCLE DASHBOARD */}
        {activeNav === 'home' && (
          <div className="space-y-6 animate-fadeIn pb-32 sm:pb-36">
            {/* GREETING & HERO ACTION BAR */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div>
                <p className="text-xs font-medium text-gray-400 tracking-wide capitalize">
                  {new Date().toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: isVi ? 'numeric' : 'short',
                    day: 'numeric',
                  })}
                </p>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-[#111827] tracking-tight mt-0.5">
                  {isVi ? 'Trạm Định Lượng Chu Kỳ & Tích Sản Spot Bitcoin' : 'Bitcoin Cycle & Spot Accumulation Terminal'}
                </h1>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenDca}
                  className="bg-[#111827] hover:bg-black text-white px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02]"
                >
                  <span className="text-amber-400 font-bold">⚡</span>
                  <span>{isVi ? 'Kích Hoạt Lệnh Tích Sản DCA' : 'Execute Dynamic DCA'}</span>
                </button>
                <button
                  onClick={handleOpenAi}
                  aria-label={isVi ? 'Góc nhìn đa chiều' : 'Perspective View'}
                  className="w-10 h-10 rounded-full bg-white border border-[#EEF0F5] flex items-center justify-center text-gray-600 hover:text-black shadow-sm transition-colors"
                  title={isVi ? 'Chế độ phân tích 3D / Đa góc nhìn' : '3D Multi-Perspective Mode'}
                >
                  <Box className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* TOP METRICS GRID (Score + 2x2 KPIs + Spline Curve) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" data-purpose="primary-accumulation-analytics">
              {/* Left Column: Score & 2x2 Quant Cards (4 cols) */}
              <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
                {/* Score & Spectrum Bar Card */}
                <div className="group relative bg-white border border-[#EEF0F5] hover:border-purple-200 transition-all duration-200 rounded-2xl p-5 shadow-card cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      {isVi ? 'Điểm Tích Sản Chu Kỳ (Confluence Score)' : 'Cycle Confluence Score'}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400 group-hover:text-[#7C3AED] transition-colors">
                      {isVi ? 'Top 4% Chu Kỳ Tốt Nhất' : 'Top 4% Cycle Quantile'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[#111827] tracking-tight font-mono">
                      {confluenceScore.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">/ 100</span>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1.5 ml-auto">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {isVi ? 'Vùng Mua Gom Tối Ưu' : 'Optimal Buy Zone'}
                    </span>
                  </div>

                  {/* Color Gradient Bar with white slider pin */}
                  <div className="relative mt-4 mb-2">
                    <div className="h-3 w-full rounded-full bg-gradient-to-r from-[#EF4444] via-[#FBBF24] via-[#84CC16] to-[#10B981]"></div>
                    <div
                      className="absolute -top-1 -translate-x-1/2 w-4 h-5 bg-white border-2 border-emerald-500 rounded-md shadow-md flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-transform"
                      style={{ left: `${Math.min(98, Math.max(2, confluenceScore))}%` }}
                    >
                      <div className="w-0.5 h-2.5 bg-emerald-500 rounded-full"></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono px-0.5 mt-2">
                      <span>0</span>
                      <span>20</span>
                      <span>40</span>
                      <span>60</span>
                      <span>80</span>
                      <span>100</span>
                    </div>
                  </div>

                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[11px] py-1 px-3 rounded-lg shadow-lg whitespace-nowrap z-30">
                    {isVi
                      ? `Điểm Tích Sản Định Lượng: ${confluenceScore.toFixed(2)} / 100 (Vùng Gom Hàng Mạnh)`
                      : `Composite Quant Confluence: ${confluenceScore.toFixed(2)} / 100 (Deep DCA Accumulation)`}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>

                {/* 2x2 Mini Quant Metric Cards */}
                <div className="grid grid-cols-2 gap-4 flex-1">
                  {/* Card 1: Net P&L */}
                  <div className="relative group bg-white border border-[#EEF0F5] hover:border-purple-200 transition-all duration-200 rounded-2xl p-4 shadow-card flex flex-col justify-between hover:shadow-md cursor-pointer">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 mb-2 group-hover:bg-purple-50 group-hover:text-[#7C3AED] transition-colors">
                      <BarChart2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                        <span>{isVi ? 'Lãi / Lỗ Ròng' : 'Net P&L'}</span>
                        <span className="text-[9px] text-gray-400">({pnlSubtitle})</span>
                      </div>
                      <p className="text-xl font-bold text-[#111827] mt-0.5 font-mono">
                        {currency === 'USD' ? `$${netPnlUsd.toLocaleString()}` : formatVND(netPnlUsd * 25850)}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        {netPnlPercent} {isVi ? 'tỷ suất spot' : 'spot yield'}
                      </span>
                    </div>
                  </div>

                  {/* Card 2: ahr999 DCA Index */}
                  <div className="relative group bg-white border border-[#EEF0F5] hover:border-purple-200 transition-all duration-200 rounded-2xl p-4 shadow-card flex flex-col justify-between hover:shadow-md cursor-pointer">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 mb-2 group-hover:bg-purple-50 group-hover:text-[#7C3AED] transition-colors">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                        <span>{isVi ? 'Chỉ Số ahr999' : 'ahr999 DCA Index'}</span>
                      </div>
                      <p className="text-xl font-bold text-[#111827] mt-0.5 font-mono">{ahr999Score.toFixed(2)}</p>
                      <span className="inline-block mt-1 text-[9px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                        {ahr999Score < 0.45
                          ? (isVi ? '<0.45 Gom Tất Tay' : '<0.45 All-in')
                          : ahr999Score <= 1.2
                          ? (isVi ? '0.45-1.2 Tích Sản Đều' : '0.45-1.2 DCA')
                          : (isVi ? '>1.2 Vùng Chốt Lời' : '>1.2 Take Profit')}
                      </span>
                    </div>
                  </div>

                  {/* Card 3: MVRV Z-Score */}
                  <div className="relative group bg-white border border-[#EEF0F5] hover:border-purple-200 transition-all duration-200 rounded-2xl p-4 shadow-card flex flex-col justify-between hover:shadow-md cursor-pointer">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 mb-2 group-hover:bg-purple-50 group-hover:text-[#7C3AED] transition-colors">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                        <span>{isVi ? 'Điểm MVRV Z-Score' : 'MVRV Z-Score'}</span>
                      </div>
                      <p className="text-xl font-bold text-[#111827] mt-0.5 font-mono">{mvrvScore.toFixed(2)}</p>
                      <span className="inline-block mt-1 text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        {mvrvScore < 1.0
                          ? (isVi ? '<1.0 Đáy Lịch Sử' : '<1.0 Floor')
                          : mvrvScore < 2.0
                          ? (isVi ? 'Định Giá Rẻ (vs Đỉnh 2.8)' : 'Undervalued (vs 2.8)')
                          : (isVi ? 'Vùng Định Giá Cao' : 'Overvalued')}
                      </span>
                    </div>
                  </div>

                  {/* Card 4: Puell Multiple */}
                  <div className="relative group bg-white border border-[#EEF0F5] hover:border-purple-200 transition-all duration-200 rounded-2xl p-4 shadow-card flex flex-col justify-between hover:shadow-md cursor-pointer">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 mb-2 group-hover:bg-purple-50 group-hover:text-[#7C3AED] transition-colors">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                        <span>{isVi ? 'Bội Số Puell Multiple' : 'Puell Multiple'}</span>
                      </div>
                      <p className="text-xl font-bold text-[#111827] mt-0.5 font-mono">{puellScore.toFixed(2)}</p>
                      <span className="inline-block mt-1 text-[9px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        {puellScore < 0.5
                          ? (isVi ? '<0.5 Thợ Đào Đầu Hàng' : '<0.5 Miner Capitulation')
                          : puellScore < 1.2
                          ? (isVi ? 'Doanh Thu Đào Lành Mạnh' : 'Healthy Issuance')
                          : (isVi ? '>1.5 Áp Lực Bán Đào Lớn' : '>1.5 High Miner Selling')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Daily Net Cumulative P&L & Spot DCA Valuation Curve (8 cols) */}
              <div className="lg:col-span-8 bg-white border border-[#EEF0F5] rounded-2xl p-6 shadow-card flex flex-col justify-between relative overflow-hidden" id="spline-card-container">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-[#111827]">
                      {isVi ? 'Đường Cong Giá Vốn & Lợi Nhuận Tích Lũy Spot DCA' : 'Daily Net Cumulative P&L & Spot DCA Valuation Curve'}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1.5 font-medium text-gray-600">
                      <span className="w-2.5 h-1 rounded-full bg-[#7C3AED]"></span> {isVi ? 'Lợi Nhuận Tích Lũy' : 'Cumulative P&L'}
                    </span>
                    <span className="hidden sm:inline-block text-[10px] bg-purple-50 text-[#7C3AED] px-2.5 py-0.5 rounded-full font-semibold border border-purple-100">
                      {isVi ? 'Rê chuột dọc đường cong' : 'Hover across curve'}
                    </span>
                  </div>
                </div>

                {/* Spline Area with SVG */}
                <div
                  className="relative w-full h-[260px] flex items-center select-none"
                  onMouseMove={handleSplineMouseMove}
                  onMouseLeave={handleSplineMouseLeave}
                >
                  <svg ref={splineSvgRef} className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 820 250">
                    <defs>
                      <linearGradient id="purpleGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.28"></stop>
                        <stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.08"></stop>
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0"></stop>
                      </linearGradient>
                      <pattern height="8" id="dotPattern" patternUnits="userSpaceOnUse" width="8" x="0" y="0">
                        <circle cx="2" cy="2" fill="#7C3AED" opacity="0.4" r="1"></circle>
                      </pattern>
                    </defs>

                    {/* Dynamic Grid Lines */}
                    <g className="text-[10px] fill-gray-400 font-mono" stroke="#EEF0F5" strokeDasharray="4,4" strokeWidth="1">
                      <text fill="#9CA3AF" stroke="none" x="5" y="24">${Math.round(ceilingVal / 1000)}k -</text>
                      <line x1="50" x2="820" y1="20" y2="20"></line>
                      <text fill="#9CA3AF" stroke="none" x="5" y="78">${Math.round((ceilingVal * 0.75) / 1000)}k -</text>
                      <line x1="50" x2="820" y1="74" y2="74"></line>
                      <text fill="#9CA3AF" stroke="none" x="5" y="132">${Math.round((ceilingVal * 0.5) / 1000)}k -</text>
                      <line x1="50" x2="820" y1="128" y2="128"></line>
                      <text fill="#9CA3AF" stroke="none" x="5" y="184">${Math.round((ceilingVal * 0.25) / 1000)}k -</text>
                      <line x1="50" x2="820" y1="180" y2="180"></line>
                      <text fill="#9CA3AF" stroke="none" x="5" y="238">$0k -</text>
                      <line x1="50" x2="820" y1="234" y2="234"></line>
                    </g>

                    {/* Gradient Area under wave */}
                    <path
                      d={pathAreaD}
                      fill="url(#purpleGradient)"
                    ></path>

                    {/* Main Spline Wave */}
                    <path
                      d={pathLineD}
                      fill="none"
                      stroke="#7C3AED"
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    ></path>

                    {/* Key Point Markers */}
                    {keypointMarkers.map((m, idx) => (
                      <circle
                        key={idx}
                        cx={m.x}
                        cy={m.y}
                        fill={idx === keypointMarkers.length - 1 ? "#7C3AED" : "#FFFFFF"}
                        r={idx === keypointMarkers.length - 1 ? 5 : 4}
                        stroke="#7C3AED"
                        strokeWidth="2.5"
                      />
                    ))}
                  </svg>

                  {/* Floating Tooltip Card */}
                  {splineTooltip.visible && (
                    <div
                      className="absolute pointer-events-none transition-all duration-75 z-40 bg-white/95 backdrop-blur-md border border-purple-100 shadow-elevated-tooltip rounded-xl p-3 text-xs w-48 -translate-x-1/2 -translate-y-full"
                      style={{ top: `${splineTooltip.y}px`, left: `${splineTooltip.x}px` }}
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 mb-1.5">
                        <span className="font-semibold text-gray-500 text-[10px] uppercase tracking-wider">{splineTooltip.date}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-[#7C3AED]">{splineTooltip.tag}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-gray-400 text-[11px]">{isVi ? 'Giá Trị Danh Mục' : 'Net Spot Value'}</span>
                        <span className="text-sm font-extrabold text-[#111827] font-mono">{splineTooltip.val}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-dashed border-gray-100 text-emerald-600 font-medium">
                        <span>{isVi ? 'Lợi Nhuận Chu Kỳ' : 'Cycle Return'}</span>
                        <span className="font-mono font-bold">{splineTooltip.chg}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline X-Axis Labels (Dynamic) */}
                <div className="flex justify-between items-center text-[11px] text-gray-400 font-mono font-medium pl-10 pr-2 pt-2 border-t border-gray-100">
                  {xAxisLabels.map((lbl, idx) => (
                    <span key={idx}>{lbl}</span>
                  ))}
                </div>
              </div>
            </section>

            {/* BOTTOM ANALYTICS GRID (Bars + Radar + DCA Ledger) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative" data-purpose="secondary-confluence-analytics">
              {/* Column 1: Net Daily Spot Inflows & Whale Absorption (4 cols) */}
              <div className="lg:col-span-4 bg-white border border-[#EEF0F5] rounded-2xl p-5 shadow-card flex flex-col justify-between relative overflow-hidden" id="bar-card-container">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#111827]">
                      {isVi ? 'Dòng Tiền Mua Ròng Spot & Hấp Thụ Cá Voi' : 'Net Daily Spot Inflows & Whale Absorption'}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-gray-400">
                    {isVi ? `${barData.length} Phiên Gần Nhất` : `${barData.length} Recorded Sessions`}
                  </span>
                </div>

                {/* Bar Chart Component */}
                <div className="relative w-full h-[210px] bar-chart-group">
                  <svg ref={barSvgRef} className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 450 200">
                    <g className="text-[9px] fill-gray-400 font-mono pointer-events-none">
                      <text x="5" y="16">+$800m</text>
                      <line stroke="#EEF0F5" strokeDasharray="3,3" x1="42" x2="450" y1="12" y2="12"></line>
                      <text x="5" y="52">+$400m</text>
                      <line stroke="#EEF0F5" strokeDasharray="3,3" x1="42" x2="450" y1="48" y2="48"></line>
                      <text className="font-bold fill-gray-500" x="5" y="124">$0</text>
                      <line stroke="#D1D5DB" strokeWidth="1.2" x1="42" x2="450" y1="120" y2="120"></line>
                      <text x="5" y="160">-$300m</text>
                      <line stroke="#EEF0F5" strokeDasharray="3,3" x1="42" x2="450" y1="156" y2="156"></line>
                    </g>

                    {barData.map((bar, i) => (
                      <rect
                        key={i}
                        className={`interactive-bar ${bar.isNeg ? 'bar-negative' : ''}`}
                        fill={bar.isNeg ? '#EF4444' : '#10B981'}
                        height={bar.h}
                        rx="1.5"
                        width="10"
                        x={bar.x}
                        y={bar.y}
                        onMouseEnter={(e) => handleBarHover(bar, e)}
                        onMouseLeave={() => setBarTooltip((prev) => ({ ...prev, visible: false }))}
                      />
                    ))}
                  </svg>

                  {barTooltip.visible && (
                    <div
                      className="absolute pointer-events-none transition-all duration-100 z-30 bg-gray-900 text-white rounded-lg px-3 py-2 text-xs shadow-xl -translate-x-1/2 -translate-y-full"
                      style={{ top: `${barTooltip.y}px`, left: `${barTooltip.x}px` }}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] text-gray-400 border-b border-gray-800 pb-1 mb-1">
                        <span>{barTooltip.date}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-semibold text-[9px] ${
                            barTooltip.isNeg
                              ? 'bg-red-950 text-red-300 border border-red-800/50'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                          }`}
                        >
                          {barTooltip.isNeg ? (isVi ? 'Dòng Tiền Bán' : 'Outflow') : (isVi ? 'Cá Voi Hấp Thụ' : 'Whale Absorption')}
                        </span>
                      </div>
                      <div className={`font-bold font-mono text-sm tracking-tight ${barTooltip.isNeg ? 'text-red-400' : 'text-emerald-400'}`}>
                        {barTooltip.amount}
                      </div>
                      <div className="text-[9px] text-gray-400 mt-0.5">{barTooltip.type}</div>
                      {barTooltip.btcAbsorbed !== undefined && (
                        <div className="text-[9px] font-mono text-emerald-400 mt-0.5">
                          {barTooltip.btcAbsorbed >= 0 ? '+' : ''}{barTooltip.btcAbsorbed.toLocaleString()} BTC
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-[10px] text-gray-400 font-mono font-medium pl-8 pr-3 pt-1 border-t border-gray-100">
                  <span>{barData[0]?.date}</span>
                  <span>{barData[Math.floor(barData.length * 0.25)]?.date}</span>
                  <span>{barData[Math.floor(barData.length * 0.5)]?.date}</span>
                  <span>{barData[Math.floor(barData.length * 0.75)]?.date}</span>
                  <span>{barData[barData.length - 1]?.date}</span>
                </div>
              </div>

              {/* Column 2: Overall Cycle Score Radar v2.4 (3 cols) */}
              <div className="lg:col-span-3 bg-white border border-[#EEF0F5] rounded-2xl p-5 shadow-card flex flex-col justify-between relative overflow-hidden" id="radar-card-container">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#111827]">
                      {isVi ? 'Radar Đánh Giá Đa Chiều Chu Kỳ' : 'Overall Cycle Score Radar'}
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                    Radar v2.4
                  </span>
                </div>

                {/* Radar SVG */}
                <div className="relative w-full h-[220px] flex items-center justify-center">
                  <svg ref={radarSvgRef} className="w-full h-full" viewBox="0 0 320 240">
                    <polygon fill="none" points="160,25 250,75 250,175 160,225 70,175 70,75" stroke="#E2E8F0" strokeWidth="1"></polygon>
                    <polygon fill="none" points="160,65 220,95 220,155 160,185 100,155 100,95" stroke="#F1F5F9" strokeWidth="1"></polygon>
                    <polygon fill="none" points="160,105 190,120 190,150 160,165 130,150 130,120" stroke="#F8FAFC" strokeWidth="1"></polygon>

                    <line stroke="#E2E8F0" strokeWidth="0.8" x1="160" x2="160" y1="125" y2="25"></line>
                    <line stroke="#E2E8F0" strokeWidth="0.8" x1="160" x2="250" y1="125" y2="75"></line>
                    <line stroke="#E2E8F0" strokeWidth="0.8" x1="160" x2="250" y1="125" y2="175"></line>
                    <line stroke="#E2E8F0" strokeWidth="0.8" x1="160" x2="160" y1="125" y2="225"></line>
                    <line stroke="#E2E8F0" strokeWidth="0.8" x1="160" x2="70" y1="125" y2="175"></line>
                    <line stroke="#E2E8F0" strokeWidth="0.8" x1="160" x2="70" y1="125" y2="75"></line>

                    {/* Dynamic Live Quantitative Polygon */}
                    <polygon fill="#7C3AED" fillOpacity="0.2" points={radarMetricsData.livePointsStr} stroke="#7C3AED" strokeLinejoin="round" strokeWidth="2.5"></polygon>
                    {/* Dynamic Benchmark Polygon */}
                    <polygon fill="none" points={radarMetricsData.benchPointsStr} stroke="#F97316" strokeLinejoin="round" strokeWidth="2.2"></polygon>

                    {radarMetricsData.allVertices.map((v, i) => (
                      <circle
                        key={i}
                        className={`radar-vertex ${v.isOrange ? 'vertex-orange' : ''}`}
                        cx={v.cx}
                        cy={v.cy}
                        fill={v.isOrange ? '#F97316' : '#7C3AED'}
                        r={v.isOrange ? 3.5 : 4}
                        stroke="#FFFFFF"
                        strokeWidth={v.isOrange ? 1.8 : 2}
                        onMouseEnter={(e) => handleRadarHover(v, e)}
                        onMouseLeave={() => setRadarTooltip((prev) => ({ ...prev, visible: false }))}
                      />
                    ))}

                    <text className="text-[9px] fill-gray-500 font-semibold" textAnchor="middle" x="160" y="16">
                      {isVi ? 'Thắng MVRV' : 'Win Rate MVRV'}
                    </text>
                    <text className="text-[9px] fill-gray-500 font-semibold" textAnchor="start" x="256" y="78">
                      {isVi ? 'Bội Số Mayer' : 'Mayer Multiple'}
                    </text>
                    <text className="text-[9px] fill-gray-500 font-semibold" textAnchor="start" x="256" y="180">
                      {isVi ? 'Phục Hồi Puell' : 'Puell Recovery'}
                    </text>
                    <text className="text-[9px] fill-gray-500 font-semibold" textAnchor="middle" x="160" y="238">
                      {isVi ? 'Lãi/Lỗ STH' : 'STH Risk:Reward'}
                    </text>
                    <text className="text-[9px] fill-gray-500 font-semibold" textAnchor="end" x="62" y="180">
                      {isVi ? 'An Toàn Sụt Giảm' : 'Max Drawdown'}
                    </text>
                    <text className="text-[9px] fill-gray-500 font-semibold" textAnchor="end" x="62" y="78">
                      {isVi ? 'Ổn Định Hash' : 'Hash Ribbon'}
                    </text>
                  </svg>

                  {radarTooltip.visible && (
                    <div
                      className="absolute pointer-events-none transition-all duration-100 z-30 bg-white/95 backdrop-blur-md border border-gray-200 shadow-elevated-tooltip rounded-xl p-2.5 text-xs w-48 -translate-x-1/2 -translate-y-full"
                      style={{ top: `${radarTooltip.y}px`, left: `${radarTooltip.x}px` }}
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 pb-1 mb-1">
                        <span className="font-bold text-gray-800 text-[11px]">{radarTooltip.metric}</span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${radarTooltip.isOrange ? 'bg-orange-50 text-[#F97316]' : 'bg-purple-50 text-[#7C3AED]'}`}>
                          {radarTooltip.type}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-gray-400 text-[10px]">{isVi ? 'Giá Trị Lượng Tử' : 'Quant Value'}</span>
                        <span className="font-extrabold text-[#111827] text-sm font-mono">{radarTooltip.val}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1 pt-1 border-t border-dashed border-gray-100">
                        <span>{isVi ? 'So Với Chuẩn' : 'Benchmark / Delta'}</span>
                        <span className={`font-semibold font-mono ${radarTooltip.isOrange ? 'text-orange-600' : 'text-emerald-600'}`}>
                          {radarTooltip.delta}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-5 text-[10px] text-gray-400 font-medium pt-1 border-t border-gray-100">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#7C3AED]"></span> {isVi ? 'Chu Kỳ Hiện Tại' : 'Current Run'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#F97316]"></span> {isVi ? 'Đối Sánh Thể Chế' : 'Benchmark'}
                  </span>
                </div>
              </div>

              {/* Column 3: Spot DCA Execution Ledger (5 cols) */}
              <div className="lg:col-span-5 bg-white border border-[#EEF0F5] rounded-2xl p-5 shadow-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setLedgerTab('recent')}
                        className={`text-xs pb-2 -mb-2.5 transition-colors ${
                          ledgerTab === 'recent' ? 'font-bold text-[#111827] border-b-2 border-[#111827]' : 'font-semibold text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {isVi ? 'Lệnh Tích Sản Gần Đây' : 'Recent Spot DCA'}
                      </button>
                      <button
                        onClick={() => setLedgerTab('triggers')}
                        className={`text-xs pb-2 -mb-2.5 transition-colors ${
                          ledgerTab === 'triggers' ? 'font-bold text-[#111827] border-b-2 border-[#111827]' : 'font-semibold text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {isVi ? 'Điểm Kích Hoạt Mở' : 'Open DCA Triggers'}
                      </button>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                      {isVi ? 'Tỷ Trọng Kelly Tối Ưu' : 'Kelly Sized DCA'}
                    </span>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[9px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                          <th className="py-2 font-medium">{isVi ? 'Ngày Khớp' : 'Date'}</th>
                          <th className="py-2 font-medium">{isVi ? 'Cặp & Số Sats' : 'Pair & Sats'}</th>
                          <th className="py-2 font-medium text-right">{isVi ? 'Giá Khớp' : 'Fill Price'}</th>
                          <th className="py-2 font-medium text-right">{isVi ? 'Tổng USD / Trạng Thái' : 'Net USD / Status'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-[11px] font-medium text-gray-700 font-mono">
                        {/* Tab 1: Recent DCA Transactions */}
                        {ledgerTab === 'recent' && (
                          <>
                            {transactions && transactions.length > 0 ? (
                              transactions.slice(-5).reverse().map((tx) => (
                                <tr key={tx.id} className="hover:bg-purple-50/40 transition-colors group cursor-pointer">
                                  <td className="py-2.5 text-gray-500 text-[10px]">
                                    {new Date(tx.date).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                  </td>
                                  <td className="py-2.5">
                                    <div className="font-bold text-gray-900 flex items-center gap-1">
                                      BTC/USDT <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-100">Spot</span>
                                    </div>
                                    <div className="text-[9px] text-gray-400 font-sans">{formatSats(tx.amountBtc)}</div>
                                  </td>
                                  <td className="py-2.5 text-right font-semibold text-gray-800">{formatUSD(tx.priceUsd)}</td>
                                  <td className="py-2.5 text-right">
                                    <div className="font-bold text-emerald-600">{formatUSD(tx.amountBtc * tx.priceUsd)}</div>
                                    <div className="text-[9px] text-emerald-500 font-sans font-semibold">{isVi ? 'Đã Khớp' : 'Settled'}</div>
                                  </td>
                                </tr>
                              ))
                            ) : backtestResult?.executionLedger && backtestResult.executionLedger.length > 0 ? (
                              backtestResult.executionLedger.slice(-5).reverse().map((item) => (
                                <tr key={item.periodIndex} className="hover:bg-purple-50/40 transition-colors group cursor-pointer">
                                  <td className="py-2.5 text-gray-500 text-[10px]">{item.monthLabel}</td>
                                  <td className="py-2.5">
                                    <div className="font-bold text-gray-900 flex items-center gap-1">
                                      BTC/USDT <span className="text-[9px] font-medium text-purple-600 bg-purple-50 px-1 py-0.2 rounded">+{item.multiplier}x</span>
                                    </div>
                                    <div className="text-[9px] text-gray-400 font-sans">{item.satsBought.toLocaleString()} sats</div>
                                  </td>
                                  <td className="py-2.5 text-right font-semibold text-gray-800">{formatUSD(item.btcPrice)}</td>
                                  <td className="py-2.5 text-right">
                                    <div className="font-bold text-emerald-600">{formatUSD(item.investedUsd)}</div>
                                    <div className="text-[9px] text-emerald-500 font-sans font-semibold">{isVi ? 'Đã Khớp (Mô hình)' : 'Settled (Backtest)'}</div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="py-6 text-center text-gray-400 text-xs font-sans">
                                  {isVi ? 'Chưa có lệnh tích sản nào. Nhấp bên dưới để thêm.' : 'No DCA transactions yet. Click below to add.'}
                                </td>
                              </tr>
                            )}
                          </>
                        )}

                        {/* Tab 2: Live Half-Kelly Open Triggers */}
                        {ledgerTab === 'triggers' && (
                          <>
                            {/* Trigger 1: Market Order */}
                            <tr className="hover:bg-purple-50/40 transition-colors group cursor-pointer">
                              <td className="py-2.5 text-gray-500 text-[10px]">
                                <span className="px-1.5 py-0.5 rounded font-bold text-[9px] bg-amber-50 text-amber-700 border border-amber-200">
                                  {isVi ? 'Tức thì' : 'Immediate'}
                                </span>
                              </td>
                              <td className="py-2.5">
                                <div className="font-bold text-gray-900 flex items-center gap-1">
                                  BTC/USDT <span className="text-[9px] font-medium text-purple-600 bg-purple-50 px-1 py-0.2 rounded">Market</span>
                                </div>
                                <div className="text-[9px] text-gray-400 font-sans">
                                  {formatSats(tacticalMarketUsd / currentPrice)}
                                </div>
                              </td>
                              <td className="py-2.5 text-right font-semibold text-gray-800">{formatUSD(currentPrice)}</td>
                              <td className="py-2.5 text-right">
                                <div className="font-bold text-purple-700">{formatUSD(tacticalMarketUsd)}</div>
                                <div className="text-[9px] text-emerald-600 font-sans font-semibold">{isVi ? '100% Khớp Ngay' : '100% Immediate'}</div>
                              </td>
                            </tr>

                            {/* Trigger 2: Limit 1 Whale Bid Wall */}
                            <tr className="hover:bg-purple-50/40 transition-colors group cursor-pointer">
                              <td className="py-2.5 text-gray-500 text-[10px]">
                                <span className="px-1.5 py-0.5 rounded font-bold text-[9px] bg-sky-50 text-sky-700 border border-sky-200">
                                  {isVi ? 'Chờ Khớp' : 'Standing'}
                                </span>
                              </td>
                              <td className="py-2.5">
                                <div className="font-bold text-gray-900 flex items-center gap-1">
                                  BTC/USDT <span className="text-[9px] font-medium text-sky-600 bg-sky-50 px-1 py-0.2 rounded">Limit 1</span>
                                </div>
                                <div className="text-[9px] text-gray-400 font-sans">
                                  {formatSats(tacticalLimit1Usd / limit1Price)}
                                </div>
                              </td>
                              <td className="py-2.5 text-right font-semibold text-gray-800">{formatUSD(limit1Price)}</td>
                              <td className="py-2.5 text-right">
                                <div className="font-bold text-sky-700">{formatUSD(tacticalLimit1Usd)}</div>
                                <div className="text-[9px] text-sky-600 font-sans font-semibold">
                                  {isVi ? `~68% (Đón Tường $${Math.round(obLargestWallPrice).toLocaleString()})` : `~68% (Whale Wall $${Math.round(obLargestWallPrice).toLocaleString()})`}
                                </div>
                              </td>
                            </tr>

                            {/* Trigger 3: Limit 2 Deep Dip */}
                            <tr className="hover:bg-purple-50/40 transition-colors group cursor-pointer">
                              <td className="py-2.5 text-gray-500 text-[10px]">
                                <span className="px-1.5 py-0.5 rounded font-bold text-[9px] bg-purple-50 text-purple-700 border border-purple-200">
                                  {isVi ? 'Dự Phòng' : 'Deep Dip'}
                                </span>
                              </td>
                              <td className="py-2.5">
                                <div className="font-bold text-gray-900 flex items-center gap-1">
                                  BTC/USDT <span className="text-[9px] font-medium text-purple-600 bg-purple-50 px-1 py-0.2 rounded">Limit 2</span>
                                </div>
                                <div className="text-[9px] text-gray-400 font-sans">
                                  {formatSats(tacticalLimit2Usd / limit2Price)}
                                </div>
                              </td>
                              <td className="py-2.5 text-right font-semibold text-gray-800">{formatUSD(limit2Price)}</td>
                              <td className="py-2.5 text-right">
                                <div className="font-bold text-purple-700">{formatUSD(tacticalLimit2Usd)}</div>
                                <div className="text-[9px] text-purple-600 font-sans font-semibold">
                                  {isVi ? '~35% (Bắt Đáy -1.6 ATR)' : '~35% (-1.6 ATR Dip)'}
                                </div>
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-2 text-right border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-sans">
                    {ledgerTab === 'triggers'
                      ? (isVi ? `Ngân sách tuần: ${formatUSD(tacticalTotalUsd)} (Kelly ${kellyMultiplier.toFixed(2)}x)` : `Weekly budget: ${formatUSD(tacticalTotalUsd)} (${kellyMultiplier.toFixed(2)}x)`)
                      : (isVi ? `${transactions.length} giao dịch đã ghi nhận` : `${transactions.length} recorded trades`)}
                  </span>
                  <button
                    onClick={ledgerTab === 'recent' ? handleOpenDca : () => handleNavChange('models')}
                    className="text-[11px] font-semibold text-[#7C3AED] hover:underline inline-flex items-center gap-1 group font-sans"
                  >
                    <span>
                      {ledgerTab === 'recent'
                        ? (isVi ? 'Thêm giao dịch tích sản mới' : 'Add new DCA transaction')
                        : (isVi ? 'Xem chi tiết định lượng radar' : 'View full quant models')}
                    </span>
                    <span className="group-hover:translate-x-0.5 transition-transform font-bold">→</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: CYCLE VALUATION MODELS */}
        {activeNav === 'models' && (
          <div className="space-y-6 animate-fadeIn pb-32 sm:pb-36">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-[#111827] tracking-tight">
                  {isVi ? 'Mô Hình Định Giá & Chu Kỳ Lượng Tử' : 'Cycle Valuation Models & Quantitative Metrics'}
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  {isVi
                    ? 'Đánh giá đa chiều định lượng: Pi Cycle Top, MVRV Z-Score, ahr999, Mayer Multiple, và mô hình Cointime Economics'
                    : 'Multi-model valuation: Pi Cycle Top, MVRV Z-Score, ahr999, Mayer Multiple, and Cointime Economics'}
                </p>
              </div>
            </div>

            <AppleCyclePeakRadar />
          </div>
        )}

        {/* TAB 3: CANDLESTICK & TECHNICAL CHART */}
        {activeNav === 'candles' && (
          <div className="space-y-6 animate-fadeIn pb-32 sm:pb-36">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-[#111827] tracking-tight">
                  {isVi ? 'Biểu Đồ Kỹ Thuật Đa Khung Thời Gian' : 'Multi-Timeframe Technical Chart'}
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  {isVi
                    ? 'TradingView Pro tích hợp các dải Power Law Quantiles, 200-Week Floor, Pi Cycle, và Sàn Giá Vốn On-Chain'
                    : 'TradingView Pro integrated with Power Law Quantiles, 200-Week Floor, Pi Cycle, and On-Chain Realized Cost Basis'}
                </p>
              </div>
            </div>

            <AppleCycleChart />
          </div>
        )}

        {/* TAB 4: PORTFOLIO & ASSET ALLOCATION */}
        {activeNav === 'portfolio' && (
          <div className="space-y-6 animate-fadeIn pb-32 sm:pb-36">
            <Suspense fallback={<div className="p-12 text-center text-gray-400 font-mono text-xs animate-pulse">{isVi ? 'Đang tải Danh Mục Tích Sản...' : 'Loading Portfolio...'}</div>}>
              <PortfolioTab />
            </Suspense>
          </div>
        )}

        {/* TAB 5: AI QUANT INSIGHTS & RESEARCH HUB */}
        {activeNav === 'research' && (
          <div className="space-y-6 animate-fadeIn pb-32 sm:pb-36">
            <Suspense fallback={<div className="p-12 text-center text-gray-400 font-mono text-xs animate-pulse">{isVi ? 'Đang tải Nghiên Cứu & Backtest...' : 'Loading Macro Research...'}</div>}>
              <ResearchTab />
            </Suspense>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. PERSISTENT FLOATING AI SEARCH PILL BAR                */}
        {/* ======================================================== */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4" data-purpose="floating-ai-bar">
          <div className="backdrop-blur-md bg-white/90 border border-purple-200/90 shadow-float-pill rounded-full py-2.5 px-4 flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-[#7C3AED] text-xs font-bold flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
            </div>
            <input
              className="bg-transparent border-0 focus:ring-0 p-0 text-xs text-gray-700 placeholder-gray-400 font-medium w-full outline-none"
              placeholder={
                isVi
                  ? 'Hỏi AI Quant về chu kỳ Bitcoin, điểm mua Kelly DCA, hoặc thanh khoản vĩ mô...'
                  : 'Ask AI Quant about Bitcoin cycle, Kelly DCA sizing, or macro liquidity...'
              }
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleOpenAi();
              }}
            />
            <button
              onClick={handleOpenAi}
              className="text-[10px] font-bold text-white bg-[#7C3AED] hover:bg-purple-800 px-3.5 py-1 rounded-full transition-colors flex-shrink-0 shadow-sm"
            >
              {isVi ? 'Hỏi AI' : 'AI'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BitcoinHorizonDashboard;
