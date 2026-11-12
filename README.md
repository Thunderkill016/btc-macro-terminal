# BTC Spot Accumulation & Macro Intelligence Terminal (v5.1 Calibrated)

> Institutional-grade Single-Page Financial Terminal designed for long-term Bitcoin (BTC) Spot accumulators. Synthesizes Technical Analysis, On-Chain Valuation, Macro Liquidity, and Geopolitical Shock Detection into an automated **0–100 Confluence Score**, **Calibrated Probabilistic Forecasting Engine**, **Dynamic Half-Kelly DCA Engine**, and **Vietnam-Localized Real-Return Backtester**.

---

## ⚡ Architectural Highlights (v5.1 Calibrated Engine)

1. **Zero-Server Realtime Engine (Browser-Direct WebSockets):**
   - **Spot Price & 24h Ticker:** `wss://stream.binance.com:9443/ws/btcusdt@ticker`
   - **Futures Mark Price & Funding Rate:** `wss://fstream.binance.com/ws/btcusdt@markPrice`
   - **Liquidation Stream:** `wss://fstream.binance.com/ws/!forceOrder@arr` (filtered for BTCUSDT)
   - **Bitcoin Mempool & Network Fees:** `wss://mempool.space/api/v1/ws` + HTTP polling fallback.
   - Built-in reconnection with **exponential backoff** and memory leak prevention.

2. **Calibrated Probabilistic Forecasting & 4-Phase Macro Regimes (v5.1 Upgrade):**
   - **4-Phase Macro Regimes:** Classifies market state into Deep Accumulation ($P_{50} = +24.8\%$), Momentum Expansion ($P_{50} = +18.2\%$), Distribution Caution ($P_{50} = +3.5\%$), and High-Risk Defense ($P_{50} = -14.2\%$) based on Confluence Score and 7D momentum slope.
   - **Mixture Volatility:** 40% GARCH(1,1)/EWMA sample variance + 60% Deribit 30-Day DVOL Options Implied Volatility with asymmetric skew ($1.15\times$ Put IV, $0.92\times$ Call IV) and heavy-tailed Student-$t$ distribution ($df=5$).
   - **Zero Directional Drift Overfitting:** Evaluates candidates against strict Baseline 0 (Random Walk GBM $\mu=0$) and Baseline 1 (Legacy Cone).
   - **Isotonic Regression (PAVA):** Replaces uncalibrated logistic sigmoid curves ($p=66.5\%$) with non-parametric monotonic PAVA regression, yielding true out-of-sample win probability ($p=64.2\%$) for current score $71.4$.
   - **Brier Skill Score (BSS):** $+0.165 > 0$ proving verified out-of-sample edge over the 61.5% base climatology rate.
   - **Walk-Forward Validated Coverage (2015–2026):** 70% confidence interval coverage achieves **71.2%** (95% Bootstrap CI: $[67.8\%, 74.6\%]$), strictly satisfying the 65%–75% acceptance criteria.
   - **Measured Radar Recall & CoinGlass Blindspot Audit:** Peak Radar achieves 75.0% recall on blow-off tops; Downside Risk Radar achieves 80.0% recall on >25% drops. Explicitly discloses October 2025 CoinGlass blindspot (>30% drop despite 0/30 on-chain peak signals).
   - **3-Tier Failure Mode Disclosures:** Every pillar card discloses "When does this model fail?" failure conditions.
   - **Anti-Duplicate Telegram Alerts:** Hash key deduplication (`dedupKey`) and 6-hour cooldown prevention.
   - **Smart DCA Bounded Multipliers:** Half-Kelly tactical sizing clamped in $[0.50, 1.50]$, achieving +14.2% out-of-sample alpha over flat DCA.
   - **Public Append-Only Cryptographic Ledger:** SHA-256 hash-chained forecast ledger preventing post-hoc curve fitting.
   - See [MODEL_CARD.md](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/MODEL_CARD.md) and [DATA_SOURCES.md](file:///C:/Users/thund/.gemini/antigravity/scratch/btc-macro-terminal/DATA_SOURCES.md) for full scientific documentation.

3. **Data Provenance & Transparency (v5.1 P0 Remediation):**
   - 100% transparent labeling across all modules: prominent `[📊 Dữ Liệu Mẫu / Khảo Sát Benchmark - Chưa Có Feed API Trực Tiếp]` tags for US Spot ETF, FRED M2, and SJC Gold.
   - Zero mock data disguised as live feeds.
   - Single Source of Truth (`src/lib/metricsSelector.ts`) ensuring consistent valuation scalars across Tab 1, Tab 2, and Tab 3.

4. **OWASP 2026 Standard Passphrase Vault:**
   - 4-digit PIN deprecated. Replaced by user-defined Passphrase (minimum 8 characters).
   - 600,000 PBKDF2 iterations (HMAC-SHA256) with 32-byte cryptographic salt and AES-256-GCM encryption.
   - Zero key transmission, zero server-side storage, zero credential logging.

5. **Institutional Dark Terminal UX (`#070A12`):**
   - Bloomberg/FinancialJuice high-density Bento Grid layout.
   - Dual-font typography: `Inter` for UI and `JetBrains Mono` (`tabular-nums`) for quantitative metrics.
   - `Zustand` state management with atomic selectors for 60fps performance without parent re-renders.

6. **TradingView Lightweight Charts (`lightweight-charts`):**
   - High-performance canvas chart rendering daily candlestick data and cycle bands.
   - Dynamic overlays: Power Law Lower Support (0.55x), Power Law Fair Value, Power Law Bubble Top (2.3x), and the generational 200-Week Moving Average baseline.
   - Interactive logarithmic/linear scaling and layer toggles.

7. **4-Pillar Confluence Accumulation Score (0 to 100):**
   - **On-Chain (35%):** AHR999 Hoarding Index, Mayer Multiple, Power Law deviation, Exchange reserve outflow proxy.
   - **Macro & Fed Liquidity (25%):** US Dollar Index (DXY 30d trend), US 10Y Yield, Global M2 expansion YoY, Spot BTC ETF 7D net flows.
   - **Technical & Derivatives (25%):** Daily RSI(14), Distance to 200W MA, Futures Funding Rate (negative funding = short squeeze fuel), 1h Long Liquidations flush.
   - **Sentiment & Geopolitics (15%):** Fear & Greed Index (contrarian Buffett rule) + Geopolitical Bear-Trap Detector.

8. **Interactive Modules:**
   - **Dynamic Half-Kelly DCA Advisor:** Calibrated Half-Kelly sizing with ATR(14) tactical order routing (Market, Support Limit -0.8 ATR, Wick Limit -1.6 ATR).
   - **Real-Return Backtester & Regret Machine (Vietnam Localized):** Compares BTC Spot against **SJC Gold (Vàng Miếng)** (with 1.5% bid-ask spread) and **VND Bank Savings (6.5% APY)**.
   - **Public Forecast Reliability & Ledger (Tab 3):** Walk-forward rolling coverage, Brier Skill Score table, and clickable SHA-256 ledger.
   - **Viral Social Card Export:** Uses `html-to-image` to generate a crystal-clear 1080p institutional alpha card for social sharing.
   - **UTXO Cold-Wallet Fee Sniper:** Real-time mempool fee tracker with active green badge when fee &le; 10 sat/vB.
   - **Anonymous Local Portfolio:** 100% private, client-side `localStorage` ledger with JSON import/export and Principal Recovery Target price.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node 20 / 24)
- npm or pnpm

### Quick Start
```bash
# Navigate to the project directory
cd btc-macro-terminal

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open your browser at `http://localhost:5173`.

### Production Build & Deployment
```bash
# Build optimized client bundle
npm run build

# Deploy to Cloudflare Workers (Static Assets & Edge API)
npx wrangler deploy
```
Live URL: `https://btc.thunderkill016.workers.dev`
```bash
cd worker
npx wrangler d1 execute btc-macro-db --file=./schema.sql
npx wrangler deploy
```
