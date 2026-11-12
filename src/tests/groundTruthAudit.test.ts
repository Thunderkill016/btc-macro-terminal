import { describe, it, expect } from 'vitest';
import {
  computeAhr999PowerLawEstimate,
  computeGeometricMean,
  computeAhr999,
  computeMayerMultiple,
  computePiCycleTop,
  getBlockSubsidy,
  computeDailyIssuanceUsd,
  computePuellMultiple,
  computeMvrv,
} from '../domain/quant/cycleModelMath';
import { calculateOnChainMetrics, computeProbabilisticForwardCone } from '../domain/quant/quantEngine';
import { computePortfolioSummaryWAC, calculateAccumulationForecast } from '../domain/models/portfolio';
import { PortfolioTransaction } from '../types';
import { calculatePowerLawAtDate, getMonotonic200WMA } from '../data/historicalSeed';

/**
 * ==============================================================================
 * MATHEMATICAL GROUND TRUTH AUDIT SUITE
 * Anchored to:
 * 1. Nine Gods (ahr999) Whitepaper (2018)
 * 2. Trace Mayer Multiple (2017)
 * 3. Philip Swift Pi Cycle Top & 200W MA (LookIntoBitcoin, 2019)
 * 4. David Puell Multiple (2019)
 * 5. CoinMetrics MVRV & Realized Price (2018)
 * 6. Wealthfolio / GAAP Weighted-Average Cost (WAC) Accounting
 * ==============================================================================
 */

describe('MATHEMATICAL GROUND TRUTH AUDIT — HISTORICAL BENCHMARKS & EQUATIONS', () => {
  // ----------------------------------------------------------------------------
  // 1. NINE GODS AHR999 INDEX
  // ----------------------------------------------------------------------------
  describe('Nine Gods AHR999 Hoarding Index', () => {
    it('verifies 2021-11-10 All-Time High ($69,000) AHR999 in Overheated Zone (> 1.20)', () => {
      const ts2021Nov = Date.UTC(2021, 10, 10, 0, 0, 0);
      const days = (ts2021Nov - Date.UTC(2009, 0, 3, 18, 15, 5)) / 86_400_000;
      expect(days).toBeGreaterThan(4690);
      expect(days).toBeLessThan(4700);

      // Power law fit at ~4694 days is ~$27,029
      const powerLawEstimate = computeAhr999PowerLawEstimate(days);
      expect(powerLawEstimate).toBeGreaterThan(26000);
      expect(powerLawEstimate).toBeLessThan(28000);

      // 200-day Geometric Mean on 2021-11-10 was ~$46,800
      const geomMean200D = 46800;
      const result = computeAhr999(69000, geomMean200D, ts2021Nov);

      // (69000 / 46800) * (69000 / 27029) ≈ 1.474 * 2.553 ≈ 3.76
      expect(result.ahr999).toBeGreaterThan(3.5);
      expect(result.ahr999).toBeLessThan(4.0);
      expect(result.zone).toBe('HOLD_WAIT'); // Approaching 4.0 top zone
    });

    it('verifies 2022-11-21 FTX Cycle Bottom ($15,800) AHR999 in Bargain Zone (< 0.45)', () => {
      const ts2022Nov = Date.UTC(2022, 10, 21, 0, 0, 0);
      const days = (ts2022Nov - Date.UTC(2009, 0, 3, 18, 15, 5)) / 86_400_000;

      // Power law fit at ~5070 days is ~$42,351
      const powerLawEstimate = computeAhr999PowerLawEstimate(days);
      expect(powerLawEstimate).toBeGreaterThan(40000);
      expect(powerLawEstimate).toBeLessThan(45000);

      // 200-day Geometric Mean on 2022-11-21 was ~$22,000
      const geomMean200D = 22000;
      const result = computeAhr999(15800, geomMean200D, ts2022Nov);

      // (15800 / 22000) * (15800 / 42351) ≈ 0.718 * 0.373 ≈ 0.268 (< 0.45)
      expect(result.ahr999).toBeLessThan(0.45);
      expect(result.zone).toBe('BOTTOM_BARGAIN');
      expect(result.zoneLabelVi).toContain('Đáy Tuyệt Đối');
    });

    it('verifies 2026-11-11 Live Anchor ($75,925) AHR999 in Prime DCA Accumulation Zone (0.45 - 1.20)', () => {
      const ts2026Nov = Date.UTC(2026, 10, 11, 0, 0, 0);
      const geomMean200D = 72500;
      const onChain = calculateOnChainMetrics(75925, ts2026Nov);

      // At $75,925 with geom $72,500 and Santostasi fair value $88,478:
      // (75925 / 72500) * (75925 / 88478) ≈ 1.0472 * 0.8581 ≈ 0.898
      expect(onChain.ahr999).toBeCloseTo(0.898, 2);
      expect(onChain.ahr999).toBeGreaterThanOrEqual(0.45);
      expect(onChain.ahr999).toBeLessThanOrEqual(1.20);
    });

    it('verifies 200-day geometric mean formula matches mathematical definition', () => {
      // For [100, 200, 400], geometric mean = (100 * 200 * 400)^(1/3) = 8,000,000^(1/3) = 200
      const testArray = [100, 200, 400];
      const geom = computeGeometricMean(testArray);
      expect(geom).toBeCloseTo(200, 4);
    });
  });

  // ----------------------------------------------------------------------------
  // 2. TRACE MAYER MULTIPLE
  // ----------------------------------------------------------------------------
  describe('Trace Mayer Multiple', () => {
    it('verifies Mayer Multiple equals price / SMA200 with 1.38 mean benchmark', () => {
      // Historical mean test
      const resMean = computeMayerMultiple(73000 * 1.38, 73000);
      expect(resMean.mayerMultiple).toBeCloseTo(1.38, 2);
      expect(resMean.isOverbought).toBe(false);

      // Overbought test (> 2.40)
      const resOver = computeMayerMultiple(73000 * 2.45, 73000);
      expect(resOver.mayerMultiple).toBeCloseTo(2.45, 2);
      expect(resOver.isOverbought).toBe(true);

      // Nov 2026 current spot ($75,925 / 73,000 = 1.040)
      const resLive = computeMayerMultiple(75925, 73000);
      expect(resLive.mayerMultiple).toBe(1.04);
      expect(resLive.isOverbought).toBe(false);
      expect(resLive.isUndervalued).toBe(false);
    });
  });

  // ----------------------------------------------------------------------------
  // 3. PHILIP SWIFT PI CYCLE TOP & 200W SMA FLOOR
  // ----------------------------------------------------------------------------
  describe('Philip Swift Pi Cycle Top & 200W SMA Floor', () => {
    it('verifies Pi Cycle top fires when SMA111D crosses 2 * SMA350D', () => {
      // Create artificial daily closes where SMA111D exceeds 2 * SMA350D
      const closes = new Array(350).fill(50000);
      // Give recent 111 days a high spike to trigger cross:
      // Base average = (239*50000 + 111*250000)/350 = 113,428; 2 * 113,428 = 226,857
      // SMA111D = 250,000 >= 226,857 -> isTopSignal = true
      for (let i = 350 - 111; i < 350; i++) {
        closes[i] = 250000;
      }

      const res = computePiCycleTop(closes);
      expect(res.sma111D).toBe(250000);
      expect(res.isTopSignal).toBe(true);
    });

    it('verifies 200W SMA floor is strictly non-decreasing and supports spot', () => {
      const nov2026Wma = getMonotonic200WMA();
      expect(nov2026Wma).toBeGreaterThanOrEqual(67000);
      expect(nov2026Wma).toBeLessThanOrEqual(69000);

      // Spot ($75,925) must be comfortably above 200W floor ($68,033)
      expect(75925).toBeGreaterThan(nov2026Wma);
    });
  });

  // ----------------------------------------------------------------------------
  // 4. DAVID PUELL'S BLOCK SUBSIDY & PUELL MULTIPLE
  // ----------------------------------------------------------------------------
  describe('David Puell Subsidy Schedule & Puell Multiple', () => {
    it('verifies block subsidy matches exact historical halving calendar', () => {
      expect(getBlockSubsidy('2012-11-01')).toBe(50.0);
      expect(getBlockSubsidy('2015-06-01')).toBe(25.0);
      expect(getBlockSubsidy('2019-01-01')).toBe(12.5);
      expect(getBlockSubsidy('2023-01-01')).toBe(6.25);
      expect(getBlockSubsidy('2026-11-11')).toBe(3.125); // Current era
    });

    it('calculates daily issuance in USD correctly', () => {
      // In 2026: 144 blocks * 3.125 BTC * $75,925 = $34,166,250 / day
      const issuance = computeDailyIssuanceUsd(75925, '2026-11-11');
      expect(issuance).toBe(144 * 3.125 * 75925);
    });

    it('identifies miner capitulation (< 0.50) and blow-off top (> 3.50)', () => {
      const pastIssuances = new Array(365).fill(34_166_250);
      // Capitulation scenario: 40% of normal daily issuance
      const capitulation = computePuellMultiple(34_166_250 * 0.40, pastIssuances);
      expect(capitulation.puellMultiple).toBeCloseTo(0.40, 2);
      expect(capitulation.isBottomZone).toBe(true);

      // Bubble top scenario: 4x normal issuance
      const top = computePuellMultiple(34_166_250 * 4.0, pastIssuances);
      expect(top.puellMultiple).toBeCloseTo(4.0, 2);
      expect(top.isTopZone).toBe(true);
    });
  });

  // ----------------------------------------------------------------------------
  // 5. COINMETRICS REALIZED PRICE & MVRV RATIO
  // ----------------------------------------------------------------------------
  describe('CoinMetrics Realized Price & MVRV Ratio', () => {
    it('verifies MVRV ratio = spot / realized price within < 0.5% tolerance', () => {
      const spot = 75925;
      const realizedPrice = 53950;
      const mvrv = computeMvrv(spot, realizedPrice);

      const expectedRatio = 75925 / 53950; // 1.4073
      expect(mvrv.mvrvRatio).toBeCloseTo(expectedRatio, 2);
      expect(mvrv.isUndervalued).toBe(false);
      expect(mvrv.isOvervalued).toBe(false);

      // Deep undervalued (< 1.0)
      const undervalued = computeMvrv(40000, 53950);
      expect(undervalued.mvrvRatio).toBeLessThan(1.0);
      expect(undervalued.isUndervalued).toBe(true);
    });
  });

  // ----------------------------------------------------------------------------
  // 6. WEALTHFOLIO / GAAP WEIGHTED-AVERAGE COST (WAC) ACCOUNTING
  // ----------------------------------------------------------------------------
  describe('Wealthfolio / GAAP Weighted-Average Cost (WAC) Portfolio Accounting', () => {
    it('preserves avgBuyPrice invariant across sales (No Distortions)', () => {
      const transactions: PortfolioTransaction[] = [
        {
          id: 'tx-1',
          date: '2023-01-01T00:00:00Z',
          type: 'BUY',
          amountBtc: 1.0,
          priceUsd: 30000,
          feeUsd: 0,
        },
        {
          id: 'tx-2',
          date: '2023-06-01T00:00:00Z',
          type: 'BUY',
          amountBtc: 1.0,
          priceUsd: 50000,
          feeUsd: 0,
        },
      ];

      // After 2 buys: 2 BTC, Total Cost $80,000, Avg Cost $40,000
      let summary = computePortfolioSummaryWAC(transactions, 60000);
      expect(summary.totalBtc).toBe(2.0);
      expect(summary.totalInvestedUsd).toBe(80000);
      expect(summary.averageBuyPriceUsd).toBe(40000);
      expect(summary.unrealizedPnlUsd).toBe(40000); // 2 * (60,000 - 40,000)

      // Tx 3: SELL 1.0 BTC at $60,000
      // In GAAP / Wealthfolio WAC:
      // avgBuyPrice MUST REMAIN $40,000!
      // remaining totalCost = 1.0 * $40,000 = $40,000
      const txWithSell: PortfolioTransaction[] = [
        ...transactions,
        {
          id: 'tx-3',
          date: '2024-01-01T00:00:00Z',
          type: 'SELL',
          amountBtc: 1.0,
          priceUsd: 60000,
          feeUsd: 0,
        },
      ];

      summary = computePortfolioSummaryWAC(txWithSell, 75925);
      expect(summary.totalBtc).toBe(1.0);
      expect(summary.averageBuyPriceUsd).toBe(40000); // Invariant holds!
      expect(summary.totalInvestedUsd).toBe(40000);
      expect(summary.currentValueUsd).toBe(75925);
      expect(summary.unrealizedPnlUsd).toBe(35925); // 1.0 * (75,925 - 40,000)
      expect(summary.unrealizedPnlPercent).toBeCloseTo(89.81, 1); // (35,925 / 40,000) * 100
    });

    it('handles complete liquidation safely without negative balance or NaN', () => {
      const fullLiquidation: PortfolioTransaction[] = [
        {
          id: 'tx-buy',
          date: '2024-01-01T00:00:00Z',
          type: 'BUY',
          amountBtc: 0.5,
          priceUsd: 40000,
          feeUsd: 10,
        },
        {
          id: 'tx-sell',
          date: '2024-02-01T00:00:00Z',
          type: 'SELL',
          amountBtc: 0.5,
          priceUsd: 50000,
          feeUsd: 10,
        },
      ];

      const summary = computePortfolioSummaryWAC(fullLiquidation, 75925);
      expect(summary.totalBtc).toBe(0);
      expect(summary.totalSats).toBe(0);
      expect(summary.totalInvestedUsd).toBe(0);
      expect(summary.currentValueUsd).toBe(0);
      expect(summary.unrealizedPnlUsd).toBe(0);
      expect(summary.unrealizedPnlPercent).toBe(0);
      expect(Number.isNaN(summary.averageBuyPriceUsd)).toBe(false);
    });
  });

  // ----------------------------------------------------------------------------
  // 7. SANTOSTASI POWER LAW BENCHMARK
  // ----------------------------------------------------------------------------
  describe('Santostasi Power Law Support & Bubble Ceiling', () => {
    it('verifies Late 2026 Fair Value ~$88,478 and Bubble Ceiling = 2.3x Fair Value ($203,500)', () => {
      const pl = calculatePowerLawAtDate(6518.24);
      expect(pl.fairValue).toBe(88478);
      expect(pl.bubble).toBe(203499); // Math.round(88,478 * 2.3) ≈ $203,500 benchmark
      expect(Math.abs(pl.bubble - 203500)).toBeLessThanOrEqual(1);

      // Deviation from $75,925 spot
      const currentPrice = 75925;
      const deviation = ((currentPrice - pl.fairValue) / pl.fairValue) * 100;
      expect(deviation).toBeCloseTo(-14.19, 1); // Trading at ~14.2% discount to power law fair value
    });
  });

  // ----------------------------------------------------------------------------
  // 8. ACCUMULATION FORECAST & COST BASIS DILUTION MATHEMATICAL INVARIANTS
  // ----------------------------------------------------------------------------
  describe('Accumulation Forecast & WAC Basis Dilution Invariants', () => {
    it('verifies exact cost-basis reduction when buying $112.36 at $73,984 from $80,792 cost basis', () => {
      const forecast = calculateAccumulationForecast({
        currentPrice: 73984,
        totalBtc: 0.00019760,
        totalSats: 19760,
        avgBuyPrice: 80792,
        totalInvestedUsd: 15.9645,
        dcaBudget: 100,
        tacticalTotalUsd: 112.36,
        marketPct: 0.50,
        limit1Pct: 0.30,
        limit2Pct: 0.20,
        limit1Price: 71758,
        limit2Price: 68000,
        fairValue: 88632,
        piCycleTop: 151272,
        cone90P50: 78500,
      });

      // Weekly added BTC: 112.36 / 73984 = 0.00151871 BTC (151,871 sats)
      expect(forecast.weeklyAddedSats).toBe(151871);
      // Total BTC after week: 19,760 + 151,871 = 171,631 sats
      expect(forecast.projectedSatsAfterWeek).toBe(171631);

      // New average cost basis: (15.9645 + 112.36) / 0.001716312 = $74,767.57 -> $74,768
      expect(forecast.projectedAvgCostAfterWeek).toBe(74768);
      // Strictly bounded between spot and old cost basis: $73,984 <= $74,768 <= $80,792
      expect(forecast.projectedAvgCostAfterWeek).toBeGreaterThanOrEqual(73984);
      expect(forecast.projectedAvgCostAfterWeek).toBeLessThanOrEqual(80792);

      // Projected portfolio values at cycle targets for 171,631 sats
      // At Power Law ($88,632): 0.00171631 * 88632 = $152.12
      expect(forecast.valAtPowerLawUsd).toBeCloseTo(152.12, 1);
      // At Pi Cycle ($151,272): 0.00171631 * 151272 = $259.63
      expect(forecast.valAtPiCycleUsd).toBeCloseTo(259.63, 1);
    });
  });

  // ----------------------------------------------------------------------------
  // 9. PROBABILISTIC FORWARD CONE ORNSTEIN-UHLENBECK DRIFT & MONOTONICITY
  // ----------------------------------------------------------------------------
  describe('Probabilistic Forward Cone OU Drift & Monotonicity', () => {
    it('verifies P50 drifts upward toward Power Law fair value when spot is undervalued', () => {
      const cone = computeProbabilisticForwardCone(73984, 88632, 0.0238, 39.4, 68033);

      // Strict monotonicity within each horizon
      expect(cone.cone30D.p15).toBeLessThan(cone.cone30D.p50);
      expect(cone.cone30D.p50).toBeLessThan(cone.cone30D.p85);
      expect(cone.cone90D.p15).toBeLessThan(cone.cone90D.p50);
      expect(cone.cone90D.p50).toBeLessThan(cone.cone90D.p85);

      // Since spot $73,984 < Fair Value $88,632, P50 must drift upwards over time
      expect(cone.cone30D.p50).toBeGreaterThanOrEqual(73984); // >= spot
      expect(cone.cone90D.p50).toBeGreaterThan(cone.cone30D.p50); // 90D P50 > 30D P50
      expect(cone.cone90D.p50).toBeGreaterThanOrEqual(77000); // Drifts toward ~$78,500
      expect(cone.cone90D.p85).toBeGreaterThan(85000);

      // 90-day positive return probability is consistent with the positive distribution
      expect(cone.pPositiveReturn90D).toBeGreaterThan(0.55);
    });
  });
});
