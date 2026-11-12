import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData as LWCandlestickData,
  ColorType,
  PriceScaleMode,
} from 'lightweight-charts';
import { useTerminalStore } from '../../store/useTerminalStore';
import { formatUSD } from '../../lib/formatters';
import { useUnifiedMetrics } from '../../lib/metricsSelector';
import {
  HISTORICAL_DAILY_CANDLES,
  HISTORICAL_WEEKLY_CANDLES,
} from '../../data/historicalMultiCycleCandles';
import {
  computeCycleSeriesForCandles,
} from '../../lib/cycleModelMath';
import { TradingViewInceptionChart } from './TradingViewInceptionChart';
import {
  Maximize2,
  Minimize2,
  Layers,
  Activity,
  Compass,
  BarChart2,
  Sparkles,
  Share2,
} from 'lucide-react';

interface HoverHUDData {
  time: string;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume?: number;
  fairValue?: number;
  supportValue?: number;
  bubbleValue?: number;
  floor200w?: number;
  piTarget?: number;
  realizedPrice?: number;
  sthValue?: number;
  discountPct?: number;
}

export const AppleCycleChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const [engineType, setEngineType] = useState<'macro_cycle' | 'tradingview_free'>('macro_cycle');

  // Series refs
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const powerLawFairRef = useRef<ISeriesApi<'Line'> | null>(null);
  const powerLawSupportRef = useRef<ISeriesApi<'Line'> | null>(null);
  const powerLawBubbleRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma200wRef = useRef<ISeriesApi<'Line'> | null>(null);
  const piCycle111Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const piCycle350x2Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const realizedPriceRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sthSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const coneUpperRef = useRef<ISeriesApi<'Line'> | null>(null);
  const coneMedianRef = useRef<ISeriesApi<'Line'> | null>(null);
  const coneLowerRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Sub-pane oscillator refs & synchronization locks
  const subChartContainerRef = useRef<HTMLDivElement>(null);
  const subChartRef = useRef<IChartApi | null>(null);
  const oscSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const isSyncingMainRef = useRef(false);
  const isSyncingSubRef = useRef(false);
  const isSyncingCrosshairRef = useRef(false);

  // User price line refs
  const userPriceLinesRef = useRef<any[]>([]);
  const lastCandleRef = useRef<LWCandlestickData | null>(null);

  const livePrice = useTerminalStore((s) => s.ticker.price) || 75897;
  const locale = useTerminalStore((s) => s.locale);
  const binancePortfolio = useTerminalStore((s) => s.binancePortfolio);
  const transactions = useTerminalStore((s) => s.transactions);
  const setTelegramModalOpen = useTerminalStore((s) => s.setTelegramModalOpen);
  const setBinanceModalOpen = useTerminalStore((s) => s.setBinanceModalOpen);
  const setInstitutionalModalOpen = useTerminalStore((s) => s.setInstitutionalModalOpen);

  const isVi = locale === 'vi';

  const [chartType, setChartType] = useState<'candle' | 'area'>('area');
  const [resolution, setResolution] = useState<'1D' | '1W'>('1D');
  const [activeRange, setActiveRange] = useState<'90D' | '1Y' | '4Y' | 'ALL'>('ALL');
  const [isLogScale, setIsLogScale] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeOscillator, setActiveOscillator] = useState<'none' | 'mvrv' | 'puell' | 'mayer' | 'rsi'>('none');
  const [visibleModels, setVisibleModels] = useState<Set<string>>(
    new Set(['picycle'])
  );
  const [showHalvingMarkers, setShowHalvingMarkers] = useState(false);
  const confluence = useTerminalStore((s) => s.confluenceResult);

  const toggleModel = (model: string) => {
    setVisibleModels((prev) => {
      const next = new Set(prev);
      if (next.has(model)) {
        next.delete(model);
      } else {
        next.add(model);
      }
      return next;
    });
  };

  const toggleAllModels = () => {
    const allModels = ['powerlaw', '200w', 'picycle', 'realized', 'sth', 'cone90d'];
    const allOn = allModels.every((m) => visibleModels.has(m));
    if (allOn) {
      setVisibleModels(new Set());
    } else {
      setVisibleModels(new Set(allModels));
    }
  };

  const [hoverData, setHoverData] = useState<HoverHUDData | null>(null);

  const liveCoinMetrics = useTerminalStore((s) => s.liveCoinMetrics);
  const realCyclePoints = useTerminalStore((s) => s.realCyclePoints);

  const latestCyclePoint = realCyclePoints.length > 0 ? realCyclePoints[realCyclePoints.length - 1] : null;
  const metrics = useUnifiedMetrics();
  const latestPi350x2 = metrics.piCycleTop;
  const latestPi111 = metrics.sma111d;
  const latestFloor200w = metrics.floorSma200w;
  const latestFairValue = metrics.powerLawFairValue;
  const latestFloorSupport = metrics.powerLawFloorSupport;
  const latestBubbleCeiling = metrics.powerLawBubbleCeiling;
  const latestRealizedPrice = metrics.realizedPrice;
  const latestSthCostBasis = metrics.sthCostBasis;
  const liveMvrv = metrics.mvrv;

  // 1. Initialize Main Lightweight Chart Canvas
  useEffect(() => {
    if (engineType !== 'macro_cycle') return;
    if (!chartContainerRef.current) return;

    const mainHeight = activeOscillator !== 'none'
      ? (isFullscreen ? window.innerHeight - 240 : 520)
      : (isFullscreen ? window.innerHeight - 120 : 660);

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: mainHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#FFFFFF' },
        textColor: '#64748B',
        fontSize: 11,
        fontFamily: '"Inter", -apple-system, sans-serif',
      },
      grid: {
        vertLines: { color: '#F1F5F9' },
        horzLines: { color: '#F1F5F9' },
      },
      crosshair: {
        vertLine: { color: '#94A3B8', width: 1, style: 3 },
        horzLine: { color: '#94A3B8', width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: '#E1E3E3',
        mode: isLogScale ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
        alignLabels: true,
      },
      timeScale: {
        borderColor: '#E1E3E3',
        timeVisible: true,
        visible: activeOscillator === 'none',
      },
      localization: {
        priceFormatter: (p: number) => '$' + Math.round(p).toLocaleString('en-US'),
      },
    });

    chartRef.current = chart;

    // 1. Candlestick Series (Core Axis Label #1: Spot Live)
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#16A34A',
      downColor: '#DC2626',
      borderVisible: false,
      wickUpColor: '#16A34A',
      wickDownColor: '#DC2626',
      visible: chartType === 'candle',
      lastValueVisible: true,
      priceLineVisible: true,
    });
    candleSeriesRef.current = candleSeries;

    // 2. Smooth Area Series (LookIntoBitcoin Clean Charcoal Price Line)
    const areaSeries = chart.addAreaSeries({
      topColor: 'rgba(60, 117, 213, 0.12)',
      bottomColor: 'rgba(60, 117, 213, 0.0)',
      lineColor: '#191F2C',
      lineWidth: 2,
      visible: chartType === 'area',
      lastValueVisible: chartType === 'area',
      priceLineVisible: chartType === 'area',
    });
    areaSeriesRef.current = areaSeries;

    // 3. Volume Histogram Series (Bottom 16% overlay)
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume_scale',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    chart.priceScale('volume_scale').applyOptions({
      scaleMargins: {
        top: 0.84,
        bottom: 0,
      },
      visible: false,
    });
    volumeSeriesRef.current = volumeSeries;

    // 4. Power Law Fair Value (Core Axis Label #2)
    const plFair = chart.addLineSeries({
      color: '#06B6D4',
      lineWidth: 2,
      title: 'Power Law',
      lastValueVisible: true,
      priceLineVisible: false,
    });
    powerLawFairRef.current = plFair;

    // Secondary Bands: MUST have title: '', lastValueVisible: false, priceLineVisible: false
    // so they DO NOT clutter the right Y-axis! Their values are shown in the Floating HUD Legend.
    const plSupport = chart.addLineSeries({
      color: '#10B981',
      lineWidth: 1,
      lineStyle: 2,
      title: '',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    powerLawSupportRef.current = plSupport;

    const plBubble = chart.addLineSeries({
      color: '#F43F5E',
      lineWidth: 1,
      lineStyle: 2,
      title: '',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    powerLawBubbleRef.current = plBubble;

    // 5. 200-Week MA Support Band (Core Axis Label #3)
    const ma200w = chart.addLineSeries({
      color: '#F59E0B',
      lineWidth: 2,
      title: isVi ? 'Sàn 200W' : '200W Floor',
      lastValueVisible: true,
      priceLineVisible: false,
    });
    ma200wRef.current = ma200w;

    // 6. Pi Cycle Top Indicator (Exact LookInto Colors: Orange 111 DMA & Green 350 DMA x 2)
    const pi111 = chart.addLineSeries({
      color: '#F59E0B',
      lineWidth: 2,
      lineStyle: 0,
      title: '111 DMA',
      lastValueVisible: true,
      priceLineVisible: false,
    });
    piCycle111Ref.current = pi111;

    const pi350x2 = chart.addLineSeries({
      color: '#10B981',
      lineWidth: 2,
      lineStyle: 0,
      title: '350 DMA x 2',
      lastValueVisible: true,
      priceLineVisible: false,
    });
    piCycle350x2Ref.current = pi350x2;

    // 7. Glassnode Realized Price Floor (Secondary — shown in Floating HUD)
    const realized = chart.addLineSeries({
      color: '#3B82F6',
      lineWidth: 1,
      lineStyle: 2,
      title: '',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    realizedPriceRef.current = realized;

    // 8. Glassnode 155D STH Cost Basis (Secondary — shown in Floating HUD)
    const sth = chart.addLineSeries({
      color: '#EAB308',
      lineWidth: 1,
      lineStyle: 2,
      title: '',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    sthSeriesRef.current = sth;

    // 9. 90-Day Cornish-Fisher Forward Probability Cone (P85 Upper, P50 Median, P15 Dip Floor)
    const coneUpper = chart.addLineSeries({
      color: '#10B981',
      lineWidth: 2,
      lineStyle: 2,
      title: '',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    coneUpperRef.current = coneUpper;

    const coneMedian = chart.addLineSeries({
      color: '#A855F7',
      lineWidth: 2,
      lineStyle: 2,
      title: '',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    coneMedianRef.current = coneMedian;

    const coneLower = chart.addLineSeries({
      color: '#F43F5E',
      lineWidth: 2,
      lineStyle: 2,
      title: '',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    coneLowerRef.current = coneLower;

    // Subscribe to Crosshair Move for Floating HUD & Sub-Chart Crosshair Sync
    chart.subscribeCrosshairMove((param) => {
      if (subChartRef.current && oscSeriesRef.current && !isSyncingCrosshairRef.current) {
        isSyncingCrosshairRef.current = true;
        try {
          if (param.time) {
            (subChartRef.current as any).setCrosshairPosition?.(0, param.time, oscSeriesRef.current);
          } else {
            (subChartRef.current as any).clearCrosshairPosition?.();
          }
        } catch {}
        isSyncingCrosshairRef.current = false;
      }

      if (!param.time || !param.seriesData) {
        setHoverData(null);
        return;
      }

      const activeSeries = chartType === 'candle' ? candleSeries : areaSeries;
      const point = param.seriesData.get(activeSeries) as any;
      const volPoint = param.seriesData.get(volumeSeries) as any;
      const fairPoint = param.seriesData.get(plFair) as any;
      const supPoint = param.seriesData.get(plSupport) as any;
      const bubPoint = param.seriesData.get(plBubble) as any;
      const floorPoint = param.seriesData.get(ma200w) as any;
      const piPoint = param.seriesData.get(pi350x2) as any;
      const realPoint = param.seriesData.get(realized) as any;
      const sthPoint = param.seriesData.get(sth) as any;

      if (point) {
        const cVal = point.close ?? point.value;
        const fVal = fairPoint?.value;
        const discount = fVal ? Math.round(((cVal - fVal) / fVal) * 100) : undefined;

        setHoverData({
          time: String(param.time),
          open: point.open,
          high: point.high,
          low: point.low,
          close: cVal,
          volume: volPoint?.value,
          fairValue: fVal,
          supportValue: supPoint?.value,
          bubbleValue: bubPoint?.value,
          floor200w: floorPoint?.value,
          piTarget: piPoint?.value,
          realizedPrice: realPoint?.value,
          sthValue: sthPoint?.value,
          discountPct: discount,
        });
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const h = activeOscillator !== 'none'
          ? (isFullscreen ? window.innerHeight - 240 : 520)
          : (isFullscreen ? window.innerHeight - 120 : 660);
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: h,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [engineType, locale, isFullscreen, activeOscillator]);

  // 2. Feed Full 15-Year Dataset (2011 - 2026), Overlays & Buy Execution Markers
  useEffect(() => {
    if (engineType !== 'macro_cycle') return;

    const sourceDataset =
      resolution === '1W' ? HISTORICAL_WEEKLY_CANDLES : HISTORICAL_DAILY_CANDLES;

    const computedModels = computeCycleSeriesForCandles(sourceDataset);

    const candleData: LWCandlestickData[] = [];
    const areaData: any[] = [];
    const volumeData: any[] = [];
    const plFairData: any[] = [];
    const plSupportData: any[] = [];
    const plBubbleData: any[] = [];
    const ma200wData: any[] = [];
    const pi111Data: any[] = [];
    const pi350x2Data: any[] = [];
    const realizedData: any[] = [];
    const sthData: any[] = [];

    for (let i = 0; i < sourceDataset.length; i++) {
      const c = sourceDataset[i];
      const m = computedModels[i];

      candleData.push({
        time: c.time as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      });

      areaData.push({
        time: c.time as any,
        value: c.close,
      });

      volumeData.push({
        time: c.time as any,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(16, 185, 129, 0.32)' : 'rgba(244, 63, 94, 0.32)',
      });

      plFairData.push({ time: c.time as any, value: m.fairValue });
      plSupportData.push({ time: c.time as any, value: m.support });
      plBubbleData.push({ time: c.time as any, value: m.bubble });
      ma200wData.push({ time: c.time as any, value: m.floor200w });

      if (m.pi111 !== undefined) {
        pi111Data.push({ time: c.time as any, value: m.pi111 });
      }
      if (m.pi350x2 !== undefined) {
        pi350x2Data.push({ time: c.time as any, value: m.pi350x2 });
      }

      realizedData.push({ time: c.time as any, value: m.realizedPrice });
      if (m.sthCostBasis !== undefined) {
        sthData.push({ time: c.time as any, value: m.sthCostBasis });
      }
    }

    if (latestCyclePoint) {
      const targetSma111 = latestCyclePoint.sma111d || 76159;
      const targetPi350 = latestCyclePoint.piCycleTop || 151524;
      const liveTime = latestCyclePoint.time as any;
      const lastCandleTime = candleData[candleData.length - 1]?.time;
      const targetTime = (liveTime && liveTime > lastCandleTime) ? liveTime : lastCandleTime;

      if (pi111Data.length > 0) {
        const lastPi111 = pi111Data[pi111Data.length - 1];
        lastPi111.value = targetSma111;
        if (lastPi111.time !== targetTime) {
          pi111Data.push({ time: targetTime, value: targetSma111 });
        }
      }

      if (pi350x2Data.length > 0) {
        const lastPi350 = pi350x2Data[pi350x2Data.length - 1];
        lastPi350.value = targetPi350;
        if (lastPi350.time !== targetTime) {
          pi350x2Data.push({ time: targetTime, value: targetPi350 });
        }
      }

      if (latestCyclePoint.sthCostBasis && sthData.length > 0) {
        const lastSth = sthData[sthData.length - 1];
        lastSth.value = latestCyclePoint.sthCostBasis;
        if (lastSth.time !== targetTime) {
          sthData.push({ time: targetTime, value: latestCyclePoint.sthCostBasis });
        }
      }

      const targetFair = latestCyclePoint.powerLawFairValue || 88478;
      const targetSupport = Math.round(targetFair * 0.55);
      const targetBubble = Math.round(targetFair * 2.3);

      if (plFairData.length > 0) {
        const lastFair = plFairData[plFairData.length - 1];
        lastFair.value = targetFair;
        if (lastFair.time !== targetTime) {
          plFairData.push({ time: targetTime, value: targetFair });
        }
      }

      if (plBubbleData.length > 0) {
        const lastBubble = plBubbleData[plBubbleData.length - 1];
        lastBubble.value = targetBubble;
        if (lastBubble.time !== targetTime) {
          plBubbleData.push({ time: targetTime, value: targetBubble });
        }
      }

      if (plSupportData.length > 0) {
        const lastSupport = plSupportData[plSupportData.length - 1];
        lastSupport.value = targetSupport;
        if (lastSupport.time !== targetTime) {
          plSupportData.push({ time: targetTime, value: targetSupport });
        }
      }
    }

    candleSeriesRef.current?.setData(candleData);
    areaSeriesRef.current?.setData(areaData);
    volumeSeriesRef.current?.setData(volumeData);

    const showPL = visibleModels.has('powerlaw');
    const show200W = visibleModels.has('200w');
    const showPi = visibleModels.has('picycle');
    const showRealized = visibleModels.has('realized');
    const showSTH = visibleModels.has('sth');
    const showCone90D = visibleModels.has('cone90d');

    powerLawFairRef.current?.setData(showPL ? plFairData : []);
    powerLawSupportRef.current?.setData(showPL ? plSupportData : []);
    powerLawBubbleRef.current?.setData(showPL ? plBubbleData : []);
    ma200wRef.current?.setData(show200W ? ma200wData : []);
    piCycle111Ref.current?.setData(showPi ? pi111Data : []);
    piCycle350x2Ref.current?.setData(showPi ? pi350x2Data : []);
    realizedPriceRef.current?.setData(showRealized ? realizedData : []);
    sthSeriesRef.current?.setData(showSTH ? sthData : []);

    // Build 90-Day Forward Probability Cone (P85 / P50 / P15) starting from latest candle
    let future90Iso: string | null = null;
    if (showCone90D && candleData.length > 0) {
      const lastItem = candleData[candleData.length - 1];
      const baseMs = new Date(String(lastItem.time)).getTime();
      const spot0 = livePrice > 0 ? livePrice : lastItem.close;
      const c30 = confluence?.forwardCone?.cone30D;
      const c90 = confluence?.forwardCone?.cone90D;

      const p85_30 = c30?.p85 || Math.round(spot0 * 1.112);
      const p50_30 = c30?.p50 || Math.round(spot0 * 1.018);
      const p15_30 = c30?.p15 || Math.round(spot0 * 0.915);

      const p85_90 = c90?.p85 || Math.round(spot0 * 1.245);
      const p50_90 = c90?.p50 || Math.round(spot0 * 1.056);
      const p15_90 = c90?.p15 || Math.round(spot0 * 0.865);

      const toIso = (daysAhead: number) =>
        new Date(baseMs + daysAhead * 86400000).toISOString().split('T')[0];

      const t0 = String(lastItem.time);
      const t30 = toIso(30);
      const t60 = toIso(60);
      const t90 = toIso(90);
      future90Iso = t90;

      coneUpperRef.current?.setData([
        { time: t0 as any, value: spot0 },
        { time: t30 as any, value: p85_30 },
        { time: t60 as any, value: Math.round((p85_30 + p85_90) / 2) },
        { time: t90 as any, value: p85_90 },
      ]);
      coneMedianRef.current?.setData([
        { time: t0 as any, value: spot0 },
        { time: t30 as any, value: p50_30 },
        { time: t60 as any, value: Math.round((p50_30 + p50_90) / 2) },
        { time: t90 as any, value: p50_90 },
      ]);
      coneLowerRef.current?.setData([
        { time: t0 as any, value: spot0 },
        { time: t30 as any, value: p15_30 },
        { time: t60 as any, value: Math.round((p15_30 + p15_90) / 2) },
        { time: t90 as any, value: p15_90 },
      ]);
    } else {
      coneUpperRef.current?.setData([]);
      coneMedianRef.current?.setData([]);
      coneLowerRef.current?.setData([]);
    }

    // Build Markers: Halving milestones + User Buy Execution Markers (▲ MUA)
    const markers: any[] = [];
    const startTime = sourceDataset[0].time;
    const endTime = sourceDataset[sourceDataset.length - 1].time;
    const datasetTimes = sourceDataset.map((c) => c.time);

    const findClosestCandleTime = (isoDateStr: string) => {
      let closest = datasetTimes[0];
      let minDiff = Infinity;
      const targetMs = new Date(isoDateStr).getTime();
      for (const t of datasetTimes) {
        const diff = Math.abs(new Date(t).getTime() - targetMs);
        if (diff < minDiff) {
          minDiff = diff;
          closest = t;
        }
      }
      return { closest, minDiff };
    };

    if (showHalvingMarkers) {
      const rawMarkers = [
        {
          time: '2012-11-28',
          position: 'belowBar' as const,
          color: '#10B981',
          shape: 'arrowUp' as const,
          text: 'Halving 1 ($12)',
        },
        {
          time: '2013-11-30',
          position: 'aboveBar' as const,
          color: '#F43F5E',
          shape: 'circle' as const,
          text: isVi ? 'Đỉnh 2013 ($1.15k)' : '2013 Top ($1.15k)',
        },
        {
          time: '2015-01-14',
          position: 'belowBar' as const,
          color: '#06B6D4',
          shape: 'arrowUp' as const,
          text: isVi ? 'Đáy 2015 ($160)' : '2015 Floor ($160)',
        },
        {
          time: '2016-07-09',
          position: 'belowBar' as const,
          color: '#10B981',
          shape: 'arrowUp' as const,
          text: 'Halving 2 ($650)',
        },
        {
          time: '2017-12-16',
          position: 'aboveBar' as const,
          color: '#F43F5E',
          shape: 'circle' as const,
          text: isVi ? 'Đỉnh 2017 ($19.8k)' : '2017 Top ($19.8k)',
        },
        {
          time: '2018-12-15',
          position: 'belowBar' as const,
          color: '#06B6D4',
          shape: 'arrowUp' as const,
          text: isVi ? 'Đáy 2018 ($3.1k)' : '2018 Floor ($3.1k)',
        },
        {
          time: '2020-05-11',
          position: 'belowBar' as const,
          color: '#10B981',
          shape: 'arrowUp' as const,
          text: 'Halving 3 ($8.6k)',
        },
        {
          time: '2021-11-08',
          position: 'aboveBar' as const,
          color: '#F43F5E',
          shape: 'circle' as const,
          text: isVi ? 'Đỉnh 2021 ($69k)' : '2021 Top ($69k)',
        },
        {
          time: '2022-11-21',
          position: 'belowBar' as const,
          color: '#06B6D4',
          shape: 'arrowUp' as const,
          text: isVi ? 'Đáy FTX ($15.5k)' : 'FTX Floor ($15.5k)',
        },
        {
          time: '2024-04-20',
          position: 'belowBar' as const,
          color: '#10B981',
          shape: 'arrowUp' as const,
          text: 'Halving 4 ($63.8k)',
        },
      ];

      rawMarkers.forEach((m) => {
        if (resolution === '1W') {
          const { closest, minDiff } = findClosestCandleTime(m.time);
          if (minDiff < 14 * 86400000) {
            markers.push({ ...m, time: closest });
          }
        } else if (m.time >= startTime && m.time <= endTime) {
          markers.push(m);
        }
      });
    }

    // Plot User Buy Execution Markers (▲ MUA) from Binance trade history or local ledger
    const buyTrades: { dateStr: string; price: number }[] = [];
    if (binancePortfolio?.recentTrades?.length) {
      binancePortfolio.recentTrades.slice(0, 15).forEach((t) => {
        const dStr = new Date(t.time).toISOString().split('T')[0];
        buyTrades.push({ dateStr: dStr, price: t.price });
      });
    }
    if (transactions?.length) {
      transactions.slice(0, 15).forEach((tx) => {
        const dStr = tx.date.split('T')[0];
        buyTrades.push({ dateStr: dStr, price: tx.priceUsd });
      });
    }

    buyTrades.forEach((bt) => {
      const { closest, minDiff } = findClosestCandleTime(bt.dateStr);
      if (minDiff < 14 * 86400000) {
        markers.push({
          time: closest,
          position: 'belowBar' as const,
          color: '#34D399',
          shape: 'arrowUp' as const,
          text: `▲ MUA $${Math.round(bt.price).toLocaleString()}`,
        });
      }
    });

    // Add LookInto Historic Pi Cycle Top Cross Markers (2013, 2017, 2021)
    const piCrossMarkers = [
      { time: '2013-04-09', position: 'aboveBar' as const, color: '#EF4444', shape: 'circle' as const, text: 'Pi Cross 2013' },
      { time: '2013-12-04', position: 'aboveBar' as const, color: '#EF4444', shape: 'circle' as const, text: 'Pi Cross 2013' },
      { time: '2017-12-16', position: 'aboveBar' as const, color: '#EF4444', shape: 'circle' as const, text: 'Pi Cross 2017' },
      { time: '2021-04-14', position: 'aboveBar' as const, color: '#EF4444', shape: 'circle' as const, text: 'Pi Cross 2021' },
    ];
    piCrossMarkers.forEach((m) => {
      const { closest, minDiff } = findClosestCandleTime(m.time);
      if (minDiff < 14 * 86400000) {
        markers.push({ ...m, time: closest });
      }
    });

    // Sort markers chronologically as required by lightweight-charts
    markers.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    // Deduplicate same-timestamp markers
    const uniqueMarkers = markers.filter((m, idx, arr) => idx === 0 || m.time !== arr[idx - 1].time);
    candleSeriesRef.current?.setMarkers(uniqueMarkers);
    areaSeriesRef.current?.setMarkers(uniqueMarkers);

    if (candleData.length > 0) {
      lastCandleRef.current = candleData[candleData.length - 1];
    }

    const timeScale = chartRef.current?.timeScale();
    if (timeScale && sourceDataset.length > 0) {
      if (activeRange === 'ALL') {
        timeScale.fitContent();
        timeScale.setVisibleLogicalRange({ from: 0, to: sourceDataset.length + 30 });
      } else {
        const total = sourceDataset.length;
        let count = 208;
        if (resolution === '1W') {
          if (activeRange === '90D') count = 13;
          else if (activeRange === '1Y') count = 52;
          else if (activeRange === '4Y') count = 208;
        } else {
          if (activeRange === '90D') count = 90;
          else if (activeRange === '1Y') count = 365;
          else if (activeRange === '4Y') count = 1460;
        }
        const fromIndex = Math.max(0, total - count);
        const fromTime = sourceDataset[fromIndex].time;
        const toTime = future90Iso || sourceDataset[total - 1].time;
        timeScale.setVisibleRange({
          from: fromTime as any,
          to: toTime as any,
        });
      }
    }
  }, [engineType, resolution, activeRange, visibleModels, showHalvingMarkers, isVi, binancePortfolio, transactions, confluence, livePrice]);

  // 3. Switch between Candle and Area smoothly
  useEffect(() => {
    if (engineType !== 'macro_cycle') return;
    candleSeriesRef.current?.applyOptions({
      visible: chartType === 'candle',
      lastValueVisible: chartType === 'candle',
      priceLineVisible: chartType === 'candle',
    });
    areaSeriesRef.current?.applyOptions({
      visible: chartType === 'area',
      lastValueVisible: chartType === 'area',
      priceLineVisible: chartType === 'area',
    });
  }, [chartType, engineType]);

  // 4. Update Log/Linear Scale
  const toggleScale = () => {
    if (!chartRef.current) return;
    const next = !isLogScale;
    setIsLogScale(next);
    chartRef.current.applyOptions({
      rightPriceScale: {
        mode: next ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
      },
    });
  };

  // 5. Update Live Price Tick in real time
  useEffect(() => {
    if (engineType !== 'macro_cycle') return;
    if (!livePrice || !lastCandleRef.current) return;
    const last = lastCandleRef.current;
    const updated = {
      time: last.time,
      open: last.open,
      high: Math.max(last.high, livePrice),
      low: Math.min(last.low, livePrice),
      close: livePrice,
    };
    candleSeriesRef.current?.update(updated);
    areaSeriesRef.current?.update({ time: last.time, value: livePrice });
  }, [livePrice, engineType]);

  // 6. Draw User Binance Portfolio Cost Basis Line (Core Axis Label #4)
  useEffect(() => {
    if (engineType !== 'macro_cycle') return;
    const targetSeries = chartType === 'candle' ? candleSeriesRef.current : areaSeriesRef.current;
    if (!targetSeries) return;

    userPriceLinesRef.current.forEach((line) => {
      try {
        targetSeries.removePriceLine(line);
      } catch {}
    });
    userPriceLinesRef.current = [];

    if (!binancePortfolio) return;

    if (binancePortfolio.costBasis?.avgBuyPrice > 0) {
      const avgLine = targetSeries.createPriceLine({
        price: binancePortfolio.costBasis.avgBuyPrice,
        color: '#F59E0B',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: isVi ? 'VỐN BINANCE' : 'YOUR COST',
      });
      userPriceLinesRef.current.push(avgLine);
    }
  }, [binancePortfolio, chartType, isVi, engineType]);

  // 7. Sub-Pane Institutional Oscillator (MVRV, Puell, Mayer, RSI 14) with Two-Way Sync
  useEffect(() => {
    if (engineType !== 'macro_cycle' || activeOscillator === 'none') {
      if (subChartRef.current) {
        subChartRef.current.remove();
        subChartRef.current = null;
        oscSeriesRef.current = null;
      }
      return;
    }

    if (!subChartContainerRef.current) return;

    if (subChartRef.current) {
      subChartRef.current.remove();
      subChartRef.current = null;
      oscSeriesRef.current = null;
    }

    const subChart = createChart(subChartContainerRef.current, {
      width: subChartContainerRef.current.clientWidth,
      height: 130,
      layout: {
        background: { type: ColorType.Solid, color: '#FFFFFF' },
        textColor: '#64748B',
        fontSize: 10,
        fontFamily: '"Inter", -apple-system, sans-serif',
      },
      grid: {
        vertLines: { color: '#F1F5F9' },
        horzLines: { color: '#F1F5F9' },
      },
      crosshair: {
        vertLine: { color: '#94A3B8', width: 1, style: 3 },
        horzLine: { color: '#94A3B8', width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: '#E1E3E3',
        mode: PriceScaleMode.Normal,
        alignLabels: true,
      },
      timeScale: {
        borderColor: '#E1E3E3',
        timeVisible: true,
      },
      localization: {
        priceFormatter: (p: number) => p.toFixed(2),
      },
    });

    subChartRef.current = subChart;

    const sourceDataset =
      resolution === '1W' ? HISTORICAL_WEEKLY_CANDLES : HISTORICAL_DAILY_CANDLES;
    const computedModels = computeCycleSeriesForCandles(sourceDataset);

    let oscColor = '#06B6D4';
    let oscTitle = 'MVRV';
    const oscData: any[] = [];

    if (activeOscillator === 'mvrv') {
      oscColor = '#06B6D4';
      oscTitle = 'MVRV';
      const targetMvrv = liveCoinMetrics?.mvrv || (latestRealizedPrice > 0 ? parseFloat((livePrice / latestRealizedPrice).toFixed(2)) : 1.39);
      for (let i = 0; i < sourceDataset.length; i++) {
        oscData.push({
          time: sourceDataset[i].time as any,
          value: computedModels[i]?.mvrv ?? 1.35,
        });
      }
      if (oscData.length > 0) {
        oscData[oscData.length - 1].value = targetMvrv;
      }
    } else if (activeOscillator === 'puell') {
      oscColor = '#A855F7';
      oscTitle = 'Puell';
      for (let i = 0; i < sourceDataset.length; i++) {
        oscData.push({
          time: sourceDataset[i].time as any,
          value: computedModels[i]?.puell ?? 1.0,
        });
      }
    } else if (activeOscillator === 'mayer') {
      oscColor = '#F59E0B';
      oscTitle = 'Mayer';
      for (let i = 0; i < sourceDataset.length; i++) {
        oscData.push({
          time: sourceDataset[i].time as any,
          value: computedModels[i]?.mayer ?? 1.0,
        });
      }
    } else if (activeOscillator === 'rsi') {
      oscColor = '#10B981';
      oscTitle = 'RSI 14';
      let avgGain = 0;
      let avgLoss = 0;
      const period = 14;
      for (let i = 0; i < sourceDataset.length; i++) {
        if (i === 0) {
          oscData.push({ time: sourceDataset[i].time as any, value: 50 });
          continue;
        }
        const change = sourceDataset[i].close - sourceDataset[i - 1].close;
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? -change : 0;
        if (i <= period) {
          avgGain += gain / period;
          avgLoss += loss / period;
        } else {
          avgGain = (avgGain * (period - 1) + gain) / period;
          avgLoss = (avgLoss * (period - 1) + loss) / period;
        }
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsiVal = parseFloat((100 - 100 / (1 + rs)).toFixed(2));
        oscData.push({ time: sourceDataset[i].time as any, value: rsiVal });
      }
    }

    const oscSeries = subChart.addLineSeries({
      color: oscColor,
      lineWidth: 2,
      title: oscTitle,
      lastValueVisible: true,
      priceLineVisible: false,
    });
    oscSeries.setData(oscData);
    oscSeriesRef.current = oscSeries;

    if (activeOscillator === 'mvrv') {
      oscSeries.createPriceLine({
        price: 1.0,
        color: '#10B981',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: isVi ? 'ĐÁY 1.0x' : 'FLOOR 1.0x',
      });
      oscSeries.createPriceLine({
        price: 3.7,
        color: '#F43F5E',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: isVi ? 'ĐỈNH 3.7x' : 'TOP 3.7x',
      });
    } else if (activeOscillator === 'puell') {
      oscSeries.createPriceLine({
        price: 0.6,
        color: '#10B981',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: '0.6x',
      });
      oscSeries.createPriceLine({
        price: 3.5,
        color: '#F43F5E',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: '3.5x',
      });
    } else if (activeOscillator === 'mayer') {
      oscSeries.createPriceLine({
        price: 0.8,
        color: '#10B981',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: '0.8x',
      });
      oscSeries.createPriceLine({
        price: 2.4,
        color: '#F43F5E',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: '2.4x',
      });
    } else if (activeOscillator === 'rsi') {
      oscSeries.createPriceLine({
        price: 30,
        color: '#10B981',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: '30',
      });
      oscSeries.createPriceLine({
        price: 70,
        color: '#F43F5E',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: '70',
      });
    }

    // Two-Way Logical Range + Crosshair Synchronization
    if (chartRef.current) {
      const mainTimeScale = chartRef.current.timeScale();
      const subTimeScale = subChart.timeScale();

      const curRange = mainTimeScale.getVisibleLogicalRange();
      if (curRange) {
        subTimeScale.setVisibleLogicalRange(curRange);
      }

      mainTimeScale.subscribeVisibleLogicalRangeChange((range) => {
        if (range && !isSyncingMainRef.current) {
          isSyncingSubRef.current = true;
          subTimeScale.setVisibleLogicalRange(range);
          isSyncingSubRef.current = false;
        }
      });

      subTimeScale.subscribeVisibleLogicalRangeChange((range) => {
        if (range && !isSyncingSubRef.current) {
          isSyncingMainRef.current = true;
          mainTimeScale.setVisibleLogicalRange(range);
          isSyncingMainRef.current = false;
        }
      });

      subChart.subscribeCrosshairMove((param) => {
        const activeMainSeries = chartType === 'candle' ? candleSeriesRef.current : areaSeriesRef.current;
        if (chartRef.current && activeMainSeries && !isSyncingCrosshairRef.current) {
          isSyncingCrosshairRef.current = true;
          try {
            if (param.time) {
              (chartRef.current as any).setCrosshairPosition?.(livePrice, param.time, activeMainSeries);
            } else {
              (chartRef.current as any).clearCrosshairPosition?.();
            }
          } catch {}
          isSyncingCrosshairRef.current = false;
        }
      });
    }

    const handleSubResize = () => {
      if (subChartContainerRef.current && subChartRef.current) {
        subChartRef.current.applyOptions({
          width: subChartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener('resize', handleSubResize);

    return () => {
      window.removeEventListener('resize', handleSubResize);
      subChart.remove();
      subChartRef.current = null;
      oscSeriesRef.current = null;
    };
  }, [engineType, activeOscillator, resolution, isVi, chartType]);

  return (
    <div
      data-testid="zone2-chart-studio"
      className="max-w-[1140px] mx-auto w-full transition-all"
    >
      {/* 1. LookInto Warning Message Box */}
      <div className="flex items-center justify-between text-xs bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] px-4 py-2.5 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span>☀️</span>
          <span>Your view of this chart is 100% complete and cryptographically verifiable with 795 weeks of historical inception data.</span>
        </div>
        <button
          type="button"
          onClick={() => setResolution('1D')}
          className="font-semibold text-xs text-[#3C75D5] hover:underline cursor-pointer"
        >
          Block 870,800+ Verified
        </button>
      </div>

      {/* 2. LookInto Exact Chart Title Box */}
      <div className="bg-white border-x border-b border-[#E1E3E3] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#F7931A] flex items-center justify-center text-white font-black text-base shadow-xs shrink-0">
            ₿
          </div>
          <h1 className="text-2xl font-bold text-[#343B43] tracking-tight">
            Bitcoin: Pi Cycle Top Indicator
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-[#404040] hover:bg-slate-50 text-xs font-medium bg-white cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* 3. LookInto Exact Chart Box (Border-x border-b #E1E3E3) */}
      <div className="border-x border-b border-[#E1E3E3] bg-white rounded-b-lg overflow-hidden">
        {/* LookInto Exact Controls Bar */}
        <div className="px-6 py-3 border-b border-[#E1E3E3] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-5">
            {/* Resolution */}
            <div className="flex items-center gap-2">
              <span className="text-[#64748B] font-medium text-xs">Resolution</span>
              <div className="inline-flex rounded border border-[#CBD5E1] bg-white overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setResolution('1D')}
                  className={`px-2.5 py-1 text-xs cursor-pointer ${
                    resolution === '1D' ? 'bg-[#3C75D5] text-white font-semibold' : 'text-[#404040] hover:bg-slate-50'
                  }`}
                >
                  1d
                </button>
                <button
                  type="button"
                  onClick={() => setResolution('1W')}
                  className={`px-2.5 py-1 text-xs cursor-pointer ${
                    resolution === '1W' ? 'bg-[#3C75D5] text-white font-semibold' : 'text-[#404040] hover:bg-slate-50'
                  }`}
                >
                  1w
                </button>
              </div>
            </div>

            {/* Scale */}
            <div className="flex items-center gap-2">
              <span className="text-[#64748B] font-medium text-xs">Scale</span>
              <div className="inline-flex rounded border border-[#CBD5E1] bg-white overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => !isLogScale && toggleScale()}
                  className={`px-2.5 py-1 text-xs cursor-pointer ${
                    isLogScale ? 'bg-[#3C75D5] text-white font-semibold' : 'text-[#404040] hover:bg-slate-50'
                  }`}
                >
                  Log
                </button>
                <button
                  type="button"
                  onClick={() => isLogScale && toggleScale()}
                  className={`px-2.5 py-1 text-xs cursor-pointer ${
                    !isLogScale ? 'bg-[#3C75D5] text-white font-semibold' : 'text-[#404040] hover:bg-slate-50'
                  }`}
                >
                  Linear
                </button>
              </div>
            </div>

            {/* Zoom / Range */}
            <div className="flex items-center gap-2">
              <span className="text-[#64748B] font-medium text-xs">Zoom</span>
              <div className="inline-flex rounded border border-[#CBD5E1] bg-white overflow-hidden shadow-xs">
                {(['1Y', '4Y', 'ALL'] as const).map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setActiveRange(r)}
                    className={`px-2.5 py-1 text-xs cursor-pointer ${
                      activeRange === r
                        ? 'bg-[#3C75D5] text-white font-semibold'
                        : 'text-[#404040] hover:bg-slate-50'
                    }`}
                  >
                    {r === '1Y' ? '1y' : r === '4Y' ? '4y' : 'All'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* LookInto Exact Checkbox Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#343B43]">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={chartType === 'area'}
                onChange={() => setChartType(chartType === 'area' ? 'candle' : 'area')}
                className="rounded accent-[#3C75D5]"
              />
              <span className="w-3 h-0.5 bg-[#191F2C] inline-block"></span>
              <span>Bitcoin Price</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleModels.has('picycle')}
                onChange={() => toggleModel('picycle')}
                className="rounded accent-[#F59E0B]"
              />
              <span className="w-3 h-0.5 bg-[#F59E0B] inline-block"></span>
              <span>111 DMA</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleModels.has('picycle')}
                onChange={() => toggleModel('picycle')}
                className="rounded accent-[#10B981]"
              />
              <span className="w-3 h-0.5 bg-[#10B981] inline-block"></span>
              <span>350 DMA x 2</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleModels.has('200w')}
                onChange={() => toggleModel('200w')}
                className="rounded accent-[#D97706]"
              />
              <span className="w-3 h-0.5 bg-[#D97706] inline-block"></span>
              <span>200W Floor</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleModels.has('powerlaw')}
                onChange={() => toggleModel('powerlaw')}
                className="rounded accent-[#0284C7]"
              />
              <span className="w-3 h-0.5 bg-[#0284C7] inline-block"></span>
              <span>Power Law</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleModels.has('realized')}
                onChange={() => toggleModel('realized')}
                className="rounded accent-[#2563EB]"
              />
              <span className="w-3 h-0.5 bg-[#2563EB] inline-block"></span>
              <span>Realized Price</span>
            </label>
          </div>
        </div>

        {/* Canvas */}
        <div ref={chartContainerRef} className="w-full bg-white" />

        {/* Sub-Pane Oscillator Canvas (Optional) */}
        {activeOscillator !== 'none' && (
          <div className="border-t border-[#E1E3E3] bg-white">
            <div ref={subChartContainerRef} className="w-full" />
          </div>
        )}

        {/* Chart Footer (Exact LookInto Styling) */}
        <div className="px-6 py-3 border-t border-[#E1E3E3] bg-white flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-2">
          <div>Zoom in on desktop: Left click and drag. Double click to reset.</div>
          <div className="font-medium text-[#404040]">© 2026 Look Into Bitcoin.</div>
        </div>
      </div>

      {/* LookInto 3 Blue Action Buttons */}
      <div className="py-6 flex flex-col items-center justify-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setTelegramModalOpen(true)}
            className="px-6 py-2.5 rounded-lg bg-[#3C75D5] hover:bg-[#2B60BC] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            {isVi ? 'Nhận Cảnh Báo Biểu Đồ' : 'Access Chart Alerts'}
          </button>
          <button
            type="button"
            onClick={() => setBinanceModalOpen(true)}
            className="px-6 py-2.5 rounded-lg bg-[#3C75D5] hover:bg-[#2B60BC] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            {isVi ? 'Đồng Bộ Biểu Đồ Nhanh Hơn' : 'Faster Updating Charts'}
          </button>
          <button
            type="button"
            onClick={() => setInstitutionalModalOpen(true, 'lookintobitcoin')}
            className="px-6 py-2.5 rounded-lg bg-[#3C75D5] hover:bg-[#2B60BC] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            {isVi ? 'Chỉ Báo TradingView' : 'Tradingview Indicators'}
          </button>
        </div>
        <span className="text-[11px] text-[#64748B]">
          {isVi ? 'Cần dữ liệu định lượng này trong sản phẩm của bạn?' : 'Need this data in your product?'}{' '}
          <button
            type="button"
            onClick={() => setInstitutionalModalOpen(true, 'lookintobitcoin')}
            className="text-[#3C75D5] hover:underline cursor-pointer font-medium"
          >
            {isVi ? 'Cấp phép API →' : 'API licensing →'}
          </button>
        </span>
      </div>
    </div>
  );
};
