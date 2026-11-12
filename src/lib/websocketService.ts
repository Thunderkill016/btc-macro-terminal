import { LiquidationOrder, MempoolData, TickerData } from '../types';
import { VIETNAM_FINANCIAL_BENCHMARKS } from '../data/historicalSeed';

interface WebSocketCallbacks {
  onSpotTicker: (ticker: Partial<TickerData>) => void;
  onFundingRate: (markPrice: number, fundingRate: number) => void;
  onLiquidation: (order: LiquidationOrder) => void;
  onMempoolUpdate: (mempool: Partial<MempoolData>) => void;
}

export class CryptoWebSocketManager {
  private spotWs: WebSocket | null = null;
  private futuresWs: WebSocket | null = null;
  private liqWs: WebSocket | null = null;
  private mempoolWs: WebSocket | null = null;
  private mempoolHttpTimer: number | null = null;
  private spotRestFallbackTimer: number | null = null;
  private watchdogTimer: number | null = null;

  private isDestroyed = false;
  private lastMessageTime = Date.now();
  private reconnectTimeouts: Map<string, number> = new Map();
  private retryCounts: Map<string, number> = new Map();

  private callbacks: WebSocketCallbacks;

  constructor(callbacks: WebSocketCallbacks) {
    this.callbacks = callbacks;
  }

  public connectAll(): void {
    this.isDestroyed = false;
    this.lastMessageTime = Date.now();
    this.connectSpotTicker();
    this.connectFuturesMarkPrice();
    this.connectLiquidationStream();
    this.connectMempool();
    this.startMempoolHttpPollingFallback();
    this.startWatchdog();
  }

  public disconnectAll(): void {
    this.isDestroyed = true;

    // Clear reconnect timers
    this.reconnectTimeouts.forEach((timerId) => clearTimeout(timerId));
    this.reconnectTimeouts.clear();

    if (this.watchdogTimer !== null) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }

    if (this.mempoolHttpTimer !== null) {
      clearInterval(this.mempoolHttpTimer);
      this.mempoolHttpTimer = null;
    }

    if (this.spotRestFallbackTimer !== null) {
      clearInterval(this.spotRestFallbackTimer);
      this.spotRestFallbackTimer = null;
    }

    this.cleanupSpotSocket();
    this.cleanupFuturesSocket();
    this.cleanupLiqSocket();
    this.cleanupMempoolSocket();
  }

  private cleanupSpotSocket(): void {
    if (this.spotWs) {
      this.spotWs.onopen = null;
      this.spotWs.onmessage = null;
      this.spotWs.onerror = null;
      this.spotWs.onclose = null;
      try { this.spotWs.close(); } catch {}
      this.spotWs = null;
    }
  }

  private cleanupFuturesSocket(): void {
    if (this.futuresWs) {
      this.futuresWs.onopen = null;
      this.futuresWs.onmessage = null;
      this.futuresWs.onerror = null;
      this.futuresWs.onclose = null;
      try { this.futuresWs.close(); } catch {}
      this.futuresWs = null;
    }
  }

  private cleanupLiqSocket(): void {
    if (this.liqWs) {
      this.liqWs.onopen = null;
      this.liqWs.onmessage = null;
      this.liqWs.onerror = null;
      this.liqWs.onclose = null;
      try { this.liqWs.close(); } catch {}
      this.liqWs = null;
    }
  }

  private cleanupMempoolSocket(): void {
    if (this.mempoolWs) {
      this.mempoolWs.onopen = null;
      this.mempoolWs.onmessage = null;
      this.mempoolWs.onerror = null;
      this.mempoolWs.onclose = null;
      try { this.mempoolWs.close(); } catch {}
      this.mempoolWs = null;
    }
  }

  // Watchdog detecting half-open TCP zombie connections (sleep, network handover)
  private startWatchdog(): void {
    if (this.watchdogTimer !== null) return;
    this.watchdogTimer = window.setInterval(() => {
      if (this.isDestroyed) return;
      const inactiveMs = Date.now() - this.lastMessageTime;
      // If no WebSocket messages received in 25 seconds, reconnect
      if (inactiveMs > 25000) {
        this.cleanupSpotSocket();
        this.cleanupFuturesSocket();
        this.connectSpotTicker();
        this.connectFuturesMarkPrice();
      }
    }, 15000);
  }

  private scheduleReconnect(key: string, connectFn: () => void): void {
    if (this.isDestroyed) return;
    const currentRetries = this.retryCounts.get(key) || 0;
    const delay = Math.min(30000, 1000 * Math.pow(1.5, currentRetries));
    this.retryCounts.set(key, currentRetries + 1);

    // If spot ticker failed repeatedly, activate REST polling fallback
    if (key === 'spot' && currentRetries >= 3) {
      this.startSpotRestFallback();
    }

    const timer = window.setTimeout(() => {
      if (!this.isDestroyed) {
        connectFn();
      }
    }, delay);

    this.reconnectTimeouts.set(key, timer);
  }

  // 1. Binance Spot Ticker (btcusdt@ticker)
  private connectSpotTicker(): void {
    this.cleanupSpotSocket();
    try {
      this.spotWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');

      this.spotWs.onopen = () => {
        this.retryCounts.set('spot', 0);
        this.stopSpotRestFallback();
      };

      this.spotWs.onmessage = (event) => {
        this.lastMessageTime = Date.now();
        try {
          const data = JSON.parse(event.data);
          const currentPrice = parseFloat(data.c);
          const changePercent = parseFloat(data.P);
          const high = parseFloat(data.h);
          const low = parseFloat(data.l);
          const volume = parseFloat(data.v);

          this.callbacks.onSpotTicker({
            price: currentPrice,
            change24h: changePercent,
            high24h: high,
            low24h: low,
            volume24h: volume,
            lastUpdated: Date.now(),
          });
        } catch {}
      };

      this.spotWs.onerror = () => {
        if (this.spotWs) this.spotWs.close();
      };

      this.spotWs.onclose = () => {
        if (!this.isDestroyed) {
          this.scheduleReconnect('spot', () => this.connectSpotTicker());
        }
      };
    } catch {
      this.scheduleReconnect('spot', () => this.connectSpotTicker());
    }
  }

  // REST Fallback for Spot Ticker if WebSocket is blocked by ISP/Corporate Firewall
  private startSpotRestFallback(): void {
    if (this.spotRestFallbackTimer !== null || this.isDestroyed) return;
    const pollRestTicker = async () => {
      if (this.isDestroyed) return;
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
        if (res.ok) {
          const data = await res.json();
          this.lastMessageTime = Date.now();
          this.callbacks.onSpotTicker({
            price: parseFloat(data.lastPrice),
            change24h: parseFloat(data.priceChangePercent),
            high24h: parseFloat(data.highPrice),
            low24h: parseFloat(data.lowPrice),
            volume24h: parseFloat(data.volume),
            lastUpdated: Date.now(),
          });
        }
      } catch {}
    };

    pollRestTicker();
    this.spotRestFallbackTimer = window.setInterval(pollRestTicker, 8000);
  }

  private stopSpotRestFallback(): void {
    if (this.spotRestFallbackTimer !== null) {
      clearInterval(this.spotRestFallbackTimer);
      this.spotRestFallbackTimer = null;
    }
  }

  // 2. Binance Futures Mark Price & Funding Rate (btcusdt@markPrice)
  private connectFuturesMarkPrice(): void {
    this.cleanupFuturesSocket();
    try {
      this.futuresWs = new WebSocket('wss://fstream.binance.com/ws/btcusdt@markPrice');

      this.futuresWs.onopen = () => {
        this.retryCounts.set('futures', 0);
      };

      this.futuresWs.onmessage = (event) => {
        this.lastMessageTime = Date.now();
        try {
          const data = JSON.parse(event.data);
          const markPrice = parseFloat(data.p);
          const fundingRate = parseFloat(data.r);
          this.callbacks.onFundingRate(markPrice, fundingRate);
        } catch {}
      };

      this.futuresWs.onerror = () => {
        if (this.futuresWs) this.futuresWs.close();
      };

      this.futuresWs.onclose = () => {
        if (!this.isDestroyed) {
          this.scheduleReconnect('futures', () => this.connectFuturesMarkPrice());
        }
      };
    } catch {
      this.scheduleReconnect('futures', () => this.connectFuturesMarkPrice());
    }
  }

  // 3. Binance Futures Liquidation Stream (!forceOrder@arr)
  private connectLiquidationStream(): void {
    this.cleanupLiqSocket();
    try {
      this.liqWs = new WebSocket('wss://fstream.binance.com/ws/!forceOrder@arr');

      this.liqWs.onopen = () => {
        this.retryCounts.set('liquidation', 0);
      };

      this.liqWs.onmessage = (event) => {
        this.lastMessageTime = Date.now();
        try {
          const data = JSON.parse(event.data);
          const order = data.o;
          if (order && order.s === 'BTCUSDT') {
            const side = order.S as 'BUY' | 'SELL';
            const price = parseFloat(order.p);
            const originalQty = parseFloat(order.q);
            const filledQty = parseFloat(order.z);
            const amountUsd = price * (filledQty || originalQty);

            this.callbacks.onLiquidation({
              id: `${data.E}_${Math.random().toString(36).substring(2, 6)}`,
              timestamp: data.E,
              side,
              price,
              quantityBtc: filledQty || originalQty,
              volumeUsd: amountUsd,
            });
          }
        } catch {}
      };

      this.liqWs.onerror = () => {
        if (this.liqWs) this.liqWs.close();
      };

      this.liqWs.onclose = () => {
        if (!this.isDestroyed) {
          this.scheduleReconnect('liquidation', () => this.connectLiquidationStream());
        }
      };
    } catch {
      this.scheduleReconnect('liquidation', () => this.connectLiquidationStream());
    }
  }

  // 4. Mempool.space WebSocket for On-Chain Fees
  private connectMempool(): void {
    this.cleanupMempoolSocket();
    try {
      this.mempoolWs = new WebSocket('wss://mempool.space/api/v1/ws');

      this.mempoolWs.onopen = () => {
        this.retryCounts.set('mempool', 0);
        this.clearMempoolHttpPollingFallback();
        try {
          this.mempoolWs?.send(JSON.stringify({ action: 'want', data: ['stats', 'blocks'] }));
        } catch {}
      };

      this.mempoolWs.onmessage = (event) => {
        this.lastMessageTime = Date.now();
        try {
          const data = JSON.parse(event.data);
          if (data && data.fees) {
            const fastestFee = data.fees.fastestFee ?? 18;
            const halfHourFee = data.fees.halfHourFee ?? 14;
            const economyFee = data.fees.economyFee ?? 9;
            const minimumFee = data.fees.minimumFee ?? 5;

            this.callbacks.onMempoolUpdate({
              fastestFee,
              halfHourFee,
              economyFee,
              minimumFee,
              isColdWalletSniperActive: halfHourFee <= 10,
            });
          }
        } catch {}
      };

      this.mempoolWs.onerror = () => {
        this.startMempoolHttpPollingFallback();
        if (this.mempoolWs) this.mempoolWs.close();
      };

      this.mempoolWs.onclose = () => {
        if (!this.isDestroyed) {
          this.startMempoolHttpPollingFallback();
          this.scheduleReconnect('mempool', () => this.connectMempool());
        }
      };
    } catch {
      this.startMempoolHttpPollingFallback();
      this.scheduleReconnect('mempool', () => this.connectMempool());
    }
  }

  private clearMempoolHttpPollingFallback(): void {
    if (this.mempoolHttpTimer !== null) {
      window.clearInterval(this.mempoolHttpTimer);
      this.mempoolHttpTimer = null;
    }
  }

  // Fallback HTTP polling for Mempool recommended fees
  private startMempoolHttpPollingFallback(): void {
    if (this.mempoolHttpTimer !== null || this.isDestroyed) return;
    const fetchFees = async () => {
      if (this.isDestroyed) return;
      try {
        const res = await fetch('https://mempool.space/api/v1/fees/recommended');
        if (res.ok) {
          const data = await res.json();
          this.callbacks.onMempoolUpdate({
            fastestFee: data.fastestFee,
            halfHourFee: data.halfHourFee,
            economyFee: data.economyFee,
            minimumFee: data.minimumFee,
            isColdWalletSniperActive: data.halfHourFee <= 10,
          });
        }
      } catch {}
    };

    fetchFees();
    this.mempoolHttpTimer = window.setInterval(fetchFees, 30000);
  }
}
