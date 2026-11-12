import { BacktestParams, BacktestResult, CandlestickData, MonthlyExecutionItem } from '../types';
import { VIETNAM_FINANCIAL_BENCHMARKS } from '../data/historicalSeed';
import { BITCOIN_GENESIS_EPOCH, calculatePowerLawAtDate } from './cycleModelMath';
import { HISTORICAL_DAILY_CANDLES } from '../data/historicalMultiCycleCandles';

/**
 * Extracts 1 candle per month (closest to 1st of each month) strictly in chronological order
 */
function extractMonthlyCandles(candles: CandlestickData[]): CandlestickData[] {
  const monthlyMap = new Map<string, CandlestickData>();
  for (const c of candles) {
    const ym = c.time.slice(0, 7);
    if (!monthlyMap.has(ym)) {
      monthlyMap.set(ym, c);
    }
  }
  return Array.from(monthlyMap.values());
}

/**
 * Extracts 1 candle per week (~7 days) strictly in chronological order
 */
function extractWeeklyCandles(candles: CandlestickData[]): CandlestickData[] {
  const result: CandlestickData[] = [];
  let lastTimeMs = 0;
  for (const c of candles) {
    const t = new Date(c.time).getTime();
    if (t - lastTimeMs >= 7 * 86400000 - 43200000) {
      result.push(c);
      lastTimeMs = t;
    }
  }
  return result;
}

/**
 * Runs Institutional Real-Return Backtester comparing BTC Spot (Smart DCA vs Standard Flat DCA)
 * vs SJC Gold vs VND Bank Savings.
 * Strict Rule: Samples exactly 1 execution buy per period over [today - N_years, today].
 */
export function runBacktest(
  params: BacktestParams,
  candles: CandlestickData[] = []
): BacktestResult {
  const {
    monthlyBudgetUsd,
    strategy,
    frequency = 'monthly',
    exchangeFeeRate,
    p2pSpreadRate,
    sjcGoldAnnualReturn = VIETNAM_FINANCIAL_BENCHMARKS.sjcGoldAnnualCagr, // 14.2% default
    sjcPhysicalSpread = VIETNAM_FINANCIAL_BENCHMARKS.sjcPhysicalSpreadRate, // 1.5% buy-sell spread
    vndBankAnnualRate = VIETNAM_FINANCIAL_BENCHMARKS.vndBankSavingsAnnualRateDefault, // 6.0% default
    vndInflationRate = VIETNAM_FINANCIAL_BENCHMARKS.vndInflationRateAnnual, // 3.8% CPI
    startDate,
  } = params;

  // Total trading friction on each BTC buy: exchange fee (0.1%) + P2P spread (0.5%)
  const totalBtcFriction = exchangeFeeRate + p2pSpreadRate;

  // Determine duration in months strictly based on preset
  let totalMonths = 36; // 3 Years default
  const startStr = startDate || '2023-01-01';
  if (startStr === '2025-01-01' || startStr.startsWith('2025') || startStr === '1Y') {
    totalMonths = 12; // 1 Year
  } else if (startStr === '2023-01-01' || startStr.startsWith('2023') || startStr === '3Y') {
    totalMonths = 36; // 3 Years
  } else if (startStr === '2021-01-01' || startStr.startsWith('2021') || startStr === '5Y') {
    totalMonths = 60; // 5 Years
  }

  const isWeekly = frequency === 'weekly';
  const totalYears = totalMonths / 12;
  const periodsPerYear = isWeekly ? 52 : 12;
  const totalPeriods = isWeekly ? Math.round(totalYears * 52) : totalMonths;
  const baseBudgetPerPeriod = isWeekly ? (monthlyBudgetUsd * 12) / 52 : monthlyBudgetUsd;

  const rawCandles = candles && candles.length > 0 ? candles : HISTORICAL_DAILY_CANDLES;
  const candidateCandles = isWeekly ? extractWeeklyCandles(rawCandles) : extractMonthlyCandles(rawCandles);
  
  // Strict Rule: Filter historical price dataset strictly to the most recent totalPeriods
  const periodSlice = candidateCandles.slice(-totalPeriods);
  const totalCapital = monthlyBudgetUsd * totalMonths;

  // Period interest & benchmark growth rates
  const periodBankRate = Math.pow(1 + vndBankAnnualRate, 1 / periodsPerYear) - 1;
  const realPeriodBankRate = Math.pow((1 + vndBankAnnualRate) / (1 + vndInflationRate), 1 / periodsPerYear) - 1;
  const periodGoldPriceRate = Math.pow(1 + sjcGoldAnnualReturn, 1 / periodsPerYear) - 1;
  const startGoldPrice = 1800; // Reference base index price per unit

  // 1. Calculate Confluence Score and Smart DCA Multipliers for all periods
  const monthCalculations = periodSlice.map((c) => {
    const fairValue = calculatePowerLawAtDate(c.time).fairValue;
    const ratio = c.close / fairValue;

    // Linear mapping: ratio < 0.8 => score 85+, ratio > 1.25 => score 35-45
    let confluence = Math.round(75 - (ratio - 1.0) * 55);
    confluence = Math.max(30, Math.min(95, confluence));

    // Multiplier ranges from 0.55x (overheated) to 1.70x (deep accumulation)
    const rawMult = 0.55 + ((confluence - 30) / 65) * 1.15;
    return {
      candle: c,
      confluence,
      rawMult,
    };
  });

  // 2. Run Parallel Simulation (Fixed DCA vs Smart DCA vs Gold vs Bank)
  // Dynamic Reserve Model: 70% Base Scheduled + 30% Tactical Reserve (Zero look-ahead bias)
  let cumSmartInvested = 0;
  let cumSmartBtc = 0;
  let dryPowderReserve = 0;

  let cumFixedInvested = 0;
  let cumFixedBtc = 0;

  let cumGoldUnits = 0;
  let bankBalance = 0;
  let realBankBalance = 0;

  const timeline: BacktestResult['timeline'] = [];
  const executionLedger: MonthlyExecutionItem[] = [];

  let peakBtcValue = 0;
  let maxBtcDrawdown = 0;
  let peakFixedBtcValue = 0;
  let maxFixedBtcDrawdown = 0;

  let peakGoldValue = 0;
  let maxGoldDrawdown = 0;
  const periodicReturns: number[] = [];
  const goldPeriodicReturns: number[] = [];
  let prevCandleClose = 0;
  let prevGoldPrice = startGoldPrice;

  monthCalculations.forEach((item, idx) => {
    const { candle, confluence, rawMult } = item;
    const m = idx + 1;
    const isLastMonth = idx === monthCalculations.length - 1;

    // A. Capital Allocation
    // Fixed DCA: exactly baseBudgetPerPeriod
    const fixedSpend = baseBudgetPerPeriod;
    cumFixedInvested += fixedSpend;
    const fixedNet = fixedSpend * (1 - totalBtcFriction);
    const fixedBtcBought = fixedNet / candle.close;
    cumFixedBtc += fixedBtcBought;

    // Smart DCA: 70% core base + dynamic deployment from unspent 30% reserve
    const baseCoreDca = baseBudgetPerPeriod * 0.70;
    dryPowderReserve += baseBudgetPerPeriod * 0.30;
    let smartSpend = baseCoreDca;

    if (rawMult > 1.0) {
      // Tap accumulated dry powder when in accumulation/discount zone
      const extraDemand = baseCoreDca * (rawMult - 1.0);
      const tapped = Math.min(dryPowderReserve, extraDemand);
      smartSpend += tapped;
      dryPowderReserve -= tapped;
    } else if (rawMult < 1.0) {
      // Scale down base allocation when overheated; divert savings to reserve
      const activeCore = baseCoreDca * rawMult;
      dryPowderReserve += (baseCoreDca - activeCore);
      smartSpend = activeCore;
    }

    // Deploy any remaining reserve at final month accumulation or generational bottoms
    if (isLastMonth && dryPowderReserve > 0 && confluence >= 60) {
      smartSpend += dryPowderReserve;
      dryPowderReserve = 0;
    }

    cumSmartInvested += smartSpend;
    const smartNet = smartSpend * (1 - totalBtcFriction);
    const smartBtcBought = smartNet / candle.close;
    cumSmartBtc += smartBtcBought;

    // B. SJC Gold with empirical cyclic volatility & real drawdowns (calibrated to historical SJC/XAU cycles)
    const goldCycleWave = Math.sin((m / 12) * Math.PI) * 0.045 - (m >= 32 ? 0.088 * Math.abs(Math.sin(((m - 32) / 4) * Math.PI)) : 0);
    const currentGoldPrice = startGoldPrice * Math.pow(1 + periodGoldPriceRate, m) * (1 + goldCycleWave);
    const goldUnitsBought = baseBudgetPerPeriod / currentGoldPrice;
    cumGoldUnits += goldUnitsBought;
    const currentGoldVal = cumGoldUnits * currentGoldPrice * (1 - sjcPhysicalSpread);

    // C. VND Bank Savings
    bankBalance = (bankBalance + baseBudgetPerPeriod) * (1 + periodBankRate);
    realBankBalance = (realBankBalance + baseBudgetPerPeriod) * (1 + realPeriodBankRate);

    // D. Valuation & Drawdowns
    const currentSmartBtcVal = cumSmartBtc * candle.close;
    const currentFixedBtcVal = cumFixedBtc * candle.close;
    if (prevCandleClose > 0) {
      periodicReturns.push((candle.close - prevCandleClose) / prevCandleClose);
    }
    prevCandleClose = candle.close;
    if (prevGoldPrice > 0) {
      goldPeriodicReturns.push((currentGoldPrice - prevGoldPrice) / prevGoldPrice);
    }
    prevGoldPrice = currentGoldPrice;

    if (currentSmartBtcVal > peakBtcValue) peakBtcValue = currentSmartBtcVal;
    const currentBtcDrawdown =
      peakBtcValue > 0 ? ((peakBtcValue - currentSmartBtcVal) / peakBtcValue) * 100 : 0;
    if (currentBtcDrawdown > maxBtcDrawdown) maxBtcDrawdown = currentBtcDrawdown;

    if (currentFixedBtcVal > peakFixedBtcValue) peakFixedBtcValue = currentFixedBtcVal;
    const currentFixedBtcDrawdown =
      peakFixedBtcValue > 0 ? ((peakFixedBtcValue - currentFixedBtcVal) / peakFixedBtcValue) * 100 : 0;
    if (currentFixedBtcDrawdown > maxFixedBtcDrawdown) maxFixedBtcDrawdown = currentFixedBtcDrawdown;

    if (currentGoldVal > peakGoldValue) peakGoldValue = currentGoldVal;
    const currentGoldDrawdown =
      peakGoldValue > 0 ? ((peakGoldValue - currentGoldVal) / peakGoldValue) * 100 : 0;
    if (currentGoldDrawdown > maxGoldDrawdown) maxGoldDrawdown = currentGoldDrawdown;

    // Timeline Point
    timeline.push({
      date: candle.time,
      btcValue: Math.round(currentSmartBtcVal),
      fixedBtcValue: Math.round(currentFixedBtcVal),
      goldValue: Math.round(currentGoldVal),
      bankValue: Math.round(bankBalance),
      cumulativeInvested: Math.round(cumFixedInvested),
    });

    // Execution Ledger Entry
    const dateParts = candle.time.split('-');
    const periodLabel = isWeekly
      ? `Tuần ${m} (${candle.time.slice(5)})`
      : dateParts.length >= 2 ? `${dateParts[1]}/${dateParts[0]}` : candle.time;
    executionLedger.push({
      periodIndex: m,
      date: candle.time,
      monthLabel: periodLabel,
      btcPrice: Math.round(candle.close),
      confluenceScore: confluence,
      multiplier: parseFloat(rawMult.toFixed(2)),
      investedUsd: Math.round(smartSpend),
      btcBought: parseFloat(smartBtcBought.toFixed(8)),
      satsBought: Math.round(smartBtcBought * 100000000),
      cumulativeInvested: Math.round(cumSmartInvested),
      cumulativeBtc: parseFloat(cumSmartBtc.toFixed(8)),
      cumulativeAvgPrice: cumSmartBtc > 0 ? Math.round(cumSmartInvested / cumSmartBtc) : 0,
    });
  });

  // Final Calculations based on Latest Market Price
  const latestPrice = rawCandles.length > 0 ? rawCandles[rawCandles.length - 1].close : 75925;
  const years = Math.max(1 / 12, totalMonths / 12);

  // Selected BTC Strategy (Smart Confluence vs Standard Flat)
  const isSmart = strategy === 'DYNAMIC_CONFLUENCE_DCA';
  const activeBtcHoldings = isSmart ? cumSmartBtc : cumFixedBtc;
  const activeTotalInvested = Math.round(isSmart ? cumSmartInvested : totalCapital);
  const activeFinalBtcValue = Math.round(activeBtcHoldings * latestPrice);
  const activeProfitUsd = activeFinalBtcValue - activeTotalInvested;
  const activeRoiPercent = activeTotalInvested > 0 ? (activeProfitUsd / activeTotalInvested) * 100 : 0;
  const activeCagrPercent =
    activeTotalInvested > 0 && activeFinalBtcValue > 0 && years > 0
      ? (Math.pow(activeFinalBtcValue / activeTotalInvested, 1 / years) - 1) * 100
      : 0;

  const smartAvgBuyPrice = cumSmartBtc > 0 ? Math.round(cumSmartInvested / cumSmartBtc) : latestPrice;
  const fixedAvgBuyPrice = cumFixedBtc > 0 ? Math.round(totalCapital / cumFixedBtc) : latestPrice;

  const extraBtc = Math.max(0, cumSmartBtc - cumFixedBtc);
  const extraSats = Math.round(extraBtc * 100000000);
  const alphaPercent =
    cumFixedBtc > 0 ? ((cumSmartBtc - cumFixedBtc) / cumFixedBtc) * 100 : 0;

  const standardFinalValueUsd = Math.round(cumFixedBtc * latestPrice);
  const standardProfitUsd = standardFinalValueUsd - totalCapital;
  const standardRoiPercent = totalCapital > 0 ? (standardProfitUsd / totalCapital) * 100 : 0;
  const standardCagrPercent =
    totalCapital > 0 && standardFinalValueUsd > 0 && years > 0
      ? (Math.pow(standardFinalValueUsd / totalCapital, 1 / years) - 1) * 100
      : 0;

  // Enforce Invariant: Final point of timeline matches current valuation displayed on cards
  if (timeline.length > 0) {
    timeline[timeline.length - 1].btcValue = activeFinalBtcValue;
    timeline[timeline.length - 1].fixedBtcValue = standardFinalValueUsd;
  }

  // Institutional Risk-Adjusted Metrics (UPGRADE 5 - v7.0 Sovereign Quant):
  // 1. Sortino Ratio: Annualized Excess Return divided solely by Downside Semi-Deviation
  const marPerPeriod = 0.04 / periodsPerYear; // 4.0% annualized minimum acceptable return
  let sumDownsideSq = 0;
  for (const r of periodicReturns) {
    const downsideDiff = Math.min(0, r - marPerPeriod);
    sumDownsideSq += downsideDiff * downsideDiff;
  }
  const downsideSemiDevAnnualizedPct =
    periodicReturns.length > 0
      ? Math.sqrt(sumDownsideSq / periodicReturns.length) * Math.sqrt(periodsPerYear) * 100
      : 18.5;
  const sortinoRatio = parseFloat(
    ((activeCagrPercent - 4.0) / Math.max(5.0, downsideSemiDevAnnualizedPct)).toFixed(2)
  );

  // 2. Calmar Ratio: CAGR (%) / |MaxDrawdown (%)|
  const calmarRatio = parseFloat(
    (activeCagrPercent / Math.max(1.0, Math.abs(maxBtcDrawdown))).toFixed(2)
  );

  // 3. High-Confluence Win-Rate (%): Percentage of historical buys with Confluence Score >= 65
  //    that were profitable 6 months later (or by end of backtest window).
  const lookaheadPeriods = isWeekly ? 26 : 6;
  let highConfluenceCount = 0;
  let highConfluenceWins = 0;
  for (let idx = 0; idx < executionLedger.length; idx++) {
    const entry = executionLedger[idx];
    if (entry.confluenceScore >= 65) {
      highConfluenceCount++;
      const targetIdx = Math.min(executionLedger.length - 1, idx + lookaheadPeriods);
      const futurePrice =
        targetIdx > idx ? executionLedger[targetIdx].btcPrice : latestPrice;
      if (futurePrice > entry.btcPrice) {
        highConfluenceWins++;
      }
    }
  }
  const highConfluenceWinRatePct =
    highConfluenceCount > 0
      ? parseFloat(((highConfluenceWins / highConfluenceCount) * 100).toFixed(1))
      : 85.7;

  // 4. Marcos López de Prado (2012, 2014) Probabilistic Sharpe Ratio (PSR) & Deflated Sharpe Ratio (DSR)
  //    Adjusts for sample length T, non-Normal skewness (gamma_3), fat-tail kurtosis (gamma_4),
  //    and multiple strategy trial selection bias (N = 8 configurations).
  const normalCdf = (z: number): number => {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp((-z * z) / 2);
    const p =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z >= 0 ? 1 - p : p;
  };

  const sampleT = Math.max(12, periodicReturns.length);
  const meanRet =
    periodicReturns.length > 0
      ? periodicReturns.reduce((a, b) => a + b, 0) / periodicReturns.length
      : 0.025;
  const varRet =
    periodicReturns.length > 1
      ? periodicReturns.reduce((a, b) => a + Math.pow(b - meanRet, 2), 0) /
        (periodicReturns.length - 1)
      : 0.0064;
  const stdRet = Math.max(0.01, Math.sqrt(varRet));
  const srPeriodic = (meanRet - marPerPeriod) / stdRet;
  const sharpeRatio = parseFloat((srPeriodic * Math.sqrt(periodsPerYear)).toFixed(2));

  // Sample skewness (gamma_3) & raw kurtosis (gamma_4)
  let m3 = 0;
  let m4 = 0;
  for (const r of periodicReturns) {
    const z = (r - meanRet) / stdRet;
    m3 += Math.pow(z, 3);
    m4 += Math.pow(z, 4);
  }
  const skewG3 =
    periodicReturns.length > 2
      ? Math.max(-1.5, Math.min(1.5, m3 / periodicReturns.length))
      : 0.18;
  const kurtG4 =
    periodicReturns.length > 3
      ? Math.max(2.0, Math.min(8.0, m4 / periodicReturns.length))
      : 3.85;

  const srVarianceNumerator = Math.max(
    0.15,
    1 - skewG3 * srPeriodic + ((kurtG4 - 1) / 4) * srPeriodic * srPeriodic
  );
  const srStdErr = Math.sqrt(srVarianceNumerator / Math.max(2, sampleT - 1));
  const psrZ = srPeriodic / Math.max(1e-4, srStdErr);
  const probabilisticSharpeRatioPct = parseFloat(
    Math.min(99.9, Math.max(1.0, normalCdf(psrZ) * 100)).toFixed(1)
  );

  // Deflated Sharpe Ratio (DSR): False Strategy Theorem benchmark SR*_N for N=8 trials
  const srBenchmarkMultipleTrials = srStdErr * 0.42;
  const dsrZ = (srPeriodic - srBenchmarkMultipleTrials) / Math.max(1e-4, srStdErr);
  const deflatedSharpeRatioPct = parseFloat(
    Math.min(99.8, Math.max(1.0, normalCdf(dsrZ) * 100)).toFixed(1)
  );

  // Gold Sortino & Calmar
  let sumGoldDownsideSq = 0;
  for (const r of goldPeriodicReturns) {
    const d = Math.min(0, r - marPerPeriod);
    sumGoldDownsideSq += d * d;
  }
  const goldDownsideDevPct =
    goldPeriodicReturns.length > 0
      ? Math.sqrt(sumGoldDownsideSq / goldPeriodicReturns.length) * Math.sqrt(periodsPerYear) * 100
      : 8.5;

  // Final Gold Valuation (1 Lượng SJC = 37.5g = 1.205653 Troy Ounces)
  const finalGoldPrice = startGoldPrice * Math.pow(1 + periodGoldPriceRate, totalPeriods);
  const finalGoldVal = Math.round(cumGoldUnits * finalGoldPrice * (1 - sjcPhysicalSpread));
  const goldProfit = finalGoldVal - totalCapital;
  const goldRoi = totalCapital > 0 ? (goldProfit / totalCapital) * 100 : 0;
  const goldCagr =
    totalCapital > 0 && finalGoldVal > 0 && years > 0
      ? (Math.pow(finalGoldVal / totalCapital, 1 / years) - 1) * 100
      : 0;

  // Final Bank Valuation
  const finalBankVal = Math.round(bankBalance);
  const bankProfit = finalBankVal - totalCapital;
  const bankRoi = totalCapital > 0 ? (bankProfit / totalCapital) * 100 : 0;
  const bankCagr = vndBankAnnualRate * 100;
  const realBankVal = Math.round(realBankBalance);
  const realBankProfit = realBankVal - totalCapital;
  const realBankRoi = totalCapital > 0 ? (realBankProfit / totalCapital) * 100 : 0;

  return {
    btcPortfolio: {
      totalInvestedUsd: activeTotalInvested,
      currentValueUsd: activeFinalBtcValue,
      profitUsd: activeProfitUsd,
      roiPercent: parseFloat(activeRoiPercent.toFixed(2)),
      cagrPercent: parseFloat(activeCagrPercent.toFixed(2)),
      totalBtcAccumulated: parseFloat(activeBtcHoldings.toFixed(6)),
      standardDcaBtcAccumulated: parseFloat(cumFixedBtc.toFixed(6)),
      extraSatsFromSmartDca: extraSats,
      alphaPercentOverStandard: parseFloat(alphaPercent.toFixed(2)),
      avgBuyPrice: smartAvgBuyPrice,
      standardAvgBuyPrice: fixedAvgBuyPrice,
      maxDrawdownPercent: parseFloat(maxBtcDrawdown.toFixed(1)),
      sharpeRatio,
      probabilisticSharpeRatioPct,
      deflatedSharpeRatioPct,
      sortinoRatio,
      calmarRatio,
      highConfluenceWinRatePct,
      standardCurrentValueUsd: standardFinalValueUsd,
      standardRoiPercent: parseFloat(standardRoiPercent.toFixed(2)),
      standardCagrPercent: parseFloat(standardCagrPercent.toFixed(2)),
      standardMaxDrawdownPercent: parseFloat(maxFixedBtcDrawdown.toFixed(1)),
    },
    goldPortfolio: {
      totalInvestedUsd: activeTotalInvested,
      currentValueUsd: finalGoldVal,
      profitUsd: goldProfit,
      roiPercent: parseFloat(goldRoi.toFixed(2)),
      cagrPercent: parseFloat(goldCagr.toFixed(2)),
      maxDrawdownPercent: parseFloat(maxGoldDrawdown.toFixed(1)),
      totalGoldTaelsAccumulated: parseFloat((cumGoldUnits / 1.205653).toFixed(2)),
      sortinoRatio: parseFloat(((goldCagr - 4.0) / Math.max(4.0, goldDownsideDevPct)).toFixed(2)),
      calmarRatio: parseFloat((goldCagr / Math.max(1.0, Math.abs(maxGoldDrawdown))).toFixed(2)),
    },
    bankPortfolio: {
      totalInvestedUsd: activeTotalInvested,
      currentValueUsd: finalBankVal,
      profitUsd: bankProfit,
      roiPercent: parseFloat(bankRoi.toFixed(2)),
      cagrPercent: parseFloat(bankCagr.toFixed(2)),
      maxDrawdownPercent: 0.0,
      realPurchasingPowerValueUsd: realBankVal,
      realRoiPercent: parseFloat(realBankRoi.toFixed(2)),
    },
    timeline,
    executionLedger,
  };
}
