# BITCOIN ALPHA TERMINAL v7.0 SOVEREIGN ARCHITECTURAL BLUEPRINT
## Clean Architecture & Multi-Rate State Separation Standards
**Architect:** Principal Quantitative Researcher & Lead Systems Architect  
**Standard:** Robert C. Martin Clean Architecture × High-Frequency Quantitative Desk Standards  
**Last Updated:** November 2026

---

## 1. Executive Architectural Summary

The Bitcoin Alpha Terminal is an institutional quantitative macroeconomic workstation designed for sovereign capital preservation and calibrated Bitcoin accumulation. To guarantee deterministic mathematical execution, zero UI freeze during heavy Monte Carlo / Cornish-Fisher expansions, and sub-millisecond reaction to 1Hz WebSocket price spikes, the codebase strictly adheres to **Clean Architecture (Robert C. Martin)** and **Multi-Rate Frequency-Isolated State Separation**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PRESENTATION LAYER                                      │
│   Zone 1 (Hero Bento)   •   Zone 2 (Dual Canvas Studio)   •   Zone 3 (Radar Matrix)     │
│   Atomic Primitives: BentoCard  •  MetricValue (tabular-nums)  •  StatusPill            │
└───────────────────────────────────────────▲────────────────────────────────────────────┘
                                            │ State Selectors
┌───────────────────────────────────────────┴────────────────────────────────────────────┐
│                             APPLICATION & STATE LAYER                                   │
│  ┌────────────────────────────────────┐    ┌────────────────────────────────────────┐  │
│  │    useTickerStore (1Hz / High-Freq)│    │   useQuantTerminalStore (Low-Freq)     │  │
│  │    • Spot Price (Binance WS)       │    │   • Multi-Cycle Models (Power Law)     │  │
│  │    • 24h Change & Price Direction  │    │   • Portfolio Ledger & PnL Engine      │  │
│  │    • 1Hz Heartbeat & Stale Guard   │    │   • Monte Carlo / Cornish-Fisher Cone  │  │
│  └────────────────────────────────────┘    │   • Modal States & User Preferences    │  │
│                       ▲                    └───────────────────▲────────────────────┘  │
│                       │ Facade Bridge                          │                        │
│                       └──────────────────┬─────────────────────┘                        │
│                                          │                                              │
│                                 useTerminalStore (Facade)                               │
└──────────────────────────────────────────▲──────────────────────────────────────────────┘
                                           │ Dispatches heavy econometric tasks
┌──────────────────────────────────────────┴──────────────────────────────────────────────┐
│                                  WEB WORKER LAYER                                       │
│                       Dedicated Off-Main-Thread quantWorker.ts                           │
│  • PAVA Isotonic Regression • Cornish-Fisher Expansion • Mixture Volatility (EWMA + GK) │
└──────────────────────────────────────────▲──────────────────────────────────────────────┘
                                           │ Pure Math Invocation
┌──────────────────────────────────────────┴──────────────────────────────────────────────┐
│                                   DOMAIN LAYER                                          │
│   src/domain/quant/cycleModelMath.ts       •   src/domain/quant/quantEngine.ts          │
│   src/domain/quant/backtester.ts           •   src/domain/models/portfolio.ts           │
│   src/domain/models/derivativesMicrostructure.ts                                        │
│   * Rules: ZERO React, ZERO Zustand, ZERO I/O, ZERO DOM/window, PURE Deterministic TS    │
└──────────────────────────────────────────▲──────────────────────────────────────────────┘
                                           │ Normalized DTOs
┌──────────────────────────────────────────┴──────────────────────────────────────────────┐
│                               INFRASTRUCTURE LAYER                                      │
│  src/infrastructure/websocket/binanceWebSocket.ts (Binance 1Hz wss stream)              │
│  src/infrastructure/orderbook/binanceOrderbook.ts ($25 Bin Aggregator & 30D VPVR)       │
│  src/infrastructure/api/derivativesRest.ts (Futures Microstructure & Deribit DVOL)      │
│  src/infrastructure/api/realDataService.ts (Mempool.space, CoinMetrics, Binance REST)   │
│  src/infrastructure/security/webCryptoVault.ts (AES-256-GCM + PBKDF2 600k Zero-Know)    │
└──────────────────────────────────────────▲──────────────────────────────────────────────┘
                                           │ Public Network I/O
                                     PUBLIC REST & WSS
                   (Binance, Deribit, Mempool.space, CoinMetrics)
```

---

## 2. Strict 4-Layer Separation of Concerns

### 2.1. Domain Layer (`src/domain/`)
The inner core contains all pure mathematical formulas, business rules, and valuation models:
- **`src/domain/quant/cycleModelMath.ts`**: Pure mathematical equations for Santostasi Power Law Fair Value ($10^{-17.015} \cdot t^{5.845}$), 200-Week Simple Moving Average, Mayer Multiple, Puell Multiple, and Pi Cycle Top.
- **`src/domain/quant/quantEngine.ts`**: Calibrated multi-pillar Confluence Engine ($0–100$), Cornish-Fisher expansion ($S \in [-1.25, +1.25], K \in [0.0, 3.50]$), and RiskMetrics EWMA ($\lambda=0.94$) + Garman-Klass volatility blend.
- **`src/domain/quant/backtester.ts`**: Non-Normal Sortino Ratio, Calmar Ratio, Marcos López de Prado Probabilistic Sharpe Ratio (PSR), and Deflated Sharpe Ratio (DSR) multiple-trial backtester.
- **`src/domain/models/portfolio.ts`**: Pure portfolio accumulation milestones, dollar-cost-averaging cost-basis dilution forecaster (`calculateAccumulationForecast`), and transaction summary math.
- **`src/domain/models/derivativesMicrostructure.ts`**: Perp basis BPS, Whale vs. Retail Long/Short delta, and 4-state orderflow regime classifier (`SPOT_DRIVEN_ACCUMULATION`, `PERP_DRIVEN_SPECULATION`, `SHORT_SQUEEZE_EXPANSION`, `LONG_LIQUIDATION_FLUSH`).

> [!IMPORTANT]
> **Domain Layer Architectural Guardrail:**
> Domain modules MUST remain 100% pure TypeScript. Importing `React`, `zustand`, `window`, `localStorage`, `document`, or calling `fetch()` inside `src/domain/` is strictly prohibited.

---

### 2.2. Infrastructure Layer (`src/infrastructure/`)
Isolates all external side effects, public I/O gateways, and cryptographic hardware:
- **`src/infrastructure/websocket/binanceWebSocket.ts`**: Resilient 1Hz WebSocket client with heartbeat watchdog (`PING/PONG`), automatic failover, and stale connection detection (`isStale`).
- **`src/infrastructure/orderbook/binanceOrderbook.ts`**: Deep orderbook depth scanner (`limit=1000`) with `$25` bin aggregation and 30-day hourly Volume Profile (VPVR) High-Volume Node (HVN) identification.
- **`src/infrastructure/api/derivativesRest.ts`**: Public Binance Futures microstructure endpoints (`openInterestHist`, `topLongShortPositionRatio`, `takerlongshortRatio`) and Deribit DVOL Volatility Risk Premium (VRP) fetchers.
- **`src/infrastructure/api/realDataService.ts`**: Multi-endpoint public data fetcher for Binance daily candles, Mempool.space fees/mining hashrate, and CoinMetrics realized price.
- **`src/infrastructure/security/webCryptoVault.ts`**: Zero-knowledge client-side hardware security module implementing AES-256-GCM authenticated encryption and PBKDF2 key derivation with 600,000 iterations and 32-byte salts (OWASP 2026 standard).

---

### 2.3. Application & State Layer (`src/store/`)
The state layer enforces **Multi-Rate State Separation** to eliminate rendering bottlenecks:

1. **High-Frequency Store (`src/store/useTickerStore.ts`):**
   - **Update Frequency:** ~1Hz (sub-second live price ticks from Binance WebSocket).
   - **Payload:** `price`, `priceVnd`, `change24h`, `priceDirection`, `isLiveConnected`, `isStale`.
   - **Isolation Benefit:** Components subscribing to `useTickerStore` re-render in `<0.5ms` without triggering expensive re-renders in charts, radar matrixes, or Monte Carlo probability cones.

2. **Low-Frequency Store (`src/store/useQuantTerminalStore.ts`):**
   - **Update Frequency:** Event-driven on daily candle close, manual user refresh, scenario preset switch, or DCA budget adjustment.
   - **Payload:** Historical candle arrays, multi-cycle regression models, portfolio ledger transactions, backtest results, and UI modal states.
   - **Isolation Benefit:** Eliminates recalculation loops and guarantees that heavy econometrics run only when new structural market data arrives.

3. **Unified Facade Store (`src/store/useTerminalStore.ts`):**
   - Implements the Facade Pattern to provide 100% backward compatibility for all existing UI components and test suites.
   - Dispatches ticker updates to `useTickerStore` and delegates low-frequency operations to `useQuantTerminalStore`.

---

### 2.4. Presentation Layer (`src/components/`)
A declarative, zero-econometric-math UI designed around the **Fey × Linear × Vercel Geist Obsidian Design System** (`#05070B` canvas, `#0A0E17` Bento containers, `border-white/[0.06]` specular hairlines, 85-12-3 color discipline):

- **Atomic Primitives (`src/components/primitives/`):**
  - `BentoCard.tsx`: Standardized container with specular hairline borders, backdrop blur, and optional headers/badges.
  - `MetricValue.tsx`: High-contrast institutional typography enforcing `font-mono tabular-nums` for numbers, deltas, and currency formats.
  - `StatusPill.tsx`: Semantic badge system (`bullish`, `bearish`, `warning`, `neutral`, `cyan`, `purple`) with glowing pulsating status dots.
- **Strict 3-Zone Bento Architecture on Tab 1:**
  - **Zone 1 (`AppleDailySignalHero.tsx`):** Executive decision and tactical execution (Macro Regime Compass, Forward Probabilistic Cone, Half-Kelly Execution Ticket, and Personal Stacking Forecaster).
  - **Zone 2 (`AppleCycleChart.tsx`):** Dual-Canvas Lightweight Charts studio (`2011–2026` multi-cycle log-scale canvas + synchronized oscillator sub-pane).
  - **Zone 3 (`AppleCyclePeakRadar.tsx`):** 4-Tab Institutional Matrix (Peak Radar, Forward Cone, Downside Risk & VRP/Liquidation, Halving/Energy Value).

---

## 3. End-to-End Data Pipeline

The data flow from raw external networks to visual pixels follows a strict deterministic pipeline:

```
[1] Raw Public APIs (api.binance.com, mempool.space, deribit.com)
         │
         ▼
[2] Infrastructure Gateways (fetchRealData, binanceOrderbook, derivativesRest)
         │  • Schema parsing & validation
         │  • Stale checks & network failover
         ▼
[3] Web Worker Off-Main-Thread Dispatch (quantWorkerClient)
         │  • Non-blocking background thread
         │  • PAVA isotonic calibration, EWMA/GK volatility, Cornish-Fisher expansion
         ▼
[4] Normalized Domain Models (ConfluenceAccumulationResult, PortfolioSummary)
         │
         ▼
[5] Frequency-Isolated Stores (useTickerStore @ 1Hz, useQuantTerminalStore @ event)
         │
         ▼
[6] Declarative React Presentation (3-Zone Bento UI with atomic primitives)
```

---

## 4. Verification & Testing Standards

All code modifications must satisfy the **66/66 Automated Verification Suite**:
1. `test_step1_p0_verification.cjs`: Zero forbidden marketing claims across `src/`, Single Source of Truth selector integrity, OWASP 600k PBKDF2 encryption.
2. `test_step2_p1_quant.cjs`: Monotonic PAVA calibration, walk-forward coverage ($[65\%, 75\%]$), cryptographic hash chaining.
3. `test_step3_p2_verification.cjs`: 4 macro regimes with return distributions, measured hit rates, Smart DCA multiplier bounds ($[0.50, 1.50]$).
4. `test_v6_apex_verification.cjs`: Design tokens (`#05070B`, `#0A0E17`), 3-Zone zero-duplication layout, Web Worker off-main-thread bridge.
5. `test_v7_sovereign_verification.cjs`: Deep orderbook ($1000$ limit, $\$25$ bins), 30D hourly VPVR, Binance Futures microstructure endpoints, RiskMetrics EWMA ($\lambda=0.94$).
6. `test_v8_global_benchmark.cjs`: Deribit DVOL & VRP, liquidation cluster zones, Cointime economics, Capriole Energy Value, López de Prado PSR/DSR.
7. `npm run build`: Zero TypeScript compilation errors and production Vite bundle optimization.
8. `e2e_v7_sovereign_browser.cjs`: Complete Playwright browser testing with zero visual regressions.
