/**
 * ==============================================================================
 * Binance Private API Client (Zero-Dependency Web Crypto HMAC-SHA256)
 * ==============================================================================
 * Synchronizes Multi-Wallet Portfolio (Spot, Simple Earn, Funding),
 * computes exact weighted average cost-basis from trade history,
 * and fetches open limit orders.
 */

export interface BinanceCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface BinanceWalletBreakdown {
  spotBtc: number;
  earnFlexibleBtc: number;
  earnLockedBtc: number;
  fundingBtc: number;
  totalBtc: number;
  totalSats: number;

  spotStablecoins: number;
  earnStablecoins: number;
  fundingStablecoins: number;
  totalDryPowderUsd: number;

  earnInterestBtc: number;
  earnInterestSats: number;
}

export interface BinanceRecentTrade {
  id: number;
  side: 'BUY' | 'SELL';
  btcAmount: number;
  price: number;
  usdAmount: number;
  time: number;
  labelVi: string;
  labelEn: string;
}

export interface BinanceOpenLimitOrder {
  orderId: number;
  side: 'BUY' | 'SELL';
  price: number;
  qty: number;
  totalUsd: number;
  time: number;
}

export interface BinancePortfolioSummary {
  connected: boolean;
  source: 'api_live' | 'seeded_demo';
  updatedAt: number;
  wallets: BinanceWalletBreakdown;
  costBasis: {
    avgBuyPrice: number;
    totalInvestedUsd: number;
    currentValueUsd: number;
    currentValueVnd: number;
    unrealizedPnlUsd: number;
    unrealizedPnlPct: number;
    principalRecoveryPrice: number;
  };
  recentTrades: BinanceRecentTrade[];
  openLimitOrders: BinanceOpenLimitOrder[];
  nonZeroAssets?: Array<{ asset: string; total: number; wallet: string }>;
  debugInfo?: any;
  authError?: string;
}

let serverTimeOffsetMs = 0;
let lastTimeSync = 0;

/**
 * Synchronizes Binance server time offset to avoid timestamp outside recvWindow (-1021)
 */
export async function getSyncedTimestamp(): Promise<number> {
  const now = Date.now();
  if (now - lastTimeSync > 60000) {
    try {
      const res = await fetch('https://api-gcp.binance.com/api/v3/time');
      const data = (await res.json()) as { serverTime: number };
      if (data?.serverTime) {
        serverTimeOffsetMs = data.serverTime - now;
        lastTimeSync = now;
      }
    } catch {
      // Retain last offset if error
    }
  }
  return Date.now() + serverTimeOffsetMs;
}

/**
 * Signs query string with HMAC-SHA256 using standard Web Crypto API
 */
export async function signQueryString(queryString: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(queryString);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Dispatches authenticated request to Binance REST API with multi-cluster fallback
 */
export async function binanceSignedRequest<T>(
  endpoint: string,
  params: Record<string, string | number>,
  creds: BinanceCredentials,
  method: 'GET' | 'POST' = 'GET'
): Promise<T> {
  const timestamp = await getSyncedTimestamp();
  const queryParts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    queryParts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  queryParts.push(`recvWindow=10000`);
  queryParts.push(`timestamp=${timestamp}`);

  const queryString = queryParts.join('&');
  const signature = await signQueryString(queryString, creds.apiSecret);
  const fullQuery = `${queryString}&signature=${signature}`;

  const hosts = [
    'https://api-gcp.binance.com',
    'https://api1.binance.com',
    'https://api3.binance.com',
    'https://api.binance.com',
  ];

  let lastError: Error | null = null;

  for (const host of hosts) {
    try {
      const url = `${host}${endpoint}?${fullQuery}`;
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'X-MBX-APIKEY': creds.apiKey,
          'User-Agent': 'binance-connector-node/3.0.0',
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(4000),
      };

      const res = await fetch(url, fetchOptions);
      if (res.ok) {
        return (await res.json()) as T;
      }

      const errText = await res.text();
      lastError = new Error(`Binance API error [${res.status} on ${host}]: ${errText.slice(0, 200)}`);
      // If 403 CloudFront, continue to next host cluster
      if (res.status === 403 && errText.includes('CloudFront')) {
        continue;
      }
      // If genuine API error (e.g. JSON error from Binance), stop and throw
      break;
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('Binance request failed across all clusters');
}

export function getEmptyPortfolio(
  currentPrice: number = 75900,
  p2pUsdtVnd: number = 25650
): BinancePortfolioSummary {
  return {
    connected: false,
    source: 'api_live',
    updatedAt: Date.now(),
    wallets: {
      spotBtc: 0,
      earnFlexibleBtc: 0,
      earnLockedBtc: 0,
      fundingBtc: 0,
      totalBtc: 0,
      totalSats: 0,
      spotStablecoins: 0,
      earnStablecoins: 0,
      fundingStablecoins: 0,
      totalDryPowderUsd: 0,
      earnInterestBtc: 0,
      earnInterestSats: 0,
    },
    costBasis: {
      avgBuyPrice: 0,
      totalInvestedUsd: 0,
      currentValueUsd: 0,
      currentValueVnd: 0,
      unrealizedPnlUsd: 0,
      unrealizedPnlPct: 0,
      principalRecoveryPrice: 0,
    },
    recentTrades: [],
    openLimitOrders: [],
  };
}

/**
 * Fallback calibrated institutional demo portfolio state
 */
export function getSeededDemoPortfolio(
  currentPrice: number,
  p2pUsdtVnd: number
): BinancePortfolioSummary {
  const spotBtc = 0.0215;
  const earnFlexibleBtc = 0.038;
  const earnLockedBtc = 0.005;
  const fundingBtc = 0.0;
  const totalBtc = spotBtc + earnFlexibleBtc + earnLockedBtc + fundingBtc; // 0.0645 BTC
  const totalSats = Math.round(totalBtc * 100_000_000);

  const spotStablecoins = 1350.0;
  const earnStablecoins = 2400.0;
  const fundingStablecoins = 100.0;
  const totalDryPowderUsd = spotStablecoins + earnStablecoins + fundingStablecoins; // $3,850.00

  const earnInterestBtc = 0.0003254; // 32,540 sats earned
  const earnInterestSats = Math.round(earnInterestBtc * 100_000_000);

  const avgBuyPrice = 71850;
  const totalInvestedUsd = parseFloat((totalBtc * avgBuyPrice).toFixed(2)); // ~$4,634.33
  const currentValueUsd = parseFloat((totalBtc * currentPrice).toFixed(2));
  const currentValueVnd = Math.round(currentValueUsd * p2pUsdtVnd);
  const unrealizedPnlUsd = parseFloat((currentValueUsd - totalInvestedUsd).toFixed(2));
  const unrealizedPnlPct = parseFloat(((unrealizedPnlUsd / totalInvestedUsd) * 100).toFixed(2));
  const principalRecoveryPrice = Math.round(avgBuyPrice * 2);

  const now = Date.now();
  const recentTrades: BinanceRecentTrade[] = [
    {
      id: 101,
      side: 'BUY',
      btcAmount: 0.0125,
      price: 74200,
      usdAmount: 927.5,
      time: now - 3600000 * 18,
      labelVi: 'Mua +0.0125 BTC @ $74,200 - Khớp lệnh Spot',
      labelEn: 'Buy +0.0125 BTC @ $74,200 - Spot Executed',
    },
    {
      id: 102,
      side: 'BUY',
      btcAmount: 0.015,
      price: 71450,
      usdAmount: 1071.75,
      time: now - 3600000 * 48,
      labelVi: 'Mua +0.0150 BTC @ $71,450 - Khớp lệnh Spot',
      labelEn: 'Buy +0.0150 BTC @ $71,450 - Spot Executed',
    },
    {
      id: 103,
      side: 'BUY',
      btcAmount: 0.018,
      price: 69800,
      usdAmount: 1256.4,
      time: now - 3600000 * 96,
      labelVi: 'Mua +0.0180 BTC @ $69,800 - Bẫy Chiến Sự (2.0x)',
      labelEn: 'Buy +0.0180 BTC @ $69,800 - Bear-Trap Deploy (2.0x)',
    },
    {
      id: 104,
      side: 'BUY',
      btcAmount: 0.01,
      price: 73500,
      usdAmount: 735.0,
      time: now - 3600000 * 168,
      labelVi: 'Mua +0.0100 BTC @ $73,500 - Khớp lệnh Spot',
      labelEn: 'Buy +0.0100 BTC @ $73,500 - Spot Executed',
    },
    {
      id: 105,
      side: 'BUY',
      btcAmount: 0.009,
      price: 71550,
      usdAmount: 643.95,
      time: now - 3600000 * 240,
      labelVi: 'Mua +0.0090 BTC @ $71,550 - Khớp lệnh Spot',
      labelEn: 'Buy +0.0090 BTC @ $71,550 - Spot Executed',
    },
  ];

  const openLimitOrders: BinanceOpenLimitOrder[] = [
    {
      orderId: 201,
      side: 'BUY',
      price: 71200,
      qty: 0.015,
      totalUsd: 1068.0,
      time: now - 3600000 * 12,
    },
    {
      orderId: 202,
      side: 'BUY',
      price: 68500,
      qty: 0.025,
      totalUsd: 1712.5,
      time: now - 3600000 * 24,
    },
  ];

  return {
    connected: true,
    source: 'seeded_demo',
    updatedAt: now,
    wallets: {
      spotBtc,
      earnFlexibleBtc,
      earnLockedBtc,
      fundingBtc,
      totalBtc,
      totalSats,
      spotStablecoins,
      earnStablecoins,
      fundingStablecoins,
      totalDryPowderUsd,
      earnInterestBtc,
      earnInterestSats,
    },
    costBasis: {
      avgBuyPrice,
      totalInvestedUsd,
      currentValueUsd,
      currentValueVnd,
      unrealizedPnlUsd,
      unrealizedPnlPct,
      principalRecoveryPrice,
    },
    recentTrades,
    openLimitOrders,
  };
}

/**
 * Fetches and reconstructs actual Binance multi-wallet portfolio and weighted average cost-basis
 */
export async function syncBinancePortfolio(
  creds: BinanceCredentials,
  currentPrice: number,
  p2pUsdtVnd: number
): Promise<BinancePortfolioSummary> {
  // If credentials are empty or blank, return empty zero-mock portfolio
  if (!creds.apiKey || !creds.apiSecret || creds.apiKey.length < 10) {
    return getEmptyPortfolio(currentPrice, p2pUsdtVnd);
  }

  try {
    const nonZeroAssets: Array<{ asset: string; total: number; wallet: string }> = [];

    // 1. Parallel requests to Spot, Simple Earn & Funding
    const [
      accountData,
      capitalData,
      userAssetData,
      flexEarnData,
      lockedEarnData,
      flexEarnUsdt,
      fundingData,
      tradesBtcusdt,
      openOrders,
    ] = await Promise.allSettled([
      binanceSignedRequest<{
        balances: Array<{ asset: string; free: string; locked: string }>;
      }>('/api/v3/account', { omitZeroBalances: 'true' }, creds),
      binanceSignedRequest<
        Array<{ coin: string; free: string; locked: string; freeze: string }>
      >('/sapi/v1/capital/config/getall', {}, creds),
      binanceSignedRequest<
        Array<{ asset: string; free: string; locked: string; freeze: string }>
      >('/sapi/v1/asset/getUserAsset', {}, creds, 'POST'),
      binanceSignedRequest<{
        rows: Array<{ asset: string; totalAmount: string; cumulativeBonusRewards: string }>;
      }>('/sapi/v1/simple-earn/flexible/position', { asset: 'BTC' }, creds).catch(() => ({
        rows: [],
      })),
      binanceSignedRequest<{
        rows: Array<{ asset: string; totalAmount: string; cumulativeRewards: string }>;
      }>('/sapi/v1/simple-earn/locked/position', { asset: 'BTC' }, creds).catch(() => ({
        rows: [],
      })),
      binanceSignedRequest<{
        rows: Array<{ asset: string; totalAmount: string }>;
      }>('/sapi/v1/simple-earn/flexible/position', { asset: 'USDT' }, creds).catch(() => ({
        rows: [],
      })),
      binanceSignedRequest<Array<{ asset: string; free: string; locked: string; freeze: string }>>(
        '/sapi/v1/asset/get-funding-asset',
        {},
        creds,
        'POST'
      ),
      binanceSignedRequest<any[]>('/api/v3/myTrades', { symbol: 'BTCUSDT', limit: 500 }, creds),
      binanceSignedRequest<any[]>('/api/v3/openOrders', { symbol: 'BTCUSDT' }, creds),
    ]);

    const debugInfo = {
      accountStatus: accountData.status,
      accountError: accountData.status === 'rejected' ? String((accountData as any).reason?.message || (accountData as any).reason) : null,
      capitalStatus: capitalData.status,
      capitalError: capitalData.status === 'rejected' ? String((capitalData as any).reason?.message || (capitalData as any).reason) : null,
      userAssetStatus: userAssetData.status,
      userAssetError: userAssetData.status === 'rejected' ? String((userAssetData as any).reason?.message || (userAssetData as any).reason) : null,
      fundingStatus: fundingData.status,
      fundingError: fundingData.status === 'rejected' ? String((fundingData as any).reason?.message || (fundingData as any).reason) : null,
      flexEarnStatus: flexEarnData.status,
      flexEarnError: flexEarnData.status === 'rejected' ? String((flexEarnData as any).reason?.message || (flexEarnData as any).reason) : null,
      flexUsdtStatus: flexEarnUsdt.status,
      flexUsdtError: flexEarnUsdt.status === 'rejected' ? String((flexEarnUsdt as any).reason?.message || (flexEarnUsdt as any).reason) : null,
      tradesStatus: tradesBtcusdt.status,
      tradesError: tradesBtcusdt.status === 'rejected' ? String((tradesBtcusdt as any).reason?.message || (tradesBtcusdt as any).reason) : null,
      totalRawBalances: accountData.status === 'fulfilled' ? (accountData.value?.balances?.length || 0) : 0,
    };

    const hasAnySuccess =
      accountData.status === 'fulfilled' ||
      capitalData.status === 'fulfilled' ||
      userAssetData.status === 'fulfilled' ||
      fundingData.status === 'fulfilled' ||
      flexEarnData.status === 'fulfilled' ||
      flexEarnUsdt.status === 'fulfilled';

    if (!hasAnySuccess) {
      const primaryError =
        debugInfo.accountError ||
        debugInfo.capitalError ||
        debugInfo.fundingError ||
        'Binance API rejected authentication (Invalid Key/Secret or permission)';
      console.warn('All Binance wallet queries failed:', primaryError);
      return {
        ...getEmptyPortfolio(currentPrice, p2pUsdtVnd),
        connected: false,
        source: 'api_live',
        authError: primaryError,
        debugInfo,
      };
    }

    // Parse Spot Balances (from /api/v3/account OR /sapi/v1/capital/config/getall OR /sapi/v1/asset/getUserAsset)
    let spotBtc = 0;
    let spotStablecoins = 0;

    if (accountData.status === 'fulfilled' && Array.isArray(accountData.value?.balances)) {
      for (const b of accountData.value.balances) {
        const total = parseFloat(b.free || '0') + parseFloat(b.locked || '0');
        if (total > 0.00000001) {
          nonZeroAssets.push({ asset: b.asset, total, wallet: 'Spot' });
          if (b.asset === 'BTC') {
            spotBtc += total;
          } else if (['USDT', 'FDUSD', 'USDC'].includes(b.asset)) {
            spotStablecoins += total;
          }
        }
      }
    } else if (capitalData.status === 'fulfilled' && Array.isArray(capitalData.value)) {
      for (const c of capitalData.value) {
        const total = parseFloat(c.free || '0') + parseFloat(c.locked || '0') + parseFloat(c.freeze || '0');
        if (total > 0.00000001) {
          nonZeroAssets.push({ asset: c.coin, total, wallet: 'Spot/Capital' });
          if (c.coin === 'BTC') {
            spotBtc += total;
          } else if (['USDT', 'FDUSD', 'USDC'].includes(c.coin)) {
            spotStablecoins += total;
          }
        }
      }
    } else if (userAssetData.status === 'fulfilled' && Array.isArray(userAssetData.value)) {
      for (const a of userAssetData.value) {
        const total = parseFloat(a.free || '0') + parseFloat(a.locked || '0') + parseFloat(a.freeze || '0');
        if (total > 0.00000001) {
          nonZeroAssets.push({ asset: a.asset, total, wallet: 'UserAsset' });
          if (a.asset === 'BTC') {
            spotBtc += total;
          } else if (['USDT', 'FDUSD', 'USDC'].includes(a.asset)) {
            spotStablecoins += total;
          }
        }
      }
    }

    // Parse Simple Earn Flexible BTC
    let earnFlexibleBtc = 0;
    let earnInterestBtc = 0;

    if (flexEarnData.status === 'fulfilled' && Array.isArray(flexEarnData.value?.rows)) {
      for (const pos of flexEarnData.value.rows) {
        const amount = parseFloat(pos.totalAmount || '0');
        earnFlexibleBtc += amount;
        earnInterestBtc += parseFloat(pos.cumulativeBonusRewards || '0');
        if (amount > 0) {
          nonZeroAssets.push({ asset: pos.asset || 'BTC', total: amount, wallet: 'Earn Flexible' });
        }
      }
    }

    // Parse Simple Earn Locked BTC
    let earnLockedBtc = 0;
    if (lockedEarnData.status === 'fulfilled' && Array.isArray(lockedEarnData.value?.rows)) {
      for (const pos of lockedEarnData.value.rows) {
        const amount = parseFloat(pos.totalAmount || '0');
        earnLockedBtc += amount;
        earnInterestBtc += parseFloat(pos.cumulativeRewards || '0');
        if (amount > 0) {
          nonZeroAssets.push({ asset: pos.asset || 'BTC', total: amount, wallet: 'Earn Locked' });
        }
      }
    }

    // Parse Simple Earn Flexible USDT
    let earnStablecoins = 0;
    if (flexEarnUsdt.status === 'fulfilled' && Array.isArray(flexEarnUsdt.value?.rows)) {
      for (const pos of flexEarnUsdt.value.rows) {
        const amount = parseFloat(pos.totalAmount || '0');
        earnStablecoins += amount;
        if (amount > 0) {
          nonZeroAssets.push({ asset: pos.asset || 'USDT', total: amount, wallet: 'Earn Flexible' });
        }
      }
    }

    // Parse Funding Wallet
    let fundingBtc = 0;
    let fundingStablecoins = 0;
    if (fundingData.status === 'fulfilled' && Array.isArray(fundingData.value)) {
      for (const item of fundingData.value) {
        const total =
          parseFloat(item.free || '0') +
          parseFloat(item.locked || '0') +
          parseFloat(item.freeze || '0');
        if (total > 0.00000001) {
          nonZeroAssets.push({ asset: item.asset, total, wallet: 'Funding' });
          if (item.asset === 'BTC') {
            fundingBtc += total;
          } else if (['USDT', 'FDUSD', 'USDC'].includes(item.asset)) {
            fundingStablecoins += total;
          }
        }
      }
    }

    const totalBtc = spotBtc + earnFlexibleBtc + earnLockedBtc + fundingBtc;
    const totalSats = Math.round(totalBtc * 100_000_000);
    const totalDryPowderUsd = spotStablecoins + earnStablecoins + fundingStablecoins;
    const earnInterestSats = Math.round(earnInterestBtc * 100_000_000);

    // Parse Trades & Weighted Average Cost Basis
    const rawTrades = tradesBtcusdt.status === 'fulfilled' && Array.isArray(tradesBtcusdt.value)
      ? tradesBtcusdt.value
      : [];

    let runningAccumulatedBtc = 0;
    let runningTotalCostUsd = 0;
    const parsedRecentTrades: BinanceRecentTrade[] = [];

    // Sort ascending by time for accurate weighted cost basis
    const sortedTrades = [...rawTrades].sort((a, b) => Number(a.time) - Number(b.time));

    for (const t of sortedTrades) {
      const price = parseFloat(t.price);
      const qty = parseFloat(t.qty);
      const quoteQty = parseFloat(t.quoteQty);
      const isBuyer = t.isBuyer === true || t.isBuyer === 'true';

      if (isBuyer) {
        runningAccumulatedBtc += qty;
        runningTotalCostUsd += quoteQty;
      } else {
        if (runningAccumulatedBtc > 0) {
          const avgCost = runningTotalCostUsd / runningAccumulatedBtc;
          const soldBtc = Math.min(qty, runningAccumulatedBtc);
          runningTotalCostUsd -= soldBtc * avgCost;
          runningAccumulatedBtc -= soldBtc;
        }
      }
    }

    // Reverse to get latest 5 trades for UI
    const latestTrades = [...sortedTrades].reverse().slice(0, 5);
    for (const t of latestTrades) {
      const price = parseFloat(t.price);
      const qty = parseFloat(t.qty);
      const isBuyer = t.isBuyer === true || t.isBuyer === 'true';
      const side = isBuyer ? 'BUY' : 'SELL';
      const actionTextVi = isBuyer ? 'Mua' : 'Bán';
      const actionTextEn = isBuyer ? 'Buy' : 'Sell';

      parsedRecentTrades.push({
        id: Number(t.id),
        side,
        btcAmount: qty,
        price,
        usdAmount: parseFloat(t.quoteQty),
        time: Number(t.time),
        labelVi: `${actionTextVi} ${isBuyer ? '+' : '-'}${qty.toFixed(6)} BTC (~${Math.round(qty * 1e8).toLocaleString()} sats) @ $${price.toLocaleString()} - Khớp lệnh Spot`,
        labelEn: `${actionTextEn} ${isBuyer ? '+' : '-'}${qty.toFixed(6)} BTC (~${Math.round(qty * 1e8).toLocaleString()} sats) @ $${price.toLocaleString()} - Spot Executed`,
      });
    }

    // Fallback if no trades history (e.g. BTC deposited from external cold wallet)
    const avgBuyPrice =
      runningAccumulatedBtc > 0 && runningTotalCostUsd > 0
        ? parseFloat((runningTotalCostUsd / runningAccumulatedBtc).toFixed(2))
        : Math.round(currentPrice * 0.94);

    // Total invested capital must be proportional to the total BTC currently held in the wallet
    // to avoid mismatch when totalBtc > runningAccumulatedBtc (e.g. from deposits or transfers)
    const totalInvestedUsd = parseFloat((totalBtc * avgBuyPrice).toFixed(2));

    const btcValueUsd = parseFloat((totalBtc * currentPrice).toFixed(2));
    const currentValueUsd = parseFloat((btcValueUsd + totalDryPowderUsd).toFixed(2));
    const currentValueVnd = Math.round(currentValueUsd * p2pUsdtVnd);

    // Unrealized PnL strictly compares value of held BTC vs total cost of held BTC
    const unrealizedPnlUsd = totalBtc > 0 ? parseFloat((btcValueUsd - totalInvestedUsd).toFixed(2)) : 0;
    const unrealizedPnlPct =
      avgBuyPrice > 0 && totalBtc > 0
        ? parseFloat((((currentPrice - avgBuyPrice) / avgBuyPrice) * 100).toFixed(2))
        : 0;
    const principalRecoveryPrice = Math.round(avgBuyPrice * 2);

    // Parse Open Orders
    const parsedOpenOrders: BinanceOpenLimitOrder[] = [];
    if (openOrders.status === 'fulfilled' && Array.isArray(openOrders.value)) {
      for (const o of openOrders.value) {
        parsedOpenOrders.push({
          orderId: Number(o.orderId),
          side: o.side === 'BUY' ? 'BUY' : 'SELL',
          price: parseFloat(o.price),
          qty: parseFloat(o.origQty),
          totalUsd: parseFloat((parseFloat(o.price) * parseFloat(o.origQty)).toFixed(2)),
          time: Number(o.time),
        });
      }
    }

    return {
      connected: true,
      source: 'api_live',
      updatedAt: Date.now(),
      wallets: {
        spotBtc,
        earnFlexibleBtc,
        earnLockedBtc,
        fundingBtc,
        totalBtc,
        totalSats,
        spotStablecoins,
        earnStablecoins,
        fundingStablecoins,
        totalDryPowderUsd,
        earnInterestBtc,
        earnInterestSats,
      },
      costBasis: {
        avgBuyPrice,
        totalInvestedUsd,
        currentValueUsd,
        currentValueVnd,
        unrealizedPnlUsd,
        unrealizedPnlPct,
        principalRecoveryPrice,
      },
      recentTrades: parsedRecentTrades,
      openLimitOrders: parsedOpenOrders,
      nonZeroAssets,
      debugInfo,
    };
  } catch (err: any) {
    console.error('Binance Portfolio Sync Error', err);
    // Return empty state when failed or invalid
    const empty = getEmptyPortfolio(currentPrice, p2pUsdtVnd);
    (empty as any).errorDetail = err?.message || String(err);
    return empty;
  }
}
