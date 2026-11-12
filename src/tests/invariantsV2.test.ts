import { describe, it, expect } from 'vitest';
import {
  buildForecastModelSSOT,
  computeFirstPassageTouchProbability,
  computeZeroCenteredCornishFisherQuantile,
} from '../domain/quant/forecastModelSSOT';
import { US_SPOT_BITCOIN_ETFS, ETF_AGGREGATE_SUMMARY } from '../data/macroEtfData';
import { runBacktest } from '../domain/quant/backtester';
import { calculateOnChainMetrics } from '../domain/quant/quantEngine';

/**
 * ==============================================================================
 * INVARIANT AUDIT SUITE — VÒNG 2 INSTITUTIONAL INTEGRITY
 * Anchored to:
 * 1. Brownian Bridge First-Passage Reflection Principle (Karatzas & Shreve, 1991)
 * 2. Zero-Drift Martingale Hypothesis for Spot Quantiles
 * 3. US Spot ETF Inflow Conservation Law (Farside / BitMEX Research Benchmark)
 * 4. Backtest Terminal Equity Equality Law
 * 5. Glassnode / CryptoQuant On-Chain Benchmarks (STH Realized & True Market Mean)
 * ==============================================================================
 */

describe('VÒNG 2 INSTITUTIONAL INVARIANT AUDIT', () => {
  const SPOT_PRICE = 74140;

  // ----------------------------------------------------------------------------
  // INVARIANT 1: FORECAST SSOT VOLATILITY CONSISTENCY (|sigma_implied - sigma| <= 1.5%)
  // ----------------------------------------------------------------------------
  describe('Invariant 1: Forecast SSOT Volatility Consistency', () => {
    it('verifies implied volatility derived from 30D [P15, P85] matches displayed sigma within +/- 1.5%', () => {
      const model = buildForecastModelSSOT({
        currentPrice: SPOT_PRICE,
        floorSma200w: 68150,
        realizedPrice: 53950,
        limit1Price: 71800,
        limit2Price: 70150,
      });

      expect(model.invariants.isValid).toBe(true);
      expect(model.invariants.volatilityErrorPct30D).toBeLessThanOrEqual(1.5);
      expect(Math.abs(model.invariants.impliedVol30D - model.annualizedVol)).toBeLessThanOrEqual(1.5);
    });

    it('verifies implied volatility derived from 90D [P15, P85] matches displayed sigma within +/- 1.5%', () => {
      const model = buildForecastModelSSOT({
        currentPrice: SPOT_PRICE,
      });

      const zCF85 = computeZeroCenteredCornishFisherQuantile(0.85, model.skewness, model.excessKurtosis);
      const zCF15 = computeZeroCenteredCornishFisherQuantile(0.15, model.skewness, model.excessKurtosis);
      const deltaZCF = zCF85 - zCF15;
      const tYears = 90 / 365;
      const p15 = model.quantiles90D.p15;
      const p85 = model.quantiles90D.p85;
      const impliedVol90D = (Math.log(p85 / p15) / (deltaZCF * Math.sqrt(tYears))) * 100;

      const diff = Math.abs(impliedVol90D - model.annualizedVol);
      expect(diff).toBeLessThanOrEqual(1.5);
    });
  });

  // ----------------------------------------------------------------------------
  // INVARIANT 2: ZERO MEDIAN DRIFT HYPOTHESIS (P50 === S0)
  // ----------------------------------------------------------------------------
  describe('Invariant 2: Zero Median Drift Invariant', () => {
    it('guarantees P50 equals current price exactly across 7D, 30D, and 90D horizons', () => {
      const model = buildForecastModelSSOT({
        currentPrice: SPOT_PRICE,
      });

      expect(model.quantiles7D.p50).toBe(SPOT_PRICE);
      expect(model.quantiles30D.p50).toBe(SPOT_PRICE);
      expect(model.quantiles90D.p50).toBe(SPOT_PRICE);
      expect(model.invariants.medianDriftPct30D).toBe(0);
      expect(model.invariants.medianDriftPct90D).toBe(0);
    });
  });

  // ----------------------------------------------------------------------------
  // INVARIANT 3: ETF FLOW CONSERVATION LAW
  // ----------------------------------------------------------------------------
  describe('Invariant 3: US Spot Bitcoin ETF Flow Conservation', () => {
    it('verifies sum of individual ETF 24h flows matches aggregate net inflow ($84.6M) within 0.1M', () => {
      const sumIndividualFlows = US_SPOT_BITCOIN_ETFS.reduce(
        (acc, etf) => acc + etf.flow24hMillionsUSD,
        0
      );

      const targetFlow = ETF_AGGREGATE_SUMMARY.dayNetInflowMillionsUSD; // 84.6
      expect(Math.abs(sumIndividualFlows - targetFlow)).toBeLessThan(0.01);
      expect(sumIndividualFlows).toBeCloseTo(84.6, 2);
    });

    it('verifies aggregate ETF BTC holdings exceed 1.49M BTC with IBIT as dominant sovereign holder', () => {
      const ibit = US_SPOT_BITCOIN_ETFS.find((e) => e.ticker === 'IBIT');
      expect(ibit).toBeDefined();
      expect(ibit!.btcHoldings).toBeGreaterThan(900_000); // 920,770 BTC

      const totalBtc = US_SPOT_BITCOIN_ETFS.reduce((acc, e) => acc + e.btcHoldings, 0);
      expect(totalBtc).toBeGreaterThan(1_490_000); // 1,491,840 BTC
    });
  });

  // ----------------------------------------------------------------------------
  // INVARIANT 4: BACKTESTER TERMINAL TIMELINE EQUITY EQUALITY
  // ----------------------------------------------------------------------------
  describe('Invariant 4: Backtester Final Timeline Valuation Equality', () => {
    it('guarantees timeline[last].btcValue strictly equals activeFinalBtcValue in monthly sampling', () => {
      const resultMonthly = runBacktest(
        {
          startDate: '2023-01-01',
          endDate: '2026-01-01',
          monthlyBudgetUsd: 500,
          strategy: 'DYNAMIC_CONFLUENCE_DCA',
          frequency: 'monthly',
          exchangeFeeRate: 0.001,
          p2pSpreadRate: 0.005,
          sjcGoldAnnualReturn: 0.142,
          sjcPhysicalSpread: 0.015,
          vndBankAnnualRate: 0.06,
          vndInflationRate: 0.038,
        },
        []
      );

      const timeline = resultMonthly.timeline;
      expect(timeline.length).toBeGreaterThan(0);
      const lastPoint = timeline[timeline.length - 1];

      expect(lastPoint.btcValue).toBe(resultMonthly.btcPortfolio.currentValueUsd);
      expect(lastPoint.fixedBtcValue).toBe(resultMonthly.btcPortfolio.standardCurrentValueUsd);
    });

    it('guarantees timeline[last].btcValue strictly equals activeFinalBtcValue in weekly sampling', () => {
      const resultWeekly = runBacktest(
        {
          startDate: '2023-01-01',
          endDate: '2026-01-01',
          monthlyBudgetUsd: 500,
          strategy: 'DYNAMIC_CONFLUENCE_DCA',
          frequency: 'weekly',
          exchangeFeeRate: 0.001,
          p2pSpreadRate: 0.005,
          sjcGoldAnnualReturn: 0.142,
          sjcPhysicalSpread: 0.015,
          vndBankAnnualRate: 0.06,
          vndInflationRate: 0.038,
        },
        []
      );

      const timeline = resultWeekly.timeline;
      expect(timeline.length).toBeGreaterThan(0);
      const lastPoint = timeline[timeline.length - 1];

      expect(lastPoint.btcValue).toBe(resultWeekly.btcPortfolio.currentValueUsd);
      expect(lastPoint.fixedBtcValue).toBe(resultWeekly.btcPortfolio.standardCurrentValueUsd);
    });
  });

  // ----------------------------------------------------------------------------
  // INVARIANT 5: ON-CHAIN VALUATION ANCHORS (STH COST BASIS & TRUE MARKET MEAN)
  // ----------------------------------------------------------------------------
  describe('Invariant 5: On-Chain Benchmarks (Glassnode / CryptoQuant)', () => {
    it('verifies Short-Term Holder (STH) cost basis is anchored to $75,700 benchmark', () => {
      const onchain = calculateOnChainMetrics(SPOT_PRICE, 1794454800000);
      expect(onchain.shortTermHolderCostBasis).toBe(75700);
      expect(SPOT_PRICE).toBeLessThan(onchain.shortTermHolderCostBasis!);
    });

    it('verifies True Market Mean is anchored to $77,700 active investor benchmark', () => {
      const onchain = calculateOnChainMetrics(SPOT_PRICE, 1794454800000);
      expect(onchain.trueMarketMeanPrice).toBe(77700);
      expect(onchain.trueMarketMeanPrice!).toBeGreaterThan(onchain.shortTermHolderCostBasis!);
    });
  });

  // ----------------------------------------------------------------------------
  // INVARIANT 6: FIRST-PASSAGE REFLECTION PRINCIPLE PROBABILITIES
  // ----------------------------------------------------------------------------
  describe('Invariant 6: Brownian Bridge Reflection Touch Probabilities', () => {
    it('verifies touch probabilities decrease monotonically with barrier depth for equal horizon', () => {
      const dailyVolDec = (38.7 / 100) / Math.sqrt(365);
      const probTier1_7D = computeFirstPassageTouchProbability(SPOT_PRICE, 71800, dailyVolDec, 7);
      const probTier2_7D = computeFirstPassageTouchProbability(SPOT_PRICE, 70150, dailyVolDec, 7);
      const probTierDeep_7D = computeFirstPassageTouchProbability(SPOT_PRICE, 65000, dailyVolDec, 7);

      expect(probTier1_7D).toBeGreaterThan(probTier2_7D);
      expect(probTier2_7D).toBeGreaterThan(probTierDeep_7D);
    });

    it('verifies 4 tiers match analytical first-passage expectations within standard tolerances', () => {
      const model = buildForecastModelSSOT({
        currentPrice: SPOT_PRICE,
        floorSma200w: 68150,
        realizedPrice: 53950,
        limit1Price: 71800,
        limit2Price: 70150,
      });

      const { tier1, tier2, tier3, tier4 } = model.touchProbabilities;

      // Tier 1 (-3.1%, 7D): ~55%
      expect(tier1.touchProbabilityPercent).toBeGreaterThan(45);
      expect(tier1.touchProbabilityPercent).toBeLessThan(65);

      // Tier 2 (-5.4%, 7D): ~30%
      expect(tier2.touchProbabilityPercent).toBeGreaterThan(20);
      expect(tier2.touchProbabilityPercent).toBeLessThan(40);

      // Tier 3 (-8.1%, 90D): ~66%
      expect(tier3.touchProbabilityPercent).toBeGreaterThan(55);
      expect(tier3.touchProbabilityPercent).toBeLessThan(75);

      // Tier 4 (-27.2%, 90D): ~10%
      expect(tier4.touchProbabilityPercent).toBeGreaterThan(5);
      expect(tier4.touchProbabilityPercent).toBeLessThan(20);
    });
  });
});
