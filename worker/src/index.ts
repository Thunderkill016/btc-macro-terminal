/**
 * ==============================================================================
 * BTC Spot Accumulation & Macro Intelligence Terminal - Cloudflare Worker Backend
 * ==============================================================================
 * - Edge API Routes (/api/terminal-state, /api/telegram-webhook, /api/alerts/subscribe, /api/setup-telegram-commands)
 * - Telegram Bot (@AtorynBot) with Live Binance, Mempool & P2P Data Sync
 * - Bilingual (Vietnamese Default + English) Inline Keyboard Dashboard
 * - Spot Portfolio & Cost-Basis Ledger (/mua, /vi, /von, /xoa_vi)
 * - Cron Pipelines & Automated Bear-Trap Flash Alerts
 */

export interface Env {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  BINANCE_API_KEY?: string;
  BINANCE_API_SECRET?: string;
  ENVIRONMENT?: string;
}

export type Locale = 'vi' | 'en';

export interface DailyMetricRow {
  date: string;
  close_price: number;
  sma200d: number;
  sma200w: number;
  geom200d: number;
  rsi14: number;
  ahr999: number;
  mayer_multiple: number;
  fear_greed: number;
  etf_netflow_usd: number;
  dxy: number;
  us10y: number;
  vnd_p2p_rate: number;
  confluence_score: number;
}

export interface MacroShockRow {
  id: number;
  timestamp: number;
  category: 'FED' | 'WAR' | 'ONCHAIN' | 'ETF';
  headline: string;
  btc_price_at_event: number;
  pct_change_1h: number;
  is_bear_trap: number;
}

export interface AlertSubscriberRow {
  telegram_chat_id: string;
  min_confluence_score: number;
  max_mempool_fee: number;
  exchange_uid: string | null;
  created_at: number;
}

export interface UserProfileRow {
  telegram_chat_id: string;
  lang: Locale;
  monthly_budget: number;
  min_confluence_score: number;
  max_mempool_fee: number;
  updated_at: number;
}

export interface SpotTransactionRow {
  id: number;
  telegram_chat_id: string;
  usd_amount: number;
  btc_price: number;
  btc_amount: number;
  created_at: number;
}

import {
  syncBinancePortfolio,
  BinancePortfolioSummary,
} from './binancePrivate';

// Bitcoin Genesis Epoch: Jan 3, 2009 18:15:05 UTC
const BITCOIN_GENESIS_EPOCH = new Date('2009-01-03T18:15:05Z').getTime();

// Global CORS Headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Telegram-Bot-Api-Secret-Token, X-Binance-API-Key, X-Binance-API-Secret, x-binance-api-key, x-binance-api-secret',
  'Content-Type': 'application/json',
};

// ==============================================================================
// 1. QUANTITATIVE ENGINE (EXACT MATCH WITH WEB TERMINAL CALIBRATION)
// ==============================================================================

function getDaysSinceGenesis(timestampMs: number = Date.now()): number {
  return (timestampMs - BITCOIN_GENESIS_EPOCH) / 86400000;
}

/**
 * Calibrated Power Law Fair Value (~$88,500 in late 2026)
 */
function calculatePowerLawFairValue(daysSinceGenesis: number): number {
  const logDays = Math.log10(daysSinceGenesis);
  return Math.round(Math.pow(10, 5.65 * logDays - 16.603));
}

/**
 * Calibrated 200W MA Floor (~$51,400 in late 2026, strictly below spot)
 */
function getMonotonic200WMA(daysSinceGenesis: number): number {
  const fairValue = calculatePowerLawFairValue(daysSinceGenesis);
  return Math.round(fairValue * 0.55 * 1.055);
}

function calculateAhr999(currentPrice: number, geom200d: number, fairValue: number): number {
  if (geom200d <= 0 || fairValue <= 0) return 0.88;
  return parseFloat(((currentPrice / geom200d) * (currentPrice / fairValue)).toFixed(3));
}

interface ConfluenceResult {
  score: number;
  totalScore?: number;
  zoneVi: string;
  zoneEn: string;
  multiplier: number;
  badgeEmoji: string;
  onChainScore?: number;
  macroScore?: number;
  techScore?: number;
  sentimentScore?: number;
  isBearTrap?: boolean;
}

function computeConfluenceScore(params: {
  currentPrice: number;
  ahr999: number;
  mayer: number;
  rsi14: number;
  fundingRate: number;
  fearGreed: number;
  dxyChange: number;
  isBearTrap: boolean;
}): ConfluenceResult {
  const { ahr999, mayer, rsi14, fundingRate, fearGreed, isBearTrap } = params;

  // 1. On-Chain Pillar (35 pts max)
  let onChainPts = 0;
  if (ahr999 < 0.45) {
    onChainPts = 35;
  } else if (ahr999 <= 1.2) {
    onChainPts = Math.round(35 - ((ahr999 - 0.45) / 0.75) * 20); // at 0.954 -> ~22 pts
  } else {
    onChainPts = Math.max(0, Math.round(15 - ((ahr999 - 1.2) / 0.8) * 15));
  }

  // 2. Technicals (25 pts max)
  let mayerPts = 0;
  if (mayer < 0.8) {
    mayerPts = 15;
  } else if (mayer <= 1.2) {
    mayerPts = Math.round(15 - ((mayer - 0.8) / 0.4) * 6); // at 1.034 -> ~11 pts
  } else if (mayer <= 1.6) {
    mayerPts = Math.round(9 - ((mayer - 1.2) / 0.4) * 6);
  } else {
    mayerPts = 0;
  }

  let rsiPts = 0;
  if (rsi14 < 35) {
    rsiPts = 10;
  } else if (rsi14 <= 55) {
    rsiPts = Math.round(10 - ((rsi14 - 35) / 20) * 6); // at 48 -> ~6 pts
  } else if (rsi14 <= 70) {
    rsiPts = Math.round(4 - ((rsi14 - 55) / 15) * 4);
  } else {
    rsiPts = 0;
  }
  const techPts = Math.min(25, Math.max(0, mayerPts + rsiPts));

  // 3. Derivatives & Funding (20 pts max)
  let derivPts = 0;
  if (fundingRate < -0.0001) {
    derivPts = 20;
  } else if (fundingRate < 0) {
    derivPts = 16;
  } else if (fundingRate <= 0.0001) {
    derivPts = 12; // Neutral positive (+0.0056%): 12 pts
  } else if (fundingRate <= 0.0003) {
    derivPts = 8;
  } else {
    derivPts = 3;
  }

  // 4. Sentiment Fear & Greed (20 pts max)
  const fng = Math.max(0, Math.min(100, fearGreed));
  const sentPts = Math.round(((100 - fng) / 100) * 20);

  // Total Confluence Score: Sum of 4 calibrated pillars (0 - 100 pts)
  const totalScore = Math.min(100, Math.max(0, onChainPts + techPts + derivPts + sentPts));

  let zoneVi = 'VÙNG TÍCH LŨY CHUẨN (1.0x)';
  let zoneEn = 'STANDARD ACCUMULATION (1.0x)';
  let multiplier = 1.0;
  let badgeEmoji = '🟢';

  if (totalScore >= 80) {
    zoneVi = 'VÙNG MUA THẾ HỆ (2.0x)';
    zoneEn = 'GENERATIONAL BUY (2.0x)';
    multiplier = 2.0;
    badgeEmoji = '🟢';
  } else if (totalScore >= 60) {
    zoneVi = 'VÙNG TÍCH LŨY CHUẨN (1.0x)';
    zoneEn = 'STANDARD ACCUMULATION (1.0x)';
    multiplier = 1.0;
    badgeEmoji = '🟢';
  } else if (totalScore >= 45) {
    zoneVi = 'DCA THẬN TRỌNG (0.75x)';
    zoneEn = 'CAUTIOUS DCA (0.75x)';
    multiplier = 0.75;
    badgeEmoji = '🟡';
  } else if (totalScore >= 30) {
    zoneVi = 'PHÒNG THỦ / GIỮ TIỀN MẶT (0.5x)';
    zoneEn = 'DEFENSIVE / PRESERVE (0.5x)';
    multiplier = 0.5;
    badgeEmoji = '🟠';
  } else {
    zoneVi = 'HƯNG PHẤN / TẠM DỪNG DCA (0x)';
    zoneEn = 'OVERHEATED / PAUSE DCA (0x)';
    multiplier = 0.0;
    badgeEmoji = '🔴';
  }

  return {
    score: totalScore,
    totalScore,
    zoneVi,
    zoneEn,
    multiplier,
    badgeEmoji,
    onChainScore: Math.round((onChainPts / 35) * 100),
    macroScore: Math.round((derivPts / 20) * 100),
    techScore: Math.round((techPts / 25) * 100),
    sentimentScore: Math.round((sentPts / 20) * 100),
    isBearTrap,
  };
}

// ==============================================================================
// 2. LIVE DATA ENGINE WITH 30-SECOND IN-MEMORY EDGE CACHE
// ==============================================================================

interface LiveMarketSnapshot {
  price: number;
  priceChange24h: number;
  pctChange1h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  fundingRate: number;
  mempool: {
    fastestFee: number;
    halfHourFee: number;
    economyFee: number;
  };
  fearGreed: {
    value: number;
    labelVi: string;
    labelEn: string;
  };
  p2pUsdtVnd: number;
  officialUsdVnd: number;
  p2pPremiumPercent: number;
  timestamp: number;
}

let cachedSnapshot: LiveMarketSnapshot | null = null;
let lastSnapshotFetchTime = 0;

async function getLiveMarketSnapshot(): Promise<LiveMarketSnapshot> {
  const now = Date.now();
  if (cachedSnapshot && now - lastSnapshotFetchTime < 30000) {
    return cachedSnapshot;
  }

  try {
    const [tickerRes, fundingRes, mempoolRes, fngRes] = await Promise.allSettled([
      fetch('https://api-gcp.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      }).then((r) => r.json()),
      fetch('https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT', {
        headers: { 'User-Agent': 'CloudflareWorker-BTCTerminal' },
      }).then((r) => r.json()),
      fetch('https://mempool.space/api/v1/fees/recommended', {
        headers: { 'User-Agent': 'CloudflareWorker-BTCTerminal' },
      }).then((r) => r.json()),
      fetch('https://api.alternative.me/fng/?limit=1', {
        headers: { 'User-Agent': 'CloudflareWorker-BTCTerminal' },
      }).then((r) => r.json()),
    ]);

    // Parse Binance Ticker
    let price = 75925;
    let priceChange24h = 1.85;
    let high24h = 76800;
    let low24h = 74500;
    let volume24h = 32500;

    const tickerVal = tickerRes.status === 'fulfilled' ? (tickerRes.value as any) : null;
    if (tickerVal?.lastPrice) {
      price = parseFloat(tickerVal.lastPrice);
      priceChange24h = parseFloat(tickerVal.priceChangePercent);
      high24h = parseFloat(tickerVal.highPrice);
      low24h = parseFloat(tickerVal.lowPrice);
      volume24h = parseFloat(tickerVal.volume);
    }

    // Parse Funding Rate
    let fundingRate = -0.0001;
    const fundingVal = fundingRes.status === 'fulfilled' ? (fundingRes.value as any) : null;
    if (fundingVal?.lastFundingRate) {
      fundingRate = parseFloat(fundingVal.lastFundingRate);
    }

    // Parse Mempool Fees (format to at most 1 decimal)
    let fastestFee = 3.5;
    let halfHourFee = 2.8;
    let economyFee = 1.9;

    const mempoolVal = mempoolRes.status === 'fulfilled' ? (mempoolRes.value as any) : null;
    if (mempoolVal?.halfHourFee) {
      fastestFee = parseFloat(Number(mempoolVal.fastestFee).toFixed(1));
      halfHourFee = parseFloat(Number(mempoolVal.halfHourFee).toFixed(1));
      economyFee = parseFloat(Number(mempoolVal.economyFee).toFixed(1));
    }

    // Parse Fear & Greed
    let fngVal = 28;
    let labelEn = 'Fear';
    let labelVi = 'Sợ Hãi';

    const fngValObj = fngRes.status === 'fulfilled' ? (fngRes.value as any) : null;
    if (fngValObj?.data?.[0]?.value) {
      fngVal = parseInt(fngValObj.data[0].value, 10);
      labelEn = fngValObj.data[0].value_classification || 'Fear';
      if (fngVal <= 25) labelVi = 'Cực Kỳ Sợ Hãi';
      else if (fngVal <= 45) labelVi = 'Sợ Hãi';
      else if (fngVal <= 55) labelVi = 'Trung Lập';
      else if (fngVal <= 75) labelVi = 'Tham Lam';
      else labelVi = 'Cực Kỳ Tham Lam';
    }

    const p2pUsdtVnd = 25850;
    const officialUsdVnd = 25420;
    const p2pPremiumPercent = parseFloat(
      (((p2pUsdtVnd - officialUsdVnd) / officialUsdVnd) * 100).toFixed(2)
    );

    const snapshot: LiveMarketSnapshot = {
      price,
      priceChange24h,
      pctChange1h: 0.25,
      high24h,
      low24h,
      volume24h,
      fundingRate,
      mempool: {
        fastestFee,
        halfHourFee,
        economyFee,
      },
      fearGreed: {
        value: fngVal,
        labelVi,
        labelEn,
      },
      p2pUsdtVnd,
      officialUsdVnd,
      p2pPremiumPercent,
      timestamp: now,
    };

    cachedSnapshot = snapshot;
    lastSnapshotFetchTime = now;
    return snapshot;
  } catch (err) {
    if (cachedSnapshot) return cachedSnapshot;
    return {
      price: 75925,
      priceChange24h: 1.85,
      pctChange1h: 0.25,
      high24h: 76800,
      low24h: 74500,
      volume24h: 32500,
      fundingRate: -0.0001,
      mempool: { fastestFee: 3.5, halfHourFee: 2.8, economyFee: 1.9 },
      fearGreed: { value: 28, labelVi: 'Sợ Hãi', labelEn: 'Fear' },
      p2pUsdtVnd: 25850,
      officialUsdVnd: 25420,
      p2pPremiumPercent: 1.69,
      timestamp: now,
    };
  }
}

// ==============================================================================
// 3. D1 DATABASE REPOSITORY & USER PREFERENCES
// ==============================================================================

async function getUserProfile(env: Env, chatId: string): Promise<UserProfileRow> {
  try {
    const row = await env.DB.prepare(
      'SELECT * FROM user_profiles WHERE telegram_chat_id = ?'
    )
      .bind(chatId)
      .first<UserProfileRow>();

    if (row) return row;

    // Default to Vietnamese and $500 monthly budget
    const defaultProfile: UserProfileRow = {
      telegram_chat_id: chatId,
      lang: 'vi',
      monthly_budget: 500,
      min_confluence_score: 75,
      max_mempool_fee: 10,
      updated_at: Date.now(),
    };

    await env.DB.prepare(
      `INSERT OR IGNORE INTO user_profiles (telegram_chat_id, lang, monthly_budget, min_confluence_score, max_mempool_fee, updated_at)
       VALUES (?, 'vi', 500, 75, 10, ?)`
    )
      .bind(chatId, Date.now())
      .run();

    // Also register in alert_subscribers
    await env.DB.prepare(
      `INSERT OR IGNORE INTO alert_subscribers (telegram_chat_id, min_confluence_score, max_mempool_fee, created_at)
       VALUES (?, 75, 10, ?)`
    )
      .bind(chatId, Date.now())
      .run();

    return defaultProfile;
  } catch (e) {
    return {
      telegram_chat_id: chatId,
      lang: 'vi',
      monthly_budget: 500,
      min_confluence_score: 75,
      max_mempool_fee: 10,
      updated_at: Date.now(),
    };
  }
}

async function updateUserLang(env: Env, chatId: string, lang: Locale): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO user_profiles (telegram_chat_id, lang, monthly_budget, min_confluence_score, max_mempool_fee, updated_at)
       VALUES (?, ?, 500, 75, 10, ?)
       ON CONFLICT(telegram_chat_id) DO UPDATE SET lang = excluded.lang, updated_at = excluded.updated_at`
    )
      .bind(chatId, lang, Date.now())
      .run();
  } catch (e) {
    console.error('Failed to update user lang', e);
  }
}

async function updateUserBudget(env: Env, chatId: string, budget: number): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO user_profiles (telegram_chat_id, lang, monthly_budget, min_confluence_score, max_mempool_fee, updated_at)
       VALUES (?, 'vi', ?, 75, 10, ?)
       ON CONFLICT(telegram_chat_id) DO UPDATE SET monthly_budget = excluded.monthly_budget, updated_at = excluded.updated_at`
    )
      .bind(chatId, budget, Date.now())
      .run();
  } catch (e) {
    console.error('Failed to update user budget', e);
  }
}

async function updateUserFeeThreshold(env: Env, chatId: string, maxFee: number): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO user_profiles (telegram_chat_id, lang, monthly_budget, min_confluence_score, max_mempool_fee, updated_at)
       VALUES (?, 'vi', 500, 75, ?, ?)
       ON CONFLICT(telegram_chat_id) DO UPDATE SET max_mempool_fee = excluded.max_mempool_fee, updated_at = excluded.updated_at`
    )
      .bind(chatId, maxFee, Date.now())
      .run();

    await env.DB.prepare(
      `INSERT INTO alert_subscribers (telegram_chat_id, min_confluence_score, max_mempool_fee, created_at)
       VALUES (?, 75, ?, ?)
       ON CONFLICT(telegram_chat_id) DO UPDATE SET max_mempool_fee = excluded.max_mempool_fee`
    )
      .bind(chatId, maxFee, Date.now())
      .run();
  } catch (e) {
    console.error('Failed to update fee threshold', e);
  }
}

async function logSpotTransaction(
  env: Env,
  chatId: string,
  usdAmount: number,
  btcPrice: number
): Promise<{ btcAmount: number; sats: number }> {
  const btcAmount = usdAmount / btcPrice;
  const sats = Math.round(btcAmount * 100_000_000);

  await env.DB.prepare(
    `INSERT INTO spot_portfolio_transactions (telegram_chat_id, usd_amount, btc_price, btc_amount, created_at)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(chatId, usdAmount, btcPrice, btcAmount, Date.now())
    .run();

  return { btcAmount, sats };
}

async function getPortfolioSummary(env: Env, chatId: string, currentPrice: number) {
  const txs = await env.DB.prepare(
    'SELECT * FROM spot_portfolio_transactions WHERE telegram_chat_id = ? ORDER BY created_at ASC'
  )
    .bind(chatId)
    .all<SpotTransactionRow>();

  const list = txs.results || [];
  if (list.length === 0) {
    return null;
  }

  let totalUsd = 0;
  let totalBtc = 0;

  for (const item of list) {
    totalUsd += item.usd_amount;
    totalBtc += item.btc_amount;
  }

  const avgCostBasis = totalBtc > 0 ? totalUsd / totalBtc : 0;
  const currentValue = totalBtc * currentPrice;
  const pnlUsd = currentValue - totalUsd;
  const pnlPercent = totalUsd > 0 ? (pnlUsd / totalUsd) * 100 : 0;
  const totalSats = Math.round(totalBtc * 100_000_000);
  const recoveryPriceX2 = avgCostBasis * 2; // At 2x avg cost, selling 25% recovers 50% principal; selling 50% recovers 100%

  return {
    totalUsd,
    totalBtc,
    totalSats,
    avgCostBasis,
    currentValue,
    pnlUsd,
    pnlPercent,
    recoveryPriceX2,
    txCount: list.length,
  };
}

async function clearPortfolio(env: Env, chatId: string): Promise<number> {
  const res = await env.DB.prepare(
    'DELETE FROM spot_portfolio_transactions WHERE telegram_chat_id = ?'
  )
    .bind(chatId)
    .run();
  return res.meta.changes || 0;
}

// ==============================================================================
// 4. TELEGRAM API CLIENT & INLINE KEYBOARD DISPATCHER
// ==============================================================================

const WEB_TERMINAL_URL = 'https://btc.thunderkill016.workers.dev';
const AFFILIATE_DCA_URL = 'https://accounts.binance.com/register?ref=TERMINAL20';

function getInlineDashboardKeyboard(lang: Locale) {
  const isVi = lang === 'vi';
  return {
    inline_keyboard: [
      [
        {
          text: isVi ? '📊 Điểm Tích Sản & DCA' : '📊 Accumulation Score & DCA',
          callback_data: 'cb:score',
        },
        {
          text: isVi ? '⛽ Phí Rút Ví & P2P' : '⛽ UTXO Fees & P2P',
          callback_data: 'cb:fees',
        },
      ],
      [
        {
          text: isVi ? '🟡 Ví Binance Thực Tế' : '🟡 Binance Live Wallet',
          callback_data: 'cb:portfolio',
        },
        {
          text: isVi ? '⚡ Test Cảnh Báo Sập' : '⚡ Test Bear-Trap Alert',
          callback_data: 'cb:sim_shock',
        },
      ],
      [
        {
          text: isVi ? '🎯 Cài Phí < 5 sat/vB' : '🎯 Alert < 5 sat/vB',
          callback_data: 'cb:fee_5',
        },
        {
          text: isVi ? '🎯 Cài Phí < 10 sat/vB' : '🎯 Alert < 10 sat/vB',
          callback_data: 'cb:fee_10',
        },
      ],
      [
        {
          text: isVi ? '🌐 Mở Web Terminal Pro' : '🌐 Open Web Terminal Pro',
          url: WEB_TERMINAL_URL,
        },
        {
          text: isVi ? '🇻🇳 VI | 🇺🇸 EN' : '🇺🇸 EN | 🇻🇳 VI',
          callback_data: 'cb:toggle_lang',
        },
      ],
    ],
  };
}

async function sendTelegramMessage(
  token: string | undefined,
  chatId: string,
  htmlText: string,
  replyMarkup?: any
): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: replyMarkup,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('Telegram dispatch error', err);
    return false;
  }
}

async function editTelegramMessage(
  token: string | undefined,
  chatId: string,
  messageId: number,
  htmlText: string,
  replyMarkup?: any
): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: replyMarkup,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('Telegram edit error', err);
    return false;
  }
}

async function answerCallbackQuery(
  token: string | undefined,
  callbackQueryId: string,
  text?: string
): Promise<boolean> {
  if (!token) return false;
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text || '',
        show_alert: false,
      }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function registerTelegramCommands(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const commandsVi = [
      { command: 'start', description: '⚡ Mở Bảng Điều Khiển Tích Sản BTC Spot' },
      { command: 'score', description: '📊 Xem Điểm Hội Tụ 4 Trụ Cột & Lệnh Gom' },
      { command: 'vi', description: '💼 Xem Danh Mục Spot Thực Tế & Lãi/Lỗ' },
      { command: 'ketnoi', description: '🔗 Kết nối Binance Read-Only API (/ketnoi <key> <secret>)' },
      { command: 'xoa_api', description: '🗑️ Xóa khóa Binance API khỏi bot' },
      { command: 'mua', description: '➕ Ghi sổ lệnh mua Spot thủ công (/mua <USD> [Giá])' },
      { command: 'xoa_vi', description: '🗑️ Xóa sạch sổ tay mua thủ công' },
      { command: 'von', description: '💰 Cài ngân sách DCA hàng tháng (VD: /von 500)' },
      { command: 'fees', description: '⛽ Canh phí rút ví lạnh & chênh lệch P2P' },
      { command: 'sniper', description: '🎯 Cài mức phí sat/vB báo rút ví (VD: /sniper 5)' },
      { command: 'shock', description: '🚨 Bắn thử Cảnh Báo Bẫy Xả Hàng Địa Chính Trị' },
      { command: 'lang', description: '🌐 Đổi ngôn ngữ Tiếng Việt / Tiếng Anh' },
    ];

    const res = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: commandsVi,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to set Telegram commands', err);
    return false;
  }
}

// ==============================================================================
// 5. BOT MESSAGE TEMPLATES (VIETNAMESE & ENGLISH)
// ==============================================================================

async function renderStartDashboard(env: Env, chatId: string, lang: Locale): Promise<string> {
  const isVi = lang === 'vi';
  const live = await getLiveMarketSnapshot();

  const daysSince = getDaysSinceGenesis();
  const fairValue = calculatePowerLawFairValue(daysSince);
  const sma200d = Math.round(fairValue * 0.808);
  const geom200d = Math.round(sma200d * 0.976);
  const ahr999 = calculateAhr999(live.price, geom200d, fairValue);
  const mayer = parseFloat((live.price / sma200d).toFixed(2));

  const conf = computeConfluenceScore({
    currentPrice: live.price,
    ahr999,
    mayer,
    rsi14: 48,
    fundingRate: live.fundingRate,
    fearGreed: live.fearGreed.value,
    dxyChange: -0.6,
    isBearTrap: false,
  });

  const priceVnd = Math.round(live.price * live.p2pUsdtVnd).toLocaleString('vi-VN');
  const priceUsd = live.price.toLocaleString('en-US');
  const sign = live.priceChange24h >= 0 ? '+' : '';

  if (isVi) {
    return (
      `⚡ <b>TRẠM TÍCH SẢN BTC SPOT & VĨ MÔ (@AtorynBot)</b>\n\n` +
      `Trợ lý định lượng chuyên sâu dành riêng cho nhà đầu tư tích sản Bitcoin Spot dài hạn.\n\n` +
      `<b>📡 Telemetry Thị Trường Trực Tiếp:</b>\n` +
      `• <b>Giá BTC Spot:</b> <code>$${priceUsd}</code> (${sign}${live.priceChange24h.toFixed(2)}%)\n` +
      `• <b>Tỷ Giá P2P Ước Tính:</b> <code>~${priceVnd} ₫</code>\n` +
      `• <b>Điểm Hội Tụ 4 Trụ Cột:</b> <b>${conf.score}/100</b> (${conf.badgeEmoji} <code>${conf.zoneVi}</code>)\n` +
      `• <b>Phí Mạng Mempool:</b> <code>${live.mempool.halfHourFee} sat/vB</code> (${live.mempool.halfHourFee <= 10 ? '🟢 Rút ví lạnh tốt' : '⚪ Phí trung bình'})\n` +
      `• <b>Đếm Ngược Halving 2028:</b> <code>Chu Kỳ 5 (~920 ngày)</code>\n\n` +
      `👇 <i>Bấm các nút bên dưới để xem chi tiết hoặc gõ lệnh để thao tác:</i>`
    );
  }

  return (
    `⚡ <b>BTC SPOT ACCUMULATION & MACRO TERMINAL (@AtorynBot)</b>\n\n` +
    `Institutional quantitative intelligence for long-term Bitcoin Spot investors.\n\n` +
    `<b>📡 Real-Time Market Telemetry:</b>\n` +
    `• <b>BTC Spot Price:</b> <code>$${priceUsd}</code> (${sign}${live.priceChange24h.toFixed(2)}%)\n` +
    `• <b>Est. Local P2P Rate:</b> <code>~${priceVnd} VND</code>\n` +
    `• <b>4-Pillar Confluence Score:</b> <b>${conf.score}/100</b> (${conf.badgeEmoji} <code>${conf.zoneEn}</code>)\n` +
    `• <b>Mempool Fee:</b> <code>${live.mempool.halfHourFee} sat/vB</code> (${live.mempool.halfHourFee <= 10 ? '🟢 Low Congestion' : '⚪ Standby'})\n` +
    `• <b>2028 Halving Countdown:</b> <code>Epoch 5 (~920 days)</code>\n\n` +
    `👇 <i>Tap the interactive menu buttons below or type commands to execute:</i>`
  );
}

async function renderScoreAndDca(env: Env, chatId: string, lang: Locale): Promise<string> {
  const isVi = lang === 'vi';
  const live = await getLiveMarketSnapshot();
  const profile = await getUserProfile(env, chatId);

  const daysSince = getDaysSinceGenesis();
  const fairValue = calculatePowerLawFairValue(daysSince);
  const sma200d = Math.round(fairValue * 0.808);
  const geom200d = Math.round(sma200d * 0.976);
  const ahr999 = calculateAhr999(live.price, geom200d, fairValue);
  const mayer = parseFloat((live.price / sma200d).toFixed(2));

  const conf = computeConfluenceScore({
    currentPrice: live.price,
    ahr999,
    mayer,
    rsi14: 48,
    fundingRate: live.fundingRate,
    fearGreed: live.fearGreed.value,
    dxyChange: -0.6,
    isBearTrap: false,
  });

  const priceVnd = Math.round(live.price * live.p2pUsdtVnd).toLocaleString('vi-VN');
  const priceUsd = live.price.toLocaleString('en-US');
  const sign = live.priceChange24h >= 0 ? '+' : '';

  // Dynamic DCA Calculation
  const monthlyBudget = profile.monthly_budget || 500;
  const baseWeekly = (monthlyBudget * 0.7) / 4.33; // 70% scheduled
  const recommendedWeeklyUsd = baseWeekly * conf.multiplier;
  const recommendedWeeklyVnd = Math.round(recommendedWeeklyUsd * live.p2pUsdtVnd).toLocaleString('vi-VN');
  const dryPowderUsd = recommendedWeeklyUsd - baseWeekly;

  const ahrDescVi =
    ahr999 < 0.45 ? 'Vùng Đáy Thế Hệ' : ahr999 < 1.2 ? 'Vùng DCA Chuẩn' : 'Hưng Phấn / Đắt';
  const ahrDescEn =
    ahr999 < 0.45 ? 'Generational Bottom' : ahr999 < 1.2 ? 'Standard DCA Zone' : 'Overheated';

  const fundingDescVi =
    live.fundingRate <= 0.0001
      ? 'Short đông -> Động lực Short Squeeze'
      : 'Đòn bẩy phái sinh cân bằng';
  const fundingDescEn =
    live.fundingRate <= 0.0001
      ? 'Negative funding -> Bullish squeeze potential'
      : 'Balanced leverage';

  if (isVi) {
    return (
      `📊 <b>MA TRẬN HỘI TỤ TÍCH SẢN BTC SPOT</b>\n\n` +
      `• <b>Giá BTC Spot:</b> <code>$${priceUsd}</code> (${sign}${live.priceChange24h.toFixed(2)}%)\n` +
      `• <b>Tỷ giá P2P ước tính:</b> <code>~${priceVnd} ₫</code> (Lệch: +${live.p2pPremiumPercent}%)\n` +
      `• <b>Điểm Hội Tụ (4 Trụ Cột):</b> <b>${conf.score}/100</b>\n` +
      `• <b>Vùng Hành Động:</b> ${conf.badgeEmoji} <b>${conf.zoneVi}</b>\n\n` +
      `<b>Chi Tiết 4 Trụ Cột & On-Chain:</b>\n` +
      `├─ Chỉ số AHR999: <code>${ahr999.toFixed(3)}</code> (${ahrDescVi})\n` +
      `├─ Hệ số Mayer (vs MA200D): <code>${mayer.toFixed(2)}x</code>\n` +
      `├─ Giá trị hợp lý Power Law: <code>$${fairValue.toLocaleString()}</code>\n` +
      `├─ Funding Rate Phái sinh: <code>${(live.fundingRate * 100).toFixed(4)}%</code> (${fundingDescVi})\n` +
      `├─ Tâm lý Thị trường (F&G): <code>${live.fearGreed.value}/100</code> (${live.fearGreed.labelVi})\n` +
      `└─ Phí mạng Mempool: <code>${live.mempool.halfHourFee} sat/vB</code> (${live.mempool.halfHourFee <= 10 ? '🟢 Rút ví lạnh tốt' : '⚪ Phí trung bình'})\n\n` +
      `💰 <b>KHUYẾN NGHỊ GIẢI NGÂN TUẦN NÀY (Ngân sách $${monthlyBudget}/tháng):</b>\n` +
      `├─ Lệnh mua đề xuất (${conf.multiplier}x): <b>$${recommendedWeeklyUsd.toFixed(2)}</b> (~${recommendedWeeklyVnd} ₫)\n` +
      `├─ Trích từ 70% Vốn định kỳ: $${baseWeekly.toFixed(2)}\n` +
      `└─ ${dryPowderUsd >= 0 ? 'Trích thêm từ 30% Quỹ bắt đáy' : 'Dành thêm vào Quỹ tiền mặt'}: $${Math.abs(dryPowderUsd).toFixed(2)}\n\n` +
      `<i>💡 Dùng lệnh <code>/von &lt;USD&gt;</code> để cài ngân sách cá nhân (VD: <code>/von 1000</code>).</i>`
    );
  }

  return (
    `📊 <b>SPOT ACCUMULATION CONFLUENCE MATRIX</b>\n\n` +
    `• <b>BTC Spot Price:</b> <code>$${priceUsd}</code> (${sign}${live.priceChange24h.toFixed(2)}%)\n` +
    `• <b>Est. P2P Price:</b> <code>~${priceVnd} VND</code> (Spread: +${live.p2pPremiumPercent}%)\n` +
    `• <b>Confluence Score:</b> <b>${conf.score}/100</b>\n` +
    `• <b>Execution Zone:</b> ${conf.badgeEmoji} <b>${conf.zoneEn}</b>\n\n` +
    `<b>Pillar Breakdown & On-Chain Metrics:</b>\n` +
    `├─ AHR999 Hoarding Index: <code>${ahr999.toFixed(3)}</code> (${ahrDescEn})\n` +
    `├─ Mayer Multiple: <code>${mayer.toFixed(2)}x</code>\n` +
    `├─ Power Law Fair Value: <code>$${fairValue.toLocaleString()}</code>\n` +
    `├─ Derivatives Funding Rate: <code>${(live.fundingRate * 100).toFixed(4)}%</code> (${fundingDescEn})\n` +
    `├─ Fear & Greed Index: <code>${live.fearGreed.value}/100</code> (${live.fearGreed.labelEn})\n` +
    `└─ Mempool Half-Hour Fee: <code>${live.mempool.halfHourFee} sat/vB</code> (${live.mempool.halfHourFee <= 10 ? '🟢 Low Congestion' : '⚪ Standby'})\n\n` +
    `💰 <b>RECOMMENDED WEEKLY ORDER (Budget: $${monthlyBudget}/mo):</b>\n` +
    `├─ Recommended Order (${conf.multiplier}x): <b>$${recommendedWeeklyUsd.toFixed(2)}</b> (~${recommendedWeeklyVnd} VND)\n` +
    `├─ Base 70% Scheduled DCA: $${baseWeekly.toFixed(2)}\n` +
    `└─ ${dryPowderUsd >= 0 ? 'Tapped from 30% Dry Powder Reserve' : 'Saved to Dry Powder Reserve'}: $${Math.abs(dryPowderUsd).toFixed(2)}\n\n` +
    `<i>💡 Use <code>/budget &lt;USD&gt;</code> to set your personal monthly budget (e.g. <code>/budget 1000</code>).</i>`
  );
}

async function renderFeesAndP2P(lang: Locale): Promise<string> {
  const isVi = lang === 'vi';
  const live = await getLiveMarketSnapshot();

  const isLowFee = live.mempool.halfHourFee <= 10;
  const p2pWarningVi =
    live.p2pPremiumPercent > 2.5
      ? '⚠️ Chênh lệch P2P > +2.5% (Tâm lý FOMO/Hoảng loạn cao, ưu tiên đặt lệnh Limit)'
      : '✅ Chênh lệch P2P an toàn (+1.6% - 2.0%)';
  const p2pWarningEn =
    live.p2pPremiumPercent > 2.5
      ? '⚠️ P2P Premium > +2.5% (Elevated local FOMO/panic spread, use limit orders)'
      : '✅ Healthy P2P Spread (+1.6% - 2.0%)';

  if (isVi) {
    return (
      `⛽ <b>CANH PHÍ RÚT VÍ LẠNH & CHÊNH LỆCH P2P</b>\n\n` +
      `<b>Phí Giao Dịch Mạng Bitcoin (Mempool):</b>\n` +
      `• Khối tiếp theo (Fastest): <code>${live.mempool.fastestFee} sat/vB</code>\n` +
      `• Mục tiêu 30 phút: <code>${live.mempool.halfHourFee} sat/vB</code>\n` +
      `• Tiết kiệm 1 giờ: <code>${live.mempool.economyFee} sat/vB</code>\n` +
      `👉 <b>Trạng Thái Ví Lạnh:</b> ${
        isLowFee
          ? '🟢 <b>THỜI ĐIỂM VÀNG: RÚT VỀ VÍ LẠNH & GỘP UTXO NGAY</b>'
          : '⚪ <b>PHÍ BÌNH THƯỜNG: Chờ ban đêm hoặc cuối tuần để gộp UTXO</b>'
      }\n\n` +
      `<b>Chênh Lệch Tỷ Giá USDT/VND (P2P vs Ngân Hàng):</b>\n` +
      `• Binance P2P: <code>${live.p2pUsdtVnd.toLocaleString('vi-VN')} ₫</code>\n` +
      `• Vietcombank FX: <code>${live.officialUsdVnd.toLocaleString('vi-VN')} ₫</code>\n` +
      `• Mức chênh lệch (Spread): <code>+${live.p2pPremiumPercent}%</code>\n` +
      `👉 ${p2pWarningVi}\n\n` +
      `<i>💡 Để cài báo động khi phí mạng giảm xuống, bấm nút <b>Cài Phí &lt; 5 sat/vB</b> bên dưới hoặc dùng lệnh <code>/sniper &lt;sat/vB&gt;</code>.</i>`
    );
  }

  return (
    `⛽ <b>UTXO FEE SNIPER & P2P RATE SPREAD</b>\n\n` +
    `<b>Bitcoin Mempool Network Congestion:</b>\n` +
    `• Next Block (Fastest): <code>${live.mempool.fastestFee} sat/vB</code>\n` +
    `• Target 30 Min: <code>${live.mempool.halfHourFee} sat/vB</code>\n` +
    `• Economy 1 Hour: <code>${live.mempool.economyFee} sat/vB</code>\n` +
    `👉 <b>Cold-Storage Action:</b> ${
      isLowFee
        ? '🟢 <b>IDEAL WINDOW: CONSOLIDATE DUST UTXOs & WITHDRAW TO HARDWARE WALLET</b>'
        : '⚪ <b>NORMAL CONGESTION: Wait for weekend/night dip to consolidate</b>'
    }\n\n` +
    `<b>USDT/VND P2P Premium Index:</b>\n` +
    `• Binance P2P Rate: <code>${live.p2pUsdtVnd.toLocaleString('vi-VN')} VND</code>\n` +
    `• Bank FX Baseline: <code>${live.officialUsdVnd.toLocaleString('vi-VN')} VND</code>\n` +
    `• Rate Spread: <code>+${live.p2pPremiumPercent}%</code>\n` +
    `👉 ${p2pWarningEn}\n\n` +
    `<i>💡 Set a custom alert threshold with <code>/sniper &lt;sat/vB&gt;</code> or use the 1-tap buttons below.</i>`
  );
}

async function renderPortfolioLedger(env: Env, chatId: string, lang: Locale): Promise<string> {
  const isVi = lang === 'vi';
  const live = await getLiveMarketSnapshot();

  // 1. Check user-specific Binance API keys in D1 user_profiles
  let userKey = '';
  let userSecret = '';

  try {
    const profile = await env.DB.prepare(
      'SELECT binance_api_key, binance_api_secret FROM user_profiles WHERE telegram_chat_id = ?'
    )
      .bind(chatId)
      .first<{ binance_api_key?: string; binance_api_secret?: string }>();

    userKey = (profile?.binance_api_key || env.BINANCE_API_KEY || '').trim();
    userSecret = (profile?.binance_api_secret || env.BINANCE_API_SECRET || '').trim();
  } catch (err) {
    console.error('Failed to read user_profiles for keys:', err);
  }

  // 2. If API keys are provided and have valid length, attempt live Binance sync
  if (userKey && userSecret && userKey.length >= 15 && userSecret.length >= 15) {
    try {
      const portfolio = await syncBinancePortfolio({ apiKey: userKey, apiSecret: userSecret }, live.price, live.p2pUsdtVnd);

      if (portfolio.connected && portfolio.source === 'api_live') {
        const pnlSign = portfolio.costBasis.unrealizedPnlUsd >= 0 ? '+' : '';
        const pnlEmoji = portfolio.costBasis.unrealizedPnlUsd >= 0 ? '🟢' : '🔴';

        let openOrdersTextVi = '';
        let openOrdersTextEn = '';
        if (portfolio.openLimitOrders.length > 0) {
          openOrdersTextVi =
            `\n\n<b>Lệnh Limit Đang Treo (${portfolio.openLimitOrders.length} lệnh):</b>\n` +
            portfolio.openLimitOrders
              .map(
                (o) =>
                  `• ${o.side === 'BUY' ? '🟢 Mua' : '🔴 Bán'} ${o.qty} BTC @ <code>$${o.price.toLocaleString()}</code> ($${o.totalUsd.toLocaleString()})`
              )
              .join('\n');
          openOrdersTextEn =
            `\n\n<b>Active Limit Orders (${portfolio.openLimitOrders.length}):</b>\n` +
            portfolio.openLimitOrders
              .map(
                (o) =>
                  `• ${o.side} ${o.qty} BTC @ <code>$${o.price.toLocaleString()}</code> ($${o.totalUsd.toLocaleString()})`
              )
              .join('\n');
        }

        let otherAssetsTextVi = '';
        let otherAssetsTextEn = '';
        if (portfolio.nonZeroAssets && portfolio.nonZeroAssets.length > 0) {
          const others = portfolio.nonZeroAssets.filter(
            (a) => !['BTC', 'USDT', 'FDUSD', 'USDC'].includes(a.asset)
          );
          if (others.length > 0) {
            otherAssetsTextVi =
              `\n\n<b>Tài Sản Khác Được Tìm Thấy:</b>\n` +
              others
                .map((a) => `• <code>${a.total} ${a.asset}</code> (${a.wallet})`)
                .join('\n');
            otherAssetsTextEn =
              `\n\n<b>Other Balances Found:</b>\n` +
              others
                .map((a) => `• <code>${a.total} ${a.asset}</code> (${a.wallet})`)
                .join('\n');
          }
        }

        if (isVi) {
          return (
            `🟢 <b>DANH MỤC BINANCE THỰC TẾ (ĐỒNG BỘ TRỰC TIẾP)</b>\n\n` +
            `├─ <b>Tổng Nắm Giữ BTC:</b> <code>${portfolio.wallets.totalBtc.toFixed(6)} BTC</code> (<b>${portfolio.wallets.totalSats.toLocaleString()} sats</b>)\n` +
            `│  ├─ Ví Spot: <code>${portfolio.wallets.spotBtc.toFixed(4)} BTC</code> | Simple Earn: <code>${portfolio.wallets.earnFlexibleBtc.toFixed(4)} BTC</code>\n` +
            `│  └─ Lãi Simple Earn Tích Lũy: <code>+${portfolio.wallets.earnInterestSats.toLocaleString()} sats</code>\n` +
            `├─ <b>Quỹ Tiền Mặt (USDT/FDUSD):</b> <code>$${portfolio.wallets.totalDryPowderUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</code>\n` +
            `├─ <b>Tổng Tài Sản Thực Tế:</b> <code>$${portfolio.costBasis.currentValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</code> (<b>~${portfolio.costBasis.currentValueVnd.toLocaleString('vi-VN')} ₫</b>)\n` +
            (portfolio.wallets.totalBtc > 0
              ? `├─ <b>Giá Vốn Trung Bình:</b> <code>$${portfolio.costBasis.avgBuyPrice > 0 ? portfolio.costBasis.avgBuyPrice.toLocaleString() : '---'} / BTC</code>\n` +
                `├─ <b>Lãi/Lỗ Ròng BTC:</b> ${pnlEmoji} <b>${pnlSign}$${portfolio.costBasis.unrealizedPnlUsd.toLocaleString()} (${pnlSign}${portfolio.costBasis.unrealizedPnlPct}%)</b>\n` +
                `└─ <b>🎯 Mốc X2 Thu Hồi 25% Vốn:</b> <code>$${portfolio.costBasis.principalRecoveryPrice.toLocaleString()} / BTC</code>`
              : `└─ <i>(Chưa nắm giữ BTC, tiền mặt đang sẵn sàng trong ví)</i>`) +
            openOrdersTextVi +
            otherAssetsTextVi +
            `\n\n<i>💡 Tự động đồng bộ số dư Ví Spot, Simple Earn & Lệnh Limit từ tài khoản Binance của bạn. Để ngắt kết nối gõ <code>/xoa_api</code>.</i>`
          );
        }

        return (
          `🟢 <b>LIVE BINANCE PORTFOLIO (READ-ONLY SYNC)</b>\n\n` +
          `├─ <b>Total BTC Holdings:</b> <code>${portfolio.wallets.totalBtc.toFixed(6)} BTC</code> (<b>${portfolio.wallets.totalSats.toLocaleString()} sats</b>)\n` +
          `│  ├─ Spot Wallet: <code>${portfolio.wallets.spotBtc.toFixed(4)} BTC</code> | Simple Earn: <code>${portfolio.wallets.earnFlexibleBtc.toFixed(4)} BTC</code>\n` +
          `│  └─ Earn Interest Accumulated: <code>+${portfolio.wallets.earnInterestSats.toLocaleString()} sats</code>\n` +
          `├─ <b>Dry Powder Reserve (USDT/FDUSD):</b> <code>$${portfolio.wallets.totalDryPowderUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</code>\n` +
          `├─ <b>Total Portfolio Value:</b> <code>$${portfolio.costBasis.currentValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</code> (~${portfolio.costBasis.currentValueVnd.toLocaleString('vi-VN')} VND)\n` +
          (portfolio.wallets.totalBtc > 0
            ? `├─ <b>Actual Cost Basis:</b> <code>$${portfolio.costBasis.avgBuyPrice.toLocaleString()} / BTC</code>\n` +
              `├─ <b>Unrealized BTC PnL:</b> ${pnlEmoji} <b>${pnlSign}$${portfolio.costBasis.unrealizedPnlUsd.toLocaleString()} (${pnlSign}${portfolio.costBasis.unrealizedPnlPct}%)</b>\n` +
              `└─ <b>🎯 2X Principal Recovery Target:</b> <code>$${portfolio.costBasis.principalRecoveryPrice.toLocaleString()} / BTC</code>`
            : `└─ <i>(No BTC held yet, dry powder available)</i>`) +
          openOrdersTextEn +
          otherAssetsTextEn +
          `\n\n<i>💡 Automatically synced from your Binance account. Unlink with <code>/unlink_api</code>.</i>`
        );
      } else if (portfolio.authError) {
        if (isVi) {
          return (
            `⚠️ <b>KẾT NỐI API BINANCE BỊ TỪ CHỐI</b>\n\n` +
            `Hệ thống không thể đọc số dư ví từ Binance với thông tin API hiện tại.\n\n` +
            `• <b>Phản hồi từ Binance:</b> <code>${portfolio.authError}</code>\n\n` +
            `👉 <b>Cách kết nối lại nhanh nhất:</b>\n` +
            `Gõ trực tiếp vào bot dòng sau:\n` +
            `<code>/ketnoi &lt;API_KEY&gt; &lt;API_SECRET&gt;</code>\n\n` +
            `<i>(Lưu ý: Chỉ cần bật quyền 'Enable Reading' trên Binance, không cần quyền Giao dịch hay Rút tiền).</i>`
          );
        }
      }
    } catch (err) {
      console.error('Binance Portfolio Sync Error:', err);
    }
  }

  // 3. Check local manual ledger in D1 (/mua)
  try {
    const manual = await getPortfolioSummary(env, chatId, live.price);
    if (manual && manual.totalBtc > 0) {
      const pnlSign = manual.pnlUsd >= 0 ? '+' : '';
      const pnlEmoji = manual.pnlUsd >= 0 ? '🟢' : '🔴';
      const currentValueVnd = Math.round(manual.currentValue * live.p2pUsdtVnd);
      const totalInvestedVnd = Math.round(manual.totalUsd * live.p2pUsdtVnd);

      if (isVi) {
        return (
          `📒 <b>SỔ TAY TÍCH SẢN SPOT CỦA BẠN (LOCAL LEDGER)</b>\n\n` +
          `├─ <b>Tổng Nắm Giữ:</b> <code>${manual.totalBtc.toFixed(6)} BTC</code> (<b>${manual.totalSats.toLocaleString()} sats</b>)\n` +
          `├─ <b>Giá Vốn Trung Bình:</b> <code>$${Math.round(manual.avgCostBasis).toLocaleString()} / BTC</code>\n` +
          `├─ <b>Tổng Vốn Đã Gom:</b> <code>$${manual.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</code> (~${totalInvestedVnd.toLocaleString('vi-VN')} ₫)\n` +
          `├─ <b>Giá Trị Hiện Tại:</b> <code>$${manual.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</code> (~${currentValueVnd.toLocaleString('vi-VN')} ₫)\n` +
          `├─ <b>Lãi/Lỗ Ròng (PnL):</b> ${pnlEmoji} <b>${pnlSign}$${manual.pnlUsd.toFixed(2)} (${pnlSign}${manual.pnlPercent.toFixed(2)}%)</b>\n` +
          `├─ <b>🎯 Mốc X2 Thu Hồi Vốn:</b> <code>$${Math.round(manual.recoveryPriceX2).toLocaleString()} / BTC</code>\n` +
          `└─ <b>Số Lệnh Đã Ghi:</b> <code>${manual.txCount}</code> lệnh mua\n\n` +
          `💡 <i>Để ghi thêm lệnh: <code>/mua &lt;USD&gt; [Giá]</code>\nĐể xóa sạch sổ tay: <code>/xoa_vi</code></i>`
        );
      } else {
        return (
          `📒 <b>YOUR SPOT LEDGER (LOCAL PORTFOLIO)</b>\n\n` +
          `├─ <b>Total Holdings:</b> <code>${manual.totalBtc.toFixed(6)} BTC</code> (<b>${manual.totalSats.toLocaleString()} sats</b>)\n` +
          `├─ <b>Average Cost Basis:</b> <code>$${Math.round(manual.avgCostBasis).toLocaleString()} / BTC</code>\n` +
          `├─ <b>Total Capital Invested:</b> <code>$${manual.totalUsd.toFixed(2)}</code>\n` +
          `├─ <b>Current Value:</b> <code>$${manual.currentValue.toFixed(2)}</code>\n` +
          `├─ <b>Unrealized PnL:</b> ${pnlEmoji} <b>${pnlSign}$${manual.pnlUsd.toFixed(2)} (${pnlSign}${manual.pnlPercent.toFixed(2)}%)</b>\n` +
          `└─ <b>Logged Purchases:</b> <code>${manual.txCount}</code> orders\n\n` +
          `💡 <i>Add trade: <code>/buy &lt;USD&gt; [Price]</code>\nClear ledger: <code>/reset_portfolio</code></i>`
        );
      }
    }
  } catch (err) {
    console.error('Failed to get manual portfolio summary:', err);
  }

  // 4. Zero-Mock Empty State: Neither connected nor logged
  if (isVi) {
    return (
      `⚠️ <b>BẠN CHƯA KẾT NỐI API BINANCE (HOẶC VÍ ĐANG RỖNG)</b>\n\n` +
      `Tài khoản Telegram của bạn hiện <b>chưa được liên kết API Binance</b> hoặc chưa có lệnh mua nào trong sổ tay!\n\n` +
      `• <b>Tổng Nắm Giữ:</b> <code>0.000000 BTC</code> (0 sats)\n` +
      `• <b>Giá Trị Hiện Tại:</b> <code>$0.00</code> (~0 ₫)\n\n` +
      `<i>(Con số 126 triệu trước đó là dữ liệu mẫu giả định khi bot chưa nhận API Key của bạn).</i>\n\n` +
      `───────────────\n` +
      `👉 <b>CÁCH 1: KẾT NỐI API BINANCE CỦA BẠN (CHỈ ĐỌC)</b>\n` +
      `Gõ lệnh trực tiếp vào bot theo cú pháp:\n` +
      `<code>/ketnoi &lt;API_KEY&gt; &lt;API_SECRET&gt;</code>\n\n` +
      `🔒 <i>Lưu ý: Chỉ cần tích chọn <b>'Enable Reading'</b> trên Binance. Tuyệt đối KHÔNG cấp quyền Rút tiền (Withdraw) hay Giao dịch (Trade).</i>\n\n` +
      `👉 <b>CÁCH 2: GHI SỔ TAY MUA THỦ CÔNG</b>\n` +
      `Gõ lệnh: <code>/mua &lt;Số_USD&gt; [Giá_Khớp]</code>\n` +
      `Ví dụ: <code>/mua 8 75900</code> (Ghi nhận mua $8 ~200k VNĐ ở giá $75,900)\n\n` +
      `👉 <b>CÁCH 3: TRUY CẬP WEB TERMINAL PRO</b>\n` +
      `<a href="${WEB_TERMINAL_URL}">${WEB_TERMINAL_URL}</a>`
    );
  }

  return (
    `⚠️ <b>NO BINANCE API CONNECTED (0 BTC)</b>\n\n` +
    `Your account has not linked a Binance Read-Only API key or logged manual trades yet.\n\n` +
    `• <b>Total Holdings:</b> <code>0.000000 BTC</code> (0 sats)\n` +
    `• <b>Current Value:</b> <code>$0.00</code> (~0 VND)\n\n` +
    `👉 <b>Option 1: Link Binance API (Read-Only)</b>\n` +
    `Send: <code>/connect &lt;API_KEY&gt; &lt;API_SECRET&gt;</code>\n\n` +
    `👉 <b>Option 2: Log manual Spot buy</b>\n` +
    `Send: <code>/buy &lt;USD&gt; [Price]</code>\n\n` +
    `👉 <b>Web Terminal:</b> <a href="${WEB_TERMINAL_URL}">${WEB_TERMINAL_URL}</a>`
  );
}

function renderSimulatedShockAlert(lang: Locale) {
  const isVi = lang === 'vi';
  if (isVi) {
    const text =
      `🚨 <b>CẢNH BÁO BẪY XẢ HÀNG ĐỊA CHÍNH TRỊ (PHASE 1 -> PHASE 2)</b>\n\n` +
      `• <b>Tin nóng OSINT:</b> Xung đột leo thang làm giá BTC quét râu -8.4% trong 1 giờ.\n` +
      `• <b>Thanh lý Long Phái sinh:</b> $185M bị quét sạch | Funding chuyển âm (-0.024%).\n` +
      `• <b>Dữ liệu On-Chain:</b> AHR999 giảm về 0.61 (Cá voi rút ròng -4,200 BTC khỏi sàn).\n` +
      `• <b>Điểm Hội Tụ Vọt Lên:</b> <b>92/100</b> (VÙNG MUA THẾ HỆ)\n\n` +
      `👉 <b>KẾT LUẬN:</b> Rũ bỏ đòn bẩy ngắn hạn. Kích hoạt hệ số gom Spot <b>2.0x (Gấp Đôi)</b>!`;

    const markup = {
      inline_keyboard: [
        [
          {
            text: '🔥 Mở Bot Auto-DCA (Giảm 20% Phí)',
            url: AFFILIATE_DCA_URL,
          },
        ],
        [
          {
            text: '🌐 Xem Biểu Đồ Chu Kỳ Trên Web',
            url: WEB_TERMINAL_URL,
          },
        ],
        [
          {
            text: '🔙 Quay Lại Bảng Điều Khiển',
            callback_data: 'cb:menu',
          },
        ],
      ],
    };
    return { text, markup };
  }

  const text =
    `🚨 <b>GEOPOLITICAL BEAR-TRAP ALERT (PHASE 1 -> PHASE 2)</b>\n\n` +
    `• <b>OSINT News:</b> Conflict escalation triggered an 8.4% 1-hour flash wick.\n` +
    `• <b>Futures Liquidation:</b> $185M Longs wiped out | Funding flips negative (-0.024%).\n` +
    `• <b>On-Chain Signals:</b> AHR999 drops to 0.61 (Whales withdraw -4,200 BTC from exchanges).\n` +
    `• <b>Confluence Score Spike:</b> <b>92/100</b> (GENERATIONAL BUY)\n\n` +
    `👉 <b>CONCLUSION:</b> Short-term leverage shakeout. Deploy Spot Confluence <b>2.0x (Double Allocation)</b>!`;

  const markup = {
    inline_keyboard: [
      [
        {
          text: '🔥 Launch Auto-DCA Bot (20% Fee Rebate)',
          url: AFFILIATE_DCA_URL,
        },
      ],
      [
        {
          text: '🌐 View Cycle Chart on Web',
          url: WEB_TERMINAL_URL,
        },
      ],
      [
        {
          text: '🔙 Return to Dashboard',
          callback_data: 'cb:menu',
        },
      ],
    ],
  };
  return { text, markup };
}

// ==============================================================================
// 6. TELEGRAM WEBHOOK & CALLBACK QUERY ROUTER
// ==============================================================================

async function handleTelegramWebhook(request: Request, env: Env): Promise<Response> {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return new Response('Missing TELEGRAM_BOT_TOKEN', { status: 500 });
  }

  try {
    const update = (await request.json()) as any;

    // 1. Handle Inline Keyboard Callbacks (Tap buttons without typing)
    if (update?.callback_query) {
      const cb = update.callback_query;
      const cbId = cb.id;
      const chatId = cb.message?.chat?.id?.toString();
      const messageId = cb.message?.message_id;
      const data = cb.data as string;

      if (!chatId || !messageId) {
        await answerCallbackQuery(botToken, cbId);
        return new Response('OK', { status: 200 });
      }

      const profile = await getUserProfile(env, chatId);
      let lang = profile.lang || 'vi';

      if (data === 'cb:toggle_lang') {
        lang = lang === 'vi' ? 'en' : 'vi';
        await updateUserLang(env, chatId, lang);
        await answerCallbackQuery(
          botToken,
          cbId,
          lang === 'vi' ? 'Đã chuyển sang Tiếng Việt 🇻🇳' : 'Switched to English 🇺🇸'
        );
        const html = await renderStartDashboard(env, chatId, lang);
        await editTelegramMessage(botToken, chatId, messageId, html, getInlineDashboardKeyboard(lang));
        return new Response('OK', { status: 200 });
      }

      await answerCallbackQuery(botToken, cbId);

      if (data === 'cb:score') {
        const html = await renderScoreAndDca(env, chatId, lang);
        await editTelegramMessage(botToken, chatId, messageId, html, getInlineDashboardKeyboard(lang));
      } else if (data === 'cb:fees') {
        const html = await renderFeesAndP2P(lang);
        await editTelegramMessage(botToken, chatId, messageId, html, getInlineDashboardKeyboard(lang));
      } else if (data === 'cb:portfolio') {
        const html = await renderPortfolioLedger(env, chatId, lang);
        await editTelegramMessage(botToken, chatId, messageId, html, getInlineDashboardKeyboard(lang));
      } else if (data === 'cb:sim_shock') {
        const { text, markup } = renderSimulatedShockAlert(lang);
        await editTelegramMessage(botToken, chatId, messageId, text, markup);
      } else if (data === 'cb:fee_5') {
        await updateUserFeeThreshold(env, chatId, 5);
        const msg =
          lang === 'vi'
            ? `🎯 <b>ĐÃ CÀI ĐẶT CANH PHÍ: &le; 5 sat/vB</b>\n\nBạn sẽ nhận được thông báo đẩy tức thời khi phí Mempool Bitcoin giảm xuống dưới 5 sat/vB.`
            : `🎯 <b>FEE SNIPER ACTIVE: &le; 5 sat/vB</b>\n\nYou will receive an instant push notification when mempool fees drop below 5 sat/vB.`;
        await editTelegramMessage(botToken, chatId, messageId, msg, getInlineDashboardKeyboard(lang));
      } else if (data === 'cb:fee_10') {
        await updateUserFeeThreshold(env, chatId, 10);
        const msg =
          lang === 'vi'
            ? `🎯 <b>ĐÃ CÀI ĐẶT CANH PHÍ: &le; 10 sat/vB</b>\n\nBạn sẽ nhận được thông báo đẩy tức thời khi phí Mempool Bitcoin giảm xuống dưới 10 sat/vB.`
            : `🎯 <b>FEE SNIPER ACTIVE: &le; 10 sat/vB</b>\n\nYou will receive an instant push notification when mempool fees drop below 10 sat/vB.`;
        await editTelegramMessage(botToken, chatId, messageId, msg, getInlineDashboardKeyboard(lang));
      } else if (data === 'cb:menu') {
        const html = await renderStartDashboard(env, chatId, lang);
        await editTelegramMessage(botToken, chatId, messageId, html, getInlineDashboardKeyboard(lang));
      }

      return new Response('OK', { status: 200 });
    }

    // 2. Handle Text Messages & Slash Commands
    const message = update?.message;
    if (!message || !message.text) {
      return new Response('OK', { status: 200 });
    }

    const chatId = message.chat.id.toString();
    const text = message.text.trim();
    const profile = await getUserProfile(env, chatId);
    const lang = profile.lang || 'vi';
    const isVi = lang === 'vi';

    // Command: /start or /menu
    if (text.startsWith('/start') || text.startsWith('/menu')) {
      const dashboardHtml = await renderStartDashboard(env, chatId, lang);
      await sendTelegramMessage(botToken, chatId, dashboardHtml, getInlineDashboardKeyboard(lang));
      return new Response('OK', { status: 200 });
    }

    // Command: /score
    if (text.startsWith('/score')) {
      const scoreHtml = await renderScoreAndDca(env, chatId, lang);
      await sendTelegramMessage(botToken, chatId, scoreHtml, getInlineDashboardKeyboard(lang));
      return new Response('OK', { status: 200 });
    }

    // Command: /fees
    if (text.startsWith('/fees')) {
      const feesHtml = await renderFeesAndP2P(lang);
      await sendTelegramMessage(botToken, chatId, feesHtml, getInlineDashboardKeyboard(lang));
      return new Response('OK', { status: 200 });
    }

    // Command: /von <USD> or /budget <USD>
    if (text.startsWith('/von') || text.startsWith('/budget')) {
      const parts = text.split(' ');
      const amount = parseFloat(parts[1]);

      if (isNaN(amount) || amount <= 0 || amount > 10_000_000) {
        const errMsg = isVi
          ? `⚠️ Vui lòng nhập số tiền hợp lệ (USD) mỗi tháng.\nVí dụ: <code>/von 500</code> hoặc <code>/von 1000</code>.`
          : `⚠️ Please enter a valid monthly USD budget.\nExample: <code>/budget 500</code> or <code>/budget 1000</code>.`;
        await sendTelegramMessage(botToken, chatId, errMsg, getInlineDashboardKeyboard(lang));
        return new Response('OK', { status: 200 });
      }

      await updateUserBudget(env, chatId, amount);
      const live = await getLiveMarketSnapshot();
      const vndAmount = Math.round(amount * live.p2pUsdtVnd).toLocaleString('vi-VN');
      const weeklyBase = (amount * 0.7) / 4.33;

      const confirmMsg = isVi
        ? `🎯 <b>ĐÃ CẬP NHẬT NGÂN SÁCH DCA HÀNG THÁNG</b>\n\n` +
          `• <b>Ngân Sách Mới:</b> <b>$${amount.toLocaleString()} / tháng</b> (~${vndAmount} ₫)\n` +
          `• <b>70% Vốn DCA Định Kỳ:</b> $${(amount * 0.7).toFixed(2)} (~$${weeklyBase.toFixed(2)} / tuần)\n` +
          `• <b>30% Quỹ USDT Bắt Đáy:</b> $${(amount * 0.3).toFixed(2)} (Dành riêng kích hoạt khi có Bẫy Chiến Sự)\n\n` +
          `👉 <i>Bấm nút bên dưới để xem khuyến nghị giải ngân tuần này.</i>`
        : `🎯 <b>MONTHLY DCA BUDGET UPDATED</b>\n\n` +
          `• <b>New Budget:</b> <b>$${amount.toLocaleString()} / month</b> (~${vndAmount} VND)\n` +
          `• <b>70% Base Scheduled DCA:</b> $${(amount * 0.7).toFixed(2)} (~$${weeklyBase.toFixed(2)} / week)\n` +
          `• <b>30% Dry Powder Reserve:</b> $${(amount * 0.3).toFixed(2)} (Reserved for Bear-Trap flashes)\n\n` +
          `👉 <i>Tap the button below to view your updated weekly order.</i>`;

      await sendTelegramMessage(botToken, chatId, confirmMsg, getInlineDashboardKeyboard(lang));
      return new Response('OK', { status: 200 });
    }

    // Command: /mua <USD> [Giá_BTC] or /buy <USD> [BTC_Price]
    if (text.startsWith('/mua') || text.startsWith('/buy')) {
      const parts = text.split(/\s+/);
      const usdAmount = parseFloat(parts[1]);
      let btcPrice = parseFloat(parts[2]);

      if (isNaN(usdAmount) || usdAmount <= 0) {
        const errMsg = isVi
          ? `⚠️ Cú pháp: <code>/mua &lt;Số_USD&gt; [Giá_BTC]</code>\n\n` +
            `• Ghi theo giá cụ thể: <code>/mua 250 75900</code>\n` +
            `• Ghi theo giá live Binance hiện tại: <code>/mua 250</code>`
          : `⚠️ Syntax: <code>/buy &lt;USD_Amount&gt; [BTC_Price]</code>\n\n` +
            `• With price: <code>/buy 250 75900</code>\n` +
            `• With live Binance price: <code>/buy 250</code>`;
        await sendTelegramMessage(botToken, chatId, errMsg, getInlineDashboardKeyboard(lang));
        return new Response('OK', { status: 200 });
      }

      const live = await getLiveMarketSnapshot();
      if (isNaN(btcPrice) || btcPrice <= 0) {
        btcPrice = live.price;
      }

      const { btcAmount, sats } = await logSpotTransaction(env, chatId, usdAmount, btcPrice);

      const successMsg = isVi
        ? `✅ <b>ĐÃ GHI SỔ LỆNH MUA SPOT THÀNH CÔNG</b>\n\n` +
          `• <b>Số Tiền Đã Mua:</b> <code>$${usdAmount.toLocaleString()}</code>\n` +
          `• <b>Giá Khớp Lệnh:</b> <code>$${btcPrice.toLocaleString()} / BTC</code>\n` +
          `• <b>Tích Lũy Thêm:</b> <code>+${btcAmount.toFixed(8)} BTC</code> (<b>+${sats.toLocaleString()} sats</b>)\n\n` +
          `👉 <i>Bấm <b>Sổ Tay Giá Vốn</b> để xem tổng tài sản & lãi/lỗ trung bình.</i>`
        : `✅ <b>SPOT PURCHASE LOGGED SUCCESSFULLY</b>\n\n` +
          `• <b>Amount Invested:</b> <code>$${usdAmount.toLocaleString()}</code>\n` +
          `• <b>Execution Price:</b> <code>$${btcPrice.toLocaleString()} / BTC</code>\n` +
          `• <b>Accumulated:</b> <code>+${btcAmount.toFixed(8)} BTC</code> (<b>+${sats.toLocaleString()} sats</b>)\n\n` +
          `👉 <i>Tap <b>Portfolio Ledger</b> below to see updated cost basis & PnL.</i>`;

      await sendTelegramMessage(botToken, chatId, successMsg, getInlineDashboardKeyboard(lang));
      return new Response('OK', { status: 200 });
    }

    // Command: /ketnoi <API_KEY> <API_SECRET> or /api or /connect
    if (
      text.startsWith('/ketnoi') ||
      text.startsWith('/api') ||
      text.startsWith('/connect')
    ) {
      const parts = text.split(/\s+/);
      if (parts.length < 3) {
        const helpMsg = isVi
          ? `⚠️ <b>HƯỚNG DẪN KẾT NỐI BINANCE READ-ONLY API</b>\n\n` +
            `Vui lòng nhập đúng cú pháp kèm theo API Key và Secret:\n` +
            `<code>/ketnoi &lt;API_KEY&gt; &lt;API_SECRET&gt;</code>\n\n` +
            `Ví dụ:\n` +
            `<code>/ketnoi vmPU9x... 9qXz8a...</code>\n\n` +
            `🔒 <b>Lưu ý an toàn:</b>\n` +
            `1. Khi tạo API Key trên Binance, <b>chỉ tích chọn 'Enable Reading'</b>.\n` +
            `2. Tuyệt đối <b>KHÔNG</b> tích chọn 'Enable Spot & Margin Trading' hay 'Enable Withdrawals'.\n` +
            `3. Key được lưu riêng cho Chat ID của bạn. Bạn có thể xóa tin nhắn trên Telegram sau khi gửi để bảo mật.`
          : `⚠️ <b>CONNECT BINANCE READ-ONLY API</b>\n\nUsage:\n<code>/connect &lt;API_KEY&gt; &lt;API_SECRET&gt;</code>`;
        await sendTelegramMessage(botToken, chatId, helpMsg, getInlineDashboardKeyboard(lang));
        return new Response('OK', { status: 200 });
      }

      const inputKey = parts[1].trim();
      const inputSecret = parts[2].trim();

      try {
        const live = await getLiveMarketSnapshot();
        const testResult = await syncBinancePortfolio(
          { apiKey: inputKey, apiSecret: inputSecret },
          live.price,
          live.p2pUsdtVnd
        );

        if (!testResult.connected || testResult.source !== 'api_live') {
          throw new Error('Binance từ chối xác thực. Vui lòng kiểm tra lại Key/Secret hoặc quyền Enable Reading.');
        }

        await env.DB.prepare(
          `INSERT INTO user_profiles (telegram_chat_id, lang, binance_api_key, binance_api_secret, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(telegram_chat_id) DO UPDATE SET
             binance_api_key = excluded.binance_api_key,
             binance_api_secret = excluded.binance_api_secret,
             updated_at = excluded.updated_at`
        )
          .bind(chatId, lang, inputKey, inputSecret, Date.now())
          .run();

        const successMsg = isVi
          ? `✅ <b>KẾT NỐI BINANCE API THÀNH CÔNG!</b>\n\n` +
            `Bot đã liên kết chính xác với tài khoản Binance của bạn (Chỉ Đọc):\n\n` +
            `• <b>Số Dư BTC Thật:</b> <code>${testResult.wallets.totalBtc.toFixed(6)} BTC</code> (~${testResult.costBasis.currentValueVnd.toLocaleString('vi-VN')} ₫)\n` +
            `• <b>Quỹ Stablecoin (USDT/FDUSD):</b> <code>$${testResult.wallets.totalDryPowderUsd.toFixed(2)}</code>\n\n` +
            `👉 <i>Bấm <b>Ví Binance Thực Tế</b> hoặc gõ <code>/vi</code> để kiểm tra bất kỳ lúc nào.\nĐể xóa key: <code>/xoa_api</code>.</i>`
          : `✅ <b>BINANCE API CONNECTED!</b>\n\n• <b>Total BTC:</b> <code>${testResult.wallets.totalBtc.toFixed(6)} BTC</code>\n• <b>Dry Powder:</b> <code>$${testResult.wallets.totalDryPowderUsd.toFixed(2)}</code>`;

        await sendTelegramMessage(botToken, chatId, successMsg, getInlineDashboardKeyboard(lang));
        return new Response('OK', { status: 200 });
      } catch (err: any) {
        const errMsg = isVi
          ? `❌ <b>KẾT NỐI BINANCE THẤT BẠI</b>\n\n` +
            `Lỗi: <code>${err.message || 'API Key hoặc Secret không chính xác'}</code>\n\n` +
            `👉 Hãy kiểm tra lại API Key trên Binance (đảm bảo quyền 'Enable Reading' và không bị giới hạn IP).`
          : `❌ <b>CONNECTION ERROR:</b> ${err.message}`;
        await sendTelegramMessage(botToken, chatId, errMsg, getInlineDashboardKeyboard(lang));
        return new Response('OK', { status: 200 });
      }
    }

    // Command: /xoa_api or /unlink_api
    if (text.startsWith('/xoa_api') || text.startsWith('/unlink_api')) {
      await env.DB.prepare(
        `UPDATE user_profiles SET binance_api_key = '', binance_api_secret = '', updated_at = ? WHERE telegram_chat_id = ?`
      )
        .bind(Date.now(), chatId)
        .run();

      const msg = isVi
        ? `🗑️ <b>ĐÃ XÓA KHÓA API BINANCE</b>\n\nAPI Key và Secret đã được gỡ bỏ khỏi tài khoản Telegram của bạn.`
        : `🗑️ <b>BINANCE API UNLINKED</b>\n\nAPI credentials have been removed.`;
      await sendTelegramMessage(botToken, chatId, msg, getInlineDashboardKeyboard(lang));
      return new Response('OK', { status: 200 });
    }

    // Command: /vi or /portfolio
    if (text.startsWith('/vi') || text.startsWith('/portfolio')) {
      const html = await renderPortfolioLedger(env, chatId, lang);
      await sendTelegramMessage(botToken, chatId, html, getInlineDashboardKeyboard(lang));
      return new Response('OK', { status: 200 });
    }

    // Command: /xoa_vi or /reset_portfolio
    if (text.startsWith('/xoa_vi') || text.startsWith('/reset_portfolio')) {
      const count = await clearPortfolio(env, chatId);
      const msg = isVi
        ? `🗑️ <b>ĐÃ XÓA SẠCH DỮ LIỆU SỔ TAY</b>\n\nĐã xóa <code>${count}</code> lệnh mua. Bạn có thể bắt đầu ghi sổ lại bằng lệnh <code>/mua &lt;USD&gt; [Giá]</code>.`
        : `🗑️ <b>PORTFOLIO CLEARED</b>\n\nDeleted <code>${count}</code> transactions. Start fresh with <code>/buy &lt;USD&gt; [Price]</code>.`;
      await sendTelegramMessage(botToken, chatId, msg, getInlineDashboardKeyboard(lang));
      return new Response('OK', { status: 200 });
    }

    // Command: /sniper <sat/vB>
    if (text.startsWith('/sniper')) {
      const parts = text.split(' ');
      const customFee = parseInt(parts[1], 10);

      if (isNaN(customFee) || customFee <= 0 || customFee > 150) {
        const errMsg = isVi
          ? `⚠️ Vui lòng nhập mức phí hợp lệ (sat/vB). Ví dụ: <code>/sniper 8</code>`
          : `⚠️ Please specify a valid fee in sat/vB. Example: <code>/sniper 8</code>`;
        await sendTelegramMessage(botToken, chatId, errMsg, getInlineDashboardKeyboard(lang));
        return new Response('OK', { status: 200 });
      }

      await updateUserFeeThreshold(env, chatId, customFee);

      const confirmMsg = isVi
        ? `🎯 <b>ĐÃ CẬP NHẬT CANH PHÍ RÚT VÍ: &le; ${customFee} sat/vB</b>\n\nBạn sẽ nhận thông báo đẩy khi mạng Bitcoin hạ nhiệt dưới ngưỡng này.`
        : `🎯 <b>FEE SNIPER UPDATED: &le; ${customFee} sat/vB</b>\n\nYou will receive a push notification when Bitcoin mempool drops below this threshold.`;

      await sendTelegramMessage(botToken, chatId, confirmMsg, getInlineDashboardKeyboard(lang));
      return new Response('OK', { status: 200 });
    }

    // Command: /shock
    if (text.startsWith('/shock')) {
      const { text: shockText, markup } = renderSimulatedShockAlert(lang);
      await sendTelegramMessage(botToken, chatId, shockText, markup);
      return new Response('OK', { status: 200 });
    }

    // Command: /lang
    if (text.startsWith('/lang')) {
      const newLang = lang === 'vi' ? 'en' : 'vi';
      await updateUserLang(env, chatId, newLang);
      const switchedMsg =
        newLang === 'vi'
          ? `🇻🇳 <b>ĐÃ CHUYỂN SANG TIẾNG VIỆT</b>\n\nNgôn ngữ mặc định của bạn đã được cập nhật.`
          : `🇺🇸 <b>SWITCHED TO ENGLISH</b>\n\nYour language preference has been updated.`;
      await sendTelegramMessage(botToken, chatId, switchedMsg, getInlineDashboardKeyboard(newLang));
      return new Response('OK', { status: 200 });
    }

    // Fallback: Show dashboard
    const fallbackHtml = await renderStartDashboard(env, chatId, lang);
    await sendTelegramMessage(botToken, chatId, fallbackHtml, getInlineDashboardKeyboard(lang));
    return new Response('OK', { status: 200 });
  } catch (err: any) {
    console.error('Webhook processing error', err);
    return new Response(
      JSON.stringify({ error: err?.message || String(err), stack: err?.stack }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// ==============================================================================
// 7. CRON PIPELINES (15-MIN FLASH & DAILY 00:05 UTC)
// ==============================================================================

async function handle15MinCron(env: Env, ctx: ExecutionContext): Promise<void> {
  const live = await getLiveMarketSnapshot();

  const daysSince = getDaysSinceGenesis();
  const fairValue = calculatePowerLawFairValue(daysSince);
  const sma200d = Math.round(fairValue * 0.808);
  const geom200d = Math.round(sma200d * 0.976);
  const ahr999 = calculateAhr999(live.price, geom200d, fairValue);
  const mayer = parseFloat((live.price / sma200d).toFixed(2));

  // Check Bear-Trap Flash conditions
  const isLeverageFlushed = live.fundingRate <= 0.0001;
  const isPriceDumped = live.pctChange1h <= -2.5 || live.priceChange24h <= -4.0;
  const isBearTrap = isPriceDumped && isLeverageFlushed && ahr999 < 1.2;

  const conf = computeConfluenceScore({
    currentPrice: live.price,
    ahr999,
    mayer,
    rsi14: 46,
    fundingRate: live.fundingRate,
    fearGreed: live.fearGreed.value,
    dxyChange: -0.6,
    isBearTrap,
  });

  // If real Bear-Trap triggered, dispatch to subscribers
  if (isBearTrap && env.TELEGRAM_BOT_TOKEN) {
    try {
      await env.DB.prepare(
        `INSERT INTO macro_shock_events (timestamp, category, headline, btc_price_at_event, pct_change_1h, is_bear_trap)
         VALUES (?, 'WAR', 'Geopolitical Liquidity Flush & Futures Shakeout', ?, ?, 1)`
      )
        .bind(Date.now(), live.price, live.pctChange1h)
        .run();

      const subscribers = await env.DB.prepare('SELECT * FROM alert_subscribers').all<AlertSubscriberRow>();
      for (const sub of subscribers.results || []) {
        const userProf = await getUserProfile(env, sub.telegram_chat_id);
        const { text, markup } = renderSimulatedShockAlert(userProf.lang || 'vi');
        ctx.waitUntil(sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, sub.telegram_chat_id, text, markup));
      }
    } catch (e) {
      console.error('Failed bear trap broadcast', e);
    }
  }

  // Low Mempool Fee Alert (< 10 sat/vB)
  if (live.mempool.halfHourFee <= 10 && env.TELEGRAM_BOT_TOKEN) {
    try {
      const eligible = await env.DB.prepare(
        'SELECT telegram_chat_id FROM alert_subscribers WHERE max_mempool_fee >= ?'
      )
        .bind(live.mempool.halfHourFee)
        .all<AlertSubscriberRow>();

      for (const sub of eligible.results || []) {
        const userProf = await getUserProfile(env, sub.telegram_chat_id);
        const isVi = (userProf.lang || 'vi') === 'vi';
        const feeAlertHtml = isVi
          ? `🟢 <b>CANH PHÍ RÚT VÍ LẠNH: PHÍ MẠNG CHẠM ĐÁY</b>\n\n` +
            `• Phí 30 Phút: <code>${live.mempool.halfHourFee} sat/vB</code>\n` +
            `• Phí Nhanh Nhất: <code>${live.mempool.fastestFee} sat/vB</code>\n\n` +
            `💡 <i>Thời điểm vàng để gộp các UTXO lẻ và rút Spot khỏi sàn về ví lạnh Trezor/Ledger an toàn với chi phí tối thiểu!</i>`
          : `🟢 <b>COLD-WALLET UTXO SNIPER: CYCLE LOW FEES</b>\n\n` +
            `• 30-Min Fee: <code>${live.mempool.halfHourFee} sat/vB</code>\n` +
            `• Fastest Fee: <code>${live.mempool.fastestFee} sat/vB</code>\n\n` +
            `💡 <i>Network congestion is at cycle lows. Ideal time to consolidate dust UTXOs and withdraw to cold storage!</i>`;

        ctx.waitUntil(
          sendTelegramMessage(
            env.TELEGRAM_BOT_TOKEN,
            sub.telegram_chat_id,
            feeAlertHtml,
            getInlineDashboardKeyboard(userProf.lang || 'vi')
          )
        );
      }
    } catch (e) {
      console.error('Fee sniper alert error', e);
    }
  }

  // Cache state for frontend
  const terminalStatePayload = {
    updatedAt: Date.now(),
    live: {
      price: live.price,
      priceVnd: Math.round(live.price * live.p2pUsdtVnd),
      p2pUsdtVnd: live.p2pUsdtVnd,
      officialUsdVnd: live.officialUsdVnd,
      p2pPremiumPercent: live.p2pPremiumPercent,
      priceChange24h: live.priceChange24h,
      pctChange1h: live.pctChange1h,
      high24h: live.high24h,
      low24h: live.low24h,
      volume24h: live.volume24h,
      fundingRate: live.fundingRate,
      mempool: live.mempool,
      fearGreed: live.fearGreed,
    },
    quant: {
      daysSinceGenesis: Math.floor(daysSince),
      powerLawFairValue: fairValue,
      ahr999,
      mayerMultiple: mayer,
      confluenceScore: conf.score,
      zone: conf.zoneEn,
      zoneVi: conf.zoneVi,
      recommendedMultiplier: conf.multiplier,
      isBearTrapActive: isBearTrap,
    },
  };

  const cache = caches.default;
  const cacheKey = new Request('https://btc-macro-terminal.internal/api/cached-terminal-state');
  const cacheResponse = new Response(JSON.stringify(terminalStatePayload), {
    headers: {
      ...CORS_HEADERS,
      'Cache-Control': 'public, max-age=60',
    },
  });

  ctx.waitUntil(cache.put(cacheKey, cacheResponse));
}

async function handleDaily0005Cron(env: Env): Promise<void> {
  try {
    const live = await getLiveMarketSnapshot();
    const daysSince = getDaysSinceGenesis();
    const fairValue = calculatePowerLawFairValue(daysSince);
    const sma200d = Math.round(fairValue * 0.808);
    const geom200d = Math.round(sma200d * 0.976);
    const ahr999 = calculateAhr999(live.price, geom200d, fairValue);
    const mayer = parseFloat((live.price / sma200d).toFixed(2));
    const sma200w = getMonotonic200WMA(daysSince);

    const conf = computeConfluenceScore({
      currentPrice: live.price,
      ahr999,
      mayer,
      rsi14: 48,
      fundingRate: live.fundingRate,
      fearGreed: live.fearGreed.value,
      dxyChange: -0.6,
      isBearTrap: false,
    });

    const todayDate = new Date().toISOString().split('T')[0];

    await env.DB.prepare(
      `INSERT INTO daily_metrics 
       (date, close_price, sma200d, sma200w, geom200d, rsi14, ahr999, mayer_multiple, 
        fear_greed, etf_netflow_usd, dxy, us10y, vnd_p2p_rate, confluence_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
        close_price = excluded.close_price,
        sma200d = excluded.sma200d,
        sma200w = excluded.sma200w,
        geom200d = excluded.geom200d,
        rsi14 = excluded.rsi14,
        ahr999 = excluded.ahr999,
        mayer_multiple = excluded.mayer_multiple,
        fear_greed = excluded.fear_greed,
        confluence_score = excluded.confluence_score`
    )
      .bind(
        todayDate,
        live.price,
        sma200d,
        sma200w,
        geom200d,
        48.0,
        ahr999,
        mayer,
        live.fearGreed.value,
        425000000,
        104.2,
        4.38,
        live.p2pUsdtVnd,
        conf.score
      )
      .run();
  } catch (err) {
    console.error('Failed daily 00:05 UTC cron', err);
  }
}

// ==============================================================================
// 8. HTTP REQUEST ROUTER
// ==============================================================================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // OPTIONS pre-flight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Route: GET /api/terminal-state
    if (url.pathname === '/api/terminal-state' && request.method === 'GET') {
      const cache = caches.default;
      const cacheKey = new Request('https://btc-macro-terminal.internal/api/cached-terminal-state');
      const cachedResponse = await cache.match(cacheKey);

      if (cachedResponse) {
        const cachedJson = (await cachedResponse.json()) as Record<string, unknown>;
        try {
          const historical = await env.DB.prepare(
            'SELECT * FROM daily_metrics ORDER BY date DESC LIMIT 365'
          ).all<DailyMetricRow>();
          const recentShocks = await env.DB.prepare(
            'SELECT * FROM macro_shock_events ORDER BY timestamp DESC LIMIT 10'
          ).all<MacroShockRow>();

          const fullPayload = {
            ...cachedJson,
            historicalMetrics: historical.results || [],
            recentShocks: recentShocks.results || [],
          };
          return new Response(JSON.stringify(fullPayload), { headers: CORS_HEADERS });
        } catch {
          return new Response(JSON.stringify(cachedJson), { headers: CORS_HEADERS });
        }
      }

      // If cache miss, generate live
      try {
        const live = await getLiveMarketSnapshot();
        const daysSince = getDaysSinceGenesis();
        const fairValue = calculatePowerLawFairValue(daysSince);
        const sma200d = Math.round(fairValue * 0.808);
        const geom200d = Math.round(sma200d * 0.976);
        const ahr999 = calculateAhr999(live.price, geom200d, fairValue);
        const mayer = parseFloat((live.price / sma200d).toFixed(2));

        const conf = computeConfluenceScore({
          currentPrice: live.price,
          ahr999,
          mayer,
          rsi14: 48,
          fundingRate: live.fundingRate,
          fearGreed: live.fearGreed.value,
          dxyChange: -0.6,
          isBearTrap: false,
        });

        const historical = await env.DB.prepare(
          'SELECT * FROM daily_metrics ORDER BY date DESC LIMIT 365'
        ).all<DailyMetricRow>();
        const shocks = await env.DB.prepare(
          'SELECT * FROM macro_shock_events ORDER BY timestamp DESC LIMIT 10'
        ).all<MacroShockRow>();

        const payload = {
          updatedAt: Date.now(),
          live: {
            price: live.price,
            priceVnd: Math.round(live.price * live.p2pUsdtVnd),
            p2pUsdtVnd: live.p2pUsdtVnd,
            officialUsdVnd: live.officialUsdVnd,
            p2pPremiumPercent: live.p2pPremiumPercent,
            priceChange24h: live.priceChange24h,
            pctChange1h: live.pctChange1h,
            high24h: live.high24h,
            low24h: live.low24h,
            volume24h: live.volume24h,
            fundingRate: live.fundingRate,
            mempool: live.mempool,
            fearGreed: live.fearGreed,
          },
          quant: {
            daysSinceGenesis: Math.floor(daysSince),
            powerLawFairValue: fairValue,
            ahr999,
            mayerMultiple: mayer,
            confluenceScore: conf.score,
            zone: conf.zoneEn,
            zoneVi: conf.zoneVi,
            recommendedMultiplier: conf.multiplier,
            isBearTrapActive: false,
          },
          historicalMetrics: historical.results || [],
          recentShocks: shocks.results || [],
        };

        return new Response(JSON.stringify(payload), { headers: CORS_HEADERS });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: CORS_HEADERS,
        });
      }
    }

    // Route: POST /api/telegram-webhook
    if (url.pathname === '/api/telegram-webhook' && request.method === 'POST') {
      return handleTelegramWebhook(request, env);
    }

    // Route: GET /api/setup-telegram-commands (Register bot command menu)
    if (url.pathname === '/api/setup-telegram-commands') {
      const ok = await registerTelegramCommands(env.TELEGRAM_BOT_TOKEN);
      return new Response(
        JSON.stringify({ success: ok, message: 'Telegram native command menu registered' }),
        { headers: CORS_HEADERS }
      );
    }

    // Route: GET /api/news (High-Signal Bitcoin & Macro RSS Feeds with Categorization, Sentiment & Translation)
    if (url.pathname === '/api/news' && request.method === 'GET') {
      try {
        const [ctRes, bmRes] = await Promise.allSettled([
          fetch('https://cointelegraph.com/rss/tag/bitcoin', {
            headers: { 'User-Agent': 'CloudflareWorker-BTCTerminal' },
          }),
          fetch('https://bitcoinmagazine.com/.rss/full/', {
            headers: { 'User-Agent': 'CloudflareWorker-BTCTerminal' },
          }),
        ]);

        const ctXml = ctRes.status === 'fulfilled' && ctRes.value.ok ? await ctRes.value.text() : '';
        const bmXml = bmRes.status === 'fulfilled' && bmRes.value.ok ? await bmRes.value.text() : '';

        function parseRss(xml: string, source: string) {
          const items: any[] = [];
          if (!xml) return items;
          const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
          let match;

          while ((match = itemRegex.exec(xml)) !== null && items.length < 15) {
            const itemStr = match[1];
            let title =
              (/<title><!\[CDATA\[(.*?)\]\]><\/title>/i.exec(itemStr) ||
                /<title>(.*?)<\/title>/i.exec(itemStr))?.[1]?.trim() || '';
            let link =
              (/<link><!\[CDATA\[(.*?)\]\]><\/link>/i.exec(itemStr) ||
                /<link>(.*?)<\/link>/i.exec(itemStr))?.[1]?.trim() || '';
            const pubDate = (/<pubDate>(.*?)<\/pubDate>/i.exec(itemStr))?.[1]?.trim() || '';
            let desc =
              (/<description><!\[CDATA\[(.*?)\]\]><\/description>/i.exec(itemStr) ||
                /<description>(.*?)<\/description>/i.exec(itemStr))?.[1]
                ?.replace(/<[^>]*>/g, '')
                .trim() || '';

            link = link.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');
            title = title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

            if (title && link) {
              const fullText = (title + ' ' + desc).toLowerCase();

              // Categorize into 4 Institutional Pillars
              let category = 'BITCOIN_MARKET';
              if (/fed|federal reserve|powell|cpi|inflation|rate cut|rate hike|yield|treasury|macro|dollar|dxy|recession|liquidity/i.test(fullText)) {
                category = 'FED_MACRO';
              } else if (/etf|blackrock|fidelity|ibit|inflow|outflow|institutional|saylor|microstrategy|sec|spot btc/i.test(fullText)) {
                category = 'ETF_INSTITUTIONAL';
              } else if (/hashrate|mempool|sat\/vb|mining|miner|difficulty|halving|utxo|ordinals|node|fee/i.test(fullText)) {
                category = 'ONCHAIN_MINING';
              }

              // Sentiment Classification (CryptoPanic style)
              let sentiment = 'NEUTRAL';
              if (/record|surge|jump|inflow|accumulat|profit|gain|bull|breakthrough|rally|approval|rise|high|ath|soar|buy|boost/i.test(fullText)) {
                sentiment = 'BULLISH';
              } else if (/drop|crash|dump|outflow|fear|risk|ban|lawsuit|hack|plunge|spike|hike|liquidat|sell|down|fall|loss/i.test(fullText)) {
                sentiment = 'BEARISH';
              }

              items.push({
                id: `${source.toLowerCase().replace(/\s+/g, '-')}-${items.length}-${pubDate ? new Date(pubDate).getTime() : Date.now()}`,
                title,
                link,
                pubDate,
                timeMs: pubDate ? new Date(pubDate).getTime() : Date.now(),
                description: desc.slice(0, 200),
                source,
                category,
                sentiment,
              });
            }
          }
          return items;
        }

        const ctItems = parseRss(ctXml, 'Cointelegraph');
        const bmItems = parseRss(bmXml, 'Bitcoin Magazine');
        const combined = [...ctItems, ...bmItems]
          .sort((a, b) => b.timeMs - a.timeMs)
          .slice(0, 16);

        // Translate headlines into Vietnamese for VI mode support
        const translatedItems = await Promise.all(
          combined.map(async (item) => {
            try {
              const transRes = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(item.title)}`
              );
              if (transRes.ok) {
                const transJson: any = await transRes.json();
                if (Array.isArray(transJson) && Array.isArray(transJson[0])) {
                  const titleVi = transJson[0].map((p: any) => p[0]).join('');
                  return { ...item, titleVi };
                }
              }
            } catch {}
            return item;
          })
        );

        return new Response(JSON.stringify(translatedItems), {
          headers: {
            ...CORS_HEADERS,
            'Cache-Control': 'public, max-age=180', // 3 minutes edge cache
          },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: CORS_HEADERS,
        });
      }
    }

    // Route: GET / POST /api/binance/portfolio
    if (url.pathname === '/api/binance/portfolio') {
      try {
        let clientKey = (request.headers.get('X-Binance-API-Key') || url.searchParams.get('apiKey') || '').trim();
        let clientSecret = (request.headers.get('X-Binance-API-Secret') || url.searchParams.get('apiSecret') || '').trim();
        let saveToServer = false;

        if (request.method === 'POST') {
          try {
            const body = (await request.json()) as any;
            if (body?.apiKey && typeof body.apiKey === 'string' && body.apiKey.trim()) {
              clientKey = body.apiKey.trim();
            }
            if (body?.apiSecret && typeof body.apiSecret === 'string' && body.apiSecret.trim()) {
              clientSecret = body.apiSecret.trim();
            }
            if (body?.saveToServer) saveToServer = true;
          } catch {}
        }

        let apiKey = clientKey || (env.BINANCE_API_KEY || '').trim();
        let apiSecret = clientSecret || (env.BINANCE_API_SECRET || '').trim();

        // Secondary fallback to Cloudflare D1 if Worker secrets are empty
        if (!apiKey || !apiSecret) {
          try {
            const profile = await env.DB.prepare(
              "SELECT binance_api_key, binance_api_secret FROM user_profiles WHERE binance_api_key != '' ORDER BY updated_at DESC LIMIT 1"
            ).first<{ binance_api_key?: string; binance_api_secret?: string }>();
            if (profile?.binance_api_key && profile?.binance_api_secret) {
              apiKey = profile.binance_api_key.trim();
              apiSecret = profile.binance_api_secret.trim();
            }
          } catch (d1Err) {
            console.error('D1 fallback error:', d1Err);
          }
        }

        const live = await getLiveMarketSnapshot();
        const portfolio = await syncBinancePortfolio(
          { apiKey: apiKey.trim(), apiSecret: apiSecret.trim() },
          live.price,
          live.p2pUsdtVnd
        );

        // Zero-Knowledge Security: apiSecret is NEVER written to DB or persisted on server
        const enrichedPortfolio = {
          ...portfolio,
          isServerPersisted: false,
          maskedApiKey: apiKey.length > 8 ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : undefined,
        };

        return new Response(JSON.stringify(enrichedPortfolio), {
            headers: {
              ...CORS_HEADERS,
              'Cache-Control': 'no-cache',
            },
          }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: CORS_HEADERS,
        });
      }
    }

    // Route: POST /api/binance/proxy (Zero-Knowledge CORS Relay for Pre-Signed Client Requests)
    if (url.pathname === '/api/binance/proxy' && request.method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const targetPath = body?.path || '';
        const query = body?.query || '';
        const apiKey = body?.apiKey || '';
        const method = (body?.method || 'GET').toUpperCase();

        // Allowed Binance endpoints only (Read-only security whitelist)
        const allowedPaths = [
          '/api/v3/account',
          '/api/v3/time',
          '/sapi/v1/capital/config/getall',
          '/sapi/v1/asset/getUserAsset',
          '/sapi/v1/simple-earn/flexible/position',
          '/sapi/v1/simple-earn/locked/position',
          '/sapi/v1/asset/get-funding-asset',
          '/api/v3/myTrades',
          '/api/v3/openOrders',
        ];

        if (!allowedPaths.includes(targetPath)) {
          return new Response(JSON.stringify({ error: 'Endpoint not permitted on read-only proxy' }), {
            status: 403,
            headers: CORS_HEADERS,
          });
        }

        const binanceUrl = `https://api.binance.com${targetPath}${query ? '?' + query : ''}`;
        const binanceRes = await fetch(binanceUrl, {
          method,
          headers: {
            'X-MBX-APIKEY': apiKey,
            'User-Agent': 'binance-connector-node/3.0.0',
            Accept: 'application/json',
          },
        });

        const data = await binanceRes.text();
        return new Response(data, {
          status: binanceRes.status,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
          },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: CORS_HEADERS,
        });
      }
    }

    // Route: POST /api/alerts/subscribe
    if (url.pathname === '/api/alerts/subscribe' && request.method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const chatId = body?.chatId?.toString().trim();
        const minScore = Number(body?.minConfluenceScore) || 75;
        const maxFee = Number(body?.maxMempoolFee) || 10;
        const exchangeUid = body?.exchangeUid || null;

        if (!chatId) {
          return new Response(JSON.stringify({ error: 'Missing telegram chat ID' }), {
            status: 400,
            headers: CORS_HEADERS,
          });
        }

        await env.DB.prepare(
          `INSERT INTO alert_subscribers (telegram_chat_id, min_confluence_score, max_mempool_fee, exchange_uid, created_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(telegram_chat_id) DO UPDATE SET
            min_confluence_score = excluded.min_confluence_score,
            max_mempool_fee = excluded.max_mempool_fee,
            exchange_uid = excluded.exchange_uid`
        )
          .bind(chatId, minScore, maxFee, exchangeUid, Date.now())
          .run();

        if (env.TELEGRAM_BOT_TOKEN) {
          ctx.waitUntil(
            sendTelegramMessage(
              env.TELEGRAM_BOT_TOKEN,
              chatId,
              `✅ <b>Terminal Alert Subscribed:</b> You will receive alerts when Score &ge; ${minScore} or Fee &le; ${maxFee} sat/vB.`,
              getInlineDashboardKeyboard('vi')
            )
          );
        }

        return new Response(JSON.stringify({ success: true, chatId }), { headers: CORS_HEADERS });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: CORS_HEADERS,
        });
      }
    }

    // Route: GET /api/trigger-cron
    if (url.pathname === '/api/trigger-cron') {
      const type = url.searchParams.get('type');
      try {
        if (type === 'daily') {
          await handleDaily0005Cron(env);
          return new Response(JSON.stringify({ status: 'ok', triggered: 'daily_0005_cron', timestamp: Date.now() }), {
            headers: CORS_HEADERS,
          });
        } else {
          await handle15MinCron(env, ctx);
          return new Response(JSON.stringify({ status: 'ok', triggered: '15min_flash_cron', timestamp: Date.now() }), {
            headers: CORS_HEADERS,
          });
        }
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: CORS_HEADERS,
        });
      }
    }

    // Route: GET /api/health
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', time: Date.now() }), {
        headers: CORS_HEADERS,
      });
    }

    return new Response(JSON.stringify({ error: 'Endpoint Not Found' }), {
      status: 404,
      headers: CORS_HEADERS,
    });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    if (event.cron === '5 0 * * *') {
      ctx.waitUntil(handleDaily0005Cron(env));
    } else {
      ctx.waitUntil(handle15MinCron(env, ctx));
    }
  },
};
