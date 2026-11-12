import { describe, it, expect } from 'vitest';
import { buildForecastModelSSOT } from '../domain/quant/forecastModelSSOT';
import { runBacktest } from '../domain/quant/backtester';
import { CANONICAL_FORECAST_LEDGER, verifyLedgerChain } from '../domain/quant/forecastLedger';

describe('2.4 Real Performance Benchmark via performance.now()', () => {
  it('benchmarks ForecastModelSSOT build time to be < 1.0 ms per run', () => {
    // Warm up
    for (let i = 0; i < 20; i++) {
      buildForecastModelSSOT({ currentPrice: 74140 });
    }

    const iterations = 100;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      buildForecastModelSSOT({
        currentPrice: 74140 + (i % 50),
        floorSma200w: 68150,
        realizedPrice: 53950,
        limit1Price: 71800,
        limit2Price: 70150,
      });
    }
    const end = performance.now();
    const avgMs = (end - start) / iterations;

    console.log(`⚡ ForecastModelSSOT avg: ${avgMs.toFixed(3)} ms/run`);
    expect(avgMs).toBeLessThan(1.0); // well within 1ms
  });

  it('benchmarks Backtester 3Y weekly simulation to be < 15.0 ms per run (60 FPS budget)', () => {
    // Warm up
    for (let i = 0; i < 5; i++) {
      runBacktest({
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
      });
    }

    const iterations = 30;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      runBacktest({
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
      });
    }
    const end = performance.now();
    const avgMs = (end - start) / iterations;

    console.log(`⚡ Backtester 3Y weekly avg: ${avgMs.toFixed(3)} ms/run`);
    expect(avgMs).toBeLessThan(15.0); // well within 16.6ms frame budget
  });

  it('benchmarks Ledger Hash Chain Verification to be < 0.1 ms per run', () => {
    const iterations = 200;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      verifyLedgerChain(CANONICAL_FORECAST_LEDGER);
    }
    const end = performance.now();
    const avgMs = (end - start) / iterations;

    console.log(`⚡ Ledger Chain verification avg: ${avgMs.toFixed(4)} ms/run`);
    expect(avgMs).toBeLessThan(0.1);
  });
});
