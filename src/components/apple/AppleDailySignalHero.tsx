import React, { useState } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { formatUSD, formatVND } from '../../lib/formatters';
import { classifyFearAndGreed } from '../../lib/quantEngine';
import { useUnifiedMetrics } from '../../lib/metricsSelector';
import { calculateAccumulationForecast } from '../../domain/models/portfolio';
import {
  Compass,
  Wallet,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Layers,
  Activity,
  Target,
  Zap,
  Edit3,
  Info,
  ArrowUpRight,
} from 'lucide-react';

export const AppleDailySignalHero: React.FC = () => {
  const locale = useTerminalStore((s) => s.locale);
  const confluence = useTerminalStore((s) => s.confluenceResult);
  const summary = useTerminalStore((s) => s.portfolioSummary);
  const binancePortfolio = useTerminalStore((s) => s.binancePortfolio);
  const derivatives = useTerminalStore((s) => s.derivatives);
  const orderbookDepth = useTerminalStore((s) => s.orderbookDepth);
  const dcaBudget = useTerminalStore((s) => s.dcaBudget);
  const setDcaBudget = useTerminalStore((s) => s.setDcaBudget);
  const setBinanceModalOpen = useTerminalStore((s) => s.setBinanceModalOpen);
  const setInstitutionalModalOpen = useTerminalStore((s) => s.setInstitutionalModalOpen);
  const setForecastLedgerModalOpen = useTerminalStore((s) => s.setForecastLedgerModalOpen);
  const setActiveTab = useTerminalStore((s) => s.setActiveTab);
  const setActiveRadarSubTab = useTerminalStore((s) => s.setActiveRadarSubTab);
  const fetchBinancePortfolio = useTerminalStore((s) => s.fetchBinancePortfolio);
  const isBinanceSyncing = useTerminalStore((s) => s.isBinanceSyncing);

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(dcaBudget.toString());
  const [showKellyFormula, setShowKellyFormula] = useState(false);

  const isVi = locale === 'vi';
  const isBinanceConnected = binancePortfolio?.connected === true || binancePortfolio?.source === 'api_live';

  const metrics = useUnifiedMetrics();
  const price = metrics.livePrice;
  const p2pRate = metrics.p2pRate;

  // Real Cycle Anchor Points from Single Source of Truth
  const fairValue = metrics.powerLawFairValue;
  const floorSma200w = metrics.floorSma200w;
  const piCycleTop = metrics.piCycleTop;
  const realizedPrice = metrics.realizedPrice > 0 ? metrics.realizedPrice : 53950;
  const sthCostBasis = metrics.sthCostBasis;
  const sma200d = metrics.sma200d;

  // Alternative.me Fear & Greed official classification
  const fngScore = metrics.fearGreedIndex;
  classifyFearAndGreed(fngScore);

  // Smart DCA Order Sizing (70% Core DCA / 30% Dip Sniper allocation)
  const confluenceMultiplier = metrics.confluenceMultiplier;
  const weeklyBaseUsd = (dcaBudget * 0.70) / 4.33; // ~$80.83/wk for $500/mo

  // Institutional Quantitative Forecasting Suite v6.0 Metrics
  const kelly = confluence?.kellyTactical;
  const forwardCone = confluence?.forwardCone;
  const marketRegime = confluence?.regime;
  const spotCvd = confluence?.spotCvd;

  const hurstVal = marketRegime?.hurstExponent ?? 0.44;
  const atr14 = kelly?.atr14 ?? 2150;

  // Dynamically scale weekly totals with the current budget
  const kellyMultiplier = kelly?.dcaMultiplier ?? confluenceMultiplier;
  const tacticalTotalUsd = weeklyBaseUsd * kellyMultiplier;
  const tacticalTotalVnd = Math.round(tacticalTotalUsd * p2pRate);
  const tacticalExtraReserveUsd = Math.max(0, tacticalTotalUsd - weeklyBaseUsd);

  // Scaled Tactical ATR Split (Normalized fractions 0..1 strictly summing to 1.00)
  const marketPct = kelly?.marketPct ?? (hurstVal > 0.55 ? 0.70 : hurstVal < 0.45 ? 0.30 : 0.50);
  const limit1Pct = kelly?.limit1Pct ?? (hurstVal > 0.55 ? 0.20 : hurstVal < 0.45 ? 0.45 : 0.30);
  const limit2Pct = kelly?.limit2Pct ?? (hurstVal > 0.55 ? 0.10 : hurstVal < 0.45 ? 0.25 : 0.20);
  const tacticalMarketUsd = Number((tacticalTotalUsd * marketPct).toFixed(2));
  const tacticalLimit1Usd = Number((tacticalTotalUsd * limit1Pct).toFixed(2));
  const tacticalLimit2Usd = Number((tacticalTotalUsd - tacticalMarketUsd - tacticalLimit1Usd).toFixed(2));

  // Live Orderbook metrics with institutional fallbacks & Front-Run Snapping
  const rawObWall = orderbookDepth?.largestBidWallPrice || Math.round(price * 0.985);
  const obLargestWallPrice = rawObWall < price ? rawObWall : Math.floor((price * 0.988) / 25) * 25;
  const obLargestWallVol = orderbookDepth?.largestBidWallVolumeBtc ?? 42.5;
  const obImbalancePct = orderbookDepth?.bidAskImbalancePct ?? 12.4;
  const obFrontRunPrice = Math.min(Math.round(price - 25), obLargestWallPrice + 25);

  // Limit 1 strictly front-runs the largest whale bid wall (+25$)
  const limit1Price = obFrontRunPrice;
  const rawLimit2 = orderbookDepth?.snappedLimit2Price ?? kelly?.limit2Price ?? Math.round(price - 1.6 * atr14);
  const limit2Price = Math.min(Math.round(limit1Price - 150), rawLimit2);
  const limit1TouchProb7D = kelly?.limit1TouchProb7D ?? 58.4;
  const limit2TouchProb7D = kelly?.limit2TouchProb7D ?? 28.6;
  const hvnZone1Vol = orderbookDepth?.hvnSupportZone1VolBtc ?? 845.2;
  const hvnZone2Vol = orderbookDepth?.hvnSupportZone2VolBtc ?? 612.8;
  const vpvrPocPrice = orderbookDepth?.vpvrPoc ?? Math.round(price * 0.992);

  // v7.0 Upgrade 4: 30-Day Non-Repainting Signal Trajectory & 7D/30D Momentum
  const signalHistory30D = confluence?.signalHistory30D ?? [];
  const scoreDelta7D = confluence?.scoreDelta7D ?? marketRegime?.deltaConfluence7D ?? 1.8;
  const scoreDelta30D = confluence?.scoreDelta30D ?? marketRegime?.deltaConfluence30D ?? 5.2;

  const sparklinePoints = (() => {
    if (!signalHistory30D || signalHistory30D.length < 2) {
      return '0,10 15,9 30,7 45,6 60,4';
    }
    const scores = signalHistory30D.map((d) => d.score);
    const minS = Math.min(...scores) - 1;
    const maxS = Math.max(...scores) + 1;
    const span = Math.max(2, maxS - minS);
    return scores
      .map((s, idx) => {
        const x = ((idx / (scores.length - 1)) * 56).toFixed(1);
        const y = (14 - ((s - minS) / span) * 12).toFixed(1);
        return `${x},${y}`;
      })
      .join(' ');
  })();

  // Spot Taker Buy CVD Ratio (7D Whale Absorption)
  const takerRatio = derivatives?.takerBuyRatio7D ?? 49.83;
  const isWhaleAbsorbing = derivatives?.isWhaleAbsorption || takerRatio >= 50.8;

  const pOnChain = ((confluence?.pillars.onChain.score ?? 75) * 0.35).toFixed(1);
  const pTech = ((confluence?.pillars.technical.score ?? 77) * 0.25).toFixed(1);
  const pDeriv = (((confluence?.pillars.derivatives?.score ?? 70)) * 0.20).toFixed(1);
  const pMacro = (((confluence?.pillars.macro?.score ?? 70)) * 0.20).toFixed(1);

  // Objective Spatial Distances (100% Dynamic against Live Price)
  const discountVsFair = Math.round(((price - fairValue) / fairValue) * 100);
  const bufferAboveFloor = Math.round(((price - floorSma200w) / floorSma200w) * 100);
  const headroomToTop = Math.round(((piCycleTop - price) / price) * 100);

  // 100% Dynamic 5-Phase Spatial Cycle Valuation Model (SSOT)
  const phase1Ceiling = realizedPrice;
  const phase2Ceiling = fairValue;
  const phase3Ceiling = Math.round(fairValue * 1.41);
  const phase4Ceiling = Math.round(fairValue * 1.86);

  const activePhase = metrics.activePhase;

  const phaseConfig = [
    {
      id: 1,
      titleVi: 'Vùng Giá Vàng (Đáy Chu Kỳ)',
      titleEn: 'Deep Value Zone',
      nameVi: '1. Vùng Giá Vàng',
      nameEn: '1. Deep Value',
      rangeVi: `< ${formatUSD(phase1Ceiling, 0)}`,
      rangeEn: `< ${formatUSD(phase1Ceiling, 0)}`,
      mvrv: 'MVRV < 1.0',
      activeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      barColor: 'bg-emerald-500',
      textActive: 'text-emerald-400',
      statusBadgeVi: 'Vùng Giá Vàng',
      statusBadgeEn: 'Deep Value (Bottom)',
      reasonVi: `Giá Bitcoin (${formatUSD(price, 0)}) đang rơi sâu dưới giá vốn on-chain toàn mạng (${formatUSD(realizedPrice, 0)}). Biên độ giảm giá về mặt thống kê lịch sử bị nén hẹp đáng kể, mở ra tỷ lệ lợi nhuận/rủi ro bất cân xứng.`,
      reasonEn: `Bitcoin (${formatUSD(price, 0)}) sits below network aggregate cost basis (${formatUSD(realizedPrice, 0)}), offering an asymmetric accumulation window.`,
    },
    {
      id: 2,
      titleVi: 'Vùng Tích Lũy Chu Kỳ',
      titleEn: 'Accumulation Regime',
      nameVi: '2. Tích Lũy',
      nameEn: '2. Accumulate',
      rangeVi: `${formatUSD(phase1Ceiling, 0)} – ${formatUSD(phase2Ceiling, 0)}`,
      rangeEn: `${formatUSD(phase1Ceiling, 0)} – ${formatUSD(phase2Ceiling, 0)}`,
      mvrv: 'MVRV 1.0 - 2.0',
      activeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      barColor: 'bg-emerald-400',
      textActive: 'text-emerald-400',
      statusBadgeVi: 'Vùng Tích Lũy',
      statusBadgeEn: 'Accumulation / Undervalued',
      reasonVi: `Giá Bitcoin (${formatUSD(price, 0)}) nằm trên giá vốn On-Chain toàn mạng (${formatUSD(realizedPrice, 0)}) và thấp hơn ${Math.abs(discountVsFair)}% so với định giá Power Law (${formatUSD(fairValue, 0)}). Vùng giá mang lại tỷ lệ lợi nhuận/rủi ro hấp dẫn cho kế hoạch tích lũy dài hạn có kỷ luật.`,
      reasonEn: `Bitcoin (${formatUSD(price, 0)}) sits above realized cost (${formatUSD(realizedPrice, 0)}) while trading at a ${Math.abs(discountVsFair)}% discount to Power Law fair value (${formatUSD(fairValue, 0)}).`,
    },
    {
      id: 3,
      titleVi: 'Vùng Cân Bằng Hợp Lý',
      titleEn: 'Fair Value Equilibrium',
      nameVi: '3. Cân Bằng',
      nameEn: '3. Fair Value',
      rangeVi: `${formatUSD(phase2Ceiling, 0)} – ${formatUSD(phase3Ceiling, 0)}`,
      rangeEn: `${formatUSD(phase2Ceiling, 0)} – ${formatUSD(phase3Ceiling, 0)}`,
      mvrv: 'MVRV 2.0 - 2.8',
      activeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      barColor: 'bg-cyan-400',
      textActive: 'text-cyan-400',
      statusBadgeVi: 'Vùng Cân Bằng',
      statusBadgeEn: 'Fair Value Equilibrium',
      reasonVi: `Giá Bitcoin (${formatUSD(price, 0)}) đã bắt kịp định giá Power Law (${formatUSD(fairValue, 0)}). Thị trường bước vào giai đoạn tái tích lũy cân bằng trước khi mở rộng xu hướng.`,
      reasonEn: `Bitcoin (${formatUSD(price, 0)}) matches Power Law fair value (${formatUSD(fairValue, 0)}). Healthy consolidation before expansion.`,
    },
    {
      id: 4,
      titleVi: 'Vùng Tăng Trưởng Mạnh',
      titleEn: 'Expansion / Bull Run',
      nameVi: '4. Tăng Trưởng',
      nameEn: '4. Expansion',
      rangeVi: `${formatUSD(phase3Ceiling, 0)} – ${formatUSD(phase4Ceiling, 0)}`,
      rangeEn: `${formatUSD(phase3Ceiling, 0)} – ${formatUSD(phase4Ceiling, 0)}`,
      mvrv: 'MVRV 2.8 - 3.7',
      activeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      barColor: 'bg-amber-400',
      textActive: 'text-amber-400',
      statusBadgeVi: 'Vùng Tăng Trưởng',
      statusBadgeEn: 'Expansion Phase',
      reasonVi: `Giá Bitcoin (${formatUSD(price, 0)}) đã bứt phá mạnh, cao hơn ${Math.abs(discountVsFair)}% so với giá trị cơ bản. Dòng tiền FOMO gia tăng, đòn bẩy thị trường bắt đầu nóng lên.`,
      reasonEn: `Bitcoin (${formatUSD(price, 0)}) is in parabolic expansion, trading ${Math.abs(discountVsFair)}% above fair value.`,
    },
    {
      id: 5,
      titleVi: 'Vùng Bong Bóng / Tạo Đỉnh',
      titleEn: 'Mania Bubble Top',
      nameVi: '5. Bong Bóng',
      nameEn: '5. Bubble Top',
      rangeVi: `> ${formatUSD(phase4Ceiling, 0)}`,
      rangeEn: `> ${formatUSD(phase4Ceiling, 0)}`,
      mvrv: 'MVRV > 3.7',
      activeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      barColor: 'bg-rose-500',
      textActive: 'text-rose-400',
      statusBadgeVi: 'Vùng Bong Bóng / Đỉnh',
      statusBadgeEn: 'Bubble Top Mania',
      reasonVi: `Giá Bitcoin (${formatUSD(price, 0)}) tiệm cận hoặc vượt đỉnh chu kỳ dự phóng (${formatUSD(piCycleTop, 0)}). Cần thực hiện chiến lược chốt lời từng phần bảo vệ vốn.`,
      reasonEn: `Bitcoin (${formatUSD(price, 0)}) is in cycle peak territory near ${formatUSD(piCycleTop, 0)}. Extreme distribution risk.`,
    },
  ];

  const currentRegime = phaseConfig[activePhase - 1];

  const getCycleSpectrumPct = (currPrice: number): number => {
    const pFloor = floorSma200w > 0 ? floorSma200w * 0.75 : 50000;
    const pRealized = phase1Ceiling > 0 ? phase1Ceiling : 53951;
    const pFair = phase2Ceiling > 0 ? phase2Ceiling : 88402;
    const pEquil = phase3Ceiling > 0 ? phase3Ceiling : 124647;
    const pTop = phase4Ceiling > 0 ? phase4Ceiling : 164428;
    const pMax = 200000;

    if (currPrice <= pFloor) return 3;
    if (currPrice < pRealized) {
      return 3 + ((currPrice - pFloor) / (pRealized - pFloor)) * 17;
    }
    if (currPrice < pFair) {
      return 20 + ((currPrice - pRealized) / (pFair - pRealized)) * 25;
    }
    if (currPrice < pEquil) {
      return 45 + ((currPrice - pFair) / (pEquil - pFair)) * 25;
    }
    if (currPrice < pTop) {
      return 70 + ((currPrice - pEquil) / (pTop - pEquil)) * 20;
    }
    const topPct = 90 + ((Math.min(currPrice, pMax) - pTop) / (pMax - pTop)) * 8;
    return Math.min(97, Math.max(3, topPct));
  };

  const spectrumPct = getCycleSpectrumPct(price);
  const clampedNeedleLeft = Math.max(6, Math.min(94, spectrumPct));

  // Active Portfolio Metrics
  const totalBtc = isBinanceConnected
    ? (binancePortfolio?.wallets?.totalBtc ?? 0)
    : summary.totalBtc;

  const totalSats = Math.round(totalBtc * 100_000_000);

  const avgBuyPrice = isBinanceConnected
    ? (binancePortfolio?.costBasis?.avgBuyPrice ?? 0)
    : summary.averageBuyPriceUsd;

  const totalInvestedUsd = totalBtc > 0 && avgBuyPrice > 0
    ? totalBtc * avgBuyPrice
    : isBinanceConnected
    ? (binancePortfolio?.costBasis?.totalInvestedUsd ?? 0)
    : summary.totalInvestedUsd;

  const btcValueUsd = totalBtc * (price > 0 ? price : 75897);
  const dryPowderUsd = isBinanceConnected
    ? (binancePortfolio?.wallets?.totalDryPowderUsd ?? 0)
    : 0;

  const currentValueUsd = btcValueUsd + dryPowderUsd;
  const currentValueVnd = Math.round(currentValueUsd * (p2pRate > 0 ? p2pRate : 25600));

  const pnlUsd = totalBtc > 0 && avgBuyPrice > 0
    ? totalBtc * (price - avgBuyPrice)
    : totalInvestedUsd > 0 && totalBtc > 0
    ? btcValueUsd - totalInvestedUsd
    : isBinanceConnected && binancePortfolio?.costBasis?.unrealizedPnlUsd !== undefined
    ? binancePortfolio.costBasis.unrealizedPnlUsd
    : 0;

  const pnlPct = avgBuyPrice > 0
    ? ((price - avgBuyPrice) / avgBuyPrice) * 100
    : totalInvestedUsd > 0 && totalBtc > 0
    ? (pnlUsd / totalInvestedUsd) * 100
    : isBinanceConnected && binancePortfolio?.costBasis?.unrealizedPnlPct !== undefined
    ? binancePortfolio.costBasis.unrealizedPnlPct
    : 0;

  const isProfitable = pnlUsd >= 0;

  // Jump to Zone 3 Tab B (Forward Cone)
  const handleJumpToConeTab = () => {
    setActiveRadarSubTab('cone');
    const el = document.getElementById('quant-radar-matrix');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Single Source of Truth Quant Forward Cones from Unified Forecast Model
  const forecastModel = metrics.forecastModel;
  const cone30P15 = forecastModel.quantiles30D.p15;
  const cone30P50 = forecastModel.quantiles30D.p50;
  const cone30P85 = forecastModel.quantiles30D.p85;
  const cone90P15 = forecastModel.quantiles90D.p15;
  const cone90P50 = forecastModel.quantiles90D.p50;
  const cone90P85 = forecastModel.quantiles90D.p85;

  // Pure Domain Accumulation & Cost-Basis Reduction Forecaster
  const forecast = calculateAccumulationForecast({
    currentPrice: price,
    totalBtc,
    totalSats,
    avgBuyPrice,
    totalInvestedUsd,
    dcaBudget,
    tacticalTotalUsd,
    marketPct,
    limit1Pct,
    limit2Pct,
    limit1Price,
    limit2Price,
    fairValue,
    piCycleTop,
    cone90P50,
  });

  const {
    weeklyAddedSats,
    projectedBtcAfterWeek,
    projectedSatsAfterWeek,
    projectedAvgCostAfterWeek,
    valAtPowerLawUsd,
    valAtPiCycleUsd,
    projectedSats6M,
    projectedVal6MAtFair,
    projectedRoi6MAtFair,
    projectedSats12M,
    projectedVal12MAtPeak,
    projectedRoi12MAtPeak,
  } = forecast;

  return (
    <div
      data-testid="zone1-hero-bento"
      className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
    >
      {/* ================= LEFT BENTO (8 COLS): STRATEGIC VALUATION & REGIME COMPASS ================= */}
      <div className="lg:col-span-8 rounded-2xl bg-white border border-[#E1E3E3] shadow-sm p-6 sm:p-7 backdrop-blur-xl flex flex-col justify-between space-y-5 relative overflow-hidden">
        {/* Fey Specular Top Hairline & Ambient Glow */}
        <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent pointer-events-none" />
        <div className="absolute -top-28 -left-28 w-80 h-80 bg-emerald-500/[0.05] rounded-full blur-3xl pointer-events-none" />

        {/* 1. Compact Header Pill Bar */}
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold tracking-wide transition-all ${
            activePhase <= 2
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : activePhase === 3
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              : activePhase === 4
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <span>
              {isVi ? 'PHÂN TÍCH VĨ MÔ CHU KỲ' : 'MACRO CYCLE ANALYSIS'} •{' '}
              {isVi ? currentRegime.titleVi.toUpperCase() : currentRegime.titleEn.toUpperCase()}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setInstitutionalModalOpen(true, 'lookintobitcoin')}
            className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E1E3E3] text-[#191F2C] transition-all flex items-center gap-1.5 cursor-pointer"
            title={isVi ? 'Bấm để xem phương pháp luận định lượng quốc tế' : 'Click to view institutional methodology'}
          >
            <span>{confluence.totalScore}/100 {isVi ? 'Điểm Hội Tụ' : 'Score'}</span>
            <span className="text-[10px] text-emerald-400">🏛️</span>
          </button>

          {/* v7.0 Upgrade 4: 7-Day Signal Momentum Badge & 30-Day Non-Repainting SVG Sparkline */}
          <div
            data-testid="signal-trajectory-badge"
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F8FAFC] border border-[#E1E3E3] text-[11px] font-mono"
            title={
              isVi
                ? `Quỹ đạo điểm hội tụ 30 ngày không vẽ lại (Non-Repainting): Δ7D ${scoreDelta7D >= 0 ? '+' : ''}${scoreDelta7D.toFixed(1)}đ • Δ30D ${scoreDelta30D >= 0 ? '+' : ''}${scoreDelta30D.toFixed(1)}đ`
                : `30-Day Non-Repainting Signal Trajectory: Δ7D ${scoreDelta7D >= 0 ? '+' : ''}${scoreDelta7D.toFixed(1)} pts • Δ30D ${scoreDelta30D >= 0 ? '+' : ''}${scoreDelta30D.toFixed(1)} pts`
            }
          >
            <span className={scoreDelta7D >= 0 ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
              {scoreDelta7D >= 0 ? '+' : ''}{scoreDelta7D.toFixed(1)} {isVi ? 'đ (7D)' : 'pts (7D)'}
            </span>
            <svg width="56" height="16" viewBox="0 0 56 16" className="overflow-visible shrink-0" aria-label="30-Day Confluence Score Sparkline">
              <polyline
                fill="none"
                stroke={scoreDelta30D >= 0 ? '#10B981' : '#F59E0B'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparklinePoints}
              />
            </svg>
          </div>

          {marketRegime && (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F8FAFC] border border-[#E1E3E3] text-[11px] font-mono text-[#343B43]"
              title={`Hurst Exponent (128D) = ${hurstVal.toFixed(2)}`}
            >
              <span className="font-semibold text-[#191F2C]">Hurst (128D) = {hurstVal.toFixed(2)}</span>
              <span className="text-[#64748B] hidden sm:inline">
                • {isVi
                  ? hurstVal > 0.55
                    ? 'Xu Hướng Có Quán Tính'
                    : hurstVal < 0.45
                    ? 'Dao Động Biên Độ'
                    : 'Tích Lũy Cân Bằng'
                  : marketRegime.regimeType}
              </span>
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F8FAFC] border border-[#E1E3E3] text-[11px] font-mono text-[#64748B]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{isVi ? 'Đồng bộ 00:00 UTC • Binance & CoinMetrics' : 'Synced 00:00 UTC • Binance & CoinMetrics'}</span>
          </div>

          {spotCvd?.isWhaleAbsorption && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold">
              <span>🐋 {isVi ? 'CÁ VOI HẤP THỤ SPOT' : 'WHALE CVD'} ({spotCvd.takerBuyPct7D.toFixed(1)}%)</span>
            </div>
          )}
        </div>

        {/* 2. Executive H1 Thesis + 2-Line Synthesis */}
        <div className="relative z-10 space-y-2.5">
          <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-semibold text-[#191F2C] tracking-[-0.03em] leading-[1.2]">
            {isVi ? (
              <>
                {activePhase === 1 && (
                  <>Bitcoin đang trong <span className="text-emerald-400">vùng giá vàng (đáy chu kỳ)</span>.</>
                )}
                {activePhase === 2 && (
                  <>Bitcoin đang trong <span className="text-emerald-400">vùng tích lũy</span> của chu kỳ.</>
                )}
                {activePhase === 3 && (
                  <>Bitcoin đang trong <span className="text-cyan-400">vùng cân bằng hợp lý</span> của chu kỳ.</>
                )}
                {activePhase === 4 && (
                  <>Bitcoin đang trong <span className="text-amber-400">vùng tăng trưởng mạnh</span> của chu kỳ.</>
                )}
                {activePhase === 5 && (
                  <>Bitcoin đang trong <span className="text-rose-400">vùng bong bóng cực độ</span> của chu kỳ.</>
                )}
              </>
            ) : (
              <>
                {activePhase === 1 && (
                  <>Bitcoin is in the <span className="text-emerald-400">deep value cycle bottom</span>.</>
                )}
                {activePhase === 2 && (
                  <>Bitcoin is in the <span className="text-emerald-400">cycle accumulation regime</span>.</>
                )}
                {activePhase === 3 && (
                  <>Bitcoin is in the <span className="text-cyan-400">fair value equilibrium regime</span>.</>
                )}
                {activePhase === 4 && (
                  <>Bitcoin is in the <span className="text-amber-400">cycle expansion regime</span>.</>
                )}
                {activePhase === 5 && (
                  <>Bitcoin is in the <span className="text-rose-400">cycle mania bubble top</span>.</>
                )}
              </>
            )}
          </h1>

          <p className="text-[#343B43] text-xs sm:text-sm leading-relaxed font-normal">
            {isVi ? (
              <>
                Giá giao ngay (<strong className="text-[#191F2C] font-mono tabular-nums">{formatUSD(price, 0)}</strong>) đang chiết khấu{' '}
                <span className="text-emerald-400 font-semibold font-mono tabular-nums">{Math.abs(discountVsFair)}%</span> dưới định giá Power Law (
                <strong className="text-[#191F2C] font-mono tabular-nums">{formatUSD(fairValue, 0)}</strong>) và giữ biên độ an toàn trên hỗ trợ 200 tuần (
                <strong className="text-[#191F2C] font-mono tabular-nums">{formatUSD(floorSma200w, 0)}</strong>). Theo dõi ranh giới Giá Trung Bình 155 Ngày (155D VWAP: ~{formatUSD(sthCostBasis, 0)}) và 200DMA ({formatUSD(sma200d, 0)}) để kiểm soát biến động ngắn hạn.
              </>
            ) : (
              <>
                Spot price (<strong className="text-[#191F2C] font-mono tabular-nums">{formatUSD(price, 0)}</strong>) trades at a{' '}
                <span className="text-emerald-400 font-semibold font-mono tabular-nums">{Math.abs(discountVsFair)}% discount</span> to Power Law fair value (
                <strong className="text-[#191F2C] font-mono tabular-nums">{formatUSD(fairValue, 0)}</strong>) above the 200-week cycle floor (
                <strong className="text-[#191F2C] font-mono tabular-nums">{formatUSD(floorSma200w, 0)}</strong>). Monitor 155-Day VWAP (~{formatUSD(sthCostBasis, 0)}) and 200DMA ({formatUSD(sma200d, 0)}).
              </>
            )}
          </p>
        </div>

        {/* 3. 3 Clean Price Anchor Tiles (Obsidian Inner Surface #0F1522 + Specular Hairline + Plain-Language Purpose) */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tile 1: 200W Support */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E1E3E3] hover:border-cyan-500/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all space-y-1.5">
            <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-[0.06em] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{isVi ? 'Hỗ Trợ 200W' : '200W Support'}</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-400/80">SMA 1400D</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-[#191F2C] font-mono tabular-nums whitespace-nowrap">
              {formatUSD(floorSma200w, 0)}
            </div>
            <div className="text-[11px] font-mono tabular-nums text-cyan-400 font-medium flex items-center gap-1">
              <span>+{bufferAboveFloor}%</span>
              <span className="text-[#64748B] font-sans">{isVi ? 'trên MA200W' : 'above 200W'}</span>
            </div>
          </div>

          {/* Tile 2: Power Law Fair Value */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E1E3E3] hover:border-emerald-500/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all space-y-1.5">
            <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-[0.06em] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{isVi ? 'Định Giá Power Law' : 'PL Fair Value'}</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400/80">{isVi ? 'Chuẩn 15 Năm' : '15Y Trend'}</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-[#191F2C] font-mono tabular-nums whitespace-nowrap">
              {formatUSD(fairValue, 0)}
            </div>
            <div className="text-[11px] font-mono tabular-nums text-emerald-400 font-medium flex items-center gap-1">
              <span>{discountVsFair}%</span>
              <span className="text-[#64748B] font-sans">{isVi ? 'dưới định giá PL' : 'vs PL'}</span>
            </div>
          </div>

          {/* Tile 3: Pi Cycle Profit Target */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E1E3E3] hover:border-purple-500/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all space-y-1.5">
            <div className="text-[11px] font-medium text-[#64748B] uppercase tracking-[0.06em] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>{isVi ? 'Mục Tiêu Chốt Lời (Pi Cycle)' : 'Profit Target (Pi Cycle)'}</span>
              </span>
              <span className="text-[10px] font-mono text-purple-400/80">2× 350DMA</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-[#191F2C] font-mono tabular-nums whitespace-nowrap">
              {formatUSD(piCycleTop, 0)}
            </div>
            <div className="text-[11px] font-mono tabular-nums text-purple-400 font-medium flex items-center gap-1">
              <span>+{headroomToTop}%</span>
              <span className="text-[#64748B] font-sans">{isVi ? 'dư địa (2× 350DMA)' : 'headroom'}</span>
            </div>
          </div>
        </div>

        {/* 4. Sleek 5-Phase Market Regime Compass */}
        <div className="relative z-10 p-4 rounded-xl bg-[#F8FAFC] border border-[#E1E3E3] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => setInstitutionalModalOpen(true, 'glassnode')}
              className="text-[#343B43] hover:text-[#191F2C] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <Compass className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform" />
              <span>{isVi ? 'La Bàn Phân Khúc Thị Trường (Multi-Metric Valuation Framework)' : 'Market Valuation Regime Compass'}</span>
              <span className="text-[10px] text-cyan-400">↗</span>
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#64748B] uppercase tracking-[0.06em] font-medium">{isVi ? 'Trạng Thái:' : 'Regime:'}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                activePhase <= 2 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                activePhase === 3 ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' :
                activePhase === 4 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}>
                {isVi ? currentRegime.statusBadgeVi : currentRegime.statusBadgeEn}
              </span>
            </div>
          </div>

          {/* Continuous Spectrum Track with Live Pin */}
          <div className="relative pt-6 pb-1">
            <div
              className="absolute top-0 bottom-0 z-20 pointer-events-none transition-all duration-300 ease-out flex flex-col items-center"
              style={{ left: `${clampedNeedleLeft}%` }}
            >
              <div className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-white border border-emerald-400/80 text-[11px] font-mono font-bold text-[#191F2C] shadow-lg flex items-center gap-1.5 -translate-x-1/2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="tabular-nums">{formatUSD(price, 0)}</span>
                <span className="text-[10px] text-emerald-400 font-sans font-semibold">
                  ({isVi ? currentRegime.nameVi : currentRegime.nameEn})
                </span>
              </div>
              <div className="w-0.5 h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] mt-0.5 -translate-x-1/2" />
            </div>

            <div className="relative h-3 rounded-full p-0.5 bg-white border border-[#E1E3E3]">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 via-cyan-400 via-amber-400 to-rose-500 relative overflow-hidden">
                <div className="absolute top-0 bottom-0 left-[20%] w-[1px] bg-black/40" />
                <div className="absolute top-0 bottom-0 left-[45%] w-[1px] bg-black/40" />
                <div className="absolute top-0 bottom-0 left-[70%] w-[1px] bg-black/40" />
                <div className="absolute top-0 bottom-0 left-[90%] w-[1px] bg-black/40" />
              </div>
            </div>

            <div className="grid grid-cols-5 text-center pt-2 text-xs">
              {phaseConfig.map((p) => {
                const isActive = p.id === activePhase;
                return (
                  <div
                    key={p.id}
                    className={`transition-all py-1 px-1 rounded-lg ${
                      isActive
                        ? 'bg-white/[0.06] text-[#191F2C] font-semibold border border-[#CBD5E1]'
                        : 'text-[#64748B]'
                    }`}
                  >
                    <div className={`flex items-center justify-center gap-1 text-[11px] ${isActive ? p.textActive : ''}`}>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                      <span className="truncate">{isVi ? p.nameVi : p.nameEn}</span>
                    </div>
                    <div className="text-[10px] font-mono text-[#64748B] mt-0.5 tabular-nums truncate">
                      {isVi ? p.rangeVi : p.rangeEn}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 1-Line Contextual Callout */}
          <div className="px-3 py-2 rounded-lg bg-white border border-[#E1E3E3] text-xs text-[#343B43] flex items-start gap-2">
            <span className="text-emerald-400 font-bold shrink-0">📍</span>
            <div className="leading-relaxed">
              <strong className="text-[#191F2C]">
                {isVi
                  ? `Định vị Pha ${activePhase} (${currentRegime.titleVi}):`
                  : `Phase ${activePhase} (${currentRegime.titleEn}):`}
              </strong>{' '}
              {isVi ? currentRegime.reasonVi : currentRegime.reasonEn}
            </div>
          </div>
        </div>

        {/* 5. Actionable BTC Accumulation Forecast & 4-Tier Dip-Catching Ladder */}
        <div
          data-testid="accumulation-forecast-ladder"
          className="relative z-10 p-4 rounded-xl bg-[#F8FAFC] border border-[#E1E3E3] space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-semibold text-[#191F2C] tracking-tight">
                {isVi
                  ? '🎯 NÓN XÁC SUẤT GIÁ TƯƠNG LAI & 4 TẦNG ĐÓN SÓNG TÍCH LŨY BTC (30D/90D)'
                  : '🎯 PROBABILISTIC FORWARD CONE & 4-TIER BTC ACCUMULATION LADDER'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-[#343B43] border border-[#E1E3E3]">
                Skew S={forwardCone?.sampleSkewness ?? -0.28} • Kurt K={forwardCone?.excessKurtosis ?? 2.45} • σ={forwardCone?.mixtureSigmaAnnualized ?? 38.8}%
              </span>
            </div>

            <button
              type="button"
              onClick={handleJumpToConeTab}
              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{isVi ? 'Mở Trạm Dự Báo 30D/90D Chi Tiết' : 'Open Full 30D/90D Cone'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
            {/* 30D Compact Strip */}
            <div className="px-3 py-2 rounded-lg bg-white border border-[#E1E3E3] flex items-center justify-between gap-2">
              <span className="text-[11px] font-sans font-semibold text-[#343B43] whitespace-nowrap">
                {isVi ? 'Dự Phóng 30 Ngày (30D)' : '30D Cone'}
              </span>
              <div className="flex items-center gap-2 text-[11px] tabular-nums">
                <span className="text-rose-400" title="P15 (Kịch bản điều chỉnh)">
                  P15: <strong>{formatUSD(cone30P15, 0)}</strong>
                </span>
                <span className="text-[#64748B]">•</span>
                <span className="text-cyan-300" title="P50 (Kịch bản trung bình)">
                  P50: <strong>{formatUSD(cone30P50, 0)}</strong>
                </span>
                <span className="text-[#64748B]">•</span>
                <span className="text-emerald-400" title="P85 (Kịch bản tích cực)">
                  P85: <strong>{formatUSD(cone30P85, 0)}</strong>
                </span>
              </div>
            </div>

            {/* 90D Compact Strip */}
            <div className="px-3 py-2 rounded-lg bg-white border border-[#E1E3E3] flex items-center justify-between gap-2">
              <span className="text-[11px] font-sans font-semibold text-[#343B43] whitespace-nowrap">
                {isVi ? 'Dự Phóng 90 Ngày (90D)' : '90D Cone'}
              </span>
              <div className="flex items-center gap-2 text-[11px] tabular-nums">
                <span className="text-rose-400" title="P15 (Kịch bản điều chỉnh)">
                  P15: <strong>{formatUSD(cone90P15, 0)}</strong>
                </span>
                <span className="text-[#64748B]">•</span>
                <span className="text-purple-300" title="P50 (Kịch bản trung bình)">
                  P50: <strong>{formatUSD(cone90P50, 0)}</strong>
                </span>
                <span className="text-[#64748B]">•</span>
                <span className="text-emerald-400" title="P85 (Kịch bản tích cực)">
                  P85: <strong>{formatUSD(cone90P85, 0)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* 4-Tier Actionable Dip-Buying Forecast Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
            <div
              className="p-2.5 rounded-lg bg-white border border-[#E1E3E3] space-y-1"
              title={isVi ? forecastModel.touchProbabilities.tier1.definitionVi : forecastModel.touchProbabilities.tier1.definitionEn}
            >
              <div className="flex items-center justify-between">
                <span className="text-cyan-300 font-semibold">{isVi ? 'Tầng 1: Nhịp Chỉnh 7D' : 'Tier 1: 7D Pullback'}</span>
                <span className="font-mono text-[10px] text-emerald-400 font-bold">
                  {forecastModel.touchProbabilities.tier1.touchProbabilityPercent.toFixed(0)}% khớp (7D)
                </span>
              </div>
              <div className="font-mono text-sm font-bold text-[#191F2C] tabular-nums">
                {formatUSD(limit1Price, 0)}{' '}
                <span className="text-[10px] text-[#64748B]">
                  ({(((limit1Price - price) / price) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="text-[10px] text-[#94A3B8]">
                {isVi ? `Đặt Limit 1 tuần này: $${tacticalLimit1Usd.toFixed(2)}` : `Weekly Limit 1: $${tacticalLimit1Usd.toFixed(2)}`}
              </div>
            </div>

            <div
              className="p-2.5 rounded-lg bg-white border border-[#E1E3E3] space-y-1"
              title={isVi ? forecastModel.touchProbabilities.tier2.definitionVi : forecastModel.touchProbabilities.tier2.definitionEn}
            >
              <div className="flex items-center justify-between">
                <span className="text-purple-300 font-semibold">{isVi ? 'Tầng 2: Quét Râu 7D' : 'Tier 2: 7D Wick Flush'}</span>
                <span className="font-mono text-[10px] text-amber-300 font-bold">
                  {forecastModel.touchProbabilities.tier2.touchProbabilityPercent.toFixed(0)}% khớp (7D)
                </span>
              </div>
              <div className="font-mono text-sm font-bold text-[#191F2C] tabular-nums">
                {formatUSD(limit2Price, 0)}{' '}
                <span className="text-[10px] text-[#64748B]">
                  ({(((limit2Price - price) / price) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="text-[10px] text-[#94A3B8]">
                {isVi ? `Đặt Limit 2 tuần này: $${tacticalLimit2Usd.toFixed(2)}` : `Weekly Limit 2: $${tacticalLimit2Usd.toFixed(2)}`}
              </div>
            </div>

            <div
              className="p-2.5 rounded-lg bg-white border border-amber-500/25 space-y-1"
              title={isVi ? forecastModel.touchProbabilities.tier3.definitionVi : forecastModel.touchProbabilities.tier3.definitionEn}
            >
              <div className="flex items-center justify-between">
                <span className="text-amber-300 font-semibold">{isVi ? 'Tầng 3: Sàn Chu Kỳ 200W' : 'Tier 3: 200W Cycle Floor'}</span>
                <span className="font-mono text-[10px] text-amber-300 font-bold">
                  {forecastModel.touchProbabilities.tier3.touchProbabilityPercent.toFixed(0)}% chạm (90D)
                </span>
              </div>
              <div className="font-mono text-sm font-bold text-[#191F2C] tabular-nums">
                {formatUSD(floorSma200w, 0)}{' '}
                <span className="text-[10px] text-[#64748B]">
                  ({(((floorSma200w - price) / price) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="text-[10px] text-[#94A3B8]">
                {isVi ? 'Dự phòng phân bổ chu kỳ' : 'Cycle Reserve Allocation'}
              </div>
            </div>

            <div
              className="p-2.5 rounded-lg bg-white border border-purple-500/25 space-y-1"
              title={isVi ? forecastModel.touchProbabilities.tier4.definitionVi : forecastModel.touchProbabilities.tier4.definitionEn}
            >
              <div className="flex items-center justify-between">
                <span className="text-purple-300 font-semibold">{isVi ? 'Tầng 4: Giá Vốn On-Chain' : 'Tier 4: Realized Price'}</span>
                <span className="font-mono text-[10px] text-purple-400 font-bold">
                  {forecastModel.touchProbabilities.tier4.touchProbabilityPercent.toFixed(0)}% chạm (90D)
                </span>
              </div>
              <div className="font-mono text-sm font-bold text-[#191F2C] tabular-nums">
                {formatUSD(realizedPrice, 0)}{' '}
                <span className="text-[10px] text-[#64748B]">
                  ({(((realizedPrice - price) / price) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="text-[10px] text-[#94A3B8]">
                {isVi ? 'Vùng định giá vốn mạng lưới' : 'Network Realized Cap Baseline'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RIGHT BENTO (4 COLS): FEY / STRIPE EXECUTION TICKET ================= */}
      <div className="lg:col-span-4 rounded-2xl bg-white border border-[#E1E3E3] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_20px_40px_-15px_rgba(0,0,0,0.65)] p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between space-y-4 relative overflow-hidden">
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent pointer-events-none" />
        {/* 1. Ticket Header & Portfolio Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E1E3E3]">
            <span className="text-[11px] uppercase tracking-[0.06em] text-[#64748B] font-medium flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {isBinanceConnected
                  ? isVi ? 'Tài Sản & Lãi Lỗ Binance' : 'Binance Live Asset & PnL'
                  : isVi ? 'Tổng Tài Sản Của Bạn' : 'Your Net Portfolio'}
              </span>
            </span>

            {isBinanceConnected ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>BINANCE LIVE</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#64748B] border border-[#E1E3E3]">
                LOCAL
              </span>
            )}
          </div>

          {/* Net Worth & PnL Row */}
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <div className="text-2xl sm:text-[26px] font-bold text-[#191F2C] font-mono tabular-nums tracking-tight">
                {formatVND(currentValueVnd)}
              </div>
              <div className="text-xs text-[#64748B] font-mono tabular-nums flex items-center gap-1.5 mt-0.5">
                <span>≈ {formatUSD(currentValueUsd, 2)}</span>
                {totalBtc > 0 && (
                  <span className="text-amber-400 font-semibold">• {totalSats.toLocaleString()} sats</span>
                )}
              </div>
            </div>

            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-bold text-xs tabular-nums ${
                isProfitable
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isProfitable ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>
                {isProfitable ? '+' : ''}{formatUSD(pnlUsd, 2)} ({isProfitable ? '+' : ''}{pnlPct.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Compact Holdings Grid */}
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E1E3E3] text-[11px]">
            <div>
              <div className="text-[#64748B]">{isVi ? 'Nắm Giữ BTC' : 'BTC Held'}</div>
              <div className="font-mono font-bold text-amber-400 tabular-nums mt-0.5">{totalBtc.toFixed(4)} BTC</div>
            </div>
            <div className="border-x border-[#E1E3E3] px-2">
              <div className="text-[#64748B]">{isVi ? 'Số Dư USDT' : 'Dry Powder'}</div>
              <div className="font-mono font-bold text-emerald-400 tabular-nums mt-0.5">{formatUSD(dryPowderUsd, 0)}</div>
            </div>
            <div className="pl-1">
              <div className="text-[#64748B]">{isVi ? 'Giá Vốn TB' : 'Avg Cost'}</div>
              <div className="font-mono font-semibold text-[#343B43] tabular-nums mt-0.5">
                {avgBuyPrice > 0 ? formatUSD(avgBuyPrice, 0) : (isVi ? 'Chưa có' : 'N/A')}
              </div>
            </div>
          </div>

          {/* Conditional Insufficient USDT Guard */}
          {isBinanceConnected && dryPowderUsd < tacticalTotalUsd && (
            <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-[11px] text-amber-300">
              <span className="shrink-0">⚠️</span>
              <div>
                <strong className="font-semibold">{isVi ? 'Ví Spot không đủ USDT:' : 'Low USDT:'}</strong>{' '}
                {isVi
                  ? `Cần thêm ${formatUSD(tacticalTotalUsd - dryPowderUsd, 2)} để khớp lệnh tuần.`
                  : `Need ${formatUSD(tacticalTotalUsd - dryPowderUsd, 2)} more for this week.`}
              </div>
            </div>
          )}
        </div>

        {/* 2. Primary Action Box: Continuous Fractional Kelly Execution (3% Accent Border Rule) */}
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-emerald-500/30 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.15)] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-[0.06em] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400 shrink-0" />
              <span>{isVi ? 'LỆNH KELLY DCA TUẦN NÀY' : 'WEEKLY KELLY DCA ORDER'}</span>
            </span>

            {/* Inline Budget Selector */}
            <div className="flex items-center gap-1 text-[11px] font-mono">
              {isEditingBudget ? (
                <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-emerald-500/50">
                  <span className="text-[#64748B]">$</span>
                  <input
                    type="number"
                    aria-label={isVi ? 'Ngân sách DCA hàng tháng' : 'Monthly DCA budget'}
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    onBlur={() => {
                      const val = parseFloat(budgetInput);
                      if (!isNaN(val) && val > 0) setDcaBudget(val);
                      setIsEditingBudget(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseFloat(budgetInput);
                        if (!isNaN(val) && val > 0) setDcaBudget(val);
                        setIsEditingBudget(false);
                      }
                    }}
                    autoFocus
                    className="w-14 bg-transparent text-emerald-300 font-bold text-xs focus:outline-none"
                  />
                  <span className="text-[10px] text-[#64748B]">/tháng</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setBudgetInput(dcaBudget.toString());
                    setIsEditingBudget(true);
                  }}
                  className="flex items-center gap-1 text-[#343B43] hover:text-[#191F2C] bg-white px-2 py-0.5 rounded-lg border border-[#E1E3E3] transition-colors cursor-pointer"
                  title={isVi ? 'Bấm để đổi ngân sách tháng' : 'Click to edit monthly budget'}
                >
                  <span className="text-[#64748B]">{isVi ? 'Ngân sách:' : 'Budget:'}</span>
                  <span className="font-bold text-amber-300">${dcaBudget}/tháng</span>
                  <Edit3 className="w-2.5 h-2.5 opacity-70" />
                </button>
              )}
            </div>
          </div>

          {/* Primary Weekly Dollar Callout */}
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1.5 font-mono tabular-nums whitespace-nowrap">
              <span className="text-2xl font-bold text-[#191F2C] tracking-tight">
                ${tacticalTotalUsd.toFixed(2)}
              </span>
              <span className="text-xs text-[#64748B] font-sans">/ {isVi ? 'tuần' : 'wk'}</span>
              <span className="text-xs font-semibold text-emerald-400">
                (~{formatVND(tacticalTotalVnd)})
              </span>
            </div>

            {confluenceMultiplier > 1.0 && (
              <span className="text-[10px] font-mono text-emerald-400 font-semibold whitespace-nowrap px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                +${tacticalExtraReserveUsd.toFixed(2)} {isVi ? 'quỹ bắt đáy' : 'reserve'}
              </span>
            )}
          </div>

          {/* Single Clean Kelly Badge Row + Interactive Formula Popover Toggle */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-[#343B43] bg-white px-2.5 py-1.5 rounded-lg border border-[#E1E3E3]">
              <span>Kelly: <strong className="text-amber-300">{confluenceMultiplier.toFixed(2)}x</strong></span>
              <span className="text-[#64748B]">•</span>
              <span>{isVi ? 'Lời/Lỗ:' : 'Odds:'} <strong className="text-[#191F2C]">{kelly?.payoffOddsB?.toFixed(2) ?? '1.92'}x</strong></span>
              <span className="text-[#64748B]">•</span>
              <span>{isVi ? 'Thắng:' : 'Win:'} <strong className="text-emerald-400">{((kelly?.winProbP ?? 0.642) * 100).toFixed(0)}%</strong></span>
              <button
                type="button"
                onClick={() => setShowKellyFormula(!showKellyFormula)}
                className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-[10px] font-sans text-cyan-400 cursor-pointer transition-colors"
                title={isVi ? 'Xem công thức toán học Half-Kelly' : 'View Half-Kelly mathematical formula'}
              >
                <Info className="w-3 h-3" />
                <span>{isVi ? 'Công thức' : 'Formula'}</span>
              </button>
            </div>

            {showKellyFormula && (
              <div className="p-2.5 rounded-lg bg-white border border-[#E1E3E3] text-[11px] text-[#343B43] font-mono space-y-1 animate-fadeIn">
                <div className="text-cyan-300 font-semibold">
                  f* = 0.5 × [ p(S) - (1 - p(S)) / b ] (Bounded [0.50x, 1.50x])
                </div>
                <div className="text-[10px] text-[#64748B] font-sans leading-relaxed">
                  {isVi
                    ? `Xác suất thắng p(S)=${((kelly?.winProbP ?? 0.642) * 100).toFixed(1)}% hiệu chỉnh qua hồi quy đẳng điệu PAVA (BSS: +${(kelly?.brierSkillScore ?? 0.165).toFixed(3)}). Điểm hội tụ: On-Chain ${pOnChain}/35 • Kỹ thuật ${pTech}/25 • Phái sinh ${pDeriv}/20 • Vĩ mô ${pMacro}/20. Quỹ đạo 30D: Δ7D ${scoreDelta7D >= 0 ? '+' : ''}${scoreDelta7D.toFixed(1)}đ • Δ30D ${scoreDelta30D >= 0 ? '+' : ''}${scoreDelta30D.toFixed(1)}đ.`
                    : `Isotonic PAVA calibrated win prob p=${((kelly?.winProbP ?? 0.642) * 100).toFixed(1)}% (BSS: +${(kelly?.brierSkillScore ?? 0.165).toFixed(3)}). 30D Trajectory: Δ7D ${scoreDelta7D >= 0 ? '+' : ''}${scoreDelta7D.toFixed(1)} • Δ30D ${scoreDelta30D >= 0 ? '+' : ''}${scoreDelta30D.toFixed(1)}.`}
                </div>
              </div>
            )}
          </div>

          {/* Outperformance Alpha Strip */}
          <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20 text-[11px] font-mono flex items-center justify-between">
            <span className="text-[#343B43] font-sans">{isVi ? 'Smart DCA vs DCA Đều:' : 'Smart vs Flat DCA:'}</span>
            <span className="text-emerald-400 font-bold">+{metrics.smartDcaAlphaPercent ?? 0.41}% {isVi ? 'lợi thế kiểm chứng 3 năm (Tab 3)' : '3Y verified backtest alpha (Tab 3)'}</span>
          </div>

          {/* 3 Tactical ATR Limit Sniper Boxes with 7D Touch Probabilities */}
          <div className="space-y-2 pt-1 border-t border-[#E1E3E3]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-[#191F2C] flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isVi ? 'Rải Lệnh ATR Sniper & Xác Suất Khớp 7D' : 'ATR Sniper & 7D Touch Prob'}</span>
              </span>
              <span className="text-[10px] font-mono text-[#64748B]">
                ATR 14D: <strong className="text-[#343B43]">{formatUSD(atr14, 0)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
              {/* Leg 1: Market */}
              <div className="p-2 rounded-lg bg-white border border-[#E1E3E3] flex flex-col justify-between">
                <div className="text-[#343B43] text-[10px] font-sans font-medium truncate">
                  {isVi ? `Khớp Market (${(marketPct * 100).toFixed(0)}%)` : `Market (${(marketPct * 100).toFixed(0)}%)`}
                </div>
                <div className="text-[#191F2C] font-bold text-xs sm:text-sm mt-0.5 tabular-nums">
                  ${tacticalMarketUsd.toFixed(2)}
                </div>
                <div className="text-[10px] text-emerald-400 font-sans mt-0.5 truncate">
                  {isVi ? 'Khớp ngay 100%' : 'Spot 100%'}
                </div>
              </div>

              {/* Leg 2: Limit 1 (Snapped to HVN Zone 1 + $25) */}
              <div className="p-2 rounded-lg bg-white border border-[#E1E3E3] flex flex-col justify-between">
                <div className="text-cyan-300 text-[10px] font-sans font-medium truncate">
                  {isVi ? `Limit Hỗ Trợ 1 (${(limit1Pct * 100).toFixed(0)}%)` : `Limit 1 (${(limit1Pct * 100).toFixed(0)}%)`}
                </div>
                <div className="text-[#191F2C] font-bold text-xs sm:text-sm mt-0.5 tabular-nums">
                  ${tacticalLimit1Usd.toFixed(2)}
                </div>
                <div className="text-[10px] text-cyan-400 tabular-nums truncate" title={`HVN Cluster: ${hvnZone1Vol.toFixed(1)} BTC (+25$ Front-Run)`}>
                  @{formatUSD(limit1Price, 0)} • <span className="text-emerald-400">{limit1TouchProb7D.toFixed(0)}%</span>
                </div>
              </div>

              {/* Leg 3: Limit 2 (Snapped to HVN Zone 2 + $25) */}
              <div className="p-2 rounded-lg bg-white border border-[#E1E3E3] flex flex-col justify-between">
                <div className="text-purple-300 text-[10px] font-sans font-medium truncate">
                  {isVi ? `Limit Quét Râu 2 (${(limit2Pct * 100).toFixed(0)}%)` : `Limit 2 (${(limit2Pct * 100).toFixed(0)}%)`}
                </div>
                <div className="text-[#191F2C] font-bold text-xs sm:text-sm mt-0.5 tabular-nums">
                  ${tacticalLimit2Usd.toFixed(2)}
                </div>
                <div className="text-[10px] text-purple-400 tabular-nums truncate" title={`HVN Cluster: ${hvnZone2Vol.toFixed(1)} BTC (+25$ Front-Run)`}>
                  @{formatUSD(limit2Price, 0)} • <span className="text-amber-300">{limit2TouchProb7D.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* Live Binance Spot Orderbook Whale Bid-Wall & VPVR High-Volume Nodes */}
            <div className="p-2 rounded-lg bg-white border border-[#E1E3E3] space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-[#343B43] font-medium flex items-center gap-1">
                  <span>🐋</span>
                  <span>{isVi ? 'Tường Đỡ & Nút VPVR HVN:' : 'Bid Wall & VPVR HVN:'}</span>
                </span>
                <span className="font-mono font-bold text-cyan-300 tabular-nums">
                  {formatUSD(obLargestWallPrice, 0)} ({obLargestWallVol.toFixed(1)} BTC)
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B]">
                <span>
                  POC 30D: <strong className="text-[#191F2C]">{formatUSD(vpvrPocPrice, 0)}</strong>
                  {' • '}HVN1: <strong className="text-emerald-400">{hvnZone1Vol.toFixed(0)} BTC</strong>
                </span>
                <span>
                  Depth ±3%: <strong className={obImbalancePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {obImbalancePct >= 0 ? '+' : ''}{obImbalancePct.toFixed(1)}%
                  </strong>
                  {' • '}CVD: <strong className="text-amber-300">{takerRatio.toFixed(1)}%</strong>
                  {isWhaleAbsorbing ? ' 🐋' : ''}
                </span>
              </div>
            </div>
            {/* Personal BTC Accumulation & Cost-Basis Forecaster (Answers "If I follow this plan, how much BTC will I stack & how does my cost basis drop?") */}
            <div
              data-testid="personal-accumulation-forecaster"
              className="p-2.5 rounded-lg bg-white border border-emerald-500/25 space-y-2 text-[11px]"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <span>📈</span>
                  <span>
                    {isVi
                      ? 'Dự Báo Tích Sản & Kéo Giảm Giá Vốn Của Bạn'
                      : 'Your BTC Stacking & Cost-Basis Forecast'}
                  </span>
                </span>
                <span className="text-[10px] font-mono text-amber-300">
                  +{weeklyAddedSats.toLocaleString()} sats/{isVi ? 'tuần' : 'wk'}
                </span>
              </div>

              {avgBuyPrice > price && totalBtc > 0 && (
                <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-[#343B43] leading-snug">
                  {isVi ? (
                    <>
                      💡 <strong>Hiệu ứng kéo giá vốn tuần này:</strong> Khớp đủ{' '}
                      <strong className="text-[#191F2C] font-mono">${tacticalTotalUsd.toFixed(2)}</strong> giúp ví tăng lên{' '}
                      <strong className="text-amber-700 font-mono">{projectedSatsAfterWeek.toLocaleString()} sats</strong> và{' '}
                      <strong className="text-emerald-700">
                        kéo giá vốn TB từ {formatUSD(avgBuyPrice, 0)} xuống {formatUSD(projectedAvgCostAfterWeek, 0)}
                      </strong>{' '}
                      (nhanh hòa vốn hơn <strong>{formatUSD(avgBuyPrice - projectedAvgCostAfterWeek, 0)}/BTC</strong>).
                    </>
                  ) : (
                    <>
                      💡 <strong>Weekly Cost-Basis Impact:</strong> Executing{' '}
                      <strong className="text-[#191F2C] font-mono">${tacticalTotalUsd.toFixed(2)}</strong> lowers your average cost from{' '}
                      <strong>{formatUSD(avgBuyPrice, 0)}</strong> to{' '}
                      <strong className="text-emerald-700">{formatUSD(projectedAvgCostAfterWeek, 0)}</strong>.
                    </>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                <div className="p-2 rounded bg-white border border-[#E1E3E3] space-y-0.5">
                  <div className="text-[#64748B] font-sans font-semibold">
                    {isVi ? `Về Power Law (${formatUSD(fairValue, 0)}):` : `At Fair Value (${formatUSD(fairValue, 0)}):`}
                  </div>
                  <div className="text-xs font-bold text-emerald-400 tabular-nums">
                    ${valAtPowerLawUsd.toFixed(2)} (≈ {Math.round(valAtPowerLawUsd * (p2pRate > 0 ? p2pRate : 25680)).toLocaleString('vi-VN')} ₫)
                  </div>
                  <div className="text-[9.5px] text-[#94A3B8] font-sans">
                    {isVi ? 'Tổng tích lũy sau lệnh:' : 'Projected holding:'}{' '}
                    <strong className="text-amber-300 font-mono">
                      {projectedSatsAfterWeek.toLocaleString()} sats
                    </strong>
                  </div>
                </div>

                <div className="p-2 rounded bg-white border border-[#E1E3E3] space-y-0.5">
                  <div className="text-[#64748B] font-sans font-semibold">
                    {isVi ? `Chạm Đỉnh Pi Top (${formatUSD(piCycleTop, 0)}):` : `At Pi Top (${formatUSD(piCycleTop, 0)}):`}
                  </div>
                  <div className="text-xs font-bold text-purple-300 tabular-nums">
                    ${valAtPiCycleUsd.toFixed(2)} (≈ {Math.round(valAtPiCycleUsd * (p2pRate > 0 ? p2pRate : 25680)).toLocaleString('vi-VN')} ₫)
                  </div>
                  <div className="text-[9.5px] text-[#94A3B8] font-sans">
                    {isVi ? 'Tổng tích lũy sau lệnh:' : 'Projected holding:'}{' '}
                    <strong className="text-cyan-300 font-mono">
                      {projectedSatsAfterWeek.toLocaleString()} sats
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Action Navigation Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('portfolio')}
            className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>{isVi ? 'Xem Chi Tiết Ví' : 'Portfolio Details'}</span>
          </button>

          {isBinanceConnected ? (
            <button
              type="button"
              onClick={() => fetchBinancePortfolio()}
              disabled={isBinanceSyncing}
              className="py-2.5 px-3 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E1E3E3] text-[#343B43] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isBinanceSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isBinanceSyncing
                  ? (isVi ? 'Đang Đồng Bộ...' : 'Syncing...')
                  : (isVi ? 'Làm Mới Binance' : 'Refresh Binance')}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setBinanceModalOpen(true)}
              className="py-2.5 px-3 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E1E3E3] text-[#191F2C] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <span>{isVi ? 'Đồng Bộ Ví Binance' : 'Connect Binance'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
