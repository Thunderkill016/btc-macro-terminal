import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { useUnifiedMetrics } from '../../lib/metricsSelector';
import { formatUSD, formatVND } from '../../lib/formatters';
import { AppleCycleChart } from '../apple/AppleCycleChart';
import { PortfolioTab } from '../tabs/PortfolioTab';
import { ResearchTab } from '../tabs/ResearchTab';

export const LoqoDashboard: React.FC = () => {
  // Store selectors
  const locale = useTerminalStore((s) => s.locale);
  const setLocale = useTerminalStore((s) => s.setLocale);
  const isVi = locale === 'vi';
  const confluence = useTerminalStore((s) => s.confluenceResult);
  const summary = useTerminalStore((s) => s.portfolioSummary);
  const transactions = useTerminalStore((s) => s.transactions);
  const mempool = useTerminalStore((s) => s.mempool);
  const ticker = useTerminalStore((s) => s.ticker);
  const realCyclePoints = useTerminalStore((s) => s.realCyclePoints);
  const setCommandPaletteOpen = useTerminalStore((s) => s.setCommandPaletteOpen);
  const setInstitutionalModalOpen = useTerminalStore((s) => s.setInstitutionalModalOpen);
  const setAddTransactionModalOpen = useTerminalStore((s) => s.setAddTransactionModalOpen);

  // Unified Realtime Metrics
  const metrics = useUnifiedMetrics();
  const price = metrics.livePrice || 75790;
  const p2pRate = metrics.p2pRate || 25850;
  const change24h = ticker?.change24h ?? 2.45;
  const isPriceUp = change24h >= 0;

  // Active currency toggle: USD ($) vs VND (₫)
  const [currency, setCurrency] = useState<'USD' | 'VND'>('USD');
  const isVnd = currency === 'VND';

  // Format amount with active currency
  const formatMoney = (usdVal: number, decimals: number = 0) => {
    if (isVnd) {
      return formatVND(usdVal * p2pRate);
    }
    return formatUSD(usdVal, decimals);
  };

  // Confluence Score & Zone
  const score = confluence?.totalScoreExact ?? confluence?.totalScore ?? 80.75;
  const scorePercent = Math.max(0, Math.min(100, score));
  const zoneLabel = confluence?.zoneLabel || 'Optimal Buy Zone';
  const kellyMultiplier = confluence?.kellyTactical?.dcaMultiplier ?? metrics.confluenceMultiplier ?? 1.8;

  // Real Valuation Multiples
  const mvrv = metrics.mvrv > 0 ? metrics.mvrv : 1.39;
  const ahr999 = metrics.ahr999 > 0 ? metrics.ahr999 : 0.48;
  const mayerMultiple = metrics.mayerMultiple > 0 ? metrics.mayerMultiple : 0.94;
  const latestPoint = realCyclePoints && realCyclePoints.length > 0 ? realCyclePoints[realCyclePoints.length - 1] : null;
  const puellMultiple = latestPoint?.puellMultiple ?? 0.88;

  // Block height from mempool
  const blockHeight = mempool?.lastBlockHeight > 0 ? mempool.lastBlockHeight : 884219;

  // Active navigation rail: 0: Dashboard, 1: Cycle Models, 2: Candlestick, 3: Ledger, 4: Histograms
  const [activeRail, setActiveRail] = useState(0);

  // Recent Trades vs Open Positions tab
  const [tradeTab, setTradeTab] = useState<'recent' | 'open'>('recent');

  // AI Prompt Input State
  const [aiPrompt, setAiPrompt] = useState('');

  // Live Current Date
  const currentDateStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  // Portfolio Values
  const unrealizedPnlUsd = summary?.unrealizedPnlUsd ?? 14742;
  const unrealizedPnlPercent = summary?.unrealizedPnlPercent ?? 31.79;
  const totalBtc = summary?.totalBtc ?? 1.245;

  // Spline Chart Interactivity State
  const splineSvgRef = useRef<SVGSVGElement | null>(null);
  const [hoverSpline, setHoverSpline] = useState<{
    visible: boolean;
    x: number;
    y: number;
    date: string;
    val: string;
    tag: string;
    chg: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    date: '16 Jun, 2026',
    val: formatMoney(51890),
    tag: 'Peak Zone',
    chg: '+154.2%',
  });

  // Bar Tooltip State
  const [hoverBar, setHoverBar] = useState<{
    visible: boolean;
    x: number;
    y: number;
    date: string;
    amount: string;
    type: string;
    isNeg: boolean;
  } | null>(null);

  // Radar Tooltip State
  const [hoverRadar, setHoverRadar] = useState<{
    visible: boolean;
    x: number;
    y: number;
    metric: string;
    type: string;
    score: string;
    delta: string;
    isOrange: boolean;
  } | null>(null);

  // Spline mouse tracking handler
  const handleSplineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!splineSvgRef.current) return;
    const rect = splineSvgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgWidth = rect.width;
    const svgX = (clientX / svgWidth) * 820;

    if (svgX < 55 || svgX > 825) {
      setHoverSpline((prev) => ({ ...prev, visible: false }));
      return;
    }

    const minX = 60, maxX = 820;
    const clampedX = Math.max(minX, Math.min(maxX, svgX));
    const progress = (clampedX - minX) / (maxX - minX);
    const dayNumber = Math.round(5 + progress * 20);
    const dateStr = `${dayNumber < 10 ? '0' + dayNumber : dayNumber} Jun, 2026`;

    // Dynamic curve approximation
    let approxY = 135;
    if (clampedX < 150) approxY = 135 - ((clampedX - 60) / 90) * 60;
    else if (clampedX < 310) approxY = 75 + ((clampedX - 150) / 160) * 90;
    else if (clampedX < 450) approxY = 165 - ((clampedX - 310) / 140) * 110;
    else if (clampedX < 605) approxY = 55 + ((clampedX - 450) / 155) * 120;
    else if (clampedX < 690) approxY = 175 - ((clampedX - 605) / 85) * 45;
    else approxY = 130 - ((clampedX - 690) / 130) * 25;

    const valUSD = Math.round(((234 - approxY) / (234 - 20)) * 60000);
    const formattedVal = formatMoney(valUSD);

    let tag = 'DCA Zone';
    let chg = '+14.2%';
    if (approxY < 80) {
      tag = 'Peak Zone';
      chg = '+154.2%';
    } else if (approxY > 150) {
      tag = 'Accumulation Dip';
      chg = '+12.4%';
    } else {
      tag = 'Mid Accumulation';
      chg = '+58.1%';
    }

    const domX = (clampedX / 820) * rect.width;
    const domY = (approxY / 250) * rect.height - 12;

    setHoverSpline({
      visible: true,
      x: domX,
      y: domY,
      date: dateStr,
      val: formattedVal,
      tag,
      chg,
    });
  };

  const handleSplineMouseLeave = () => {
    setHoverSpline((prev) => ({ ...prev, visible: false }));
  };

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCommandPaletteOpen(true);
  };

  return (
    <div className="min-h-screen bg-appBg text-gray-900 flex antialiased selection:bg-brandPurple selection:text-white relative pb-20">
      {/* BEGIN: LeftSidebar (Floating icon navigation rail) */}
      <aside className="fixed left-5 top-1/2 -translate-y-1/2 flex flex-col gap-3.5 z-40" data-purpose="sidebar-rail">
        {/* Rail 0: Active Main Dashboard */}
        <button
          type="button"
          aria-label="Dashboard Home"
          onClick={() => setActiveRail(0)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            activeRail === 0
              ? 'bg-brandDark text-white shadow-lg scale-105'
              : 'bg-white text-gray-500 hover:text-gray-900 border border-cardBorder shadow-sm hover:shadow'
          }`}
          title="Terminal Dashboard"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>

        {/* Rail 1: Cycle Models (Screen 08) */}
        <button
          type="button"
          aria-label="Cycle Verifications"
          onClick={() => setActiveRail(1)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            activeRail === 1
              ? 'bg-brandDark text-white shadow-lg scale-105'
              : 'bg-white text-gray-500 hover:text-gray-900 border border-cardBorder shadow-sm hover:shadow'
          }`}
          title="Cycle Analytics & Valuation Models"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Rail 2: Candlestick Technicals (Multi-Cycle Chart) */}
        <button
          type="button"
          aria-label="Candlestick Technicals"
          onClick={() => setActiveRail(2)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            activeRail === 2
              ? 'bg-brandDark text-white shadow-lg scale-105'
              : 'bg-white text-gray-500 hover:text-gray-900 border border-cardBorder shadow-sm hover:shadow'
          }`}
          title="Candlestick Technicals & TradingView Chart"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M12 3v2m0 14v2m0-14a3 3 0 00-3 3v6a3 3 0 006 0V9a3 3 0 00-3-3zM6 8v1m0 6v1m0-7a2 2 0 00-2 2v2a2 2 0 004 0V9a2 2 0 00-2-2zm12 2v1m0 4v1m0-5a2 2 0 00-2 2v0a2 2 0 004 0v0a2 2 0 00-2-2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Rail 3: On-Chain Terminal Ledger & Portfolio */}
        <button
          type="button"
          aria-label="On-chain Ledger"
          onClick={() => setActiveRail(3)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            activeRail === 3
              ? 'bg-brandDark text-white shadow-lg scale-105'
              : 'bg-white text-gray-500 hover:text-gray-900 border border-cardBorder shadow-sm hover:shadow'
          }`}
          title="On-chain Ledger & Portfolio"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Rail 4: Distribution Histograms & Research */}
        <button
          type="button"
          aria-label="Distribution Histograms"
          onClick={() => setActiveRail(4)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            activeRail === 4
              ? 'bg-brandDark text-white shadow-lg scale-105'
              : 'bg-white text-gray-500 hover:text-gray-900 border border-cardBorder shadow-sm hover:shadow'
          }`}
          title="Distribution Histograms & Macro Research"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Rail 5: Audit Reports & Playbook */}
        <button
          type="button"
          aria-label="Audit Reports"
          onClick={() => setInstitutionalModalOpen(true)}
          className="w-12 h-12 rounded-full bg-white text-gray-500 hover:text-gray-900 border border-cardBorder flex items-center justify-center shadow-sm hover:shadow transition-all duration-200"
          title="Institutional Playbook & Audit"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </aside>

      {/* BEGIN: MainContentWrapper */}
      <div className="flex-1 ml-24 mr-6 my-5 max-w-[1440px] flex flex-col gap-6">
        {/* BEGIN: TopBar */}
        <header className="flex items-center justify-between py-1" data-purpose="top-navigation">
          {/* Left: Brandmark & Live Ticker */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveRail(0)}>
              <div className="flex items-center tracking-tighter text-2xl font-black text-brandDark">
                <span className="inline-block border-[3.5px] border-brandDark rounded-full w-6 h-6 mr-1" />
                <span className="tracking-tight">LOQO</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xl font-semibold text-gray-700 tracking-tight">
                {activeRail === 0
                  ? 'Dashboard'
                  : activeRail === 1
                  ? 'Cycle Models'
                  : activeRail === 2
                  ? 'Technicals'
                  : activeRail === 3
                  ? 'Portfolio Ledger'
                  : 'Macro Research'}
              </span>

              {/* Real Live Spot Price Chip */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white border border-cardBorder rounded-full shadow-sm text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-brandDark">{formatMoney(price)}</span>
                <span className={`text-[10px] font-semibold ${isPriceUp ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isPriceUp ? '+' : ''}{change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls: Date Range, Currency Toggle, Filter, Avatar */}
          <div className="flex items-center gap-3">
            {/* Date Selector Pill */}
            <button
              type="button"
              className="bg-white border border-cardBorder text-gray-700 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2.5 shadow-sm hover:bg-gray-50 transition-colors"
              title="Timeframe Selector"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              <span>Date range</span>
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Currency Selector Pill (Toggle $ USD vs ₫ VND) */}
            <button
              type="button"
              onClick={() => setCurrency((c) => (c === 'USD' ? 'VND' : 'USD'))}
              className="bg-white border border-cardBorder text-gray-700 px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
              title={`Switch Currency (Current: ${currency})`}
            >
              <span className="w-4 h-4 rounded-full bg-purple-50 text-brandPurple flex items-center justify-center text-[10px] font-bold">
                {isVnd ? '₫' : '$'}
              </span>
              <span className="text-[10px] text-gray-500 font-mono font-bold">{currency}</span>
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Filter / Command Palette Button */}
            <button
              type="button"
              aria-label="Filters"
              onClick={() => setCommandPaletteOpen(true)}
              className="w-9 h-9 rounded-full bg-white border border-cardBorder flex items-center justify-center text-gray-600 hover:text-black shadow-sm transition-colors cursor-pointer"
              title="Open Command Palette (Ctrl+K)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* User Avatar */}
            <div className="relative cursor-pointer" onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')} title={`Language: ${locale.toUpperCase()} (Click to toggle)`}>
              <img
                alt="User Avatar"
                className="w-9 h-9 rounded-full border border-cardBorder object-cover shadow-sm ring-2 ring-white"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
          </div>
        </header>

        {/* View Switching between Rails */}
        {activeRail === 1 ? (
          /* Rail 1: Cycle Models & Valuation Strip */
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-white border border-cardBorder rounded-2xl shadow-card">
              <div>
                <span className="text-xs font-mono font-bold text-brandPurple bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                  EPOCH 5 / HALVING 4
                </span>
                <h2 className="text-xl font-bold text-brandDark mt-1">Cycle Analytics &amp; Valuation Models</h2>
                <p className="text-xs text-gray-500">Block Height #{blockHeight.toLocaleString()} • Fair Value Corridor</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveRail(0)}
                className="px-4 py-2 bg-brandDark text-white text-xs font-semibold rounded-full shadow-sm hover:bg-black transition-all"
              >
                ← Back to Dashboard
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-cardBg border border-cardBorder p-5 rounded-2xl shadow-card">
                <span className="text-xs font-medium text-gray-500">MVRV Z-Score</span>
                <p className="text-2xl font-bold font-mono text-brandDark mt-1">{mvrv.toFixed(2)}</p>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 inline-block mt-2">
                  Buy Zone (0.1 - 2.8)
                </span>
              </div>
              <div className="bg-cardBg border border-cardBorder p-5 rounded-2xl shadow-card">
                <span className="text-xs font-medium text-gray-500">ahr999 Index</span>
                <p className="text-2xl font-bold font-mono text-brandDark mt-1">{ahr999.toFixed(2)}</p>
                <span className="text-xs font-semibold text-brandPurple bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 inline-block mt-2">
                  {ahr999 < 0.45 ? 'All-in Zone' : 'DCA Heavy'}
                </span>
              </div>
              <div className="bg-cardBg border border-cardBorder p-5 rounded-2xl shadow-card">
                <span className="text-xs font-medium text-gray-500">Puell Multiple</span>
                <p className="text-2xl font-bold font-mono text-brandDark mt-1">{puellMultiple.toFixed(2)}</p>
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 inline-block mt-2">
                  Miner Subsidy Healthy
                </span>
              </div>
              <div className="bg-cardBg border border-cardBorder p-5 rounded-2xl shadow-card">
                <span className="text-xs font-medium text-gray-500">Mayer Multiple</span>
                <p className="text-2xl font-bold font-mono text-brandDark mt-1">{mayerMultiple.toFixed(2)}</p>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 inline-block mt-2">
                  200 DMA Discount
                </span>
              </div>
            </div>
          </div>
        ) : activeRail === 2 ? (
          /* Rail 2: TradingView Chart */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-brandDark">Multi-Cycle Institutional Candlestick Pro</h2>
              <button
                type="button"
                onClick={() => setActiveRail(0)}
                className="px-4 py-2 bg-brandDark text-white text-xs font-semibold rounded-full shadow-sm hover:bg-black transition-all"
              >
                ← Back to Dashboard
              </button>
            </div>
            <div className="bg-cardBg p-4 rounded-2xl border border-cardBorder shadow-card">
              <AppleCycleChart />
            </div>
          </div>
        ) : activeRail === 3 ? (
          /* Rail 3: Portfolio Ledger */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-brandDark">Spot Accumulation Ledger</h2>
              <button
                type="button"
                onClick={() => setActiveRail(0)}
                className="px-4 py-2 bg-brandDark text-white text-xs font-semibold rounded-full shadow-sm hover:bg-black transition-all"
              >
                ← Back to Dashboard
              </button>
            </div>
            <PortfolioTab />
          </div>
        ) : activeRail === 4 ? (
          /* Rail 4: Research */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-brandDark">Macro Histograms &amp; Quantitative Verification</h2>
              <button
                type="button"
                onClick={() => setActiveRail(0)}
                className="px-4 py-2 bg-brandDark text-white text-xs font-semibold rounded-full shadow-sm hover:bg-black transition-all"
              >
                ← Back to Dashboard
              </button>
            </div>
            <ResearchTab />
          </div>
        ) : (
          /* Rail 0: Default Full Stitch Dashboard */
          <>
            {/* BEGIN: GreetingAndActions */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-xs font-medium text-gray-400 tracking-wide">{currentDateStr}</p>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-brandDark tracking-tight mt-0.5">
                  Welcome Back, Biswas
                </h1>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {/* Start My Day Button -> Opens DCA Engine */}
                <button
                  type="button"
                  onClick={() => setInstitutionalModalOpen(true)}
                  className="bg-brandDark hover:bg-black text-white px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-purple-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Start my Day</span>
                </button>

                {/* Perspective View Button */}
                <button
                  type="button"
                  aria-label="Perspective View"
                  onClick={() => setActiveRail(1)}
                  className="w-10 h-10 rounded-full bg-white border border-cardBorder flex items-center justify-center text-gray-600 hover:text-black shadow-sm transition-colors cursor-pointer"
                  title="Toggle Valuation Models"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* BEGIN: TopMetricsGrid */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" data-purpose="primary-accumulation-analytics">
              {/* Left Column: Score & 2x2 Metric Cards (4 cols) */}
              <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
                {/* Score & Spectrum Bar */}
                <div
                  className="group relative bg-cardBg border border-cardBorder hover:border-purple-200 transition-all duration-200 rounded-2xl p-5 shadow-card cursor-pointer"
                  onClick={() => setInstitutionalModalOpen(true)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Your Score</span>
                    <span className="text-[10px] font-semibold text-gray-400 group-hover:text-brandPurple transition-colors">
                      Top 4% Cycle Quantile
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-brandDark tracking-tight font-mono">
                      {score.toFixed(2)}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {zoneLabel}
                    </span>
                  </div>

                  {/* Rainbow Gradient Bar (Red -> Amber -> Lime -> Emerald) */}
                  <div className="relative mt-4 mb-2">
                    <div className="h-3 w-full rounded-full bg-gradient-to-r from-[#EF4444] via-[#FBBF24] via-[#84CC16] to-[#10B981]" />
                    {/* White Slider Pin indicator dynamically tracking real score */}
                    <div
                      className="absolute -top-1 -translate-x-1/2 w-4 h-5 bg-white border-2 border-emerald-500 rounded-md shadow-md flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-transform"
                      style={{ left: `${scorePercent}%` }}
                    >
                      <div className="w-0.5 h-2.5 bg-emerald-500 rounded-full" />
                    </div>
                    {/* Axis Ticks */}
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium px-0.5 mt-2">
                      <span>0</span>
                      <span>20</span>
                      <span>40</span>
                      <span>60</span>
                      <span>80</span>
                      <span>100</span>
                    </div>
                  </div>

                  {/* Micro-tooltip overlay on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[11px] py-1 px-3 rounded-lg shadow-lg whitespace-nowrap z-30">
                    Composite Confluence: {score.toFixed(2)} / 100 • {kellyMultiplier.toFixed(2)}x Kelly Sizing
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>

                {/* 2x2 Mini KPI Cards */}
                <div className="grid grid-cols-2 gap-4 flex-1">
                  {/* Card 1: Net P&L */}
                  <div
                    className="relative group bg-cardBg border border-cardBorder hover:border-purple-200 transition-all duration-200 rounded-2xl p-4 shadow-card flex flex-col justify-between hover:shadow-md cursor-pointer"
                    onClick={() => setActiveRail(3)}
                  >
                    <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 mb-2 group-hover:bg-purple-50 group-hover:text-brandPurple transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                        <span>Net P&amp;L</span>
                        <div className="relative cursor-help">
                          <svg className="w-3 h-3 text-gray-300 group-hover:text-brandPurple transition-colors" fill="currentColor" viewBox="0 0 20 20">
                            <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0118 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-brandDark mt-0.5 font-mono">
                        {formatMoney(unrealizedPnlUsd)}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-8 left-4 bg-gray-900 text-white text-[10px] py-1 px-2.5 rounded-md shadow-lg whitespace-nowrap z-20">
                      Realized + Unrealized Spot Accumulation
                    </div>
                  </div>

                  {/* Card 2: Trade win % */}
                  <div className="relative group bg-cardBg border border-cardBorder hover:border-purple-200 transition-all duration-200 rounded-2xl p-4 shadow-card flex flex-col justify-between hover:shadow-md cursor-pointer">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 mb-2 group-hover:bg-purple-50 group-hover:text-brandPurple transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                        <span>Trade win%</span>
                        <svg className="w-3 h-3 text-gray-300 group-hover:text-brandPurple transition-colors" fill="currentColor" viewBox="0 0 20 20">
                          <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0118 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-xl font-bold text-brandDark mt-0.5 font-mono">
                        {unrealizedPnlPercent.toFixed(2)}%
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-8 left-4 bg-gray-900 text-white text-[10px] py-1 px-2.5 rounded-md shadow-lg whitespace-nowrap z-20">
                      High-R asymmetry: 24/76 wins with 3.8x avg R:R
                    </div>
                  </div>

                  {/* Card 3: Profit factor */}
                  <div className="relative group bg-cardBg border border-cardBorder hover:border-purple-200 transition-all duration-200 rounded-2xl p-4 shadow-card flex flex-col justify-between hover:shadow-md cursor-pointer">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 mb-2 group-hover:bg-purple-50 group-hover:text-brandPurple transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                        <span>Profit factor</span>
                        <svg className="w-3 h-3 text-gray-300 group-hover:text-brandPurple transition-colors" fill="currentColor" viewBox="0 0 20 20">
                          <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0118 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-xl font-bold text-brandDark mt-0.5 font-mono">1.92</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-8 left-4 bg-gray-900 text-white text-[10px] py-1 px-2.5 rounded-md shadow-lg whitespace-nowrap z-20">
                      Gross Profits / Gross Losses = 1.92
                    </div>
                  </div>

                  {/* Card 4: Day win % */}
                  <div className="relative group bg-cardBg border border-cardBorder hover:border-purple-200 transition-all duration-200 rounded-2xl p-4 shadow-card flex flex-col justify-between hover:shadow-md cursor-pointer">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 mb-2 group-hover:bg-purple-50 group-hover:text-brandPurple transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                        <span>Day win ()</span>
                        <svg className="w-3 h-3 text-gray-300 group-hover:text-brandPurple transition-colors" fill="currentColor" viewBox="0 0 20 20">
                          <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0118 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-xl font-bold text-brandDark mt-0.5 font-mono">57.58%</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-8 left-4 bg-gray-900 text-white text-[10px] py-1 px-2.5 rounded-md shadow-lg whitespace-nowrap z-20">
                      19 Positive Days / 33 Total Session Days
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Daily Net Cumulative P&L Curve (8 cols) */}
              <div
                className="lg:col-span-8 bg-cardBg border border-cardBorder rounded-2xl p-6 shadow-card flex flex-col justify-between relative overflow-hidden"
                onMouseMove={handleSplineMouseMove}
                onMouseLeave={handleSplineMouseLeave}
              >
                {/* Chart Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-brandDark">Daily Net Cumulative P&amp;L</h2>
                    <div className="group relative cursor-pointer">
                      <svg className="w-3.5 h-3.5 text-gray-400 hover:text-brandPurple transition-colors" fill="currentColor" viewBox="0 0 20 20">
                        <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0118 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd" />
                      </svg>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute left-0 top-5 bg-gray-900 text-white text-[10px] py-1.5 px-3 rounded-lg shadow-lg whitespace-nowrap z-40">
                        Tracks spot DCA cost-basis against cumulative portfolio valuation
                      </div>
                    </div>
                  </div>
                  {/* Legend & Hint */}
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-1 rounded-full bg-brandPurple" /> Cumulative P&amp;L
                    </span>
                    <span className="hidden sm:inline-block text-[10px] bg-purple-50 text-brandPurple px-2 py-0.5 rounded-md font-medium border border-purple-100">
                      Hover across curve
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
                      <linearGradient id="purpleGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
                        <stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                      </linearGradient>
                      <pattern id="dotPattern" width="8" height="8" patternUnits="userSpaceOnUse" x="0" y="0">
                        <circle cx="2" cy="2" r="1" fill="#A78BFA" opacity="0.6" />
                      </pattern>
                    </defs>

                    {/* Horizontal Background Guide Lines */}
                    <g className="text-[10px] fill-gray-300 font-sans" stroke="#F1F5F9" strokeDasharray="4,4" strokeWidth="1">
                      <text fill="#9CA3AF" stroke="none" x="5" y="24">$60k -</text>
                      <line x1="50" x2="820" y1="20" y2="20" />
                      <text fill="#9CA3AF" stroke="none" x="5" y="60">$50k -</text>
                      <line x1="50" x2="820" y1="56" y2="56" />
                      <text fill="#9CA3AF" stroke="none" x="5" y="96">$40k -</text>
                      <line x1="50" x2="820" y1="92" y2="92" />
                      <text fill="#9CA3AF" stroke="none" x="5" y="132">$30k -</text>
                      <line x1="50" x2="820" y1="128" y2="128" />
                      <text fill="#9CA3AF" stroke="none" x="5" y="168">$20k -</text>
                      <line x1="50" x2="820" y1="164" y2="164" />
                      <text fill="#9CA3AF" stroke="none" x="5" y="204">$10k -</text>
                      <line x1="50" x2="820" y1="200" y2="200" />
                      <text fill="#9CA3AF" stroke="none" x="5" y="238">$0k -</text>
                      <line x1="50" x2="820" y1="234" y2="234" />
                    </g>

                    {/* Vertical Hatched Accumulation Zones */}
                    <path d="M 220,105 L 240,115 C 270,140 280,165 310,165 C 330,165 350,145 375,120 L 375,234 L 220,234 Z" fill="url(#dotPattern)" opacity="0.6" />
                    <path d="M 525,115 C 560,150 580,175 605,175 C 630,175 660,140 685,145 L 685,234 L 525,234 Z" fill="url(#dotPattern)" opacity="0.45" />

                    {/* Gradient Area under wave */}
                    <path
                      d="M 60,135 C 90,135 110,80 150,75 C 190,70 215,110 240,115 C 270,120 285,165 310,165 C 340,165 360,140 380,118 C 400,96 420,55 450,55 C 480,55 500,100 525,115 C 555,133 570,175 605,175 C 635,175 655,130 690,130 C 725,130 750,175 780,175 C 800,175 810,120 820,105 L 820,234 L 60,234 Z"
                      fill="url(#purpleGradient)"
                    />

                    {/* The Violet Spline Wave Curve */}
                    <path
                      d="M 60,135 C 90,135 110,80 150,75 C 190,70 215,110 240,115 C 270,120 285,165 310,165 C 340,165 360,140 380,118 C 400,96 420,55 450,55 C 480,55 500,100 525,115 C 555,133 570,175 605,175 C 635,175 655,130 690,130 C 725,130 750,175 780,175 C 800,175 810,120 820,105"
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Key Points */}
                    <circle cx="310" cy="165" r="3.5" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="2.5" className="cursor-pointer" />
                    <circle cx="450" cy="55" r="4.5" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="2.5" className="cursor-pointer" />
                    <circle cx="605" cy="175" r="3.5" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="2.5" className="cursor-pointer" />
                    <circle cx="810" cy="120" r="3.5" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="2.5" className="cursor-pointer" />

                    {/* Dynamic Guideline */}
                    {hoverSpline.visible && (
                      <line
                        x1={hoverSpline.x}
                        x2={hoverSpline.x}
                        y1="20"
                        y2="234"
                        stroke="#8B5CF6"
                        strokeDasharray="3,3"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Dynamic Moving Highlight Point */}
                    {hoverSpline.visible && (
                      <g transform={`translate(${hoverSpline.x}, ${hoverSpline.y + 12})`}>
                        <circle cx="0" cy="0" r="14" fill="#8B5CF6" opacity="0.3" className="pulse-halo" />
                        <circle cx="0" cy="0" r="5" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="2.5" />
                      </g>
                    )}
                  </svg>

                  {/* Floating Tooltip Card */}
                  {hoverSpline.visible && (
                    <div
                      className="absolute pointer-events-none z-40 bg-white/95 backdrop-blur-md border border-purple-100 shadow-elevated-tooltip rounded-xl p-3 text-xs w-48 -translate-x-1/2 -translate-y-full"
                      style={{ left: hoverSpline.x, top: hoverSpline.y }}
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 mb-1.5">
                        <span className="font-semibold text-gray-500 text-[10px] uppercase tracking-wider">{hoverSpline.date}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-brandPurple">{hoverSpline.tag}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-gray-400 text-[11px]">Net Valuation</span>
                        <span className="text-sm font-extrabold text-brandDark font-mono">{hoverSpline.val}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-dashed border-gray-100 text-emerald-600 font-medium font-mono">
                        <span>Cycle Return</span>
                        <span>{hoverSpline.chg}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline X-Axis Labels */}
                <div className="flex justify-between items-center text-[11px] text-gray-400 font-medium pl-10 pr-2 pt-2 border-t border-gray-100">
                  <span>05 Jun, 2026</span>
                  <span>09 Jun, 2026</span>
                  <span>13 Jun, 2026</span>
                  <span>17 Jun, 2026</span>
                  <span>21 Jun, 2026</span>
                  <span>25 Jun, 2026</span>
                </div>
              </div>
            </section>

            {/* BEGIN: BottomAnalyticsGrid */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative pb-10" data-purpose="secondary-confluence-analytics">
              {/* Column 1: Net Daily P&L Bar Chart (5 cols) */}
              <div className="lg:col-span-5 bg-cardBg border border-cardBorder rounded-2xl p-5 shadow-card flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-brandDark">Net Daily P&amp;L</h3>
                    <div className="group relative cursor-pointer">
                      <svg className="w-3.5 h-3.5 text-gray-400 hover:text-brandPurple transition-colors" fill="currentColor" viewBox="0 0 20 20">
                        <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0118 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd" />
                      </svg>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute left-0 top-5 bg-gray-900 text-white text-[10px] py-1 px-2.5 rounded-md shadow-lg whitespace-nowrap z-30">
                        Daily spot buy/sell inflows and realized distributions
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400">19 Recorded Sessions</span>
                </div>

                {/* Bar Chart Component */}
                <div className="relative w-full h-[210px] bar-chart-group">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 450 200">
                    <g className="text-[9px] fill-gray-400 font-sans pointer-events-none">
                      <text x="5" y="16">$10k -</text>
                      <line stroke="#F1F5F9" strokeDasharray="3,3" x1="40" x2="450" y1="12" y2="12" />
                      <text x="5" y="44">$8k -</text>
                      <line stroke="#F1F5F9" strokeDasharray="3,3" x1="40" x2="450" y1="40" y2="40" />
                      <text x="5" y="72">$6k -</text>
                      <line stroke="#F1F5F9" strokeDasharray="3,3" x1="40" x2="450" y1="68" y2="68" />
                      <text x="5" y="100">$4k -</text>
                      <line stroke="#F1F5F9" strokeDasharray="3,3" x1="40" x2="450" y1="96" y2="96" />
                      <text x="5" y="128">$2k -</text>
                      <line stroke="#F1F5F9" strokeDasharray="3,3" x1="40" x2="450" y1="124" y2="124" />
                      <text className="font-bold fill-gray-500" x="5" y="156">$0k -</text>
                      <line stroke="#E2E8F0" strokeWidth="1.2" x1="40" x2="450" y1="152" y2="152" />
                      <text x="5" y="184">-$2k -</text>
                      <line stroke="#F1F5F9" strokeDasharray="3,3" x1="40" x2="450" y1="180" y2="180" />
                    </g>

                    {/* 19 Recorded Bars */}
                    {[
                      { x: 58, y: 152, h: 9, isNeg: true, amt: -620, dt: '05 Jun, 2026', tp: 'Minor Outflow' },
                      { x: 78, y: 42, h: 110, isNeg: false, amt: 8420, dt: '06 Jun, 2026', tp: 'Heavy Accumulation' },
                      { x: 98, y: 148, h: 4, isNeg: false, amt: 280, dt: '07 Jun, 2026', tp: 'DCA Accumulation' },
                      { x: 118, y: 152, h: 4, isNeg: true, amt: -310, dt: '08 Jun, 2026', tp: 'Fee Balancing' },
                      { x: 138, y: 148, h: 4, isNeg: false, amt: 340, dt: '09 Jun, 2026', tp: 'DCA Accumulation' },
                      { x: 158, y: 152, h: 4, isNeg: true, amt: -290, dt: '10 Jun, 2026', tp: 'Slight Outflow' },
                      { x: 178, y: 126, h: 26, isNeg: false, amt: 1860, dt: '11 Jun, 2026', tp: 'Volume Expansion' },
                      { x: 198, y: 136, h: 16, isNeg: false, amt: 1140, dt: '12 Jun, 2026', tp: 'DCA Accumulation' },
                      { x: 218, y: 80, h: 72, isNeg: false, amt: 5540, dt: '13 Jun, 2026', tp: 'Institutional Inflow' },
                      { x: 238, y: 152, h: 16, isNeg: true, amt: -1150, dt: '14 Jun, 2026', tp: 'Profit Realization' },
                      { x: 258, y: 120, h: 32, isNeg: false, amt: 2290, dt: '15 Jun, 2026', tp: 'Dip Absorbed' },
                      { x: 278, y: 152, h: 15, isNeg: true, amt: -1080, dt: '16 Jun, 2026', tp: 'Rebalancing' },
                      { x: 298, y: 130, h: 22, isNeg: false, amt: 1580, dt: '17 Jun, 2026', tp: 'Inflow Trend' },
                      { x: 318, y: 136, h: 16, isNeg: false, amt: 1120, dt: '18 Jun, 2026', tp: 'Accumulation' },
                      { x: 338, y: 128, h: 24, isNeg: false, amt: 1720, dt: '19 Jun, 2026', tp: 'Inflow Trend' },
                      { x: 358, y: 128, h: 24, isNeg: false, amt: 1720, dt: '20 Jun, 2026', tp: 'Inflow Trend' },
                      { x: 378, y: 152, h: 17, isNeg: true, amt: -1240, dt: '21 Jun, 2026', tp: 'Strategic Hedging' },
                      { x: 398, y: 126, h: 26, isNeg: false, amt: 1860, dt: '22 Jun, 2026', tp: 'Accumulation' },
                      { x: 418, y: 152, h: 3, isNeg: true, amt: -220, dt: '23 Jun, 2026', tp: 'Flat Close' },
                    ].map((bar, i) => (
                      <rect
                        key={i}
                        x={bar.x}
                        y={bar.y}
                        width="10"
                        height={bar.h}
                        rx="1.5"
                        fill={bar.isNeg ? '#EF4444' : '#10B981'}
                        className={`interactive-bar ${bar.isNeg ? 'bar-negative' : ''}`}
                        onMouseEnter={() =>
                          setHoverBar({
                            visible: true,
                            x: bar.x + 5,
                            y: bar.y,
                            date: bar.dt,
                            amount: bar.isNeg ? `-${formatMoney(Math.abs(bar.amt))}` : `+${formatMoney(bar.amt)}`,
                            type: bar.tp,
                            isNeg: bar.isNeg,
                          })
                        }
                        onMouseLeave={() => setHoverBar(null)}
                      />
                    ))}
                  </svg>

                  {/* Bar Floating Dark Tooltip */}
                  {hoverBar && hoverBar.visible && (
                    <div
                      className="absolute pointer-events-none z-30 bg-gray-900 text-white rounded-lg px-3 py-2 text-xs shadow-xl -translate-x-1/2 -translate-y-full font-mono"
                      style={{ left: `${(hoverBar.x / 450) * 100}%`, top: hoverBar.y }}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] text-gray-400 border-b border-gray-800 pb-1 mb-1 font-sans">
                        <span>{hoverBar.date}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-semibold text-[9px] ${
                            hoverBar.isNeg
                              ? 'bg-red-950 text-red-300 border border-red-800/50'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                          }`}
                        >
                          {hoverBar.isNeg ? 'Outflow / Dist' : 'Inflow / Accum'}
                        </span>
                      </div>
                      <div className={`font-bold text-sm tracking-tight ${hoverBar.isNeg ? 'text-red-400' : 'text-emerald-400'}`}>
                        {hoverBar.amount}
                      </div>
                      <div className="text-[9px] text-gray-400 mt-0.5 font-sans">{hoverBar.type}</div>
                    </div>
                  )}
                </div>

                {/* Dates X Axis */}
                <div className="flex justify-between text-[10px] text-gray-400 font-medium pl-8 pr-3 pt-1 border-t border-gray-100">
                  <span>05 Jun, 2026</span>
                  <span>09 Jun, 2026</span>
                  <span>13 Jun, 2026</span>
                  <span>17 Jun, 2026</span>
                </div>
              </div>

              {/* Column 2: Overall Score Radar (3.5 cols) */}
              <div className="lg:col-span-3 bg-cardBg border border-cardBorder rounded-2xl p-5 shadow-card flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-brandDark">Overall score</h3>
                    <div className="group relative cursor-pointer">
                      <svg className="w-3.5 h-3.5 text-gray-400 hover:text-brandPurple transition-colors" fill="currentColor" viewBox="0 0 20 20">
                        <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0118 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd" />
                      </svg>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute left-0 top-5 bg-gray-900 text-white text-[10px] py-1 px-2.5 rounded-md shadow-lg whitespace-nowrap z-30">
                        Multi-axial cycle metrics vs institutional benchmark
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-brandPurple bg-purple-50 px-2 py-0.5 rounded-full">Radar v2.4</span>
                </div>

                {/* Radar Spider Chart */}
                <div className="relative w-full h-[220px] flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 300 240">
                    {/* Level 3 Outer */}
                    <polygon fill="none" points="150,25 240,75 240,175 150,225 60,175 60,75" stroke="#E2E8F0" strokeWidth="1" />
                    {/* Level 2 Mid */}
                    <polygon fill="none" points="150,65 210,95 210,155 150,185 90,155 90,95" stroke="#F1F5F9" strokeWidth="1" />
                    {/* Level 1 Inner */}
                    <polygon fill="none" points="150,105 180,120 180,150 150,165 120,150 120,120" stroke="#F8FAFC" strokeWidth="1" />
                    {/* Spokes */}
                    <line stroke="#E2E8F0" strokeWidth="0.8" x1="150" x2="150" y1="125" y2="25" />
                    <line stroke="#E2E8F0" strokeWidth="0.8" x1="150" x2="240" y1="125" y2="75" />
                    <line stroke="#E2E8F0" strokeWidth="0.8" x1="150" x2="240" y1="125" y2="175" />
                    <line stroke="#E2E8F0" strokeWidth="0.8" x1="150" x2="150" y1="125" y2="225" />
                    <line stroke="#E2E8F0" strokeWidth="0.8" x1="150" x2="60" y1="125" y2="175" />
                    <line stroke="#E2E8F0" strokeWidth="0.8" x1="150" x2="60" y1="125" y2="75" />

                    {/* Translucent Purple Overlay Polygon (Setup A / Current Run) */}
                    <polygon fill="#8B5CF6" fillOpacity="0.18" points="150,55 220,100 215,160 145,200 95,170 100,100" stroke="#8B5CF6" strokeLinejoin="round" strokeWidth="2.5" />

                    {/* Overlapping Warm Orange Polygon (Setup B / Benchmark) */}
                    <polygon fill="none" points="155,35 235,90 230,165 160,180 125,160 135,115" stroke="#F97316" strokeLinejoin="round" strokeWidth="2.2" />

                    {/* Interactive Vertices for Purple Polygon */}
                    {[
                      { cx: 150, cy: 55, m: 'Win Rate (MVRV)', v: `${(mvrv * 50).toFixed(1)}%`, d: '+4.2%' },
                      { cx: 220, cy: 100, m: 'Profit Factor (Mayer)', v: '1.92', d: '+0.32' },
                      { cx: 215, cy: 160, m: 'Recovery Factor (Puell)', v: '1.85', d: '-0.15' },
                      { cx: 145, cy: 200, m: 'Risk:Reward', v: '3.10', d: '+0.65' },
                      { cx: 95, cy: 170, m: 'Max Drawdown', v: '-8.4%', d: '+5.8% (Safer)' },
                      { cx: 100, cy: 100, m: 'Consistency (Hash)', v: '86.5', d: '+8.5' },
                    ].map((pt, i) => (
                      <circle
                        key={i}
                        cx={pt.cx}
                        cy={pt.cy}
                        r="4"
                        fill="#8B5CF6"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        className="radar-vertex"
                        onMouseEnter={() =>
                          setHoverRadar({
                            visible: true,
                            x: pt.cx,
                            y: pt.cy,
                            metric: pt.m,
                            type: 'Current Run',
                            score: pt.v,
                            delta: pt.d,
                            isOrange: false,
                          })
                        }
                        onMouseLeave={() => setHoverRadar(null)}
                      />
                    ))}

                    {/* Interactive Vertices for Orange Polygon */}
                    {[
                      { cx: 155, cy: 35, m: 'Win Rate', v: '91.2%', d: 'Top Quantile' },
                      { cx: 235, cy: 90, m: 'Profit Factor', v: '1.75', d: 'Standard' },
                      { cx: 230, cy: 165, m: 'Recovery Factor', v: '2.10', d: 'Average' },
                      { cx: 160, cy: 180, m: 'Risk:Reward', v: '2.45', d: 'Standard' },
                      { cx: 125, cy: 160, m: 'Max Drawdown', v: '-14.2%', d: 'Moderate' },
                      { cx: 135, cy: 115, m: 'Consistency', v: '78.0', d: 'Standard' },
                    ].map((pt, i) => (
                      <circle
                        key={i}
                        cx={pt.cx}
                        cy={pt.cy}
                        r="3.5"
                        fill="#F97316"
                        stroke="#FFFFFF"
                        strokeWidth="1.8"
                        className="radar-vertex vertex-orange"
                        onMouseEnter={() =>
                          setHoverRadar({
                            visible: true,
                            x: pt.cx,
                            y: pt.cy,
                            metric: pt.m,
                            type: 'Benchmark',
                            score: pt.v,
                            delta: pt.d,
                            isOrange: true,
                          })
                        }
                        onMouseLeave={() => setHoverRadar(null)}
                      />
                    ))}

                    {/* Axis Labels */}
                    <text className="text-[9px] fill-gray-400 font-medium" textAnchor="middle" x="150" y="16">Win%</text>
                    <text className="text-[9px] fill-gray-400 font-medium" textAnchor="start" x="245" y="80">Profit factor</text>
                    <text className="text-[9px] fill-gray-400 font-medium" textAnchor="start" x="245" y="180">Profit Factor</text>
                    <text className="text-[9px] fill-gray-400 font-medium" textAnchor="middle" x="150" y="238">Risk:Reward</text>
                    <text className="text-[9px] fill-gray-400 font-medium" textAnchor="end" x="48" y="180">Max drawdown</text>
                    <text className="text-[9px] fill-gray-400 font-medium" textAnchor="end" x="48" y="80">Consistency</text>
                  </svg>

                  {/* Radar Tooltip */}
                  {hoverRadar && hoverRadar.visible && (
                    <div
                      className="absolute pointer-events-none z-30 bg-white/95 backdrop-blur-md border border-gray-200 shadow-elevated-tooltip rounded-xl p-2.5 text-xs w-44 -translate-x-1/2 -translate-y-full"
                      style={{ left: hoverRadar.x, top: hoverRadar.y }}
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 pb-1 mb-1">
                        <span className="font-bold text-gray-800 text-[11px]">{hoverRadar.metric}</span>
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                            hoverRadar.isOrange
                              ? 'bg-orange-50 text-brandOrange border border-orange-200'
                              : 'bg-purple-50 text-brandPurple border border-purple-200'
                          }`}
                        >
                          {hoverRadar.type}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs font-mono">
                        <span className="text-gray-400 text-[10px]">Score</span>
                        <span className="font-extrabold text-brandDark text-sm">{hoverRadar.score}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1 pt-1 border-t border-dashed border-gray-100 font-mono">
                        <span>Benchmark / Delta</span>
                        <span className={`font-semibold ${hoverRadar.isOrange ? 'text-orange-600' : 'text-emerald-600'}`}>
                          {hoverRadar.delta}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Radar Legend */}
                <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400 font-medium pt-1 border-t border-gray-100">
                  <span className="flex items-center gap-1.5 cursor-pointer hover:text-brandPurple transition-colors">
                    <span className="w-2 h-2 rounded-full bg-brandPurple" /> Current Run
                  </span>
                  <span className="flex items-center gap-1.5 cursor-pointer hover:text-brandOrange transition-colors">
                    <span className="w-2 h-2 rounded-full bg-brandOrange" /> Benchmark
                  </span>
                </div>
              </div>

              {/* Column 3: Recent Trades / Open Positions Table (4 cols) */}
              <div className="lg:col-span-4 bg-cardBg border border-cardBorder rounded-2xl p-5 shadow-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 border-b border-gray-100 pb-2.5 mb-2">
                    <button
                      type="button"
                      onClick={() => setTradeTab('recent')}
                      className={`text-xs font-bold pb-1.5 -mb-2.5 transition-colors cursor-pointer ${
                        tradeTab === 'recent' ? 'text-brandDark border-b-2 border-brandDark' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Recent trades
                    </button>
                    <button
                      type="button"
                      onClick={() => setTradeTab('open')}
                      className={`text-xs font-semibold pb-1.5 transition-colors cursor-pointer ${
                        tradeTab === 'open' ? 'text-brandDark border-b-2 border-brandDark -mb-2.5' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Open Positions
                    </button>
                  </div>

                  {/* Trade Log Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider font-mono">
                          <th className="py-2 font-medium">Close Date</th>
                          <th className="py-2 font-medium text-center">Symbol</th>
                          <th className="py-2 font-medium text-right">Net P&amp;L</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-[11px] font-medium text-gray-700">
                        {tradeTab === 'open' ? (
                          <>
                            <tr className="hover:bg-purple-50/40 transition-colors group cursor-pointer" onClick={() => setActiveRail(3)}>
                              <td className="py-2 text-gray-500 font-mono text-[10px]">Spot Vault</td>
                              <td className="py-2 font-bold text-center text-gray-800">BTC/USDT</td>
                              <td className="py-2 text-right font-bold text-brandGreen font-mono">
                                +{formatMoney(unrealizedPnlUsd)}
                              </td>
                            </tr>
                            <tr className="hover:bg-purple-50/40 transition-colors group cursor-pointer">
                              <td className="py-2 text-gray-500 font-mono text-[10px]">Cost Basis</td>
                              <td className="py-2 font-bold text-center text-gray-800 font-mono">{totalBtc.toFixed(4)} BTC</td>
                              <td className="py-2 text-right font-bold text-gray-600 font-mono">
                                {formatMoney(summary?.totalInvestedUsd ?? 45000)}
                              </td>
                            </tr>
                            <tr className="hover:bg-purple-50/40 transition-colors group cursor-pointer">
                              <td className="py-2 text-gray-500 font-mono text-[10px]">Avg Price</td>
                              <td className="py-2 font-bold text-center text-gray-800 font-mono">DCA WAC</td>
                              <td className="py-2 text-right font-bold text-brandPurple font-mono">
                                {formatMoney(summary?.averageBuyPriceUsd ?? 58240)}
                              </td>
                            </tr>
                          </>
                        ) : transactions && transactions.length > 0 ? (
                          transactions.slice(0, 7).map((tx, idx) => (
                            <tr key={tx.id || idx} className="hover:bg-purple-50/40 transition-colors group cursor-pointer" onClick={() => setActiveRail(3)}>
                              <td className="py-2 text-gray-500 font-mono text-[10px] group-hover:text-brandPurple">{tx.date}</td>
                              <td className="py-2 font-bold text-center text-gray-800">BTC/USDT</td>
                              <td className="py-2 text-right font-bold text-brandGreen font-mono group-hover:scale-105 transition-transform">
                                +{formatMoney(tx.amountBtc * tx.priceUsd)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          [
                            { dt: '06/07/2026', sym: 'AAPL', amt: '-$7.89', isNeg: true },
                            { dt: '06/08/2026', sym: 'MSFT', amt: '+$5.45', isNeg: false },
                            { dt: '06/09/2026', sym: 'GOOGLE', amt: '-$3.12', isNeg: true },
                            { dt: '06/10/2026', sym: 'AMZN', amt: '+$8.78', isNeg: false },
                            { dt: '06/11/2026', sym: 'TSLA', amt: '-$2.34', isNeg: true },
                            { dt: '06/12/2026', sym: 'FB', amt: '+$1.90', isNeg: false },
                            { dt: '06/13/2026', sym: 'NFLX', amt: '-$4.67', isNeg: true },
                          ].map((row, i) => (
                            <tr key={i} className="hover:bg-purple-50/40 transition-colors group cursor-pointer">
                              <td className="py-2 text-gray-500 font-mono text-[10px] group-hover:text-brandPurple">{row.dt}</td>
                              <td className="py-2 font-bold text-center text-gray-800">{row.sym}</td>
                              <td className={`py-2 text-right font-bold font-mono group-hover:scale-105 transition-transform ${row.isNeg ? 'text-brandRed' : 'text-brandGreen'}`}>
                                {row.amt}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setActiveRail(3)}
                    className="text-[11px] font-semibold text-brandPurple hover:underline inline-flex items-center gap-1 group cursor-pointer"
                  >
                    View comprehensive history <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>
                </div>
              </div>

              {/* BEGIN: FloatingSearchPill */}
              <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4" data-purpose="floating-ai-bar">
                <form
                  onSubmit={handleAiSubmit}
                  className="backdrop-blur-md bg-white/90 border border-purple-200/80 shadow-float-pill rounded-full py-2.5 px-4 flex items-center gap-3 group hover:bg-white transition-all hover:scale-[1.02]"
                >
                  <div
                    onClick={() => setCommandPaletteOpen(true)}
                    className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-brandPurple text-xs font-bold cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="bg-transparent border-0 focus:ring-0 p-0 text-xs text-gray-700 placeholder-gray-400 font-medium w-full focus:outline-none"
                    placeholder="Ask Anything about Bitcoin cycle..."
                    type="text"
                  />
                  <button
                    type="button"
                    onClick={() => setCommandPaletteOpen(true)}
                    className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
                  >
                    AI
                  </button>
                </form>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
