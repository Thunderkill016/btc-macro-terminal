# DATA SOURCES CATALOG: BITCOIN ALPHA v5.1

**Last Updated:** November 2026  
**Operating Principle:** Strict data provenance, $0/month infrastructure cost guarantee, zero mock disguised as live, transparent fallback indicators.

---

## 1. Overview & Data Provenance Matrix

Every scalar, metric, and time series displayed on the Bitcoin Alpha terminal is classified into one of three provenance states:
1. **LIVE FEED:** Real-time or low-latency REST/WebSocket feed directly from primary exchange or data provider.
2. **CACHED / EXPANDING SNAPSHOT:** Statically synced or cached historical time series updated daily with immutable timestamps.
3. **SURVEY / BENCHMARK (MẪU / KHẢO SÁT):** Secondary benchmark data (e.g. ETF flows, FRED M2, SJC Gold) clearly marked with a visual badge `[📊 Dữ Liệu Mẫu / Khảo Sát Benchmark - Chưa Có Feed API Trực Tiếp]`.

---

## 2. Comprehensive Data Source Inventory

| Provider / Endpoint | Data Stream | Terms of Service | Rate Limit / Quota | Latency | Cost | Provenance State |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Binance Public Spot API**<br>`api.binance.com/api/v3/ticker/24hr`<br>`api.binance.com/api/v3/klines` | Spot BTC/USDT price, 24h High/Low, Volume, 1D/1W Candlesticks (since 2017) | Free public API, no key required for public market data | 1,200 weight/min per IP | Real-time (WebSocket / 1s poll) | $0/month | **LIVE FEED** |
| **Binance Futures Public API**<br>`fapi.binance.com/fapi/v1/fundingRate`<br>`fapi.binance.com/fapi/v1/openInterest` | BTCUSDT Perpetual Funding Rate, Open Interest, Liquidation Streams | Free public API | 2,400 weight/min per IP | Real-time (WebSocket / 3s poll) | $0/month | **LIVE FEED** |
| **Deribit Options Public API**<br>`deribit.com/api/v2/public/get_volatility_index_data` | Deribit Bitcoin Implied Volatility Index (DVOL Index), Options Skew | Free public API, non-commercial research compliant | Non-strict public quota (~20 req/s) | 1-minute snapshots / Daily | $0/month | **LIVE FEED & CACHE** |
| **Alternative.me Crypto Fear & Greed**<br>`api.alternative.me/fng/?limit=30` | Crypto Sentiment Index (0–100), Historical 30-day series | Free public REST API, attribution requested | Generous public quota | Updated daily at 00:00 UTC | $0/month | **LIVE FEED** |
| **CoinMetrics Community API**<br>`api.coinmetrics.io/v4/timeseries/asset-metrics` | Historical On-Chain Mayer Multiple, MVRV, STH/LTH Realized Price | Free Community Tier | 100 requests / 10 minutes | Daily close (T+1) | $0/month | **CACHED SNAPSHOT** |
| **Federal Reserve Bank of St. Louis (FRED)**<br>`fred.stlouisfed.org` (WM2NS, DFII10, DTWEXBGS, T10Y2Y, WALCL) | U.S. M2 Money Supply, 10-Year Real Yield, Broad Dollar Index (DXY), Fed Balance Sheet | Free public access (API key optional for high rate) | 120 requests/min with free key | Weekly / Monthly official releases | $0/month | **BENCHMARK / MẪU** |
| **Farside Investors / Newhedge**<br>`farside.co.uk/btc` / `newhedge.io` | US Spot Bitcoin ETF net flows by ticker (IBIT, FBTC, GBTC, etc.), cumulative BTC holdings | Public web tables / research aggregate | Crawled / manual daily benchmark | Daily close post-market (T+1) | $0/month | **BENCHMARK / MẪU** |
| **Mempool.space API**<br>`mempool.space/api/v1/fees/recommended` | Bitcoin mempool gas fee estimates (sat/vB for UTXO consolidation) | Open source public API | 10 req/s | Real-time (<5s) | $0/month | **LIVE FEED** |
| **Bitstamp / Historical Seed** | Long-term BTC historical price seed from Genesis (2011 to 2017) | Free public historical archives | Pre-compiled static bundle | Static immutable archive | $0/month | **CACHED ARCHIVE** |
| **BGeometrics (Optional Tier)**<br>`portal.bgeometrics.com` | On-chain STH/LTH cost basis, SOPR, NUPL | Free tier: 10 req/h, 15 req/day; Advanced tier: $18/month | Free tier compliant | Hourly / Daily | $0 (Free) or $18/mo | **OPTIONAL LIVE** |
| **SJC Gold & State Bank of Vietnam** | SJC physical gold price (bid/ask), commercial bank savings deposit interest rate (6.5%/yr) | Public survey rates | Static benchmark updated monthly | Monthly survey | $0/month | **BENCHMARK / MẪU** |

---

## 3. Rate Limit Management & Redundancy

1. **Client-Side Deduplication & In-Memory Cache:** All network requests are cached with TTLs matching the data source cadence:
   - Live Ticker: 2 seconds TTL.
   - Candlesticks: 60 seconds TTL.
   - Funding & Derivatives: 30 seconds TTL.
   - Sentiment (Fear & Greed): 30 minutes TTL.
   - Macro & On-Chain: 24 hours TTL.
2. **WebSocket Fallback Watchdog:** If the Binance WebSocket connection disconnects or experiences silent dropouts (>10 seconds without tick), the system automatically degrades to authenticated REST polling with exponential backoff.
3. **Zero Leaked API Credentials:** Public endpoints are accessed without credentials. User Binance API keys (read-only) are encrypted client-side using PBKDF2 (600,000 iterations) + AES-256-GCM and stored only in browser `localStorage`, never sent to Cloudflare or logged.
