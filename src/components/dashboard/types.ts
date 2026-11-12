export interface Trade {
  id: string;
  pair: string;
  marketType: 'Spot DCA' | 'Tactical' | 'Derivatives' | 'Spot' | 'P2P Rate' | 'Macro Ratio' | '8H Yield' | string;
  badge: string;
  badgeBg: string;
  badgeTextColor: string;
  entry: string;
  exit: string;
  pnl: string;
  isProfit: boolean;
  timestamp: string;
  leverage?: string;
  size?: string;
  fee?: string;
  duration?: string;
}

export interface WatchlistItem {
  id: string;
  pair: string;
  marketType: 'Spot DCA' | 'Tactical' | 'Derivatives' | 'Spot' | 'P2P Rate' | 'Macro Ratio' | '8H Yield' | string;
  badge: string;
  badgeBg: string;
  badgeTextColor: string;
  changePercent: string;
  isPositive: boolean;
  price: string;
  rawPrice: number;
}

export interface AISignal {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  confidence: number;
  entryPrice: number;
  target1: number;
  target2: number;
  target3: number;
  stopLoss: number;
  riskReward: string;
  timeframe: string;
  status: 'ACTIVE' | 'TARGET_HIT' | 'EXPIRED';
  timestamp: string;
  reasoning: string[];
}

