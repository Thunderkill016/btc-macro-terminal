import { PortfolioSummary, PortfolioTransaction } from '../../types';

export interface AccumulationForecastInput {
  currentPrice: number;
  totalBtc: number;
  totalSats: number;
  avgBuyPrice: number;
  totalInvestedUsd: number;
  dcaBudget: number;
  tacticalTotalUsd: number;
  marketPct: number;
  limit1Pct: number;
  limit2Pct: number;
  limit1Price: number;
  limit2Price: number;
  fairValue: number;
  piCycleTop: number;
  cone90P50: number;
}

export interface AccumulationForecastResult {
  blendedWeeklyExecPrice: number;
  weeklyAddedBtc: number;
  weeklyAddedSats: number;
  projectedBtcAfterWeek: number;
  projectedSatsAfterWeek: number;
  projectedAvgCostAfterWeek: number;
  valAtPowerLawUsd: number;
  valAtPiCycleUsd: number;
  // 6M Projections
  totalCapital6M: number;
  projectedBtc6M: number;
  projectedSats6M: number;
  projectedAvgCost6M: number;
  projectedVal6MAtFair: number;
  projectedRoi6MAtFair: number;
  // 12M Projections
  totalCapital12M: number;
  projectedBtc12M: number;
  projectedSats12M: number;
  projectedAvgCost12M: number;
  projectedVal12MAtPeak: number;
  projectedRoi12MAtPeak: number;
}

/**
 * Pure domain model for projecting Bitcoin accumulation milestones,
 * dollar-cost-averaging dilution impacts on cost basis, and 6M/12M terminal wealth.
 */
export function calculateAccumulationForecast(input: AccumulationForecastInput): AccumulationForecastResult {
  const {
    currentPrice,
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
  } = input;

  const blendedWeeklyExecPrice = Math.round(
    currentPrice * marketPct + limit1Price * limit1Pct + limit2Price * limit2Pct
  );
  // Weekly tactical accumulation executed at current spot price:
  // addedBtc = weeklyOrderUsd / spotPrice
  const weeklyAddedBtc = currentPrice > 0 ? tacticalTotalUsd / currentPrice : 0;
  const weeklyAddedSats = Math.round(weeklyAddedBtc * 100_000_000);
  const projectedBtcAfterWeek = totalBtc + weeklyAddedBtc;
  const projectedSatsAfterWeek = totalSats + weeklyAddedSats;

  // Wealthfolio / GAAP Weighted-Average Cost basis formula:
  // oldCostUsd = totalBtc * avgBuyPrice
  // newAvgCost = (oldCostUsd + weeklyOrderUsd) / newTotalBtc
  const currentCostUsd = totalBtc > 0 && avgBuyPrice > 0 ? totalBtc * avgBuyPrice : totalInvestedUsd;
  const rawAvgCost =
    projectedBtcAfterWeek > 0
      ? Math.round((currentCostUsd + tacticalTotalUsd) / projectedBtcAfterWeek)
      : currentPrice;

  // Mathematical guard: new average cost must strictly lie between old avgBuyPrice and current entry price
  const minBound = avgBuyPrice > 0 ? Math.min(avgBuyPrice, currentPrice) : currentPrice;
  const maxBound = avgBuyPrice > 0 ? Math.max(avgBuyPrice, currentPrice) : currentPrice;
  const projectedAvgCostAfterWeek = avgBuyPrice > 0
    ? Math.min(maxBound, Math.max(minBound, rawAvgCost))
    : currentPrice;

  // Exact valuation at key cycle targets for projected holdings:
  // valAtPowerLawUsd = newTotalBtc * powerLawFairValue
  // valAtPiCycleUsd = newTotalBtc * piCycleTopTarget
  const targetProjectedBtc = projectedBtcAfterWeek > 0 ? projectedBtcAfterWeek : totalBtc;
  const valAtPowerLawUsd = Number((targetProjectedBtc * fairValue).toFixed(2));
  const valAtPiCycleUsd = Number((targetProjectedBtc * piCycleTop).toFixed(2));

  // 6-Month Projection (26 weekly buys)
  const avgExpectedDcaPrice6M = Math.round(0.55 * blendedWeeklyExecPrice + 0.45 * cone90P50);
  const totalCapital6M = dcaBudget * 6;
  const addedBtc6M = avgExpectedDcaPrice6M > 0 ? totalCapital6M / avgExpectedDcaPrice6M : 0;
  const projectedBtc6M = totalBtc + addedBtc6M;
  const projectedSats6M = Math.round(projectedBtc6M * 100_000_000);
  const projectedAvgCost6M =
    projectedBtc6M > 0
      ? Math.round((currentCostUsd + totalCapital6M) / projectedBtc6M)
      : avgExpectedDcaPrice6M;
  const projectedVal6MAtFair = Math.round(projectedBtc6M * fairValue);
  const projectedRoi6MAtFair =
    projectedAvgCost6M > 0 ? ((fairValue - projectedAvgCost6M) / projectedAvgCost6M) * 100 : 0;

  // 12-Month Projection (52 weekly buys)
  const totalCapital12M = dcaBudget * 12;
  const avgExpectedDcaPrice12M = Math.round(0.45 * blendedWeeklyExecPrice + 0.55 * fairValue);
  const addedBtc12M = avgExpectedDcaPrice12M > 0 ? totalCapital12M / avgExpectedDcaPrice12M : 0;
  const projectedBtc12M = totalBtc + addedBtc12M;
  const projectedSats12M = Math.round(projectedBtc12M * 100_000_000);
  const projectedAvgCost12M =
    projectedBtc12M > 0
      ? Math.round((currentCostUsd + totalCapital12M) / projectedBtc12M)
      : avgExpectedDcaPrice12M;
  const projectedVal12MAtPeak = Math.round(projectedBtc12M * piCycleTop);
  const projectedRoi12MAtPeak =
    projectedAvgCost12M > 0 ? ((piCycleTop - projectedAvgCost12M) / projectedAvgCost12M) * 100 : 0;

  return {
    blendedWeeklyExecPrice,
    weeklyAddedBtc,
    weeklyAddedSats,
    projectedBtcAfterWeek,
    projectedSatsAfterWeek,
    projectedAvgCostAfterWeek,
    valAtPowerLawUsd,
    valAtPiCycleUsd,
    totalCapital6M,
    projectedBtc6M,
    projectedSats6M,
    projectedAvgCost6M,
    projectedVal6MAtFair,
    projectedRoi6MAtFair,
    totalCapital12M,
    projectedBtc12M,
    projectedSats12M,
    projectedAvgCost12M,
    projectedVal12MAtPeak,
    projectedRoi12MAtPeak,
  };
}

/**
 * Wealthfolio / GAAP / IFRS Weighted-Average Cost (WAC) Accounting Engine.
 * 
 * Rules:
 * 1. Sequential chronological trade processing.
 * 2. On BUY:
 *    totalCost += buyQty * buyPrice + feeUsd
 *    totalQty += buyQty
 *    avgBuyPrice = totalCost / totalQty
 * 3. On SELL:
 *    totalQty = Math.max(0, totalQty - sellQty)
 *    totalCost = totalQty * avgBuyPrice  (avgBuyPrice NEVER changes on a sale!)
 * 4. Unrealized PnL:
 *    unrealizedPnlUsd = totalQty * (livePrice - avgBuyPrice)
 *    unrealizedPnlPct = avgBuyPrice > 0 ? ((livePrice - avgBuyPrice) / avgBuyPrice) * 100 : 0
 */
export function computePortfolioSummaryWAC(
  transactions: PortfolioTransaction[],
  livePrice: number
): PortfolioSummary {
  // Sort chronologically ascending
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let totalQty = 0;
  let totalCost = 0;
  let avgBuyPrice = 0;

  for (const tx of sorted) {
    const qty = Math.max(0, tx.amountBtc);
    const price = Math.max(0, tx.priceUsd);
    const fee = Math.max(0, tx.feeUsd || 0);

    if (tx.type === 'BUY') {
      totalCost += qty * price + fee;
      totalQty += qty;
      avgBuyPrice = totalQty > 0 ? totalCost / totalQty : 0;
    } else if (tx.type === 'SELL') {
      totalQty = Math.max(0, totalQty - qty);
      totalCost = totalQty * avgBuyPrice; // avgBuyPrice NEVER changes on a sale!
    }
  }

  const currentValueUsd = totalQty * livePrice;
  const unrealizedPnlUsd = totalQty * (livePrice - avgBuyPrice);
  const unrealizedPnlPercent =
    totalQty > 0 && avgBuyPrice > 0 ? ((livePrice - avgBuyPrice) / avgBuyPrice) * 100 : 0;
  const averageBuyPriceUsd = totalQty > 0 ? Math.round(avgBuyPrice) : 0;
  const principalRecoveryPriceUsd =
    totalQty > 0 ? totalCost / (totalQty * 0.25) : 0;

  return {
    totalBtc: parseFloat(totalQty.toFixed(8)),
    totalSats: Math.round(totalQty * 100_000_000),
    totalInvestedUsd: Math.round(totalCost),
    currentValueUsd: Math.round(currentValueUsd),
    averageBuyPriceUsd,
    unrealizedPnlUsd: Math.round(unrealizedPnlUsd),
    unrealizedPnlPercent: parseFloat(unrealizedPnlPercent.toFixed(2)),
    principalRecoveryPriceUsd: Math.round(principalRecoveryPriceUsd),
  };
}
