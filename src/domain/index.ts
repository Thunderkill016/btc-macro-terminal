/**
 * ==============================================================================
 * BITCOIN ALPHA TERMINAL — DOMAIN LAYER
 * Clean Architecture (Robert C. Martin) & Quantitative Desk Standard
 *
 * Rules:
 * 1. PURE functional TypeScript logic only.
 * 2. ZERO external I/O (no fetch, no websocket, no localStorage, no window).
 * 3. Zero framework coupling (no React, no Zustand hooks).
 * ==============================================================================
 */

export * from './quant/quantEngine';
export * from './quant/cycleModelMath';
export * from './quant/backtester';
export * from './quant/quantForecastingEngine';
export * from './quant/forecastModelSSOT';
export * from './quant/leakageAudit';
export {
  CANONICAL_FORECAST_LEDGER,
  computeLedgerHash,
  verifyLedgerChain,
  buildCanonicalForecastLedger,
} from './quant/forecastLedger';
export type {
  OtsProof,
  ForecastLedgerEntry as CanonicalForecastLedgerEntry,
} from './quant/forecastLedger';
export * from './models/derivativesMicrostructure';
export * from './models/portfolio';
