# DESIGN.md — BTC Macro Signal & Tactical DCA Intelligence Terminal

## 1. Product Overview & Identity
- **Product Name**: BTC Macro Signal & Tactical DCA Intelligence Terminal
- **Domain**: Institutional Bitcoin Macro Valuation, Quantitative On-Chain Analytics, and Dynamic Half-Kelly DCA Execution.
- **Core Value Proposition**: Transform complex multi-cycle Bitcoin models (Santostasi Power Law, Generational 200WMA, MVRV Z-Score, Short-Term Holder Cost Basis, Derivatives Microstructure, and Hurst Exponent) into an ultra-intuitive, sleek, institutional-grade executive dashboard.
- **Target Audience**: Bitcoin macro investors, quantitative DCA fund managers, high-net-worth portfolio allocators, and active crypto traders.

---

## 2. Design Philosophy & Visual Language
- **Style Archetype**: **Modern Soft Neumorphism & Glassmorphic Surfaces**.
  - High-radius curved containers (`rounded-[32px]` to `rounded-[40px]`).
  - Multi-layered soft drop shadows (`0 20px 50px rgba(0,0,0,0.06)` light / `0 25px 60px rgba(0,0,0,0.45)` dark).
  - Subtle hairline borders (`1px solid rgba(0,0,0,0.05)` light / `1px solid rgba(255,255,255,0.08)` dark) providing crisp separation without visual clutter.
  - Generous whitespace, elegant micro-padding, and purposeful layout hierarchy.
- **Themes**: Seamless dual-mode architecture (Light Mode default, Obsidian Dark Mode available via one-click toggle).

---

## 3. Color Tokens & Semantic Palette

### Light Mode (Default)
- **App Canvas**: `#F0F2F5` (Soft warm platinum off-white)
- **Main Board Container**: `#FFFFFF` (Pure crisp white with `shadow-2xl`)
- **Card Surface**: `#FFFFFF` with `#F8FAFC` subtle nested sections
- **Text Primary**: `#111827` (Deep Obsidian Grey)
- **Text Secondary / Muted**: `#64748B` / `#94A3B8` (Cool Slate)
- **Border Hairline**: `rgba(0, 0, 0, 0.06)`

### Dark Mode (Obsidian Terminal)
- **App Canvas**: `#0B0F19` (Deep Cosmos Navy)
- **Main Board Container**: `#121623` (Midnight Obsidian Slate)
- **Card Surface**: `#1A2234` (Elevated Card Slate)
- **Text Primary**: `#FFFFFF` (Crisp White)
- **Text Secondary / Muted**: `#94A3B8` / `#64748B`
- **Border Hairline**: `rgba(255, 255, 255, 0.08)`

### Semantic Accents & Indicators
- **Electric Blue (Primary Brand)**: `#1E6BFF` to `#3B82F6` (Logo, Primary Focus, Navigation highlights)
- **Emerald Green (Profit / Buy / Bullish)**: `#10B981` (Glow: `rgba(16, 185, 129, 0.25)`)
- **Coral Red (Loss / Risk / Stop)**: `#EF4444` / `#E11D48` (Glow: `rgba(239, 68, 68, 0.25)`)
- **Cyan Neon (Order Flow / Microstructure)**: `#06B6D4` to `#22D3EE` (Equalizer bars, live streams)
- **Amber Orange (Warning / Regime / Multiplier)**: `#F59E0B` to `#EA580C` (AI Confluence badges, Kelly multipliers)
- **Iridescent Hero Gradient**:
  - *Light*: `linear-gradient(135deg, #EAE8FE 0%, #E2F0FE 50%, #E9F3FE 100%)`
  - *Dark*: `linear-gradient(135deg, #1A1C35 0%, #16253B 50%, #152336 100%)`
  - *Overlay*: Semi-transparent checkered mosaic grid pattern (`opacity: 0.6` light / `0.2` dark)

---

## 4. Typography Hierarchy
- **Primary Display & Headings**: `Plus Jakarta Sans`, `Inter`, -apple-system, sans-serif
  - Hero Greeting: `28px` font-bold, `-0.02em` tracking
  - Card Titles: `18px - 20px` font-bold, `-0.01em` tracking
  - Metric Big Numbers: `26px - 30px` font-extrabold, tabular lining
- **Numerical & Financial Data**: `JetBrains Mono`, `ui-monospace`, monospace
  - Tickers, prices, P/L deltas, orderbook volumes, entry/exit numbers.
  - Enforce zero-width tabular figures to prevent jitter during live WebSocket updates.

---

## 5. Layout Architecture & Screen Anatomy

### Global Container
- Center-aligned giant rounded card (`max-w-[1440px]`, `rounded-[36px]`, `p-6` to `p-10`) nested within a clean ambient background canvas.

### Section 1: Header Bar
- **Brand Logo**: Circular badge (`48px x 48px`, `#1E6BFF` gradient) with upward dynamic vector chart line.
- **Segmented Pill Navigation**: Capsule container (`#EFF2F6` / `#1A2234`) with active white floating pill:
  1. `Dashboard` (Active Executive View)
  2. `Market Overview` (Valuation & Multi-Cycle Models)
  3. `Live Signals` (Quantitative Signal Grid)
  4. `AI Risk Analyzer` (Portfolio VaR & Half-Kelly Allocator)
- **Right Utilities**:
  - Theme Toggle Capsule (Moon / Sun icons with active pill indicator).
  - Notification Bell with red pulse dot (3 live alerts: Confluence shift, 200WMA retest, STH discount).
  - Profile Avatar (Circular portrait with green status dot & dropdown menu).

### Section 2: Iridescent Hero Welcome Banner
- **Left Dismiss Strip**: Collapsible rounded vertical rail with `✕` dismiss icon.
- **Main Banner**:
  - Badges row:
    - `✨ AI Confluence: 71/100` (Rainbow/amber border pill)
    - `🛡️ Calibrated v5.1 · Pro Plan` (Shield pill)
    - `⚡ Deep Accumulation` (Emerald regime tag)
  - Headline: `Good Morning, Macro Investor!`
  - Subtitle: `Your AI has analyzed 47 multi-pillar quantitative BTC indicators overnight · Kelly DCA multiplier is 1.35x.`
  - Action CTAs:
    - `Quick Trade` (Pill button with swap icon, light glass surface)
    - `Generate Signal` (Obsidian dark pill button with sparkle icon, glowing hover state)

### Section 3: Four Key Metric Cards (Row 1)
1. **Total P/L (MTD) / Portfolio Equity**:
   - Primary metric: `$24,892.50`
   - Sub-badges: `+12.5%` green badge, `75% of goal` label.
   - Graphic: **Barcode Equalizer** (28 vertical rounded bars, graduated heights, emerald green active bars vs grey pending bars).
2. **Win Rate**:
   - Primary metric: `78.5%`
   - Sub-badges: `+3.2%` amber badge, `142 wins / 39 losses`.
   - Graphic: **Dual-Spline Wave Chart** (Subtle grey baseline curve crossed by an energetic orange spline featuring 2 circular ring node markers at inflection peaks).
3. **Active Signals**:
   - Primary metric: `12`
   - Sub-badges: `• Live` pulsing cyan pill, clickable `8 Buy` (emerald) / `4 Sell` (slate) breakdown.
   - Graphic: **Glowing Cyan Equalizer Frequency Lines** (11 glowing vertical neon pills with subtle height variations).
4. **AI Accuracy**:
   - Primary metric: `92.3%`
   - Sub-badges: `Based on 500+ signals` label.
   - Graphic: **Coral Spline Wave with Confidence Corridor** (Smooth salmon/coral curve passing through a vertical translucent gradient highlight bar with a target focal point).

### Section 4: Lower Intelligence Grid (Row 2 - 3 Columns)
1. **Left (4 cols): Performance Overview**:
   - Title: `Your trading performance this month` / `Performance Overview`.
   - Controls: `1M`, `3M`, `YTD` segmented pill toggle.
   - Interactive Tooltip: `Day 18: +$1,450.00 | Cumul. P/L: $24,892.50` (emerald callout).
   - Graphic: **Stepped City-Skyline Chart** (Right-angled geometric polygon filled with soft green gradient, sharp stepped green stroke, and circular green day marker over a dot-matrix background pattern).
2. **Center (5 cols): Recent Trades Table**:
   - Title: `Recent Trades` / `Your latest quantitative trading & DCA activity`.
   - Filter Tabs: `All`, `Spot DCA`, `Tactical`, `Derivatives`.
   - Columns: `PAIR` (with colorful round letter badge: `B` Emerald for BTC/USDT, `B` Amber for BTC/FDUSD, `E` Orange for ETH/BTC, `F` Cyan for BTC-PERP), `ENTRY`, `EXIT / CURR`, `P/L`, and action `Eye` icon.
   - Strictly Bitcoin & macro crypto pairs — **No generic Forex (EUR/USD) data**.
3. **Right (3 cols): Watchlist**:
   - Title: `Watchlist` with `+ Add` action.
   - Items:
     - `BTC/USDT` (Binance Spot real-time WebSocket ticker)
     - `USDT/VND` (Live P2P Treasury Rate: `25,850 ₫`)
     - `ETH/BTC` (Macro Crypto Dominance Ratio)
     - `BTC Funding` (8H Derivatives Yield: `+0.010%` / `+10.95% APR`)
   - Micro-flashing animation upon price tick updates.

---

## 6. Interactive Modals
- **Quick Trade Modal**: Sizing inputs, Half-Kelly recommended leverage (1x Spot to 3x Hedge), take-profit/stop-loss sliders, and one-click execution with confetti animation.
- **Generate Signal Modal**: Step-by-step radar scan animation across 4 Pillars (Technical 200WMA, On-Chain MVRV, Derivatives CVD, Macro Volatility) generating an actionable signal card.
- **Trade Detail Modal**: In-depth trade breakdown including execution fees, holding duration, and cost basis impact.

---

## 7. Stitch Design Directives & Guidelines
- **Strict Domain Fidelity**: Keep all elements 100% focused on Bitcoin and institutional quantitative cryptocurrency trading.
- **Aesthetic Tone**: Elegant, calm, trustworthy, high-wealth fintech. Avoid garish neon-drenched casino tropes; prioritize clean Apple/Linear-style glassmorphic craft.
- **Scalability**: High-DPI responsive layout adapting smoothly from 1920px wide monitor down to mobile viewport.

