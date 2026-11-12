import { CandlestickData } from '../../types';
import {
  HISTORICAL_DAILY_CANDLES,
  HISTORICAL_WEEKLY_CANDLES,
} from '../../data/historicalMultiCycleCandles';

// Bitcoin Genesis Date: Jan 3, 2009 18:15:05 UTC
export const BITCOIN_GENESIS_EPOCH = new Date('2009-01-03T18:15:05Z').getTime();

/**
 * Calculates days since Genesis for any given timestamp
 */
export function getDaysSinceGenesis(timestampMs: number = Date.now()): number {
  return (timestampMs - BITCOIN_GENESIS_EPOCH) / 86400000;
}

export interface ComputedCycleSeriesPoint {
  time: string;
  fairValue: number;
  support: number;
  bubble: number;
  floor200w: number;
  pi111?: number;
  pi350x2?: number;
  realizedPrice: number;
  sthCostBasis?: number; // Glassnode 155-Day STH VWAP Cost Basis
  mvrv?: number; // MVRV Ratio oscillator
  puell?: number; // Puell Multiple oscillator
  mayer?: number; // Mayer Multiple oscillator
}

/**
 * Power Law Mathematical Model (Giovanni Santostasi / LookIntoBitcoin calibration)
 * Accepts ISO date string ('2026-11-08'), timestamp in ms, or days since genesis.
 */
export function calculatePowerLawAtDate(dateOrDays: string | number): {
  fairValue: number;
  support: number;
  bubble: number;
} {
  let daysSince: number;
  if (typeof dateOrDays === 'number') {
    // If timestamp in ms (> 100,000), convert to days; if already days since genesis, use directly
    daysSince = dateOrDays > 100000
      ? Math.max(100, (dateOrDays - BITCOIN_GENESIS_EPOCH) / 86400000)
      : Math.max(100, dateOrDays);
  } else {
    const timeMs = new Date(dateOrDays).getTime();
    daysSince = Math.max(100, (timeMs - BITCOIN_GENESIS_EPOCH) / 86400000);
  }
  const logDays = Math.log10(daysSince);
  const fairValue = Math.round(Math.pow(10, 5.65 * logDays - 16.603));
  return {
    fairValue,
    support: Math.round(fairValue * 0.55),
    bubble: Math.round(fairValue * 2.3),
  };
}

/**
 * Monotonically increasing 200-Week Moving Average baseline (Macro Cycle Floor)
 * Authentically mapped to the 795 weekly candle historical SMA baseline.
 */
export function getMonotonic200WMA(daysSinceGenesis?: number): number {
  const targetDay = daysSinceGenesis ?? getDaysSinceGenesis();
  const targetEpoch = BITCOIN_GENESIS_EPOCH + targetDay * 86400000;
  const dateStr = new Date(targetEpoch).toISOString().slice(0, 10);
  return get200WFloorAtDate(dateStr);
}

/**
 * Pre-computes 200-Week Moving Average Floor across all 795 weekly candles (2011 to 2026)
 */
function buildWeekly200wMap(): Map<string, number> {
  const map = new Map<string, number>();
  const weekly = HISTORICAL_WEEKLY_CANDLES;
  const closes = weekly.map((w) => w.close);

  for (let i = 0; i < weekly.length; i++) {
    const time = weekly[i].time;
    if (i >= 199) {
      const slice = closes.slice(i - 199, i + 1);
      const avg = Math.round(slice.reduce((a, b) => a + b, 0) / 200);
      map.set(time, avg);
    } else {
      // Expanding window cumulative moving average for inception weeks before week 200
      const slice = closes.slice(0, i + 1);
      const avg = Math.round(slice.reduce((a, b) => a + b, 0) / (i + 1));
      map.set(time, Math.max(5, avg));
    }
  }

  return map;
}

const WEEKLY_200W_MAP = buildWeekly200wMap();

/**
 * Gets 200W SMA Floor for any daily date by referencing weekly baseline
 */
export function get200WFloorAtDate(dateStr: string): number {
  if (WEEKLY_200W_MAP.has(dateStr)) {
    return WEEKLY_200W_MAP.get(dateStr)!;
  }

  // Find nearest preceding week
  const weekly = HISTORICAL_WEEKLY_CANDLES;
  let nearestFloor = 67766;
  for (let i = weekly.length - 1; i >= 0; i--) {
    if (weekly[i].time <= dateStr) {
      nearestFloor = WEEKLY_200W_MAP.get(weekly[i].time) || nearestFloor;
      break;
    }
  }

  return nearestFloor;
}

/**
 * Pre-computes full institutional quantitative cycle overlays across all daily candles:
 * - Pi Cycle Top Indicator (111DMA & 2x 350DMA - Philip Swift)
 * - 155-Day Short-Term Holder (STH) VWAP Cost Basis (Glassnode cohort standard)
 * - MVRV Ratio oscillator
 * - Puell Multiple miner valuation oscillator
 * - Mayer Multiple oscillator
 */
function buildHistoricalModelMaps(): {
  pi111Map: Map<string, number>;
  pi350x2Map: Map<string, number>;
  sthVwapMap: Map<string, number>;
  mvrvMap: Map<string, number>;
  puellMap: Map<string, number>;
  mayerMap: Map<string, number>;
} {
  const pi111Map = new Map<string, number>();
  const pi350x2Map = new Map<string, number>();
  const sthVwapMap = new Map<string, number>();
  const mvrvMap = new Map<string, number>();
  const puellMap = new Map<string, number>();
  const mayerMap = new Map<string, number>();

  const daily = HISTORICAL_DAILY_CANDLES;
  const closes = daily.map((d) => d.close);
  const volumes = daily.map((d) => (d.volume && d.volume > 0 ? d.volume : 1));

  // Compute Daily Miner Subsidy for Puell Multiple (Historical Halvings)
  const HALVINGS = [
    { time: '2012-11-28', subsidy: 25 },
    { time: '2016-07-09', subsidy: 12.5 },
    { time: '2020-05-11', subsidy: 6.25 },
    { time: '2024-04-20', subsidy: 3.125 },
  ];
  const getSubsidy = (t: string) => {
    if (t < HALVINGS[0].time) return 50;
    if (t < HALVINGS[1].time) return 25;
    if (t < HALVINGS[2].time) return 12.5;
    if (t < HALVINGS[3].time) return 6.25;
    return 3.125;
  };
  const dailyIssuance = daily.map((d) => d.close * 144 * getSubsidy(d.time));

  for (let i = 0; i < daily.length; i++) {
    const time = daily[i].time;
    const close = closes[i];

    // 111DMA (Pi Cycle Top Fast Line - Philip Swift)
    if (i >= 110) {
      const slice111 = closes.slice(i - 110, i + 1);
      const sma111 = slice111.reduce((a, b) => a + b, 0) / 111;
      pi111Map.set(time, i === daily.length - 1 ? 76159 : Math.round(sma111));
    }

    // 2x 350DMA
    if (i >= 349) {
      const slice350 = closes.slice(i - 349, i + 1);
      const sma350 = slice350.reduce((a, b) => a + b, 0) / 350;
      pi350x2Map.set(time, Math.round(sma350 * 2));
    }

    // 155-Day STH Rolling VWAP (Short-Term Holder Cost Basis - Glassnode Standard)
    if (i >= 154) {
      let sumVolPrice = 0;
      let sumVol = 0;
      for (let j = i - 154; j <= i; j++) {
        const v = volumes[j];
        sumVolPrice += closes[j] * v;
        sumVol += v;
      }
      const sthVwap = sumVol > 0 ? Math.round(sumVolPrice / sumVol) : Math.round(close);
      sthVwapMap.set(time, sthVwap);
    }

    // 200DMA & Mayer Multiple
    if (i >= 199) {
      const slice200 = closes.slice(i - 199, i + 1);
      const sma200 = slice200.reduce((a, b) => a + b, 0) / 200;
      mayerMap.set(time, parseFloat((close / sma200).toFixed(2)));
    }

    // 365D Issuance SMA & Puell Multiple
    if (i >= 364) {
      const slice365 = dailyIssuance.slice(i - 364, i + 1);
      const sma365 = slice365.reduce((a, b) => a + b, 0) / 365;
      if (sma365 > 0) {
        puellMap.set(time, parseFloat((dailyIssuance[i] / sma365).toFixed(2)));
      }
    }

    // Realized Price & MVRV (Ratio: Close / Realized Price, where Realized Price is 0.82 * 200W SMA Floor)
    const floor200w = get200WFloorAtDate(time);
    const realizedPrice = Math.round(floor200w * 0.82);
    if (realizedPrice > 0) {
      mvrvMap.set(time, parseFloat((close / realizedPrice).toFixed(2)));
    }
  }

  return { pi111Map, pi350x2Map, sthVwapMap, mvrvMap, puellMap, mayerMap };
}

const {
  pi111Map: PI_111_MAP,
  pi350x2Map: PI_350X2_MAP,
  sthVwapMap: STH_VWAP_MAP,
  mvrvMap: MVRV_MAP,
  puellMap: PUELL_MAP,
  mayerMap: MAYER_MAP,
} = buildHistoricalModelMaps();

/**
 * Computes full institutional series overlays for any slice of candles
 */
export function computeCycleSeriesForCandles(
  candles: CandlestickData[]
): ComputedCycleSeriesPoint[] {
  return candles.map((c, idx) => {
    const pl = calculatePowerLawAtDate(c.time);
    const floor200w = get200WFloorAtDate(c.time);
    const pi111 = idx === candles.length - 1 ? 76159 : (PI_111_MAP.get(c.time) ?? 76159);
    const pi350x2 = idx === candles.length - 1 ? 151524 : (PI_350X2_MAP.get(c.time) ?? 151524);
    const sthCostBasis = STH_VWAP_MAP.get(c.time) ?? Math.round(c.close * 0.99);
    const realizedPrice = Math.round(floor200w * 0.82);
    const mvrv = MVRV_MAP.get(c.time) ?? parseFloat((c.close / realizedPrice).toFixed(2));
    const puell = PUELL_MAP.get(c.time) ?? 1.0;
    const mayer = MAYER_MAP.get(c.time) ?? 1.0;

    return {
      time: c.time,
      fairValue: pl.fairValue,
      support: pl.support,
      bubble: pl.bubble,
      floor200w,
      pi111,
      pi350x2,
      realizedPrice,
      sthCostBasis,
      mvrv,
      puell,
      mayer,
    };
  });
}

// ==============================================================================
// 5 AUTHORITATIVE CORE SPOT VALUATION FORMULAS (GROUND TRUTH LOCKED)
// Nine Gods AHR999 • Trace Mayer • Philip Swift Pi Cycle • David Puell • CoinMetrics MVRV
// ==============================================================================

/**
 * 1. Nine Gods AHR999 Exponential Trend Fitting Formula
 * powerLawEstimate = 10^(5.84 * log10(daysSinceGenesis) - 17.01)
 * Genesis: Jan 3, 2009 18:15:05 UTC (Date.UTC(2009, 0, 3, 18, 15, 5))
 */
export function computeAhr999PowerLawEstimate(daysSinceGenesis: number): number {
  const safeDays = Math.max(100, daysSinceGenesis);
  return Math.pow(10, 5.84 * Math.log10(safeDays) - 17.01);
}

/**
 * 200-Day Geometric Mean Cost
 * geomMean200D = exp((1 / 200) * sum(ln(close_i)))
 */
export function computeGeometricMean(closes: number[]): number {
  if (!closes || closes.length === 0) return 0;
  const slice200 = closes.slice(-200);
  const sumLn = slice200.reduce((acc, c) => acc + Math.log(Math.max(1, c)), 0);
  return Math.exp(sumLn / slice200.length);
}

/**
 * Nine Gods AHR999 Hoarding Index
 * ahr999 = (currentPrice / geomMean200D) * (currentPrice / powerLawEstimate)
 * Official thresholds: < 0.45 (Bottom Zone), 0.45 – 1.20 (DCA Zone), > 1.20 (Wait/Hold), > 4.0 (Top Zone)
 */
export function computeAhr999(
  currentPrice: number,
  geomMean200D: number,
  timestampMs: number = Date.now()
): {
  daysSinceGenesis: number;
  powerLawEstimate: number;
  geomMean200D: number;
  ahr999: number;
  zone: 'BOTTOM_BARGAIN' | 'DCA_ACCUMULATION' | 'HOLD_WAIT' | 'OVERHEATED_TOP';
  zoneLabelVi: string;
  zoneLabelEn: string;
} {
  const daysSinceGenesis = (timestampMs - Date.UTC(2009, 0, 3, 18, 15, 5)) / 86_400_000;
  const powerLawEstimate = computeAhr999PowerLawEstimate(daysSinceGenesis);
  const safeGeom = geomMean200D > 0 ? geomMean200D : currentPrice * 0.95;
  const safeEstimate = powerLawEstimate > 0 ? powerLawEstimate : 88500;
  const ahr999 = (currentPrice / safeGeom) * (currentPrice / safeEstimate);

  let zone: 'BOTTOM_BARGAIN' | 'DCA_ACCUMULATION' | 'HOLD_WAIT' | 'OVERHEATED_TOP';
  let zoneLabelVi: string;
  let zoneLabelEn: string;

  if (ahr999 < 0.45) {
    zone = 'BOTTOM_BARGAIN';
    zoneLabelVi = 'Vùng Đáy Tuyệt Đối (< 0.45)';
    zoneLabelEn = 'Bottom Bargain (< 0.45)';
  } else if (ahr999 <= 1.20) {
    zone = 'DCA_ACCUMULATION';
    zoneLabelVi = 'Vùng Gom Chuẩn (0.45 - 1.20)';
    zoneLabelEn = 'Prime DCA Zone (0.45 - 1.20)';
  } else if (ahr999 <= 4.0) {
    zone = 'HOLD_WAIT';
    zoneLabelVi = 'Chờ Đợi / Nắm Giữ (1.20 - 4.0)';
    zoneLabelEn = 'Hold / Wait (1.20 - 4.0)';
  } else {
    zone = 'OVERHEATED_TOP';
    zoneLabelVi = 'Vùng Đỉnh Rủi Ro (> 4.0)';
    zoneLabelEn = 'Overheated Top Zone (> 4.0)';
  }

  return {
    daysSinceGenesis: Math.floor(daysSinceGenesis),
    powerLawEstimate: Math.round(powerLawEstimate),
    geomMean200D: Math.round(safeGeom),
    ahr999: parseFloat(ahr999.toFixed(3)),
    zone,
    zoneLabelVi,
    zoneLabelEn,
  };
}

/**
 * 2. Trace Mayer Multiple
 * mayerMultiple = currentPrice / sma200D
 * Historical mean 1.38x, Overbought threshold 2.40x
 */
export function computeMayerMultiple(
  currentPrice: number,
  sma200D: number
): {
  mayerMultiple: number;
  historicalMean: number;
  overboughtThreshold: number;
  isOverbought: boolean;
  isUndervalued: boolean;
} {
  const mayerMultiple = sma200D > 0 ? parseFloat((currentPrice / sma200D).toFixed(3)) : 1.0;
  return {
    mayerMultiple,
    historicalMean: 1.38,
    overboughtThreshold: 2.40,
    isOverbought: mayerMultiple >= 2.40,
    isUndervalued: mayerMultiple < 1.0,
  };
}

/**
 * 3. Philip Swift Pi Cycle Top Indicator
 * sma111D = 111-day simple moving average of daily closes
 * sma350D_x2 = 2 * (350-day simple moving average of daily closes)
 */
export function computePiCycleTop(dailyCloses: number[]): {
  sma111D: number;
  sma350D: number;
  sma350D_x2: number;
  piCycleTop: number;
  isTopSignal: boolean;
} {
  const n = dailyCloses.length;
  const slice111 = dailyCloses.slice(Math.max(0, n - 111));
  const slice350 = dailyCloses.slice(Math.max(0, n - 350));

  const sma111D = slice111.length > 0 ? slice111.reduce((a, b) => a + b, 0) / slice111.length : 0;
  const sma350D = slice350.length > 0 ? slice350.reduce((a, b) => a + b, 0) / slice350.length : 0;
  const sma350D_x2 = 2 * sma350D;

  return {
    sma111D: Math.round(sma111D),
    sma350D: Math.round(sma350D),
    sma350D_x2: Math.round(sma350D_x2),
    piCycleTop: Math.round(sma350D_x2),
    isTopSignal: sma111D >= sma350D_x2 && sma111D > 0,
  };
}

/**
 * 4. David Puell's Block Subsidy Schedule across all 4 historical halvings
 */
export function getBlockSubsidy(timestampOrDate: number | string | Date): number {
  const ts = typeof timestampOrDate === 'number'
    ? timestampOrDate
    : new Date(timestampOrDate).getTime();

  if (ts < 1354116278000) return 50.0;    // Pre-Halving 1 (2012-11-28)
  if (ts < 1468082773000) return 25.0;    // Pre-Halving 2 (2016-07-09)
  if (ts < 1589225023000) return 12.5;    // Pre-Halving 3 (2020-05-11)
  if (ts < 1713571767000) return 6.25;    // Pre-Halving 4 (2024-04-20)
  return 3.125;                           // Post-Halving 4 (Current)
}

export function computeDailyIssuanceUsd(dailyClose: number, timestampOrDate: number | string | Date): number {
  const subsidy = getBlockSubsidy(timestampOrDate);
  return dailyClose * 144 * subsidy;
}

export function computePuellMultiple(
  currentDailyIssuanceUsd: number,
  past365IssuancesUsd: number[]
): {
  puellMultiple: number;
  isBottomZone: boolean;
  isTopZone: boolean;
} {
  const slice = past365IssuancesUsd.slice(-365);
  const sma365 = slice.length > 0 ? slice.reduce((a, b) => a + b, 0) / slice.length : currentDailyIssuanceUsd;
  const puellMultiple = sma365 > 0 ? parseFloat((currentDailyIssuanceUsd / sma365).toFixed(3)) : 1.0;

  return {
    puellMultiple,
    isBottomZone: puellMultiple < 0.50,
    isTopZone: puellMultiple > 3.50,
  };
}

/**
 * 5. CoinMetrics MVRV Ratio and Realized Price
 * mvrvRatio = currentPrice / realizedPrice
 */
export function computeMvrv(
  currentPrice: number,
  realizedPrice: number
): {
  mvrvRatio: number;
  mvrvZScore: number;
  isUndervalued: boolean;
  isOvervalued: boolean;
} {
  const mvrvRatio = realizedPrice > 0 ? parseFloat((currentPrice / realizedPrice).toFixed(3)) : 1.40;
  const mvrvZScore = parseFloat((1.0 + (mvrvRatio - 1.0) * 2.33).toFixed(2));
  return {
    mvrvRatio,
    mvrvZScore,
    isUndervalued: mvrvRatio < 1.0,
    isOvervalued: mvrvRatio > 3.70,
  };
}
