import React, { useState, useMemo } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import {
  formatUSD,
  formatVND,
  formatBtc,
  formatSats,
  timeAgo,
} from '../../lib/formatters';
import { ColdWalletUTXOSniper } from '../right-column/ColdWalletUTXOSniper';
import { ExitLadderStrategy } from './ExitLadderStrategy';
import { useUnifiedMetrics } from '../../lib/metricsSelector';
import {
  Wallet,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  Lock,
  Link as LinkIcon,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  FileSpreadsheet,
  Target,
  Zap,
  Award,
  Sparkles,
  CheckCircle,
  Clock,
  ArrowDownRight,
  ShieldAlert,
} from 'lucide-react';

export const PortfolioTab: React.FC = () => {
  const locale = useTerminalStore((s) => s.locale);
  const livePrice = useTerminalStore((s) => s.ticker.price) || 75925;
  const p2pRate = useTerminalStore((s) => s.ticker.p2pUsdtVndRate) || 25600;
  const summary = useTerminalStore((s) => s.portfolioSummary);
  const transactions = useTerminalStore((s) => s.transactions);
  const deleteTransaction = useTerminalStore((s) => s.deleteTransaction);
  const setEditingTransaction = useTerminalStore((s) => s.setEditingTransaction);
  const setAddTransactionModalOpen = useTerminalStore((s) => s.setAddTransactionModalOpen);
  const exportJson = useTerminalStore((s) => s.exportPortfolioJson);
  const exportCsv = useTerminalStore((s) => s.exportPortfolioCsv);
  const importJson = useTerminalStore((s) => s.importPortfolioJson);
  const manualDryPowderUsd = useTerminalStore((s) => s.manualDryPowderUsd);
  const dcaBudget = useTerminalStore((s) => s.dcaBudget) || 500;

  // Binance API integration
  const binancePortfolio = useTerminalStore((s) => s.binancePortfolio);
  const isBinanceLive = binancePortfolio?.source === 'api_live';
  const openBinanceModal = useTerminalStore((s) => s.setBinanceModalOpen);
  const fetchBinance = useTerminalStore((s) => s.fetchBinancePortfolio);
  const isBinanceSyncing = useTerminalStore((s) => s.isBinanceSyncing);

  const isVi = locale === 'vi';

  const [storageFilter, setStorageFilter] = useState<'all' | 'binance_spot' | 'binance_earn' | 'cold_wallet'>('all');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Active Data Detection
  const hasBinanceData = binancePortfolio?.connected === true || isBinanceLive;
  const hasManualData = transactions.length > 0;
  const isEmpty = !hasBinanceData && !hasManualData;

  // Exact Metrics
  const totalBtc = hasBinanceData
    ? binancePortfolio!.wallets.totalBtc
    : summary.totalBtc;

  const totalSats = Math.round(totalBtc * 100_000_000);

  const avgBuyPrice = hasBinanceData
    ? binancePortfolio!.costBasis.avgBuyPrice
    : summary.averageBuyPriceUsd;

  const totalInvestedUsd = totalBtc > 0 && avgBuyPrice > 0
    ? totalBtc * avgBuyPrice
    : hasBinanceData
    ? binancePortfolio!.costBasis.totalInvestedUsd
    : summary.totalInvestedUsd;

  const btcValueUsd = totalBtc * (livePrice > 0 ? livePrice : 75925);
  const dryPowderUsd = hasBinanceData
    ? (binancePortfolio?.wallets.totalDryPowderUsd || 0)
    : manualDryPowderUsd;

  const currentValueUsd = btcValueUsd + dryPowderUsd;
  const currentValueVnd = Math.round(currentValueUsd * (p2pRate > 0 ? p2pRate : 25600));

  // PnL: Strictly compare current market price vs user's average cost basis
  const pnlUsd = totalBtc > 0 && avgBuyPrice > 0
    ? totalBtc * (livePrice - avgBuyPrice)
    : totalInvestedUsd > 0 && totalBtc > 0
    ? btcValueUsd - totalInvestedUsd
    : 0;

  const pnlPct = avgBuyPrice > 0
    ? ((livePrice - avgBuyPrice) / avgBuyPrice) * 100
    : totalInvestedUsd > 0 && totalBtc > 0
    ? (pnlUsd / totalInvestedUsd) * 100
    : 0;

  const isProfitable = pnlUsd >= 0;

  // Benchmarks & Strategic Points (Single Source of Truth from useUnifiedMetrics)
  const metrics = useUnifiedMetrics();
  const sma200w = metrics.floorSma200w || 68033;
  const userCostBasis = avgBuyPrice > 0 ? avgBuyPrice : livePrice;
  const takeProfit2xPrice = userCostBasis * 2;
  const distTo200wPct = ((livePrice - sma200w) / sma200w) * 100;
  const gainVsCostPct = userCostBasis > 0 ? ((livePrice - userCostBasis) / userCostBasis) * 100 : 0;
  const distTo2xPct = livePrice > 0 ? ((takeProfit2xPrice - livePrice) / livePrice) * 100 : 100;

  // Dynamic Strictly Sorted Milestones (Ascending by Dollar Price)
  const sortedMilestones = useMemo(() => {
    return [
      {
        id: 'sma200w',
        labelVi: 'Sàn 200W',
        labelEn: '200W Floor',
        price: sma200w,
        subVi: `+${distTo200wPct.toFixed(1)}% đệm phòng thủ`,
        subEn: `+${distTo200wPct.toFixed(1)}% structural cushion`,
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-800',
        barColor: 'bg-amber-500',
        badgeVi: 'Sàn Chu Kỳ',
        badgeEn: 'Cycle Floor',
      },
      {
        id: 'marketPrice',
        labelVi: 'Giá Thị Trường',
        labelEn: 'Market Price',
        price: livePrice,
        subVi: gainVsCostPct < 0
          ? `Thấp hơn ${Math.abs(gainVsCostPct).toFixed(2)}% so với giá vốn (Vùng trung bình giá)`
          : `Lãi +${gainVsCostPct.toFixed(2)}% so với giá vốn`,
        subEn: gainVsCostPct < 0
          ? `${gainVsCostPct.toFixed(2)}% below cost basis`
          : `+${gainVsCostPct.toFixed(2)}% above cost basis`,
        borderColor: 'border-emerald-500/50',
        textColor: 'text-emerald-700',
        barColor: 'bg-emerald-500 animate-pulse',
        badgeVi: 'Binance Live',
        badgeEn: 'Live Binance',
        isMarket: true,
      },
      {
        id: 'costBasis',
        labelVi: 'Giá Vốn Của Bạn',
        labelEn: 'Your Cost Basis',
        price: userCostBasis,
        subVi: isVi ? 'Giá mua bình quân vị thế' : 'Weighted cost basis',
        subEn: 'Weighted cost basis',
        borderColor: 'border-cyan-500/40',
        textColor: 'text-sky-800',
        barColor: 'bg-sky-500',
        badgeVi: 'Vị Thế Mở',
        badgeEn: 'Open Position',
        isCost: true,
      },
      {
        id: 'takeProfit2x',
        labelVi: 'Mốc X2 Thu Vốn',
        labelEn: '2x Principal Exit',
        price: takeProfit2xPrice,
        subVi: `+${distTo2xPct.toFixed(1)}% dư địa chạm mốc`,
        subEn: `+${distTo2xPct.toFixed(1)}% to 2x target`,
        borderColor: 'border-purple-500/30',
        textColor: 'text-purple-800',
        barColor: 'bg-purple-500',
        badgeVi: 'Thu Hồi Gốc',
        badgeEn: 'Principal Exit',
      },
    ].sort((a, b) => a.price - b.price);
  }, [sma200w, distTo200wPct, livePrice, gainVsCostPct, userCostBasis, takeProfit2xPrice, distTo2xPct, isVi]);

  // Sats Milestone Tracker Calculations
  const weeklyDcaUsd = (dcaBudget / 4.33) * 0.7; // 70% DCA allocation
  const weeklySats = livePrice > 0 ? Math.round((weeklyDcaUsd / livePrice) * 1e8) : 105_000;

  const satsMilestones = [
    {
      sats: 100_000,
      labelVi: '100.000 sats',
      labelEn: '100k sats',
      btcEquivalent: '0.001 BTC',
      titleVi: 'Thợ Săn Sats Nhỏ',
      titleEn: 'Sat Hunter',
      icon: '🌱',
    },
    {
      sats: 1_000_000,
      labelVi: '1.000.000 sats',
      labelEn: '1M sats',
      btcEquivalent: '0.01 BTC',
      titleVi: 'Câu Lạc Bộ 1 Triệu Sats',
      titleEn: '1M Sats Club',
      icon: '⚡',
    },
    {
      sats: 10_000_000,
      labelVi: '10.000.000 sats',
      labelEn: '10M sats',
      btcEquivalent: '0.1 BTC',
      titleVi: 'Cột Mốc Phân Bổ 0.1 BTC',
      titleEn: '0.1 BTC Milestone Stacker',
      icon: '🏰',
    },
    {
      sats: 100_000_000,
      labelVi: '100.000.000 sats',
      labelEn: '100M sats',
      btcEquivalent: '1.0 BTC',
      titleVi: 'Nguyên Vẹn 1 Bitcoin (Wholecoiner)',
      titleEn: 'Wholecoiner',
      icon: '👑',
    },
  ];

  const nextMilestone =
    satsMilestones.find((m) => totalSats < m.sats) || satsMilestones[satsMilestones.length - 1];
  const satsRemaining = Math.max(0, nextMilestone.sats - totalSats);
  const progressToNext = Math.min(100, (totalSats / nextMilestone.sats) * 100);
  const weeksToReach = weeklySats > 0 ? Math.ceil(satsRemaining / weeklySats) : 0;

  // Trades and Orders from Binance Private API
  const recentTrades = binancePortfolio?.recentTrades || [];
  const openLimitOrders = binancePortfolio?.openLimitOrders || [];

  // Export / Import handlers
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(exportJson());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `btc_portfolio_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(exportCsv());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `btc_portfolio_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        const content = event.target?.result as string;
        const success = importJson(content);
        setImportStatus(
          success
            ? isVi ? 'Đã nhập danh mục thành công!' : 'Imported successfully!'
            : isVi ? 'Tệp JSON không hợp lệ' : 'Invalid JSON file format'
        );
        setTimeout(() => setImportStatus(null), 3500);
      };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start font-sans">
      {/* MAIN PORTFOLIO COLUMN (8 of 12 cols) */}
      <div className="lg:col-span-8 space-y-5">
        {/* 1. EXECUTIVE PORTFOLIO HERO CARD */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-[#EEF0F5] shadow-card p-6 sm:p-7 space-y-6">
          {/* Subtle Glow Accents */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Top Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EEF0F5]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 text-[#7C3AED] flex items-center justify-center shadow-xs">
                <Wallet className="w-5 h-5 text-[#7C3AED]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-extrabold text-[#111827] tracking-tight uppercase">
                    {isVi ? 'DANH MỤC TÍCH SẢN BTC SPOT' : 'BTC SPOT PORTFOLIO'}
                  </h1>
                  {hasBinanceData && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                      BINANCE LIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 font-normal">
                  {isVi
                    ? 'Quản lý giá vốn bình quân và số lượng sats tích lũy chuẩn quốc tế.'
                    : 'Real-time Bitcoin holdings, cost basis, and sat stacking performance.'}
                </p>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openBinanceModal(true)}
                className="px-4 py-2 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <LinkIcon className="w-3.5 h-3.5 text-amber-700" />
                <span>{hasBinanceData ? (isVi ? 'Ví Binance' : 'Binance Live') : (isVi ? 'Kết Nối Binance' : 'Connect Binance')}</span>
              </button>

              <button
                type="button"
                onClick={() => setAddTransactionModalOpen(true)}
                className="px-4 py-2 rounded-full bg-[#111827] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>{isVi ? 'Thêm Lệnh Mua' : 'Add Spot Buy'}</span>
              </button>
            </div>
          </div>

          {/* Primary Wealth Display (VND + USD + Sats) */}
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-medium block">
              {isVi ? 'Tổng Giá Trị Danh Mục Hiện Tại:' : 'Total Current Portfolio Value:'}
            </span>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#111827] tracking-tight">
              {formatVND(currentValueVnd)}
            </div>
            <div className="text-sm text-gray-500 font-medium flex items-center gap-2 pt-1 font-mono">
              <span className="font-bold text-gray-800">≈ {formatUSD(currentValueUsd, 2)}</span>
              <span className="text-amber-600 font-bold">
                • {totalSats.toLocaleString()} sats
              </span>
              <span className="text-gray-400 font-normal hidden sm:inline">
                ({formatBtc(totalBtc, 8)} BTC)
              </span>
            </div>
          </div>

          {/* 4 Clean Institutional Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {/* Card 1: Giá Vốn Trung Bình */}
            <div className="p-4 rounded-2xl bg-[#F4F6F9] hover:bg-white border border-[#EEF0F5] hover:border-purple-200 shadow-xs transition-all space-y-1">
              <span className="text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-wider font-semibold block">
                {isVi ? 'GIÁ VỐN TRUNG BÌNH' : 'AVERAGE BUY PRICE'}
              </span>
              <div className="text-base sm:text-lg font-bold text-[#111827] font-mono tabular-nums">
                {avgBuyPrice > 0 ? formatUSD(avgBuyPrice, 0) : '---'}
              </div>
              <span className="text-[10px] text-gray-400 block font-normal">
                {isVi ? 'Chi phí mua bình quân' : 'Weighted cost basis'}
              </span>
            </div>

            {/* Card 2: Lợi Nhuận Vị Thế Mở (Unrealized PnL) */}
            <div className="p-4 rounded-2xl bg-[#F4F6F9] hover:bg-white border border-[#EEF0F5] hover:border-purple-200 shadow-xs transition-all space-y-1">
              <span className="text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-wider font-semibold block">
                {isVi ? 'LÃI / LỖ VỊ THẾ (PNL)' : 'UNREALIZED PNL'}
              </span>
              <div
                className={`text-base sm:text-lg font-bold font-mono tabular-nums flex items-center gap-1 ${
                  isProfitable ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {isProfitable ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>
                  {totalInvestedUsd > 0
                    ? `${isProfitable ? '+' : ''}${formatUSD(pnlUsd, 2)}`
                    : '$0.00'}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold block ${
                  isProfitable ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {totalInvestedUsd > 0
                  ? isProfitable
                    ? `+${pnlPct.toFixed(2)}% (Lãi vị thế)`
                    : `${pnlPct.toFixed(2)}% (Chưa chốt)`
                  : '0.00%'}
              </span>
            </div>

            {/* Card 3: Tiền Mặt Chờ Mua (Dry Powder) */}
            <div className="p-4 rounded-2xl bg-[#F4F6F9] hover:bg-white border border-[#EEF0F5] hover:border-purple-200 shadow-xs transition-all space-y-1">
              <span className="text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-wider font-semibold block flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#7C3AED]" />
                <span>{isVi ? 'TIỀN MẶT CHỜ GOM' : 'DRY POWDER (USDT)'}</span>
              </span>
              <div className="text-base sm:text-lg font-bold text-[#7C3AED] font-mono tabular-nums">
                {formatUSD(dryPowderUsd, 2)}
              </div>
              <span className="text-[10px] text-gray-400 block font-normal">
                {isVi ? 'Sẵn sàng gom khi giá tốt' : 'Ready for dip stacking'}
              </span>
            </div>

            {/* Card 4: Tổng Vốn Đã Gom */}
            <div className="p-4 rounded-2xl bg-[#F4F6F9] hover:bg-white border border-[#EEF0F5] hover:border-purple-200 shadow-xs transition-all space-y-1">
              <span className="text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-wider font-semibold block">
                {isVi ? 'TỔNG VỐN ĐÃ GOM' : 'TOTAL INVESTED'}
              </span>
              <div className="text-base sm:text-lg font-bold text-[#111827] font-mono tabular-nums">
                {formatUSD(totalInvestedUsd, 2)}
              </div>
              <span className="text-[10px] text-gray-400 block font-normal">
                ≈ {formatVND(Math.round(totalInvestedUsd * p2pRate))}
              </span>
            </div>
          </div>
        </div>

        {/* 2. COST-BASIS BENCHMARK & SMART AVERAGE-DOWN CARD */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#EEF0F5] shadow-card space-y-4 font-sans">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EEF0F5]">
              <span className="font-bold text-[#111827] text-sm uppercase flex items-center gap-2">
                <Target className="w-4 h-4 text-[#7C3AED]" />
                <span>{isVi ? 'ĐỊNH VỊ GIÁ VỐN & KẾ HOẠCH GOM HÀNG' : 'COST-BASIS BENCHMARK & STRATEGY'}</span>
              </span>
              <span className="text-xs text-[#64748B]">
                {isVi ? 'Thứ tự giá toán học từ sàn đỡ đến mục tiêu chốt lời' : 'Ascending price milestones'}
              </span>
            </div>

            {/* Plain-Language Takeaway Advice */}
            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-500/20 flex items-start gap-3">
              <ArrowDownRight className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-[#191F2C] leading-relaxed">
                {gainVsCostPct < 0 ? (
                  isVi ? (
                    <>
                      Giá Bitcoin hiện tại (<strong>{formatUSD(livePrice, 0)}</strong>) đang{' '}
                      <span className="text-emerald-700 font-bold">thấp hơn {Math.abs(gainVsCostPct).toFixed(2)}%</span>{' '}
                      so với giá vốn bình quân của bạn (<strong>{formatUSD(userCostBasis, 0)}</strong>). 💡{' '}
                      <strong className="text-emerald-700">Hiểu đơn giản:</strong> Nếu bạn tiếp tục mua DCA định kỳ ở vùng giá thấp hơn giá vốn này, giá mua trung bình của cả danh mục sẽ giảm xuống và nhanh hòa vốn hơn khi thị trường hồi phục.
                    </>
                  ) : (
                    <>
                      Current price (<strong>{formatUSD(livePrice, 0)}</strong>) is{' '}
                      <span className="text-emerald-700 font-bold">{Math.abs(gainVsCostPct).toFixed(2)}% below</span> your average cost basis (
                      <strong>{formatUSD(userCostBasis, 0)}</strong>). Prime opportunity to average down!
                    </>
                  )
                ) : (
                  isVi ? (
                    <>
                      Vị thế của bạn đang có lãi <strong className="text-emerald-700">+{gainVsCostPct.toFixed(2)}%</strong> so với giá vốn (
                      <strong>{formatUSD(userCostBasis, 0)}</strong>). Tiếp tục duy trì kỷ luật DCA tích sản dài hạn!
                    </>
                  ) : (
                    <>
                      Your position is in profit by <strong className="text-emerald-700">+{gainVsCostPct.toFixed(2)}%</strong> above your cost basis. Stay disciplined with DCA!
                    </>
                  )
                )}
              </div>
            </div>

            {/* 4 Landmark Cards Strictly Ordered */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              {sortedMilestones.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-2xl bg-[#F4F6F9] border ${m.borderColor} space-y-1 transition-all`}
                >
                  <div className="flex items-center justify-between text-[11px] text-gray-600">
                    <span className="font-semibold">{isVi ? m.labelVi : m.labelEn}</span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-gray-700 text-[10px] font-mono tabular-nums shadow-xs">
                      {isVi ? m.badgeVi : m.badgeEn}
                    </span>
                  </div>
                  <div className={`text-sm sm:text-base font-bold font-mono tabular-nums ${m.textColor}`}>
                    {formatUSD(m.price, 0)}
                  </div>
                  <span className="text-[11px] text-gray-500 block leading-tight font-normal">
                    {isVi ? m.subVi : m.subEn}
                  </span>
                </div>
              ))}
            </div>

            {/* Clean Mathematically Proportional Progress Line */}
            <div className="space-y-1.5 pt-1">
              <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden flex border border-gray-300/40" role="progressbar" aria-label="Milestone Progress">
                {(() => {
                  const minP = sortedMilestones[0].price;
                  const maxP = sortedMilestones[sortedMilestones.length - 1].price;
                  const totalSpan = Math.max(1, maxP - minP);
                  return sortedMilestones.map((m, idx) => {
                    const nextP = idx < sortedMilestones.length - 1 ? sortedMilestones[idx + 1].price : maxP;
                    const rawPct = idx < sortedMilestones.length - 1 ? ((nextP - m.price) / totalSpan) * 100 : 15;
                    const clampedPct = Math.max(15, Math.min(50, rawPct));
                    return (
                      <div
                        key={m.id}
                        className={`h-full ${m.barColor} transition-all duration-500`}
                        style={{ width: `${clampedPct}%` }}
                        title={`${m.labelVi}: ${formatUSD(m.price, 0)}`}
                      />
                    );
                  });
                })()}
              </div>
              <div className="grid grid-cols-4 text-center text-xs text-gray-600 font-mono">
                {sortedMilestones.map((m) => (
                  <span
                    key={m.id}
                    className={m.isMarket ? 'text-emerald-600 font-bold' : m.isCost ? 'text-[#7C3AED] font-bold' : 'text-gray-500'}
                  >
                    {isVi ? m.labelVi : m.labelEn}
                  </span>
                ))}
              </div>
            </div>
          </div>

        {/* 3. STRATEGIC EXIT LADDER (Principal Recovery & Profit Exit) */}
        <ExitLadderStrategy />

        {/* 4. TWO BALANCED COLUMNS BELOW (Order History vs Sats Milestones) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Binance Spot Trade History (7 cols) */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-[#EEF0F5] shadow-card space-y-3.5 text-xs font-mono">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#EEF0F5]">
                <span className="font-bold text-[#111827] uppercase flex items-center gap-2 font-sans text-xs">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>{isVi ? 'LỊCH SỬ LỆNH KHỚP BINANCE' : 'BINANCE TRADE HISTORY'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => fetchBinance()}
                  disabled={isBinanceSyncing}
                  className="p-1.5 rounded-lg bg-[#F4F6F9] hover:bg-gray-100 border border-[#EEF0F5] text-gray-700 hover:text-black transition-colors cursor-pointer"
                  title={isVi ? 'Đồng bộ lại từ Binance' : 'Sync from Binance'}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBinanceSyncing ? 'animate-spin text-amber-500' : ''}`} />
                </button>
              </div>

              {/* Balance Breakdown Pills */}
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-[#F4F6F9] border border-[#EEF0F5] text-[10px]">
                <span className="px-2.5 py-1 rounded-full bg-white border border-[#EEF0F5] text-gray-700 shadow-xs">
                  Ví Spot: <strong className="text-amber-600">{formatSats(binancePortfolio?.wallets.spotBtc || totalBtc)}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white border border-[#EEF0F5] text-gray-700 shadow-xs">
                  Simple Earn: <strong className="text-purple-600">{formatSats(binancePortfolio?.wallets.earnFlexibleBtc || 0)}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white border border-[#EEF0F5] text-gray-700 shadow-xs">
                  USDT: <strong className="text-[#7C3AED]">{formatUSD(dryPowderUsd, 2)}</strong>
                </span>
              </div>

              {/* Trade List */}
              <div className="space-y-2">
                {recentTrades.length > 0 ? (
                  <div className="space-y-2">
                    {recentTrades.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl bg-[#F4F6F9] border border-[#EEF0F5] flex items-center justify-between text-xs hover:border-purple-200 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {t.side}
                          </span>
                          <div>
                            <span className="font-bold text-[#111827]">
                              +{Math.round(t.btcAmount * 1e8).toLocaleString()} sats
                            </span>
                            <span className="text-[10px] text-gray-500 block font-normal">
                              @ {formatUSD(t.price, 0)} ({t.btcAmount.toFixed(8)} BTC)
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[#111827] font-bold block">{formatUSD(t.usdAmount, 2)}</span>
                          <span className="text-[10px] text-gray-400">{timeAgo(t.time, locale)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#F4F6F9] border border-[#EEF0F5] text-center text-gray-500 text-xs font-sans">
                    {isVi
                      ? 'Chưa có lệnh mua bán BTC nào gần đây trên cặp BTCUSDT.'
                      : 'No recent trades on BTCUSDT pair.'}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Sats Milestone Roadmap (5 cols) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-[#EEF0F5] shadow-card space-y-3.5 text-xs font-sans">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#EEF0F5]">
                <span className="font-bold text-[#111827] uppercase flex items-center gap-2 text-xs">
                  <Award className="w-4 h-4 text-emerald-500" />
                  <span>{isVi ? 'LỘ TRÌNH TÍCH SẢN SATS' : 'SATS ROADMAP'}</span>
                </span>
                <span className="text-xs text-amber-600 font-bold font-mono">
                  {totalSats.toLocaleString()} sats
                </span>
              </div>

              {/* Next Milestone Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isVi ? 'Mục tiêu kế tiếp:' : 'Next Goal:'} {nextMilestone.sats.toLocaleString()} sats</span>
                  </span>
                  <span className="text-emerald-800 font-mono font-extrabold">{progressToNext.toFixed(1)}%</span>
                </div>

                <div className="h-2.5 w-full bg-emerald-100 rounded-full overflow-hidden border border-emerald-200">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressToNext}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-gray-600 font-mono">
                  <span>Thiếu: {satsRemaining.toLocaleString()} sats</span>
                  {weeksToReach > 0 && (
                    <span className="text-amber-700 font-semibold font-sans">
                      ~{weeksToReach} {isVi ? 'tuần DCA' : 'weeks'}
                    </span>
                  )}
                </div>
              </div>

              {/* Milestone Tiers */}
              <div className="space-y-1.5 pt-1">
                {satsMilestones.map((m) => {
                  const isAchieved = totalSats >= m.sats;
                  const pct = Math.min(100, (totalSats / m.sats) * 100);

                  return (
                    <div
                      key={m.sats}
                      className={`p-3 rounded-xl border transition-all ${
                        isAchieved
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-[#F4F6F9] border-[#EEF0F5] text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold flex items-center gap-1.5">
                          <span>{m.icon}</span>
                          <span>{isVi ? m.titleVi : m.titleEn}</span>
                        </span>
                        <span className="font-mono text-[10px]">
                          {isAchieved ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-600" /> Đạt
                            </span>
                          ) : (
                            `${pct.toFixed(1)}%`
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-0.5">
                        <span>{isVi ? m.labelVi : m.labelEn}</span>
                        <span>{m.btcEquivalent}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        {/* 4. MANUAL LOCAL LEDGER TABLE (If local transactions exist) */}
        {hasManualData && (
          <div className="p-5 rounded-2xl bg-white border border-[#EEF0F5] shadow-card space-y-3.5 text-xs font-mono">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#EEF0F5]">
              <div className="flex items-center gap-2 font-sans">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-[#111827] uppercase">
                  {isVi ? 'LỊCH SỬ LỆNH SỔ CÁI NỘI BỘ' : 'LOCAL SPOT LEDGER ORDERS'}
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-200 font-mono font-bold">
                  {transactions.length} {isVi ? 'lệnh' : 'trades'}
                </span>
              </div>

              {/* Action Buttons: Add, Export CSV/JSON, Import */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAddTransactionModalOpen(true)}
                  className="px-3 py-1 rounded-full bg-[#111827] hover:bg-black text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3 h-3 text-amber-400" />
                  <span>{isVi ? 'Thêm Lệnh' : 'Add Trade'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-2.5 py-1 rounded-full bg-[#F4F6F9] border border-[#EEF0F5] hover:bg-gray-100 text-gray-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-500" />
                  <span>CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-2.5 py-1 rounded-full bg-[#F4F6F9] border border-[#EEF0F5] hover:bg-gray-100 text-gray-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Download className="w-3 h-3 text-[#7C3AED]" />
                  <span>JSON</span>
                </button>

                <label className="px-2.5 py-1 rounded-full bg-[#F4F6F9] border border-[#EEF0F5] hover:bg-gray-100 text-gray-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors">
                  <Upload className="w-3 h-3 text-gray-500" />
                  <span>{isVi ? 'Nhập' : 'Import'}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {importStatus && (
              <div className="p-2 rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-200 text-xs font-sans">
                {importStatus}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EEF0F5] text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">{isVi ? 'Ngày Mua' : 'Date'}</th>
                    <th className="py-2.5 px-3">{isVi ? 'Số Lượng BTC' : 'Amount BTC'}</th>
                    <th className="py-2.5 px-3">{isVi ? 'Giá Khớp' : 'Price'}</th>
                    <th className="py-2.5 px-3">{isVi ? 'Tổng Vốn' : 'Total'}</th>
                    <th className="py-2.5 px-3">{isVi ? 'Nơi Lưu Trữ' : 'Storage'}</th>
                    <th className="py-2.5 px-3 text-right">{isVi ? 'Thao Tác' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF0F5]">
                  {transactions.map((tr) => (
                    <tr key={tr.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-2.5 px-3 text-gray-500">{tr.date}</td>
                      <td className="py-2.5 px-3 font-bold text-[#111827] tabular-nums">
                        +{tr.amountBtc} BTC
                      </td>
                      <td className="py-2.5 px-3 text-amber-600 font-bold tabular-nums">
                        {formatUSD(tr.priceUsd, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-gray-700 tabular-nums font-semibold">
                        {formatUSD(tr.amountBtc * tr.priceUsd + (tr.feeUsd || 0), 2)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-[#F4F6F9] border border-[#EEF0F5] text-gray-700 text-[10px] font-sans font-medium">
                          {tr.storageLocation || 'Binance Spot'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            aria-label={isVi ? 'Chỉnh sửa giao dịch' : 'Edit transaction'}
                            onClick={() => setEditingTransaction(tr)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#7C3AED] hover:bg-purple-50 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={isVi ? 'Xóa giao dịch' : 'Delete transaction'}
                            onClick={() => deleteTransaction(tr.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: COLD WALLET ADVISOR & ON-CHAIN SECURITY (4 of 12 cols) */}
      <div className="lg:col-span-4 space-y-4">
        <ColdWalletUTXOSniper />
      </div>
    </div>
  );
};
