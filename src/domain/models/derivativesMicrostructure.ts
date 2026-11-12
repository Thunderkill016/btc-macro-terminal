import { DerivativesMicrostructureMetrics } from '../../types';

export interface MicrostructureComputationParams {
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
}

/**
 * Pure deterministic evaluator for Spot vs. Perpetual Futures Microstructure,
 * Whale vs. Retail Positioning Spread, Deribit DVOL Implied Volatility,
 * Volatility Risk Premium (VRP = IV - RV), Perpetual Basis & Leverage Liquidation Clusters.
 */
export function computeDerivativesMicrostructure(params: MicrostructureComputationParams): DerivativesMicrostructureMetrics {
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

  if (whaleRetailSpread >= 4.0) {
    whaleRetailStatusVi = '🐋 Cá Voi Gom Vị Thế Ngược Đám Đông (Bullish Smart Money Divergence)';
    whaleRetailStatusEn = '🐋 Bullish Smart Money Divergence (Whales Net Long vs. Retail)';
  } else if (whaleRetailSpread <= -4.0) {
    whaleRetailStatusVi = '⚠️ Cá Voi Phòng Thủ / Nhỏ Lẻ Đu Đỉnh (Retail Long Crowding)';
    whaleRetailStatusEn = '⚠️ Bearish Retail Long Crowding (Whales Hedging / Net Short vs. Retail)';
  }

  const spotTakerBuyPct7D = Number(
    Math.max(20, Math.min(80, Number.isFinite(params.spotTakerBuyPct7D) ? params.spotTakerBuyPct7D : 50.8)).toFixed(2)
  );
  const perpTakerBuyPct7D = Number(
    Math.max(20, Math.min(80, Number.isFinite(params.perpTakerBuyPct7D) ? params.perpTakerBuyPct7D : 49.4)).toFixed(2)
  );

  let orderflowRegime: DerivativesMicrostructureMetrics['orderflowRegime'] = 'NEUTRAL_FLOW';
  let orderflowRegimeLabelVi = '⚪ Cân Bằng Vi Cấu Trúc (Neutral Flow)';
  let orderflowRegimeLabelEn = '⚪ Neutral Microstructure Flow';

  if (spotTakerBuyPct7D >= 50.5 && spotTakerBuyPct7D > perpTakerBuyPct7D) {
    orderflowRegime = 'SPOT_LED_ACCUMULATION';
    orderflowRegimeLabelVi = '🟢 Hấp Thụ Spot Thực Chất (Spot-Led Accumulation)';
    orderflowRegimeLabelEn = '🟢 Spot-Led Accumulation (Real Spot Absorption)';
  } else if (perpTakerBuyPct7D > 51.5 && spotTakerBuyPct7D < 49.2) {
    orderflowRegime = 'PERP_DRIVEN_SPECULATION';
    orderflowRegimeLabelVi = '🟡 Kéo Giá Phái Sinh (Perp-Driven Speculation)';
    orderflowRegimeLabelEn = '🟡 Perp-Driven Speculation (Leverage-Led Rally)';
  } else if (spotTakerBuyPct7D < 48.5 && perpTakerBuyPct7D < 48.5) {
    orderflowRegime = 'DELEVERAGING_FLUSH';
    orderflowRegimeLabelVi = '🔴 Rũ Bỏ Đòn Bẩy (Deleveraging Flush)';
    orderflowRegimeLabelEn = '🔴 Deleveraging Flush (Supply Overhang)';
  }

  const dvolIndex = Number(
    Math.max(15, Math.min(140, Number.isFinite(params.dvolIndex) ? params.dvolIndex! : 39.4)).toFixed(1)
  );
  const realizedVolAnnualized = Number(
    Math.max(10, Math.min(150, Number.isFinite(params.realizedVolAnnualized) ? params.realizedVolAnnualized! : 45.8)).toFixed(1)
  );
  const volatilityRiskPremium = Number((dvolIndex - realizedVolAnnualized).toFixed(1));

  let vrpRegimeVi = '⚡ Biến Động Thực Tế Vượt Quyền Chọn (VRP Âm: Định Giá Thấp Đột Biến)';
  let vrpRegimeEn = '⚡ Negative VRP (Realized Vol > Implied Vol: Breakout Underpriced)';
  if (volatilityRiskPremium > 5.0) {
    vrpRegimeVi = '🛡️ Phí Quyền Chọn Quá Đắt (VRP Dương: Kỳ Vọng Biến Động Quá Mức)';
    vrpRegimeEn = '🛡️ Positive VRP (Options Overpriced: Excess Market Complacency)';
  } else if (volatilityRiskPremium >= -2.0 && volatilityRiskPremium <= 5.0) {
    vrpRegimeVi = '⚖️ Cân Bằng Biến Động Quyền Chọn & Thực Tế (Neutral VRP)';
    vrpRegimeEn = '⚖️ Balanced Volatility Risk Premium';
  }

  const spot = params.spotPrice && params.spotPrice > 0 ? params.spotPrice : 75925;
  const mark = params.markPrice && params.markPrice > 0 ? params.markPrice : spot;
  const perpBasisBps = Number((((mark - spot) / spot) * 10000).toFixed(1));

  const liqLong50xPrice = Math.round(spot * (1 - 1 / 50 + 0.004));
  const liqLong25xPrice = Math.round(spot * (1 - 1 / 25 + 0.004));
  const liqShort25xPrice = Math.round(spot * (1 + 1 / 25 - 0.004));

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
    liqLong50xPrice,
    liqLong25xPrice,
    liqShort25xPrice,
    source: params.source || 'fallback_model',
  };
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
