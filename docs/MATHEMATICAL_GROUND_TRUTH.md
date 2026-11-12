# MATHEMATICAL GROUND TRUTH & AUTHORITATIVE REFERENCE FORMULAS
## Quantitative Valuation Models, On-Chain Metrics & Portfolio Accounting
**Repository:** `btc-macro-terminal`  
**Standard:** Open-Source Whitepapers & Peer-Reviewed Quantitative Financial Engineering  
**Version:** 7.1 Ground Truth Locked  
**Last Updated:** November 2026

---

## 1. Executive Ground Truth Policy

All mathematical valuation indicators, on-chain cycle models, and portfolio accounting calculations in `btc-macro-terminal` are strictly anchored to published academic literature, open-source reference implementations, and verified industry standards. 

AI-invented heuristics, arbitrary magic multipliers, and non-reproducible composite formulas are strictly prohibited in the core valuation pipeline. Composite models (such as the Multi-Pillar Confluence Score and Continuous Fractional Kelly Execution) are explicitly categorized as **Tactical Execution Helpers** and decomposed into their mathematically proven building blocks (PAVA Isotonic Regression, J.P. Morgan RiskMetrics, and Marcos López de Prado Backtest Statistics).

---

## 2. The 5 Core Spot Valuation Models

### 2.1. Nine Gods AHR999 Hoarding Index (九神囤币指标)
- **Author & Origin:** ahr999 (Nine Gods / ahr999, published 2018–2019 in *囤比特币* / *Holding Bitcoin*).
- **Core Thesis:** Combines short-term moving average acquisition cost (200-day Geometric Mean) with long-term geometric exponential trend fitting (Power Law) to identify deep undervaluation windows and overheated cycle tops.
- **Authoritative Mathematical Formulation:**
  $$\text{DaysSinceGenesis} = \frac{\text{Timestamp}_{\text{ms}} - \text{Epoch}_{\text{Genesis}}}{86{,}400{,}000}$$
  $$\text{Epoch}_{\text{Genesis}} = \text{Date.UTC}(2009, 0, 3, 18, 15, 5) = 1{,}231{,}006{,}505{,}000\text{ ms}$$
  $$\text{GeomMean}_{200\text{D}} = \exp\left(\frac{1}{200} \sum_{i=1}^{200} \ln(P_{\text{close}, i})\right)$$
  $$\text{PowerLawEstimate} = 10^{5.84 \cdot \log_{10}(\text{DaysSinceGenesis}) - 17.01}$$
  $$\text{AHR999} = \left(\frac{P_{\text{spot}}}{\text{GeomMean}_{200\text{D}}}\right) \times \left(\frac{P_{\text{spot}}}{\text{PowerLawEstimate}}\right)$$
- **Canonical Decision Thresholds:**
  - $\text{AHR999} < 0.45$: **Bottom Bargain Zone (抄底区间)** — High conviction lump-sum / aggressive accumulation.
  - $0.45 \le \text{AHR999} \le 1.20$: **Prime DCA Zone (定投区间)** — Sustained disciplined dollar-cost averaging.
  - $1.20 < \text{AHR999} \le 4.00$: **Hold / Wait Zone (等待/起飞区间)** — Cease fresh DCA, maintain cold custody.
  - $\text{AHR999} > 4.00$: **Overheated Top Zone (牛市顶部)** — Historical multi-cycle mania / bubble phase.
- **Reference Implementations & Cross-Check Endpoints:**
  - Bitview Space: `https://bitview.space/ahr999`
  - CheckOnChain: `https://checkonchain.com/btc/macro/ahr999`
  - GitHub Reference: `https://github.com/ahr999/bitcoin`

---

### 2.2. Trace Mayer Multiple
- **Author & Origin:** Trace Mayer (2019).
- **Core Thesis:** Compares current spot price against its 200-day Simple Moving Average ($\text{SMA}_{200\text{D}}$), representing the historical institutional baseline cost.
- **Authoritative Mathematical Formulation:**
  $$\text{SMA}_{200\text{D}} = \frac{1}{200} \sum_{i=1}^{200} P_{\text{close}, i}$$
  $$\text{MayerMultiple} = \frac{P_{\text{spot}}}{\text{SMA}_{200\text{D}}}$$
- **Statistical Benchmark Parameters:**
  - All-Time Historical Mean: $\approx 1.38\text{x}$
  - Undervalued / Accumulation Threshold: $< 1.00\text{x}$ (Spot trading below 200-day trend).
  - Overbought / Historical Cycle Top Threshold: $\ge 2.40\text{x}$ (Occurred in less than 3% of Bitcoin's historical trading days; preceded the 2011, 2013, and 2017 macro peaks).
- **Reference Implementations & Cross-Check Endpoints:**
  - LookIntoBitcoin: `https://www.lookintobitcoin.com/charts/mayer-multiple/`
  - CheckOnChain: `https://checkonchain.com/btc/pricing/mayer-multiple`

---

### 2.3. Philip Swift Pi Cycle Top & 200-Week SMA Floor
- **Author & Origin:** Philip Swift (LookIntoBitcoin, 2019).
- **Core Thesis:** Identifies macro exhaustion points where the fast-moving 111-day moving average crosses above twice the 350-day moving average ($2 \times \text{SMA}_{350\text{D}}$), and establishes the 200-week moving average ($\text{SMA}_{200\text{W}}$) as Bitcoin's generational secular accumulation floor.
- **Authoritative Mathematical Formulation:**
  $$\text{SMA}_{111\text{D}} = \frac{1}{111} \sum_{i=1}^{111} P_{\text{close}, i}$$
  $$\text{SMA}_{350\text{D}\times 2} = 2 \times \left(\frac{1}{350} \sum_{i=1}^{350} P_{\text{close}, i}\right)$$
  $$\text{SMA}_{200\text{W}} = \frac{1}{200} \sum_{w=1}^{200} P_{\text{weekly\_close}, w}$$
- **Signal Logic:**
  - $\text{PiCycleTop Signal} \iff \text{SMA}_{111\text{D}} \ge \text{SMA}_{350\text{D}\times 2}$
  - Historical Accuracy: Detected the exact cycle tops of April 2013, November 2013, December 2017, and April 2021 within $\pm 3$ days.
  - $\text{SMA}_{200\text{W}}$ Floor: Has never been decisively broken for more than several weekly closes in Bitcoin's entire history (2015, 2018, 2020, 2022).
- **Reference Implementations & Cross-Check Endpoints:**
  - LookIntoBitcoin: `https://www.lookintobitcoin.com/charts/pi-cycle-top-indicator/`
  - LookIntoBitcoin: `https://www.lookintobitcoin.com/charts/200-week-moving-average-heatmap/`

---

### 2.4. David Puell's Puell Multiple
- **Author & Origin:** David Puell (Cryptopoiesis, 2019).
- **Core Thesis:** Evaluates Bitcoin miner profitability and supply-side selling pressure by comparing daily miner fiat issuance against its 365-day moving average.
- **Authoritative Mathematical Formulation:**
  $$\text{BlockSubsidy}(t) = \begin{cases} 
  50.000 & t < \text{2012-11-28} \text{ (Epoch 0)} \\
  25.000 & \text{2012-11-28} \le t < \text{2016-07-09} \text{ (Epoch 1)} \\
  12.500 & \text{2016-07-09} \le t < \text{2020-05-11} \text{ (Epoch 2)} \\
  6.250 & \text{2020-05-11} \le t < \text{2024-04-20} \text{ (Epoch 3)} \\
  3.125 & t \ge \text{2024-04-20} \text{ (Epoch 4, Current)}
  \end{cases}$$
  $$\text{DailyIssuanceUSD}(t) = P_{\text{close}}(t) \times 144 \times \text{BlockSubsidy}(t)$$
  $$\text{PuellMultiple}(t) = \frac{\text{DailyIssuanceUSD}(t)}{\frac{1}{365} \sum_{k=0}^{364} \text{DailyIssuanceUSD}(t - k)}$$
- **Canonical Decision Thresholds:**
  - $\text{PuellMultiple} < 0.50$: **Miner Capitulation (Deep Undervaluation)** — Daily issuance significantly below annual baseline; historical generational buying opportunity.
  - $\text{PuellMultiple} > 3.50$: **Miner Profit-Taking (Macro Top Risk)** — Daily revenue vastly exceeding annual baseline; extreme miner selling incentive.
- **Reference Implementations & Cross-Check Endpoints:**
  - LookIntoBitcoin: `https://www.lookintobitcoin.com/charts/puell-multiple/`
  - Glassnode Studio: `https://studio.glassnode.com/metrics?m=indicators.PuellMultiple`

---

### 2.5. CoinMetrics Realized Price & MVRV Ratio
- **Authors & Origin:** Nic Carter & Antoine Le Calvez (CoinMetrics, 2018), Murad Mahmudov & David Puell (2018).
- **Core Thesis:** Realized Capitalization values each UTXO at the market price when it last moved on-chain, eliminating lost coins and reflecting aggregate network cost basis. MVRV is the ratio of market cap to realized cap.
- **Authoritative Mathematical Formulation:**
  $$\text{RealizedPrice} = \frac{\text{RealizedCap}}{\text{CirculatingSupply}}$$
  $$\text{MVRV} = \frac{\text{MarketCap}}{\text{RealizedCap}} = \frac{P_{\text{spot}}}{\text{RealizedPrice}}$$
  $$\text{MVRV Z-Score} = \frac{\text{MarketCap} - \text{RealizedCap}}{\sigma_{\text{MarketCap}}}$$
- **Data Ingestion Spec:**
  - Endpoint: `GET https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=btc&metrics=CapMVRVCur,PriceUSD&page_size=10`
  - Parser: $\text{RealizedPrice} = \text{PriceUSD} / \text{CapMVRVCur}$.
- **Canonical Thresholds:**
  - $\text{MVRV} < 1.00$: **Aggregate Unrealized Loss (Generational Accumulation)** — Spot below aggregate network cost.
  - $\text{MVRV} > 3.70$: **Extreme Euphoria (Macro Distribution)** — Historical peak distribution regime.
- **Reference Implementations & Cross-Check Endpoints:**
  - CoinMetrics API: `https://community-api.coinmetrics.io/`
  - CheckOnChain: `https://checkonchain.com/btc/pricing/mvrv`

---

## 3. Portfolio Accounting: Wealthfolio / GAAP Weighted-Average Cost (WAC)

All portfolio calculations (in Local Ledger and Binance Sync) strictly adhere to **GAAP / IFRS Weighted-Average Cost (WAC)** accounting standards. Naive net-cash-flow formulas that distort unit cost basis upon selling are completely forbidden.

### Sequential Transaction Processing Pipeline:
1. Sort all transactions chronologically: $T_1, T_2, \dots, T_n$ where $\text{Date}(T_i) \le \text{Date}(T_{i+1})$.
2. Initialize running state:
   $$\text{TotalQty}_0 = 0, \quad \text{TotalCost}_0 = 0, \quad \text{AvgBuyPrice}_0 = 0$$
3. For each transaction $i \in \{1, \dots, n\}$:
   - **Case BUY:**
     $$\text{TotalCost}_i = \text{TotalCost}_{i-1} + (\text{Qty}_i \times \text{Price}_i + \text{FeeUSD}_i)$$
     $$\text{TotalQty}_i = \text{TotalQty}_{i-1} + \text{Qty}_i$$
     $$\text{AvgBuyPrice}_i = \frac{\text{TotalCost}_i}{\text{TotalQty}_i}$$
   - **Case SELL:**
     $$\text{TotalQty}_i = \max\left(0, \text{TotalQty}_{i-1} - \text{Qty}_i\right)$$
     $$\text{TotalCost}_i = \text{TotalQty}_i \times \text{AvgBuyPrice}_{i-1}$$
     $$\text{AvgBuyPrice}_i = \text{AvgBuyPrice}_{i-1} \quad \text{(Cost basis per unit NEVER changes on a sale!)}$$
4. **Final Portfolio Valuation:**
   $$\text{CurrentValueUSD} = \text{TotalQty}_n \times P_{\text{spot}}$$
   $$\text{UnrealizedPnlUSD} = \text{TotalQty}_n \times (P_{\text{spot}} - \text{AvgBuyPrice}_n)$$
   $$\text{UnrealizedPnlPct} = \begin{cases} 
   \frac{P_{\text{spot}} - \text{AvgBuyPrice}_n}{\text{AvgBuyPrice}_n} \times 100 & \text{AvgBuyPrice}_n > 0 \\ 
   0 & \text{otherwise} 
   \end{cases}$$
   $$\text{PrincipalRecoveryPrice} = \begin{cases} 
   \frac{\text{TotalCost}_n}{\text{TotalQty}_n \times 0.25} & \text{TotalQty}_n > 0 \\ 
   0 & \text{otherwise} 
   \end{cases}$$

---

## 4. Advanced Econometric & Microstructure Models

| Indicator | Canonical Author / Publication | Mathematical Spec | Reference URL |
| :--- | :--- | :--- | :--- |
| **Cointime Economics (True Market Mean & AVIV)** | David Puell & ARK Invest / Glassnode (2023) | Weighted coinblocks destroyed vs coinblocks created; Active Value to Investor Value ($\text{AVIV} = \frac{\text{ActiveCap}}{\text{InvestorCap}}$) | `checkonchain.com/btc/cointime` |
| **Capriole Bitcoin Energy Value** | Charles Edwards, Capriole Investments (2019) | $V = \frac{\text{Hashrate}(\text{EH/s}) \times 10^{18} \times E_c}{\text{DailyIssuance}}$, where $E_c$ is network energy efficiency in Joules per GigaHash | `capriole.com/energy-value` |
| **RiskMetrics EWMA Volatility** | J.P. Morgan (1996) | $\sigma_t^2 = \lambda \sigma_{t-1}^2 + (1 - \lambda) r_t^2$, $\lambda = 0.94$; blended 60% EWMA + 40% Garman-Klass OHLC | `jpmorgan.com/riskmetrics` |
| **Cornish-Fisher Quantile Expansion** | E. A. Cornish & R. A. Fisher (1938) | $z_{\text{CF}}(\alpha) = z_\alpha + \frac{S}{6}(z_\alpha^2-1) + \frac{K}{24}(z_\alpha^3-3z_\alpha) - \frac{S^2}{36}(2z_\alpha^3-5z_\alpha)$ with strict Monotonicity Guard $S \in [-1.25, 1.25], K \in [0, 3.5]$ | Biometrika (1938) |
| **Probabilistic Sharpe Ratio (PSR) & DSR** | Marcos López de Prado (2012, 2014) | Adjusts Sharpe ratio for non-normal skewness, kurtosis, sample length $T$, and multiple trial false strategy selection bias ($N = 8$) | *The Journal of Risk* (2012), *Journal of Portfolio Management* (2014) |
| **Volatility Risk Premium (VRP)** | Deribit DVOL vs Garman-Klass | $\text{VRP} = \text{DVOL}_{\text{IV}} - \text{RealizedVol}_{\text{RV}}$ (Deribit public endpoint `get_volatility_index_data`) | `deribit.com`, `coinglass.com` |

---

## 5. Tactical Execution Helpers Classification

The following components are engineered specifically for disciplined capital execution and are classified as **Tactical Execution Helpers**:
1. **Continuous Fractional Half-Kelly Multiplier:**
   $$f^* = 0.5 \times \left[ p(S) - \frac{1 - p(S)}{b} \right]$$
   - Win probability $p(S)$ is calibrated via PAVA Isotonic Regression on historical 90-day returns.
   - Payoff odds $b = \text{P85} / |\text{P15}|$.
   - Multiplier is strictly clamped to $[0.50\text{x}, 1.50\text{x}]$ to prevent over-allocation.
2. **Multi-Pillar Confluence Score ($0–100$):**
   $$\text{Score} = \sum_{j} w_j \cdot M_j, \quad w_{\text{OnChain}}=35, \; w_{\text{Technical}}=25, \; w_{\text{Derivatives}}=20, \; w_{\text{Macro}}=20$$
   Each pillar score maps monotonically to standardized z-scores and empirical percentiles.
