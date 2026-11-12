-- ==============================================================================
-- Cloudflare D1 (SQLite) Schema for BTC Spot Accumulation & Macro Intelligence Terminal
-- Optimized for minimal row reads and instant indexing
-- ==============================================================================

-- 1. Daily On-Chain, Technical & Macro Confluence Metrics
CREATE TABLE IF NOT EXISTS daily_metrics (
  date TEXT PRIMARY KEY,                       -- Format: YYYY-MM-DD
  close_price REAL NOT NULL,                   -- USD Spot closing price
  sma200d REAL NOT NULL,                       -- 200-day Simple Moving Average
  sma200w REAL NOT NULL,                       -- 200-week Simple Moving Average (Cycle Floor)
  geom200d REAL NOT NULL,                      -- 200-day Geometric Mean for AHR999
  rsi14 REAL NOT NULL,                         -- 14-day Relative Strength Index
  ahr999 REAL NOT NULL,                        -- AHR999 Hoarding Index (< 0.45 bottom, < 1.2 DCA)
  mayer_multiple REAL NOT NULL,                -- Current Price / sma200d
  fear_greed INTEGER NOT NULL,                 -- Alternative.me index (0 - 100)
  etf_netflow_usd REAL NOT NULL,               -- US Spot ETF net inflow in USD
  dxy REAL NOT NULL,                           -- US Dollar Index
  us10y REAL NOT NULL,                         -- US 10-Year Treasury Yield (%)
  vnd_p2p_rate REAL NOT NULL,                  -- Binance P2P USDT/VND rate
  confluence_score INTEGER NOT NULL            -- 0-100 Multi-Pillar Score
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date DESC);

-- 2. Macro & Geopolitical Shock Events (Bear-Trap Detector Log)
CREATE TABLE IF NOT EXISTS macro_shock_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,                  -- Epoch ms
  category TEXT CHECK(category IN ('FED', 'WAR', 'ONCHAIN', 'ETF')),
  headline TEXT NOT NULL,
  btc_price_at_event REAL NOT NULL,
  pct_change_1h REAL NOT NULL,
  is_bear_trap INTEGER NOT NULL DEFAULT 0      -- 1 = True (leverage flushed while fundamentals solid)
);

CREATE INDEX IF NOT EXISTS idx_shock_events_timestamp ON macro_shock_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_shock_events_bear_trap ON macro_shock_events(is_bear_trap, timestamp DESC);

-- 3. Telegram Alert Subscribers & Whitelist Registry
CREATE TABLE IF NOT EXISTS alert_subscribers (
  telegram_chat_id TEXT PRIMARY KEY,
  min_confluence_score INTEGER NOT NULL DEFAULT 75, -- Triggers when score >= 75
  max_mempool_fee INTEGER NOT NULL DEFAULT 10,       -- Triggers when mempool <= 10 sat/vB
  exchange_uid TEXT,                                -- Optional affiliate UID
  created_at INTEGER NOT NULL                       -- Epoch ms
);

CREATE INDEX IF NOT EXISTS idx_subscribers_fee ON alert_subscribers(max_mempool_fee);
CREATE INDEX IF NOT EXISTS idx_subscribers_score ON alert_subscribers(min_confluence_score);

-- 4. Telegram User Profiles & Language Settings
CREATE TABLE IF NOT EXISTS user_profiles (
  telegram_chat_id TEXT PRIMARY KEY,
  lang TEXT NOT NULL DEFAULT 'vi',                  -- 'vi' or 'en'
  monthly_budget REAL NOT NULL DEFAULT 500,         -- Monthly DCA budget in USD
  min_confluence_score INTEGER NOT NULL DEFAULT 75, -- Alert threshold
  max_mempool_fee INTEGER NOT NULL DEFAULT 10,       -- Fee alert threshold in sat/vB
  binance_api_key TEXT DEFAULT '',                  -- Read-only API key
  binance_api_secret TEXT DEFAULT '',               -- API secret
  updated_at INTEGER NOT NULL                       -- Epoch ms
);

-- 5. Spot Portfolio Ledger Transactions
CREATE TABLE IF NOT EXISTS spot_portfolio_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_chat_id TEXT NOT NULL,
  usd_amount REAL NOT NULL,
  btc_price REAL NOT NULL,
  btc_amount REAL NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_portfolio_chat_id ON spot_portfolio_transactions(telegram_chat_id, created_at DESC);
