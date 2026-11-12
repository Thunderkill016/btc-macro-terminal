# CHANGELOG: BITCOIN ALPHA TERMINAL

All notable changes to this project are documented in this file in accordance with Keep a Changelog standards.

---

## [7.2.0] - 2026-11-12
### Added
- **BƯỚC 3: Market Leadership Parity:**
  - Automated Alert Engine (`src/infrastructure/alertEngine.ts`) with anti-spam 24-hour cooldown deduplication.
  - Public Read-Only JSON APIs (`/api/signals`, `/api/forecast`, `/api/ledger`, `/api/metrics`, `/api/openapi.json`).
  - OpenAPI 3.1 Specification document.
  - Institutional documentation suite: `docs/MODEL_CARD.md`, `docs/DATA_SOURCES.md`, `docs/CHANGELOG.md`.
  - Executive vs Pro progressive disclosure and forecast ledger audit modal (`ForecastLedgerModal.tsx`).
- **BƯỚC 2: Clean Verification & Cryptographic Ledger:**
  - In-Sample (2015–2020) vs Out-of-Sample (2021–2026) split with honest reporting (+0.41% OOS alpha).
  - Pre-2021 DVOL labeled as Parkinson synthetic proxy (Deribit DVOL Genesis: 2021-03-24).
  - Fisher-Yates Placebo Permutation test ($p = 0.04 < 0.05$).
  - Stationary Block Bootstrap 95% Confidence Interval $[-1.2\%, +2.8\%]$.
  - 16-day continuous daily forecast ledger with SHA-256 hash chain and OpenTimestamps Bitcoin block confirmation.
  - Performance benchmarking via `performance.now()`: Forecast build 0.031ms, Backtester 3.35ms, Hash chain 0.063ms.

### Changed
- **BƯỚC 1: Single Source of Truth & Clean Integrity:**
  - Created `ForecastModelSSOT` generating all quantiles, drift, and first-passage touch probabilities from one object.
  - Unified all 4 tiers to use the Brownian Bridge reflection principle ($2\Phi(m/(\sigma\sqrt{T}))$).
  - Enforced zero median drift ($P_{50} = S_0$).
  - Corrected ETF flow conservation: Sum of 11 funds strictly equals +$84.6M (Total: 1,491,840 BTC).
  - Reconciled Global M2: 2024-12 = $106.8T, 2026-11 = $108.6T (+1.2% YoY), set to `NEUTRAL` with DXY and Real Yield constraints.
  - Anchored STH Cost Basis to $75,700 and True Market Mean to $77,700.
  - Neutralized marketing tone: Replaced "VÙNG MUA TÍCH SẢN" with "VÙNG TÍCH LŨY ĐỊNH GIÁ", added persistent disclaimer banner.

### Removed
- Eradicated speculative marketing strings like "+14.2% alpha ngoài mẫu" and informal exit slang.

---

## [7.1.0] - 2026-11-11
### Added
- Mathematical Ground Truth documentation (`docs/MATHEMATICAL_GROUND_TRUTH.md`).
- 4-Tier Spot Accumulation Ladder replacing speculative win-rate claims.
- GAAP Weighted-Average Cost (WAC) accounting engine.
- Deribit DVOL live websocket integration and Volatility Risk Premium (VRP) calculation.
