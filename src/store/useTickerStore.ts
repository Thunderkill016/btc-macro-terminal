import { create } from 'zustand';
import { TickerData } from '../types';
import { VIETNAM_FINANCIAL_BENCHMARKS } from '../data/historicalSeed';

export interface TickerState {
  ticker: TickerData;
  isLiveConnected: boolean;
  isStale: boolean;
  updateTicker: (update: Partial<TickerData>) => void;
  setLiveConnected: (connected: boolean) => void;
  markStale: () => void;
}

const INITIAL_PRICE = 75925;
const P2P_RATE = VIETNAM_FINANCIAL_BENCHMARKS.p2pUsdtVndRate;
const OFFICIAL_RATE = VIETNAM_FINANCIAL_BENCHMARKS.officialUsdVndRate;

export const INITIAL_TICKER_DATA: TickerData = {
  price: INITIAL_PRICE,
  priceVnd: Math.round(INITIAL_PRICE * P2P_RATE),
  p2pUsdtVndRate: P2P_RATE,
  officialUsdVndRate: OFFICIAL_RATE,
  p2pPremiumPercent: parseFloat((((P2P_RATE - OFFICIAL_RATE) / OFFICIAL_RATE) * 100).toFixed(2)),
  change24h: 1.45,
  high24h: 76800,
  low24h: 74900,
  volume24h: 92000,
  lastUpdated: Date.now(),
  priceDirection: 'neutral',
};

/**
 * High-Frequency Isolated Store (1Hz WebSocket Price & 24h Change Only).
 * Decouples fast sub-second price ticks from heavy econometric models.
 */
export const useTickerStore = create<TickerState>((set, get) => ({
  ticker: INITIAL_TICKER_DATA,
  isLiveConnected: false,
  isStale: false,

  updateTicker: (tickerUpdate: Partial<TickerData>) => {
    const oldPrice = get().ticker.price;
    const newPrice = tickerUpdate.price ?? oldPrice;
    const direction: 'up' | 'down' | 'neutral' =
      newPrice > oldPrice ? 'up' : newPrice < oldPrice ? 'down' : 'neutral';

    set((state) => ({
      ticker: {
        ...state.ticker,
        ...tickerUpdate,
        price: newPrice,
        priceDirection: direction,
        priceVnd:
          tickerUpdate.priceVnd ??
          Math.round(newPrice * (tickerUpdate.p2pUsdtVndRate ?? state.ticker.p2pUsdtVndRate)),
        lastUpdated: tickerUpdate.lastUpdated ?? Date.now(),
      },
      isLiveConnected: true,
      isStale: false,
    }));
  },

  setLiveConnected: (connected: boolean) => set({ isLiveConnected: connected }),
  markStale: () => set({ isStale: true }),
}));
