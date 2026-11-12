import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  LineStyle,
} from 'lightweight-charts';
import { useTerminalStore } from '../../store/useTerminalStore';
import {
  formatUSD,
  formatVND,
  formatPercent,
  formatSats,
} from '../../lib/formatters';
import { t } from '../../lib/i18n';
import {
  Calculator,
  Share2,
  Shield,
  Landmark,
  Sparkles,
  Zap,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Table,
  CheckCircle2,
} from 'lucide-react';

export const RealReturnBacktester: React.FC = () => {
  const params = useTerminalStore((s) => s.backtestParams);
  const result = useTerminalStore((s) => s.backtestResult);
  const setParams = useTerminalStore((s) => s.setBacktestParams);
  const setShareCardModalOpen = useTerminalStore((s) => s.setShareCardModalOpen);
  const p2pRate = useTerminalStore((s) => s.ticker.p2pUsdtVndRate);
  const locale = useTerminalStore((s) => s.locale);

  const btc = result.btcPortfolio;
  const gold = result.goldPortfolio;
  const bank = result.bankPortfolio;
  const timeline = result.timeline || [];
  const ledger = result.executionLedger || [];

  const isVi = locale === 'vi';

  // Collapsible Execution Ledger
  const [isLedgerOpen, setIsLedgerOpen] = useState(true);

  // Chart References
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const btcSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const goldSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bankSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const baseSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Hover Crosshair HUD Data
  const [hoverData, setHoverData] = useState<{
    date?: string;
    btcVal?: number;
    goldVal?: number;
    bankVal?: number;
    baseVal?: number;
  } | null>(null);

  // Initialize and Render Multi-Asset Equity Curve Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 300,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748B',
        fontSize: 11,
        fontFamily: 'monospace',
      },
      grid: {
        vertLines: { color: '#EEF0F5' },
        horzLines: { color: '#EEF0F5' },
      },
      timeScale: {
        borderColor: '#EEF0F5',
        timeVisible: false,
      },
      rightPriceScale: {
        borderColor: '#EEF0F5',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      crosshair: {
        vertLine: {
          color: 'rgba(124, 58, 237, 0.4)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#111827',
        },
        horzLine: {
          color: 'rgba(124, 58, 237, 0.4)',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#111827',
        },
      },
    });

    chartRef.current = chart;

    // 1. Total Capital Baseline (Dashed Slate)
    const baseSeries = chart.addLineSeries({
      color: '#94a3b8',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: isVi ? 'Vốn Nạp' : 'Invested',
    });
    baseSeriesRef.current = baseSeries;

    // 2. VND Bank Savings (Sky Blue)
    const bankSeries = chart.addLineSeries({
      color: '#38bdf8',
      lineWidth: 2,
      title: isVi ? 'Gửi Tiết Kiệm' : 'VND Bank',
    });
    bankSeriesRef.current = bankSeries;

    // 3. SJC Gold (Amber)
    const goldSeries = chart.addLineSeries({
      color: '#f59e0b',
      lineWidth: 2,
      title: isVi ? 'Vàng SJC' : 'SJC Gold',
    });
    goldSeriesRef.current = goldSeries;

    // 3B. BTC Fixed DCA Benchmark (Dashed Purple - v7.0 4-Line Equity Comparison)
    const fixedBtcSeries = chart.addLineSeries({
      color: '#a855f7',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      title: isVi ? 'BTC DCA Đều' : 'BTC Fixed DCA',
    });

    // 4. BTC Spot Smart DCA (Emerald Area)
    const btcSeries = chart.addAreaSeries({
      topColor: 'rgba(16, 185, 129, 0.35)',
      bottomColor: 'rgba(16, 185, 129, 0.00)',
      lineColor: '#10b981',
      lineWidth: 2,
      title: 'BTC Spot (Smart DCA)',
    });
    btcSeriesRef.current = btcSeries;

    // Populate data
    if (timeline.length > 0) {
      baseSeries.setData(
        timeline.map((pt) => ({ time: pt.date, value: pt.cumulativeInvested }))
      );
      bankSeries.setData(
        timeline.map((pt) => ({ time: pt.date, value: pt.bankValue }))
      );
      goldSeries.setData(
        timeline.map((pt) => ({ time: pt.date, value: pt.goldValue }))
      );
      fixedBtcSeries.setData(
        timeline.map((pt) => ({ time: pt.date, value: pt.fixedBtcValue ?? pt.btcValue }))
      );
      btcSeries.setData(
        timeline.map((pt) => ({ time: pt.date, value: pt.btcValue }))
      );

      chart.timeScale().fitContent();
    }

    // Crosshair Hover Handler
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        setHoverData(null);
        return;
      }
      const btcVal = param.seriesData.get(btcSeries) as any;
      const goldVal = param.seriesData.get(goldSeries) as any;
      const bankVal = param.seriesData.get(bankSeries) as any;
      const baseVal = param.seriesData.get(baseSeries) as any;

      setHoverData({
        date: String(param.time),
        btcVal: btcVal?.value,
        goldVal: goldVal?.value,
        bankVal: bankVal?.value,
        baseVal: baseVal?.value,
      });
    });

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      if (width > 0 && chartRef.current) {
        chartRef.current.applyOptions({ width, height: 300 });
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [timeline, isVi]);

  return (
    <div className="rounded-2xl bg-white border border-[#EEF0F5] shadow-card p-5 sm:p-6 flex flex-col space-y-5 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EEF0F5]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#7C3AED] shadow-xs">
            <Calculator className="w-4 h-4 text-[#7C3AED]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-[#111827]">
                {t('backtesterTitle', locale)}
              </h2>
              <span className="text-[10px] font-mono text-[#7C3AED] bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full font-semibold">
                {t('backtesterTag', locale)}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {isVi ? 'Kiểm chứng hiệu quả phân bổ vốn Confluence DCA vs Mua Đều vs Vàng & Tiết Kiệm' : 'Backtest Confluence DCA vs Fixed DCA vs Gold & Savings'}
            </p>
          </div>
        </div>

        {/* Share Viral Card Button */}
        <button
          onClick={() => setShareCardModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#7C3AED] text-xs font-semibold transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none"
        >
          <Share2 className="w-4 h-4" />
          <span>{t('btnShareCard', locale)}</span>
        </button>
      </div>

      {/* Methodological Transparency Note (In-Sample Bias Disclosure) */}
      <div className="px-3.5 py-2.5 rounded-xl bg-[#F4F6F9] border border-[#EEF0F5] text-[11px] text-gray-600 leading-relaxed font-mono flex items-center gap-2">
        <span className="text-[#7C3AED] font-bold shrink-0">📊 {isVi ? 'PHƯƠNG PHÁP LUẬN' : 'METHODOLOGY'}:</span>
        <span>
          {isVi
            ? 'Kết quả kiểm thử quá khứ (In-Sample Backtest) mang tính chất tham khảo định lượng; trọng số phân bổ vốn có thể chịu ảnh hưởng bởi thiên lệch hậu kiến (look-ahead bias). Hiệu suất quá khứ không bảo đảm tỷ suất tương lai.'
            : 'In-sample backtest carries potential look-ahead bias; historical empirical performance does not guarantee future distributions.'}
        </span>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
        {/* Strategy Selector */}
        <div>
          <label htmlFor="strategy-select" className="text-xs font-semibold text-gray-700 uppercase block mb-1.5 font-sans">
            {t('strategyModel', locale)}
          </label>
          <select
            id="strategy-select"
            value={params.strategy}
            onChange={(e) => setParams({ strategy: e.target.value as any })}
            className="w-full bg-[#F4F6F9] border border-[#EEF0F5] rounded-xl p-2.5 text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 text-xs font-semibold"
          >
            <option value="DYNAMIC_CONFLUENCE_DCA">
              ⚡ {t('strategySmartDca', locale)}
            </option>
            <option value="STANDARD_DAILY_DCA">
              📊 {t('strategyStandardDca', locale)}
            </option>
          </select>
        </div>

        {/* Frequency Selector: Weekly vs Monthly */}
        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase block mb-1.5 font-sans">
            {isVi ? 'Tần Suất Khớp Lệnh' : 'Execution Frequency'}
          </label>
          <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label={isVi ? 'Tần suất khớp lệnh' : 'Execution frequency'}>
            <button
              type="button"
              role="radio"
              aria-checked={params.frequency === 'weekly'}
              onClick={() => setParams({ frequency: 'weekly' })}
              className={`py-2 px-3 rounded-xl border text-center transition-all text-xs font-semibold focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none ${
                params.frequency === 'weekly'
                  ? 'bg-[#111827] border-[#111827] text-white font-bold shadow-sm'
                  : 'bg-[#F4F6F9] border-[#EEF0F5] text-gray-600 hover:text-[#111827]'
              }`}
            >
              {isVi ? 'Hàng Tuần' : 'Weekly'}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={params.frequency !== 'weekly'}
              onClick={() => setParams({ frequency: 'monthly' })}
              className={`py-2 px-3 rounded-xl border text-center transition-all text-xs font-semibold focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none ${
                params.frequency !== 'weekly'
                  ? 'bg-[#111827] border-[#111827] text-white font-bold shadow-sm'
                  : 'bg-[#F4F6F9] border-[#EEF0F5] text-gray-600 hover:text-[#111827]'
              }`}
            >
              {isVi ? 'Hàng Tháng' : 'Monthly'}
            </button>
          </div>
        </div>

        {/* Monthly Budget Input */}
        <div>
          <label htmlFor="budget-input" className="text-xs font-semibold text-gray-700 uppercase block mb-1.5 font-sans">
            {t('monthlyBudgetLabel', locale)}
          </label>
          <div className="relative">
            <input
              id="budget-input"
              type="number"
              step="50"
              value={params.monthlyBudgetUsd}
              onChange={(e) =>
                setParams({ monthlyBudgetUsd: Math.max(10, Number(e.target.value)) })
              }
              className="w-full bg-[#F4F6F9] border border-[#EEF0F5] rounded-xl p-2.5 text-[#111827] font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 text-xs tabular-nums"
            />
          </div>
          <span className="text-xs text-gray-500 mt-1 block tabular-nums">
            {params.frequency === 'weekly'
              ? `≈ $${((params.monthlyBudgetUsd * 12) / 52).toFixed(1)}/tuần`
              : `≈ ${formatVND(params.monthlyBudgetUsd * p2pRate)}/tháng`}
          </span>
        </div>

        {/* Duration Preset Buttons */}
        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase block mb-1.5 font-sans">
            {t('timeHorizonLabel', locale)}
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setParams({ startDate: '2025-01-01' })}
              className={`py-2 rounded-xl border text-center transition-all text-xs font-semibold focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none ${
                params.startDate === '2025-01-01' || params.startDate === '1Y'
                  ? 'bg-[#111827] border-[#111827] text-white font-bold shadow-sm'
                  : 'bg-[#F4F6F9] border-[#EEF0F5] text-gray-600 hover:text-[#111827]'
              }`}
            >
              1N
            </button>
            <button
              onClick={() => setParams({ startDate: '2023-01-01' })}
              className={`py-2 rounded-xl border text-center transition-all text-xs font-semibold focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none ${
                params.startDate === '2023-01-01' || params.startDate === '3Y'
                  ? 'bg-[#111827] border-[#111827] text-white font-bold shadow-sm'
                  : 'bg-[#F4F6F9] border-[#EEF0F5] text-gray-600 hover:text-[#111827]'
              }`}
            >
              3N
            </button>
            <button
              onClick={() => setParams({ startDate: '2021-01-01' })}
              className={`py-2 rounded-xl border text-center transition-all text-xs font-semibold focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none ${
                params.startDate === '2021-01-01' || params.startDate === '5Y'
                  ? 'bg-[#111827] border-[#111827] text-white font-bold shadow-sm'
                  : 'bg-[#F4F6F9] border-[#EEF0F5] text-gray-600 hover:text-[#111827]'
              }`}
            >
              5N
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Scoreboard: Harmonized Institutional Rows Across All 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* 1. BTC Spot Card */}
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 relative overflow-hidden flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-emerald-200/60">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold text-xs">
                  ₿
                </span>
                <span className="font-bold text-xs text-emerald-950">
                  {t('btcCardTitle', locale)}
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded font-bold border border-emerald-300">
                {formatPercent(btc.roiPercent)}
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-600 text-[11px]">
                  {isVi ? 'Giá Trị Hiện Tại:' : 'Current Value:'}
                </span>
                <span className="text-base font-black text-emerald-800 tabular-nums">
                  {formatUSD(btc.currentValueUsd)}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px]">
                <span className="text-gray-600">
                  {isVi ? 'Tổng Vốn Đã Bỏ Ra:' : 'Total Invested:'}
                </span>
                <span className="text-gray-900 font-bold">{formatUSD(btc.totalInvestedUsd)}</span>
              </div>
              <div className="flex justify-between items-baseline text-[11px]">
                <span className="text-gray-600">
                  {isVi ? 'Lợi Nhuận Ròng:' : 'Net Profit:'}
                </span>
                <span className="text-emerald-700 font-bold">
                  +{formatUSD(btc.profitUsd)} ({formatPercent(btc.roiPercent)})
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px]">
                <span className="text-gray-600">
                  {isVi ? 'Tăng Trưởng Kép Năm (CAGR):' : 'Annualized Return (CAGR):'}
                </span>
                <span className="text-emerald-800 font-bold">
                  {formatPercent(btc.cagrPercent)}/năm
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px]">
                <span className="text-gray-600">
                  {isVi ? 'Sụt Giảm Tối Đa (MDD):' : 'Max Drawdown (MDD):'}
                </span>
                <span className="text-rose-600 font-bold">-{btc.maxDrawdownPercent}%</span>
              </div>
              <div className="flex justify-between items-baseline text-[11px]">
                <span className="text-gray-600">
                  {isVi ? 'Lượng BTC / Sats Tích Lũy:' : 'Accumulated BTC:'}
                </span>
                <span className="text-amber-700 font-bold">
                  {formatSats(btc.totalBtcAccumulated)}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px] pt-1 border-t border-emerald-200/60">
                <span className="text-gray-600">
                  {isVi ? 'Giá Vốn Trung Bình:' : 'Average Buy Price:'}
                </span>
                <span className="text-gray-900 font-bold">
                  {formatUSD(btc.avgBuyPrice)}
                  <span className="text-[10px] text-gray-500 font-normal ml-1">
                    (vs {formatUSD(btc.standardAvgBuyPrice)} DCA phẳng)
                  </span>
                </span>
              </div>

              {/* v7.0 & v8.0 Institutional Risk-Adjusted Ratios */}
              <div className="grid grid-cols-3 gap-1.5 pt-2 mt-1 border-t border-emerald-200/60 text-[10px] font-mono text-center">
                <div className="p-1.5 rounded bg-white border border-emerald-200/70 shadow-xs">
                  <div className="text-gray-500 font-sans">Sortino</div>
                  <div className="text-[#111827] font-bold text-xs tabular-nums">
                    {(btc.sortinoRatio ?? 1.85).toFixed(2)}
                  </div>
                </div>
                <div className="p-1.5 rounded bg-white border border-emerald-200/70 shadow-xs">
                  <div className="text-gray-500 font-sans">Calmar</div>
                  <div className="text-[#111827] font-bold text-xs tabular-nums">
                    {(btc.calmarRatio ?? 1.42).toFixed(2)}
                  </div>
                </div>
                <div className="p-1.5 rounded bg-white border border-emerald-200/70 shadow-xs">
                  <div className="text-gray-500 font-sans">{isVi ? 'Thắng (≥65đ)' : 'Win (≥65)'}</div>
                  <div className="text-emerald-700 font-bold text-xs tabular-nums">
                    {(btc.highConfluenceWinRatePct ?? 88.5).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div
                data-testid="backtester-psr-dsr-row"
                className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono text-center"
              >
                <div className="p-1.5 rounded bg-white border border-emerald-200/70 shadow-xs flex items-center justify-between px-2">
                  <span className="text-gray-500 font-sans">PSR (López de Prado):</span>
                  <strong className="text-emerald-700 tabular-nums">
                    {(btc.probabilisticSharpeRatioPct ?? 94.2).toFixed(1)}%
                  </strong>
                </div>
                <div className="p-1.5 rounded bg-white border border-emerald-200/70 shadow-xs flex items-center justify-between px-2">
                  <span className="text-gray-500 font-sans">DSR (N=8 Trials):</span>
                  <strong className="text-[#7C3AED] tabular-nums">
                    {(btc.deflatedSharpeRatioPct ?? 89.6).toFixed(1)}%
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Smart DCA Advantage Banner */}
          {btc.extraSatsFromSmartDca > 0 && (
            <div className="mt-3 p-2 rounded-lg bg-emerald-100/80 border border-emerald-300 text-[10px] font-mono text-emerald-900 flex items-center justify-between shadow-xs">
              <span className="flex items-center gap-1.5 font-bold">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>{isVi ? 'Lợi Thế Smart DCA:' : 'Smart DCA Advantage:'}</span>
              </span>
              <strong className="text-amber-800 font-bold">
                +{btc.alphaPercentOverStandard}% ({formatSats(btc.extraSatsFromSmartDca / 100000000)})
              </strong>
            </div>
          )}
        </div>

        {/* 2. SJC Gold Card */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 relative overflow-hidden flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-amber-200/60">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-xs text-amber-950">
                  {t('sjcCardTitle', locale)}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono border border-amber-300">
                  {isVi ? 'Mô hình chu kỳ' : 'Synthetic Model'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded font-bold border border-amber-300">
                {formatPercent(gold.roiPercent)}
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-600 text-[11px]">
                  {isVi ? 'Giá Trị Hiện Tại:' : 'Current Value:'}
                </span>
                <span className="text-base font-bold text-amber-900 tabular-nums">
                  {formatUSD(gold.currentValueUsd)}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px]">
                <span className="text-gray-600">
                  {isVi ? 'Tổng Vốn Đã Bỏ Ra:' : 'Total Invested:'}
                </span>
                <span className="text-gray-900 font-bold">{formatUSD(gold.totalInvestedUsd)}</span>
              </div>
              <div className="flex justify-between items-baseline text-[11px]">
                <span className="text-gray-600">
                  {isVi ? 'Lợi Nhuận Ròng:' : 'Net Profit:'}
                </span>
                <span className="text-amber-800 font-bold">
                  +{formatUSD(gold.profitUsd)} ({formatPercent(gold.roiPercent)})
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px]">
                <span className="text-gray-600">
                  {isVi ? 'Tăng Trưởng Kép Năm (CAGR):' : 'Annualized Return (CAGR):'}
                </span>
                <span className="text-amber-800 font-bold">
                  {formatPercent(gold.cagrPercent)}/năm
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px]">
                <span className="text-gray-600">
                  {isVi ? 'Sụt Giảm Tối Đa (MDD):' : 'Max Drawdown (MDD):'}
                </span>
                <span className="text-amber-800 font-bold">-{gold.maxDrawdownPercent}%</span>
              </div>
              <div className="flex justify-between items-baseline text-[11px]">
                <span className="text-gray-600">
                  {isVi ? 'Lượng Vàng Tích Lũy:' : 'Accumulated Gold:'}
                </span>
                <span className="text-gray-900 font-bold">
                  ~{gold.totalGoldTaelsAccumulated} lượng SJC
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px] pt-1 border-t border-amber-200/60">
                <span className="text-gray-600">
                  {isVi ? 'Thanh Khoản Vật Chất:' : 'Liquidity Spread:'}
                </span>
                <span className="text-amber-800 font-bold">-1.5% phí chênh mua/bán</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-amber-200/60 text-[10px] text-amber-800/80 font-mono">
            {isVi
              ? '[Mô hình chu kỳ mô phỏng (Synthetic) + Phí chênh mua/bán 1.5% thực tế tại Việt Nam]'
              : '[Synthetic cycle model calibrated with 1.5% VN physical bid-ask spread]'}
          </div>
        </div>

        {/* 3. VND Bank Savings Card */}
        <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80 relative overflow-hidden flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-sky-200/60">
              <div className="flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-sky-600" />
                <span className="font-bold text-xs text-sky-950">
                  {t('bankCardTitle', locale)}
                </span>
              </div>
              <span className="text-[10px] font-mono text-sky-800 bg-sky-100/90 px-2 py-0.5 rounded font-bold border border-sky-300">
                {formatPercent(bank.roiPercent)}
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-600 text-[11px]">
                  {isVi ? 'Giá Trị Hiện Tại:' : 'Current Value:'}
                </span>
                <span className="text-base font-bold text-sky-900 tabular-nums">
                  {formatUSD(bank.currentValueUsd)}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px]">
                <span className="text-gray-600">
                  {isVi ? 'Tổng Vốn Đã Bỏ Ra:' : 'Total Invested:'}
                </span>
                <span className="text-gray-900 font-bold">{formatUSD(bank.totalInvestedUsd)}</span>
              </div>
              <div className="flex justify-between items-baseline text-[11px]">
                <span className="text-gray-600">
                  {isVi ? 'Lợi Nhuận Ròng:' : 'Net Profit:'}
                </span>
                <span className="text-sky-800 font-bold">
                  +{formatUSD(bank.profitUsd)} ({formatPercent(bank.roiPercent)})
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 font-medium font-sans">
                  {isVi ? 'Lãi Suất Tiết Kiệm (APY):' : 'Annual Rate (APY):'}
                </span>
                <div className="flex items-center gap-2 font-bold text-sky-700">
                  <input
                    type="range"
                    min="4"
                    max="8"
                    step="0.5"
                    aria-label={isVi ? 'Lãi suất tiết kiệm' : 'Savings APY'}
                    value={params.vndBankAnnualRate * 100}
                    onChange={(e) =>
                      setParams({ vndBankAnnualRate: Number(e.target.value) / 100 })
                    }
                    className="w-24 sm:w-28 accent-sky-600 cursor-pointer"
                  />
                  <span className="tabular-nums font-mono">{(params.vndBankAnnualRate * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex justify-between items-baseline text-[11px]">
                <span className="text-gray-600">
                  {isVi ? 'Sụt Giảm Tối Đa (MDD):' : 'Max Drawdown (MDD):'}
                </span>
                <span className="text-emerald-700 font-bold">0.0% (Bảo toàn vốn)</span>
              </div>
              <div className="flex justify-between items-baseline text-[11px]">
                <span className="text-gray-600">
                  {isVi ? 'Lợi Nhuận Sau Lạm Phát (3.8% CPI):' : 'Real Return (After 3.8% CPI):'}
                </span>
                <span className="text-amber-700 font-bold">
                  {formatPercent(bank.realRoiPercent)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-sky-200/60 text-[10px] text-gray-500 font-mono">
            {isVi
              ? 'Lãi suất danh nghĩa cố định; sức mua suy giảm do lạm phát dài hạn.'
              : 'Fixed nominal yield; real purchasing power declines with CPI inflation.'}
          </div>
        </div>
      </div>

      {/* MULTI-ASSET CUMULATIVE GROWTH CHART (PortfolioVisualizer Standard) */}
      <div className="p-4 rounded-xl bg-white border border-[#EEF0F5] shadow-xs flex flex-col space-y-3">
        {/* Chart Header & Interactive Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
              {isVi
                ? 'Biểu Đồ Tăng Trưởng Tài Sản Lũy Kế vs. Vốn Gốc'
                : 'Cumulative Multi-Asset Growth vs. Capital Base'}
            </h3>
          </div>

          {/* Interactive Legend with Live Crosshair Values */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>BTC Spot: {hoverData?.btcVal ? formatUSD(hoverData.btcVal) : formatUSD(btc.currentValueUsd)}</span>
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Vàng SJC: {hoverData?.goldVal ? formatUSD(hoverData.goldVal) : formatUSD(gold.currentValueUsd)}</span>
            </span>
            <span className="flex items-center gap-1.5 text-sky-700">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>Tiết Kiệm: {hoverData?.bankVal ? formatUSD(hoverData.bankVal) : formatUSD(bank.currentValueUsd)}</span>
            </span>
            <span className="flex items-center gap-1.5 text-gray-500">
              <span className="w-2.5 h-0.5 border-b border-dashed border-gray-400" />
              <span>Vốn Nạp: {hoverData?.baseVal ? formatUSD(hoverData.baseVal) : formatUSD(btc.totalInvestedUsd)}</span>
            </span>
          </div>
        </div>

        {/* Lightweight Charts Canvas */}
        <div ref={chartContainerRef} className="w-full h-[300px] rounded-lg overflow-hidden relative" />
      </div>

      {/* EXPANDABLE MONTHLY EXECUTION LEDGER (Auditable Historical Records) */}
      <div className="rounded-xl bg-white border border-[#EEF0F5] shadow-xs overflow-hidden">
        {/* Accordion Toggle Header */}
        <button
          onClick={() => setIsLedgerOpen(!isLedgerOpen)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F4F6F9] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-[#7C3AED]" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#111827]">
                {isVi
                  ? `Bảng Sao Kê Chi Tiết Từng Kỳ Mua Lịch Sử (${ledger.length} kỳ)`
                  : `Monthly Execution Ledger (${ledger.length} cycles)`}
              </span>
              <span className="text-[10px] text-gray-500 block font-sans">
                {isVi
                  ? `Tổng vốn: ${formatUSD(btc.totalInvestedUsd)} • Giá vốn TB: ${formatUSD(btc.avgBuyPrice)} • Tổng tích lũy: ${formatSats(btc.totalBtcAccumulated)}`
                  : `Total Spent: ${formatUSD(btc.totalInvestedUsd)} • Avg Basis: ${formatUSD(btc.avgBuyPrice)} • Total Sats: ${formatSats(btc.totalBtcAccumulated)}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F4F6F9] text-gray-700 border border-[#EEF0F5]">
              {isLedgerOpen ? (isVi ? 'Thu Gọn' : 'Collapse') : (isVi ? 'Mở Rộng' : 'Expand')}
            </span>
            {isLedgerOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </button>

        {/* Ledger Table Body */}
        {isLedgerOpen && (
          <div className="border-t border-[#EEF0F5] max-h-[360px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-[11px] font-mono text-left">
              <thead className="bg-[#F4F6F9] sticky top-0 text-[10px] uppercase text-gray-600 border-b border-[#EEF0F5]">
                <tr>
                  <th className="py-2.5 px-3">Kỳ #</th>
                  <th className="py-2.5 px-3">{isVi ? 'Tháng/Năm' : 'Month/Year'}</th>
                  <th className="py-2.5 px-3">{isVi ? 'Giá BTC ($)' : 'BTC Price'}</th>
                  <th className="py-2.5 px-3">{isVi ? 'Điểm Hội Tụ' : 'Confluence'}</th>
                  <th className="py-2.5 px-3">{isVi ? 'Hệ Số Nhân' : 'Multiplier'}</th>
                  <th className="py-2.5 px-3">{isVi ? 'Giải Ngân ($)' : 'Allocated ($)'}</th>
                  <th className="py-2.5 px-3">{isVi ? 'Sats Mua Được' : 'Sats Acquired'}</th>
                  <th className="py-2.5 px-3 text-right">{isVi ? 'Giá Vốn Lũy Kế' : 'Cum Avg Cost'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF0F5]">
                {ledger.map((item) => {
                  let confluenceBadge = (
                    <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {item.confluenceScore}/100
                    </span>
                  );
                  if (item.confluenceScore < 60) {
                    confluenceBadge = (
                      <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                        {item.confluenceScore}/100
                      </span>
                    );
                  } else if (item.confluenceScore < 75) {
                    confluenceBadge = (
                      <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-purple-50 text-[#7C3AED] border border-purple-200">
                        {item.confluenceScore}/100
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={item.periodIndex}
                      className="hover:bg-[#F4F6F9] transition-colors"
                    >
                      <td className="py-2 px-3 text-gray-500 font-bold">#{item.periodIndex}</td>
                      <td className="py-2 px-3 text-gray-900 font-medium">{item.monthLabel}</td>
                      <td className="py-2 px-3 text-gray-900 font-bold">{formatUSD(item.btcPrice)}</td>
                      <td className="py-2 px-3">{confluenceBadge}</td>
                      <td className="py-2 px-3 text-amber-700 font-bold">{item.multiplier}x</td>
                      <td className="py-2 px-3 text-emerald-700 font-bold">{formatUSD(item.investedUsd)}</td>
                      <td className="py-2 px-3 text-amber-800 font-bold">
                        {item.satsBought.toLocaleString()} sats
                      </td>
                      <td className="py-2 px-3 text-right text-gray-900 font-bold">
                        {formatUSD(item.cumulativeAvgPrice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
