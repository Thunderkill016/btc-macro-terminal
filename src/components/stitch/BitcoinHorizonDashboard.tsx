import React, { useState, useRef, useCallback, Suspense, lazy } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { formatUSD, formatVND } from '../../lib/formatters';
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
  const locale = useTerminalStore((s) => s.locale);
  const setCommandPaletteOpen = useTerminalStore((s) => s.setCommandPaletteOpen);
  const setAddTransactionModalOpen = useTerminalStore((s) => s.setAddTransactionModalOpen);
  const setBinanceModalOpen = useTerminalStore((s) => s.setBinanceModalOpen);
  const setSelfCustodyModalOpen = useTerminalStore((s) => s.setSelfCustodyModalOpen);

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

  // Fallbacks & formatted values
  const currentPrice = ticker?.price && ticker.price > 0 ? ticker.price : 75790;
  const change24h = ticker?.change24h ?? 2.45;
  const isUp = change24h >= 0;
  const confluenceScore = confluence?.totalScoreExact ?? 80.75;
  const mvrvScore = liveCoinMetrics?.mvrv ?? 1.39;
  const ahr999Score = 0.48;
  const puellScore = 0.88;
  const mayerScore = 1.34;
  const netPnlUsd = portfolioSummary?.unrealizedPnlUsd ? Math.round(portfolioSummary.unrealizedPnlUsd) : 14742;
  const netPnlPercent = portfolioSummary?.unrealizedPnlPercent ? `${portfolioSummary.unrealizedPnlPercent.toFixed(2)}%` : '+31.79%';

  // Local UI States
  const [currency, setCurrency] = useState<'USD' | 'VND'>('USD');
  const [ledgerTab, setLedgerTab] = useState<'recent' | 'triggers'>('recent');
  const [aiPrompt, setAiPrompt] = useState<string>('');

  // 1. Spline Curve Interactive Tooltip State
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
    date: '16 Jun, 2026',
    val: '$67,490.00',
    chg: '+184.2%',
    tag: 'Peak Zone',
  });

  // 2. Bar Chart Interactive Tooltip State
  const [barTooltip, setBarTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    date: string;
    amount: string;
    type: string;
    isNeg: boolean;
  }>({
    visible: false,
    x: 0,
    y: 0,
    date: '06 Jun, 2026',
    amount: '+$8,450k',
    type: 'Whale Spot Absorption',
    isNeg: false,
  });

  // 3. Radar Chart Interactive Tooltip State
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
    metric: 'Win Rate MVRV',
    type: 'Current Run',
    val: '1.39',
    delta: '+0.14',
    isOrange: false,
  });

  const splineSvgRef = useRef<SVGSVGElement | null>(null);
  const barSvgRef = useRef<SVGSVGElement | null>(null);
  const radarSvgRef = useRef<SVGSVGElement | null>(null);

  // Spline mouse move handler
  const handleSplineMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!splineSvgRef.current) return;
    const rect = splineSvgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgWidth = rect.width;
    const normX = Math.max(0, Math.min(1, clientX / svgWidth));
    const targetSvgX = normX * 820;

    const keypoints = [
      { x: 60, y: 135, date: '05 Jun, 2026', val: '$14,200.00', chg: '+12.4%', tag: 'DCA Accumulation' },
      { x: 150, y: 75, date: '09 Jun, 2026', val: '$28,400.00', chg: '+38.5%', tag: 'Local High' },
      { x: 310, y: 165, date: '11 Jun, 2026', val: '$25,710.00', chg: '+42.8%', tag: 'Cycle Dip Buy' },
      { x: 450, y: 55, date: '16 Jun, 2026', val: '$67,490.00', chg: '+184.2%', tag: 'Peak Zone' },
      { x: 605, y: 175, date: '21 Jun, 2026', val: '$22,180.00', chg: '+31.5%', tag: 'Secondary DCA' },
      { x: 810, y: 105, date: '25 Jun, 2026', val: '$44,820.00', chg: '+115.6%', tag: 'Macro Expansion' },
    ];

    let nearest = keypoints[0];
    let minDist = Math.abs(keypoints[0].x - targetSvgX);
    for (const kp of keypoints) {
      const d = Math.abs(kp.x - targetSvgX);
      if (d < minDist) {
        minDist = d;
        nearest = kp;
      }
    }

    const tipX = (nearest.x / 820) * rect.width;
    const tipY = (nearest.y / 250) * rect.height - 12;

    setSplineTooltip({
      visible: true,
      x: tipX,
      y: tipY,
      date: nearest.date,
      val: nearest.val,
      chg: nearest.chg,
      tag: nearest.tag,
    });
  }, []);

  const handleSplineMouseLeave = useCallback(() => {
    setSplineTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  // Spot Bar Data (19 Sessions)
  const barData = [
    { x: 58, y: 120, h: 24, amount: '-$1,820k', date: '05 Jun, 2026', type: 'Exchange Inflow Dump', isNeg: true },
    { x: 78, y: 22, h: 98, amount: '+$8,450k', date: '06 Jun, 2026', type: 'Whale Spot Absorption', isNeg: false },
    { x: 98, y: 102, h: 18, amount: '+$1,450k', date: '07 Jun, 2026', type: 'Retail DCA Inflow', isNeg: false },
    { x: 118, y: 120, h: 12, amount: '-$850k', date: '08 Jun, 2026', type: 'Miner Treasury Outflow', isNeg: true },
    { x: 138, y: 96, h: 24, amount: '+$1,920k', date: '09 Jun, 2026', type: 'Institutional DCA', isNeg: false },
    { x: 158, y: 120, h: 9, amount: '-$640k', date: '10 Jun, 2026', type: 'Spot Profit Taking', isNeg: true },
    { x: 178, y: 62, h: 58, amount: '+$4,820k', date: '11 Jun, 2026', type: 'ETF Net Accumulation', isNeg: false },
    { x: 198, y: 82, h: 38, amount: '+$3,100k', date: '12 Jun, 2026', type: 'Spot Absorption', isNeg: false },
    { x: 218, y: 36, h: 84, amount: '+$7,210k', date: '13 Jun, 2026', type: 'Whale Cluster Bid', isNeg: false },
    { x: 238, y: 120, h: 32, amount: '-$2,410k', date: '14 Jun, 2026', type: 'Derivatives Hedging Outflow', isNeg: true },
    { x: 258, y: 72, h: 48, amount: '+$3,950k', date: '15 Jun, 2026', type: 'Dip Floor Absorption', isNeg: false },
    { x: 278, y: 120, h: 18, amount: '-$1,340k', date: '16 Jun, 2026', type: 'Rebalancing Outflow', isNeg: true },
    { x: 298, y: 86, h: 34, amount: '+$2,840k', date: '17 Jun, 2026', type: 'Systematic DCA', isNeg: false },
    { x: 318, y: 92, h: 28, amount: '+$2,200k', date: '18 Jun, 2026', type: 'Cold Wallet Outflow (Bullish)', isNeg: false },
    { x: 338, y: 78, h: 42, amount: '+$3,450k', date: '19 Jun, 2026', type: 'Spot Inflow Wave', isNeg: false },
    { x: 358, y: 70, h: 50, amount: '+$4,150k', date: '20 Jun, 2026', type: 'ETF High Volume', isNeg: false },
    { x: 378, y: 120, h: 38, amount: '-$2,900k', date: '21 Jun, 2026', type: 'Short-Term Holder Realization', isNeg: true },
    { x: 398, y: 58, h: 62, amount: '+$5,200k', date: '22 Jun, 2026', type: 'Aggressive Whale Buying', isNeg: false },
    { x: 418, y: 120, h: 6, amount: '-$480k', date: '23 Jun, 2026', type: 'Minor Outflow', isNeg: true },
  ];

  // Radar Vertices Data
  const radarVertices = [
    { cx: 160, cy: 52, metric: 'Win Rate MVRV', val: '1.39', delta: '+0.14', type: 'Current Run', isOrange: false },
    { cx: 230, cy: 98, metric: 'Mayer Multiple', val: '1.34', delta: '+0.16', type: 'Current Run', isOrange: false },
    { cx: 222, cy: 162, metric: 'Puell Recovery', val: '0.88', delta: '+0.13', type: 'Current Run', isOrange: false },
    { cx: 154, cy: 202, metric: 'STH Risk:Reward', val: '3.50', delta: '+0.85', type: 'Current Run', isOrange: false },
    { cx: 102, cy: 168, metric: 'Max Drawdown Safety', val: '-10.4%', delta: '+8.1% (Resilient)', type: 'Current Run', isOrange: false },
    { cx: 108, cy: 98, metric: 'Hash Ribbon Consistency', val: '89.2', delta: '+7.2', type: 'Current Run', isOrange: false },
    // Benchmark
    { cx: 165, cy: 35, metric: 'Win Rate MVRV', val: '1.25', delta: 'Cycle Avg', type: 'Institutional Benchmark', isOrange: true },
    { cx: 242, cy: 88, metric: 'Mayer Multiple', val: '1.18', delta: '200D SMA', type: 'Institutional Benchmark', isOrange: true },
    { cx: 238, cy: 168, metric: 'Puell Recovery', val: '0.75', delta: 'Post-Halving', type: 'Institutional Benchmark', isOrange: true },
    { cx: 170, cy: 182, metric: 'STH Risk:Reward', val: '2.65', delta: 'Standard', type: 'Institutional Benchmark', isOrange: true },
    { cx: 132, cy: 158, metric: 'Max Drawdown Safety', val: '-18.5%', delta: 'Moderate', type: 'Institutional Benchmark', isOrange: true },
    { cx: 142, cy: 112, metric: 'Hash Ribbon Consistency', val: '82.0', delta: 'Miner Inversion', type: 'Institutional Benchmark', isOrange: true },
  ];

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
    });
  };

  const handleRadarHover = (v: typeof radarVertices[0], e: React.MouseEvent) => {
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
          aria-label="Terminal Home"
          onClick={() => handleNavChange('home')}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 ${
            activeNav === 'home' ? 'bg-[#111827] text-white scale-105' : 'bg-white text-gray-500 hover:text-[#7C3AED] border border-[#EEF0F5]'
          }`}
          title="Tín hiệu Tích sản Spot (Dashboard)"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
          </svg>
        </button>

        {/* Cycle Valuation Models */}
        <button
          aria-label="Cycle Models"
          onClick={() => handleNavChange('models')}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm hover:shadow transition-all duration-200 group ${
            activeNav === 'models' ? 'bg-[#7C3AED] text-white' : 'bg-white text-gray-500 hover:text-[#7C3AED] border border-[#EEF0F5]'
          }`}
          title="Mô Hình Định Giá & Radar Đỉnh Đáy Chu Kỳ"
        >
          <BarChart2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Candlestick & Technicals */}
        <button
          aria-label="Candlestick Chart"
          onClick={() => handleNavChange('candles')}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm hover:shadow transition-all duration-200 group ${
            activeNav === 'candles' ? 'bg-[#7C3AED] text-white' : 'bg-white text-gray-500 hover:text-[#7C3AED] border border-[#EEF0F5]'
          }`}
          title="Biểu Đồ Kỹ Thuật Đa Khung Thời Gian"
        >
          <LineChart className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Portfolio & DCA Ledger */}
        <button
          aria-label="Portfolio & DCA Ledger"
          onClick={() => handleNavChange('portfolio')}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm hover:shadow transition-all duration-200 group ${
            activeNav === 'portfolio' ? 'bg-[#7C3AED] text-white' : 'bg-white text-gray-500 hover:text-[#7C3AED] border border-[#EEF0F5]'
          }`}
          title="Danh Mục & Sổ Lệnh Tích Sản"
        >
          <PieChart className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* AI Quant Insights & Research */}
        <button
          aria-label="Research & AI Quant"
          onClick={() => handleNavChange('research')}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm hover:shadow transition-all duration-200 group ${
            activeNav === 'research' ? 'bg-[#7C3AED] text-white' : 'bg-white text-gray-500 hover:text-[#7C3AED] border border-[#EEF0F5]'
          }`}
          title="Nghiên Cứu Vĩ Mô & AI Quant Insights"
        >
          <Globe className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Vault & Security Audit */}
        <button
          aria-label="Vault & Security"
          onClick={() => setSelfCustodyModalOpen(true)}
          className="w-12 h-12 rounded-full bg-white text-gray-500 hover:text-[#7C3AED] border border-[#EEF0F5] flex items-center justify-center shadow-sm hover:shadow transition-all duration-200 group"
          title="Bảo Mật Ví Lạnh & Vault"
        >
          <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN CONTENT WRAPPER                                 */}
      {/* ======================================================== */}
      <div className="flex-1 ml-20 sm:ml-24 mr-4 sm:mr-6 my-5 max-w-[1440px] flex flex-col gap-6">
        {/* TOP BAR */}
        <header className="flex flex-wrap items-center justify-between gap-4 py-1" data-purpose="top-navigation">
          {/* Logo & Live BTC Spot Ticker */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavChange('home')}>
              <div className="flex items-center tracking-tighter text-2xl font-black text-[#111827]">
                <span className="inline-block border-[3.5px] border-[#111827] rounded-full w-6 h-6 mr-1.5 bg-gradient-to-tr from-amber-400 to-amber-500"></span>
                <span className="tracking-tight">LOQO</span>
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
              <span>Tín Hiệu Spot</span>
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
              <span>Mô Hình Chu Kỳ</span>
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
              <span>Biểu Đồ Nến</span>
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
              <span>Danh Mục &amp; Ví</span>
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
              <span>Nghiên Cứu Vĩ Mô</span>
            </button>
          </nav>

          {/* Right Controls: Halving, Currency, Search, Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            {/* Cycle Halving Pill */}
            <div className="hidden xl:flex items-center gap-2 bg-white border border-[#EEF0F5] text-gray-700 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>1W Cycle - Halving 5</span>
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
              aria-label="Open Command Palette"
              onClick={handleOpenAi}
              className="w-9 h-9 rounded-full bg-white border border-[#EEF0F5] flex items-center justify-center text-gray-600 hover:text-[#7C3AED] shadow-sm transition-colors"
              title="Tìm kiếm & AI Command Palette (⌘K)"
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
          <div className="space-y-6 animate-fadeIn">
            {/* GREETING & HERO ACTION BAR */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div>
                <p className="text-xs font-medium text-gray-400 tracking-wide">
                  {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-[#111827] tracking-tight mt-0.5">
                  Bitcoin Cycle &amp; Spot Accumulation Terminal
                </h1>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenDca}
                  className="bg-[#111827] hover:bg-black text-white px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02]"
                >
                  <span className="text-amber-400 font-bold">⚡</span>
                  <span>Execute Dynamic DCA</span>
                </button>
                <button
                  onClick={handleOpenAi}
                  aria-label="Perspective View"
                  className="w-10 h-10 rounded-full bg-white border border-[#EEF0F5] flex items-center justify-center text-gray-600 hover:text-black shadow-sm transition-colors"
                  title="Chế độ phân tích 3D / Đa góc nhìn"
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
                    <span className="text-xs font-medium text-gray-500">Cycle Confluence Score</span>
                    <span className="text-[10px] font-semibold text-gray-400 group-hover:text-[#7C3AED] transition-colors">
                      Top 4% Cycle Quantile
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[#111827] tracking-tight font-mono">
                      {confluenceScore.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">/ 100</span>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1.5 ml-auto">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Optimal Buy Zone
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
                    Composite Quant Confluence: {confluenceScore.toFixed(2)} / 100 (Deep DCA Accumulation)
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
                        <span>Net P&amp;L</span>
                      </div>
                      <p className="text-xl font-bold text-[#111827] mt-0.5 font-mono">
                        {currency === 'USD' ? `$${netPnlUsd.toLocaleString()}` : formatVND(netPnlUsd * 25850)}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        {netPnlPercent} spot yield
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
                        <span>ahr999 DCA Index</span>
                      </div>
                      <p className="text-xl font-bold text-[#111827] mt-0.5 font-mono">{ahr999Score.toFixed(2)}</p>
                      <span className="inline-block mt-1 text-[9px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                        &lt;0.45 All-in, 0.45-1.2 DCA
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
                        <span>MVRV Z-Score</span>
                      </div>
                      <p className="text-xl font-bold text-[#111827] mt-0.5 font-mono">{mvrvScore.toFixed(2)}</p>
                      <span className="inline-block mt-1 text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        Undervalued (vs 2.8 Top)
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
                        <span>Puell Multiple</span>
                      </div>
                      <p className="text-xl font-bold text-[#111827] mt-0.5 font-mono">{puellScore.toFixed(2)}</p>
                      <span className="inline-block mt-1 text-[9px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        Healthy Miner Issuance
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Daily Net Cumulative P&L & Spot DCA Valuation Curve (8 cols) */}
              <div className="lg:col-span-8 bg-white border border-[#EEF0F5] rounded-2xl p-6 shadow-card flex flex-col justify-between relative overflow-hidden" id="spline-card-container">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-[#111827]">Daily Net Cumulative P&amp;L &amp; Spot DCA Valuation Curve</h2>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1.5 font-medium text-gray-600">
                      <span className="w-2.5 h-1 rounded-full bg-[#7C3AED]"></span> Cumulative P&amp;L
                    </span>
                    <span className="hidden sm:inline-block text-[10px] bg-purple-50 text-[#7C3AED] px-2.5 py-0.5 rounded-full font-semibold border border-purple-100">
                      Hover across curve
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

                    {/* Grid Lines */}
                    <g className="text-[10px] fill-gray-400 font-mono" stroke="#EEF0F5" strokeDasharray="4,4" strokeWidth="1">
                      <text fill="#9CA3AF" stroke="none" x="5" y="24">$80k -</text>
                      <line x1="50" x2="820" y1="20" y2="20"></line>
                      <text fill="#9CA3AF" stroke="none" x="5" y="78">$60k -</text>
                      <line x1="50" x2="820" y1="74" y2="74"></line>
                      <text fill="#9CA3AF" stroke="none" x="5" y="132">$40k -</text>
                      <line x1="50" x2="820" y1="128" y2="128"></line>
                      <text fill="#9CA3AF" stroke="none" x="5" y="184">$20k -</text>
                      <line x1="50" x2="820" y1="180" y2="180"></line>
                      <text fill="#9CA3AF" stroke="none" x="5" y="238">$0k -</text>
                      <line x1="50" x2="820" y1="234" y2="234"></line>
                    </g>

                    {/* Vertical Hatched Accumulation Zones */}
                    <path d="M 220,105 L 240,115 C 270,140 280,165 310,165 C 330,165 350,145 375,120 L 375,234 L 220,234 Z" fill="url(#dotPattern)"></path>
                    <path d="M 525,115 C 560,150 580,175 605,175 C 630,175 660,140 685,145 L 685,234 L 525,234 Z" fill="url(#dotPattern)"></path>

                    {/* Gradient Area under wave */}
                    <path
                      d="M 60,135 C 90,135 110,80 150,75 C 190,70 215,110 240,115 C 270,120 285,165 310,165 C 340,165 360,140 380,118 C 400,96 420,55 450,55 C 480,55 500,100 525,115 C 555,133 570,175 605,175 C 635,175 655,130 690,130 C 725,130 750,175 780,175 C 800,175 810,120 820,105 L 820,234 L 60,234 Z"
                      fill="url(#purpleGradient)"
                    ></path>

                    {/* Main Spline Wave */}
                    <path
                      d="M 60,135 C 90,135 110,80 150,75 C 190,70 215,110 240,115 C 270,120 285,165 310,165 C 340,165 360,140 380,118 C 400,96 420,55 450,55 C 480,55 500,100 525,115 C 555,133 570,175 605,175 C 635,175 655,130 690,130 C 725,130 750,175 780,175 C 800,175 810,120 820,105"
                      fill="none"
                      stroke="#7C3AED"
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    ></path>

                    {/* Key Points */}
                    <circle cx="310" cy="165" fill="#FFFFFF" r="4" stroke="#7C3AED" strokeWidth="2.5"></circle>
                    <circle cx="450" cy="55" fill="#7C3AED" r="5" stroke="#FFFFFF" strokeWidth="2.5"></circle>
                    <circle cx="605" cy="175" fill="#FFFFFF" r="4" stroke="#7C3AED" strokeWidth="2.5"></circle>
                    <circle cx="810" cy="120" fill="#FFFFFF" r="4" stroke="#7C3AED" strokeWidth="2.5"></circle>
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
                        <span className="text-gray-400 text-[11px]">Net Spot Value</span>
                        <span className="text-sm font-extrabold text-[#111827] font-mono">{splineTooltip.val}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-dashed border-gray-100 text-emerald-600 font-medium">
                        <span>Cycle Return</span>
                        <span className="font-mono font-bold">{splineTooltip.chg}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline X-Axis Labels */}
                <div className="flex justify-between items-center text-[11px] text-gray-400 font-mono font-medium pl-10 pr-2 pt-2 border-t border-gray-100">
                  <span>05 Jun, 2026</span>
                  <span>09 Jun, 2026</span>
                  <span>13 Jun, 2026</span>
                  <span>17 Jun, 2026</span>
                  <span>21 Jun, 2026</span>
                  <span>25 Jun, 2026</span>
                </div>
              </div>
            </section>

            {/* BOTTOM ANALYTICS GRID (Bars + Radar + DCA Ledger) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative pb-16" data-purpose="secondary-confluence-analytics">
              {/* Column 1: Net Daily Spot Inflows & Whale Absorption (4 cols) */}
              <div className="lg:col-span-4 bg-white border border-[#EEF0F5] rounded-2xl p-5 shadow-card flex flex-col justify-between relative overflow-hidden" id="bar-card-container">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#111827]">Net Daily Spot Inflows &amp; Whale Absorption</h3>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-gray-400">19 Recorded Sessions</span>
                </div>

                {/* Bar Chart Component */}
                <div className="relative w-full h-[210px] bar-chart-group">
                  <svg ref={barSvgRef} className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 450 200">
                    <g className="text-[9px] fill-gray-400 font-mono pointer-events-none">
                      <text x="5" y="16">+$10m</text>
                      <line stroke="#EEF0F5" strokeDasharray="3,3" x1="42" x2="450" y1="12" y2="12"></line>
                      <text x="5" y="52">+$6m</text>
                      <line stroke="#EEF0F5" strokeDasharray="3,3" x1="42" x2="450" y1="48" y2="48"></line>
                      <text x="5" y="88">+$3m</text>
                      <line stroke="#EEF0F5" strokeDasharray="3,3" x1="42" x2="450" y1="84" y2="84"></line>
                      <text className="font-bold fill-gray-500" x="5" y="124">$0</text>
                      <line stroke="#D1D5DB" strokeWidth="1.2" x1="42" x2="450" y1="120" y2="120"></line>
                      <text x="5" y="160">-$3m</text>
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
                          {barTooltip.isNeg ? 'Outflow' : 'Whale Absorption'}
                        </span>
                      </div>
                      <div className={`font-bold font-mono text-sm tracking-tight ${barTooltip.isNeg ? 'text-red-400' : 'text-emerald-400'}`}>
                        {barTooltip.amount}
                      </div>
                      <div className="text-[9px] text-gray-400 mt-0.5">{barTooltip.type}</div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-[10px] text-gray-400 font-mono font-medium pl-8 pr-3 pt-1 border-t border-gray-100">
                  <span>05 Jun, 2026</span>
                  <span>09 Jun, 2026</span>
                  <span>13 Jun, 2026</span>
                  <span>17 Jun, 2026</span>
                  <span>23 Jun, 2026</span>
                </div>
              </div>

              {/* Column 2: Overall Cycle Score Radar v2.4 (3 cols) */}
              <div className="lg:col-span-3 bg-white border border-[#EEF0F5] rounded-2xl p-5 shadow-card flex flex-col justify-between relative overflow-hidden" id="radar-card-container">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#111827]">Overall Cycle Score Radar</h3>
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

                    <polygon fill="#7C3AED" fillOpacity="0.2" points="160,52 230,98 222,162 154,202 102,168 108,98" stroke="#7C3AED" strokeLinejoin="round" strokeWidth="2.5"></polygon>
                    <polygon fill="none" points="165,35 242,88 238,168 170,182 132,158 142,112" stroke="#F97316" strokeLinejoin="round" strokeWidth="2.2"></polygon>

                    {radarVertices.map((v, i) => (
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

                    <text className="text-[9px] fill-gray-500 font-semibold" textAnchor="middle" x="160" y="16">Win Rate MVRV</text>
                    <text className="text-[9px] fill-gray-500 font-semibold" textAnchor="start" x="256" y="78">Mayer Multiple</text>
                    <text className="text-[9px] fill-gray-500 font-semibold" textAnchor="start" x="256" y="180">Puell Recovery</text>
                    <text className="text-[9px] fill-gray-500 font-semibold" textAnchor="middle" x="160" y="238">STH Risk:Reward</text>
                    <text className="text-[9px] fill-gray-500 font-semibold" textAnchor="end" x="62" y="180">Max Drawdown</text>
                    <text className="text-[9px] fill-gray-500 font-semibold" textAnchor="end" x="62" y="78">Hash Ribbon</text>
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
                        <span className="text-gray-400 text-[10px]">Quant Value</span>
                        <span className="font-extrabold text-[#111827] text-sm font-mono">{radarTooltip.val}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1 pt-1 border-t border-dashed border-gray-100">
                        <span>Benchmark / Delta</span>
                        <span className={`font-semibold font-mono ${radarTooltip.isOrange ? 'text-orange-600' : 'text-emerald-600'}`}>
                          {radarTooltip.delta}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-5 text-[10px] text-gray-400 font-medium pt-1 border-t border-gray-100">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#7C3AED]"></span> Current Run</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F97316]"></span> Benchmark</span>
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
                        Recent Spot DCA
                      </button>
                      <button
                        onClick={() => setLedgerTab('triggers')}
                        className={`text-xs pb-2 -mb-2.5 transition-colors ${
                          ledgerTab === 'triggers' ? 'font-bold text-[#111827] border-b-2 border-[#111827]' : 'font-semibold text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        Open DCA Triggers
                      </button>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                      Kelly Sized DCA
                    </span>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[9px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                          <th className="py-2 font-medium">Date</th>
                          <th className="py-2 font-medium">Pair &amp; Sats</th>
                          <th className="py-2 font-medium text-right">Fill Price</th>
                          <th className="py-2 font-medium text-right">Net USD / Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-[11px] font-medium text-gray-700 font-mono">
                        <tr className="hover:bg-purple-50/40 transition-colors group cursor-pointer">
                          <td className="py-2.5 text-gray-500 text-[10px]">06/19/2026</td>
                          <td className="py-2.5">
                            <div className="font-bold text-gray-900 flex items-center gap-1">
                              BTC/USDT <span className="text-[9px] font-medium text-purple-600 bg-purple-50 px-1 py-0.2 rounded">+1.8x</span>
                            </div>
                            <div className="text-[9px] text-gray-400 font-sans">0.01350 BTC (1.35m sats)</div>
                          </td>
                          <td className="py-2.5 text-right font-semibold text-gray-800">$74,200</td>
                          <td className="py-2.5 text-right">
                            <div className="font-bold text-emerald-600">$1,001.70</div>
                            <div className="text-[9px] text-emerald-500 font-sans font-semibold">Settled</div>
                          </td>
                        </tr>
                        <tr className="hover:bg-purple-50/40 transition-colors group cursor-pointer">
                          <td className="py-2.5 text-gray-500 text-[10px]">06/16/2026</td>
                          <td className="py-2.5">
                            <div className="font-bold text-gray-900 flex items-center gap-1">
                              BTC/USDT <span className="text-[9px] font-medium text-purple-600 bg-purple-50 px-1 py-0.2 rounded">+2.0x</span>
                            </div>
                            <div className="text-[9px] text-gray-400 font-sans">0.02100 BTC (2.10m sats)</div>
                          </td>
                          <td className="py-2.5 text-right font-semibold text-gray-800">$71,450</td>
                          <td className="py-2.5 text-right">
                            <div className="font-bold text-emerald-600">$1,500.45</div>
                            <div className="text-[9px] text-emerald-500 font-sans font-semibold">Settled</div>
                          </td>
                        </tr>
                        <tr className="hover:bg-purple-50/40 transition-colors group cursor-pointer">
                          <td className="py-2.5 text-gray-500 text-[10px]">06/12/2026</td>
                          <td className="py-2.5">
                            <div className="font-bold text-gray-900 flex items-center gap-1">
                              BTC/USDT <span className="text-[9px] font-medium text-purple-600 bg-purple-50 px-1 py-0.2 rounded">+1.5x</span>
                            </div>
                            <div className="text-[9px] text-gray-400 font-sans">0.01250 BTC (1.25m sats)</div>
                          </td>
                          <td className="py-2.5 text-right font-semibold text-gray-800">$69,820</td>
                          <td className="py-2.5 text-right">
                            <div className="font-bold text-emerald-600">$872.75</div>
                            <div className="text-[9px] text-emerald-500 font-sans font-semibold">Settled</div>
                          </td>
                        </tr>
                        <tr className="hover:bg-purple-50/40 transition-colors group cursor-pointer">
                          <td className="py-2.5 text-gray-500 text-[10px]">06/08/2026</td>
                          <td className="py-2.5">
                            <div className="font-bold text-gray-900 flex items-center gap-1">
                              BTC/USDT <span className="text-[9px] font-medium text-purple-600 bg-purple-50 px-1 py-0.2 rounded">+2.2x</span>
                            </div>
                            <div className="text-[9px] text-gray-400 font-sans">0.01800 BTC (1.80m sats)</div>
                          </td>
                          <td className="py-2.5 text-right font-semibold text-gray-800">$68,500</td>
                          <td className="py-2.5 text-right">
                            <div className="font-bold text-emerald-600">$1,233.00</div>
                            <div className="text-[9px] text-emerald-500 font-sans font-semibold">Settled</div>
                          </td>
                        </tr>
                        <tr className="hover:bg-purple-50/40 transition-colors group cursor-pointer">
                          <td className="py-2.5 text-gray-500 text-[10px]">06/05/2026</td>
                          <td className="py-2.5">
                            <div className="font-bold text-gray-900 flex items-center gap-1">
                              BTC/USDT <span className="text-[9px] font-medium text-gray-500 bg-gray-100 px-1 py-0.2 rounded">1.0x Base</span>
                            </div>
                            <div className="text-[9px] text-gray-400 font-sans">0.01050 BTC (1.05m sats)</div>
                          </td>
                          <td className="py-2.5 text-right font-semibold text-gray-800">$72,110</td>
                          <td className="py-2.5 text-right">
                            <div className="font-bold text-emerald-600">$757.15</div>
                            <div className="text-[9px] text-emerald-500 font-sans font-semibold">Settled</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-2 text-right border-t border-gray-100">
                  <button
                    onClick={handleOpenDca}
                    className="text-[11px] font-semibold text-[#7C3AED] hover:underline inline-flex items-center gap-1 group font-sans"
                  >
                    <span>Thêm giao dịch tích sản mới</span>
                    <span className="group-hover:translate-x-0.5 transition-transform font-bold">→</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: CYCLE VALUATION MODELS */}
        {activeNav === 'models' && (
          <div className="space-y-6 animate-fadeIn pb-16">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-[#111827] tracking-tight">
                  Mô Hình Định Giá &amp; Chu Kỳ Lượng Tử
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Đánh giá đa chiều định lượng: Pi Cycle Top, MVRV Z-Score, ahr999, Mayer Multiple, và mô hình Cointime Economics
                </p>
              </div>
            </div>

            <div className="horizon-card p-6">
              <AppleCyclePeakRadar />
            </div>
          </div>
        )}

        {/* TAB 3: CANDLESTICK & TECHNICAL CHART */}
        {activeNav === 'candles' && (
          <div className="space-y-6 animate-fadeIn pb-16">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-[#111827] tracking-tight">
                  Biểu Đồ Kỹ Thuật Đa Khung Thời Gian
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  TradingView Pro tích hợp các dải Power Law Quantiles, 200-Week Floor, Pi Cycle, và Sàn Giá Vốn On-Chain
                </p>
              </div>
            </div>

            <div className="horizon-card p-6">
              <AppleCycleChart />
            </div>
          </div>
        )}

        {/* TAB 4: PORTFOLIO & ASSET ALLOCATION */}
        {activeNav === 'portfolio' && (
          <div className="space-y-6 animate-fadeIn pb-16">
            <Suspense fallback={<div className="p-12 text-center text-gray-400 font-mono text-xs animate-pulse">Đang tải Danh Mục Tích Sản...</div>}>
              <PortfolioTab />
            </Suspense>
          </div>
        )}

        {/* TAB 5: AI QUANT INSIGHTS & RESEARCH HUB */}
        {activeNav === 'research' && (
          <div className="space-y-6 animate-fadeIn pb-16">
            <Suspense fallback={<div className="p-12 text-center text-gray-400 font-mono text-xs animate-pulse">Đang tải Nghiên Cứu & Backtest...</div>}>
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
              placeholder="Hỏi AI Quant về chu kỳ Bitcoin, Kelly DCA sizing, hoặc thanh khoản vĩ mô..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleOpenAi();
              }}
            />
            <button
              onClick={handleOpenAi}
              className="text-[10px] font-bold text-white bg-[#7C3AED] hover:bg-purple-800 px-3 py-1 rounded-full transition-colors flex-shrink-0 shadow-sm"
            >
              AI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BitcoinHorizonDashboard;
