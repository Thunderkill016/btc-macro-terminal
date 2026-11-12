import { DerivativesMicrostructureMetrics } from '../../types';

export interface RawLongShortRatioItem {
  symbol?: string;
  longShortRatio: string;
  longAccount: string; // e.g. "0.6142"
  shortAccount: string; // e.g. "0.3858"
  timestamp: number;
}

export interface RawTakerBuySellRatioItem {
  buySellRatio: string; // e.g. "1.0420"
  buyVol: string;
  sellVol: string;
  timestamp: number;
}

/**
 * Pure deterministic evaluator for Spot vs. Perpetual Futures Microstructure,
 * Whale vs. Retail Positioning Spread, Deribit DVOL Implied Volatility,
 * Volatility Risk Premium (VRP = IV - RV), Perpetual Basis & Leverage Liquidation Clusters.
 */
export function computeDerivativesMicrostructure(params: {
  topPositionLongPct: number;
  retailAccountLongPct: number;
  spotTakerBuyPct7D: number;
  perpTakerBuyPct7D: number;
  fundingRate?: number;
  dvolIndex?: number;
  realizedVolAnnualized?: number;
  spotPrice?: number;
  markPrice?: number;
  source?: 'binance_futures_live' | 'fallback_model';
}): DerivativesMicrostructureMetrics {
  const topPositionLongPct = Number(
    Math.max(10, Math.min(90, Number.isFinite(params.topPositionLongPct) ? params.topPositionLongPct : 58.6)).toFixed(2)
  );
  const topPositionShortPct = Number((100 - topPositionLongPct).toFixed(2));

  const retailAccountLongPct = Number(
    Math.max(10, Math.min(90, Number.isFinite(params.retailAccountLongPct) ? params.retailAccountLongPct : 52.1)).toFixed(2)
  );
  const retailAccountShortPct = Number((100 - retailAccountLongPct).toFixed(2));

  const whaleRetailSpread = Number((topPositionLongPct - retailAccountLongPct).toFixed(2));
  const fundingRate = params.fundingRate ?? 0.0001;

  let whaleRetailStatusVi = '⚖️ Phân Bổ Vị Thế Cân Bằng (Balanced Positioning)';
  let whaleRetailStatusEn = '⚖️ Balanced Whale vs. Retail Positioning';

  if (retailAccountLongPct > 66 && fundingRate > 0.00015) {
    whaleRetailStatusVi = '⚠️ Đám Đông Nhỏ Lẻ Quá Tải Long (Rủi Ro Quét Long Squeeze)';
    whaleRetailStatusEn = '⚠️ Crowded Retail Longs (Long Squeeze Flush Risk)';
  } else if (whaleRetailSpread > 5.0) {
    whaleRetailStatusVi = '🐋 Cá Voi Gom Vị Thế Ngược Đám Đông (Bullish Smart Money Divergence)';
    whaleRetailStatusEn = '🐋 Bullish Smart Money Divergence (Whales Net Long vs. Retail)';
  } else if (whaleRetailSpread < -5.0) {
    whaleRetailStatusVi = '⚠️ Cá Voi Phòng Thủ / Nhỏ Lẻ Đu Đỉnh (Retail Long Crowding)';
    whaleRetailStatusEn = '⚠️ Whales Defensive while Retail Crowds Long';
  }

  const spotTakerBuyPct7D = Number(
    Math.max(25, Math.min(75, Number.isFinite(params.spotTakerBuyPct7D) ? params.spotTakerBuyPct7D : 50.8)).toFixed(2)
  );
  const perpTakerBuyPct7D = Number(
    Math.max(25, Math.min(75, Number.isFinite(params.perpTakerBuyPct7D) ? params.perpTakerBuyPct7D : 49.4)).toFixed(2)
  );

  let orderflowRegime: DerivativesMicrostructureMetrics['orderflowRegime'] = 'NEUTRAL_FLOW';
  let orderflowRegimeLabelVi = '⚪ Cân Bằng Vi Cấu Trúc (Neutral Flow)';
  let orderflowRegimeLabelEn = '⚪ Neutral Microstructure Orderflow';

  if (spotTakerBuyPct7D >= 50.5 && spotTakerBuyPct7D > perpTakerBuyPct7D) {
    orderflowRegime = 'SPOT_LED_ACCUMULATION';
    orderflowRegimeLabelVi = '🟢 Hấp Thụ Spot Thực Chất (Spot-Led Accumulation)';
    orderflowRegimeLabelEn = '🟢 Spot-Led Accumulation (Real Spot Absorption)';
  } else if (perpTakerBuyPct7D > 51.5 && spotTakerBuyPct7D < 49.2) {
    orderflowRegime = 'PERP_DRIVEN_SPECULATION';
    orderflowRegimeLabelVi = '🟡 Kéo Giá Phái Sinh (Perp-Driven Speculation)';
    orderflowRegimeLabelEn = '🟡 Perp-Driven Speculation (Leverage-Led Rally)';
  } else if (fundingRate <= 0.00005 && spotTakerBuyPct7D >= 49.6 && perpTakerBuyPct7D < 49.4) {
    orderflowRegime = 'DELEVERAGING_FLUSH';
    orderflowRegimeLabelVi = '🔵 Thanh Lọc Đòn Bẩy (De-leveraging Flush)';
    orderflowRegimeLabelEn = '🔵 De-leveraging Flush (Spot Bids Absorbing Liquidations)';
  }

  // v8.0 Global Benchmark: Deribit DVOL, Volatility Risk Premium (VRP = IV - RV), Perp Basis & Liquidation Clusters
  const dvolIndex = Number(
    Math.max(15, Math.min(140, Number.isFinite(params.dvolIndex) ? params.dvolIndex! : 39.4)).toFixed(1)
  );
  const realizedVolAnn = Number.isFinite(params.realizedVolAnnualized) ? params.realizedVolAnnualized! : 45.8;
  const volatilityRiskPremium = Number((dvolIndex - realizedVolAnn).toFixed(2));

  let vrpRegimeVi = '🛡️ Phí Bảo Hiểm Quyền Chọn Cân Bằng (Normal VRP)';
  let vrpRegimeEn = '🛡️ Balanced Options Volatility Risk Premium';
  if (volatilityRiskPremium < -2.0) {
    vrpRegimeVi = '⚡ Biến Động Thực Tế Vượt Quyền Chọn (VRP Âm: Định Giá Thấp Đột Biến)';
    vrpRegimeEn = '⚡ Negative VRP (Realized Vol > Implied Vol: Breakout Underpriced)';
  } else if (volatilityRiskPremium > 6.0) {
    vrpRegimeVi = '🛡️ Phí Bảo Hiểm Quyền Chọn Cao (VRP Dương: Phòng Hộ Định Chế Mạnh)';
    vrpRegimeEn = '🛡️ Elevated Positive VRP (High Institutional Hedging Demand)';
  }

  const spotPrice = params.spotPrice && params.spotPrice > 0 ? params.spotPrice : 75925;
  const markPrice = params.markPrice && params.markPrice > 0 ? params.markPrice : spotPrice * (1 + fundingRate * 0.45);
  const perpBasisBps = Number((((markPrice - spotPrice) / spotPrice) * 10000).toFixed(1));

  // Leverage Liquidation Magnet Zones (maintenance margin buffer ~0.4%)
  const liqLong50xPrice = Math.round(spotPrice * (1 - 1 / 50 + 0.004));
  const liqLong25xPrice = Math.round(spotPrice * (1 - 1 / 25 + 0.004));
  const liqShort25xPrice = Math.round(spotPrice * (1 + 1 / 25 - 0.004));

  return {
    topPositionLongPct,
    topPositionShortPct,
    retailAccountLongPct,
    retailAccountShortPct,
    whaleRetailSpread,
    whaleRetailStatusVi,
    whaleRetailStatusEn,
    spotTakerBuyPct7D,
    perpTakerBuyPct7D,
    orderflowRegime,
    orderflowRegimeLabelVi,
    orderflowRegimeLabelEn,
    dvolIndex,
    volatilityRiskPremium,
    vrpRegimeVi,
    vrpRegimeEn,
    perpBasisBps,
    liqLong25xPrice,
    liqLong50xPrice,
    liqShort25xPrice,
    source: params.source ?? 'fallback_model',
  };
}

/**
 * Fetches live 30-day BTC Implied Volatility Index (DVOL) from Deribit's public zero-auth v2 API.
 * Falls back deterministically to 39.4 if offline or rate-limited.
 */
export async function fetchLiveDeribitDvol(fallbackDvol: number = 39.4): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const endTs = Date.now();
    const startTs = endTs - 7 * 86400000;
    const url = `https://www.deribit.com/api/v2/public/get_volatility_index_data?currency=BTC&resolution=86400&start_timestamp=${startTs}&end_timestamp=${endTs}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return fallbackDvol;
    const json = await res.json();
    const rows = json?.result?.data;
    if (Array.isArray(rows) && rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      // Format: [timestamp, open, high, low, close]
      const closeDvol = Array.isArray(lastRow) ? Number(lastRow[4]) : NaN;
      if (Number.isFinite(closeDvol) && closeDvol >= 15 && closeDvol <= 140) {
        return Number(closeDvol.toFixed(1));
      }
    }
    return fallbackDvol;
  } catch {
    clearTimeout(timer);
    return fallbackDvol;
  }
}

/**
 * Default deterministic microstructure state when initial store boots or offline
 */
export function getDefaultDerivativesMicrostructure(
  spotTakerBuyPct7D: number = 50.8,
  fundingRate: number = 0.000085
): DerivativesMicrostructureMetrics {
  return computeDerivativesMicrostructure({
    topPositionLongPct: 58.6,
    retailAccountLongPct: 52.1,
    spotTakerBuyPct7D,
    perpTakerBuyPct7D: 49.4,
    fundingRate,
    source: 'fallback_model',
  });
}

/**
 * Fetches the 3 free, zero-auth public Binance Futures microstructure endpoints in parallel
 * via Promise.allSettled with graceful deterministic fallback if CORS/network is restricted:
 * 1. Top Trader Long/Short Position Ratio (Whale Positioning)
 * 2. Global Long/Short Account Ratio (Retail Crowd Positioning)
 * 3. Perpetual Taker Buy/Sell Volume Ratio (7D Perp Taker Flow)
 */
export async function fetchDerivativesMicrostructure(
  spotTakerBuyPct7D: number = 50.8,
  fundingRate: number = 0.000085,
  spotPrice: number = 75925,
  markPrice?: number,
  realizedVolAnnualized: number = 45.8
): Promise<DerivativesMicrostructureMetrics> {
  const fetchJsonWithTimeout = async (url: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  const [topPositionRes, globalAccountRes, perpTakerRes, liveDvolRes] = await Promise.allSettled([
    fetchJsonWithTimeout(
      'https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=BTCUSDT&period=1d&limit=14'
    ),
    fetchJsonWithTimeout(
      'https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=1d&limit=14'
    ),
    fetchJsonWithTimeout(
      'https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=BTCUSDT&period=1d&limit=14'
    ),
    fetchLiveDeribitDvol(39.4),
  ]);

  let topPositionLongPct = 58.6;
  let retailAccountLongPct = 52.1;
  let perpTakerBuyPct7D = 49.4;
  let dvolIndex = 39.4;
  let anyLiveFulfilled = false;

  if (liveDvolRes.status === 'fulfilled' && Number.isFinite(liveDvolRes.value)) {
    dvolIndex = liveDvolRes.value;
  }

  if (
    topPositionRes.status === 'fulfilled' &&
    Array.isArray(topPositionRes.value) &&
    topPositionRes.value.length > 0
  ) {
    const latest: RawLongShortRatioItem = topPositionRes.value[topPositionRes.value.length - 1];
    const parsedLong = parseFloat(latest.longAccount) * 100;
    if (Number.isFinite(parsedLong) && parsedLong > 0 && parsedLong < 100) {
      topPositionLongPct = parsedLong;
      anyLiveFulfilled = true;
    }
  }

  if (
    globalAccountRes.status === 'fulfilled' &&
    Array.isArray(globalAccountRes.value) &&
    globalAccountRes.value.length > 0
  ) {
    const latest: RawLongShortRatioItem = globalAccountRes.value[globalAccountRes.value.length - 1];
    const parsedRetailLong = parseFloat(latest.longAccount) * 100;
    if (Number.isFinite(parsedRetailLong) && parsedRetailLong > 0 && parsedRetailLong < 100) {
      retailAccountLongPct = parsedRetailLong;
      anyLiveFulfilled = true;
    }
  }

  if (
    perpTakerRes.status === 'fulfilled' &&
    Array.isArray(perpTakerRes.value) &&
    perpTakerRes.value.length > 0
  ) {
    const recent7 = perpTakerRes.value.slice(-7) as RawTakerBuySellRatioItem[];
    let sumBuyVol = 0;
    let sumTotalVol = 0;
    for (const row of recent7) {
      const bVol = parseFloat(row.buyVol);
      const sVol = parseFloat(row.sellVol);
      if (Number.isFinite(bVol) && Number.isFinite(sVol) && bVol + sVol > 0) {
        sumBuyVol += bVol;
        sumTotalVol += bVol + sVol;
      }
    }
    if (sumTotalVol > 0) {
      perpTakerBuyPct7D = (sumBuyVol / sumTotalVol) * 100;
      anyLiveFulfilled = true;
    }
  }

  return computeDerivativesMicrostructure({
    topPositionLongPct,
    retailAccountLongPct,
    spotTakerBuyPct7D,
    perpTakerBuyPct7D,
    fundingRate,
    dvolIndex,
    realizedVolAnnualized,
    spotPrice,
    markPrice,
    source: anyLiveFulfilled ? 'binance_futures_live' : 'fallback_model',
  });
}
