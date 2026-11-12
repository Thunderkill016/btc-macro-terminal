import type { Trade, WatchlistItem, AISignal } from './types';

export const INITIAL_TRADES: Trade[] = [
  {
    id: 'tr-btc-01',
    pair: 'BTC/USDT',
    marketType: 'Spot DCA',
    badge: 'B',
    badgeBg: 'bg-[#10B981]',
    badgeTextColor: 'text-white',
    entry: '$67,245',
    exit: '$68,890',
    pnl: '+$1,645.00',
    isProfit: true,
    timestamp: 'Today, 08:42 AM',
    leverage: '1x Spot',
    size: '0.45 BTC',
    fee: '$0.00',
    duration: '2h 15m'
  },
  {
    id: 'tr-btc-02',
    pair: 'BTC/FDUSD',
    marketType: 'Tactical',
    badge: 'B',
    badgeBg: 'bg-[#F59E0B]',
    badgeTextColor: 'text-white',
    entry: '$65,800',
    exit: '$67,400',
    pnl: '+$1,600.00',
    isProfit: true,
    timestamp: 'Today, 06:15 AM',
    leverage: '1x Spot',
    size: '0.25 BTC',
    fee: '$0.00',
    duration: '6h 30m'
  },
  {
    id: 'tr-eth-03',
    pair: 'ETH/BTC',
    marketType: 'Tactical',
    badge: 'E',
    badgeBg: 'bg-[#FF5722]',
    badgeTextColor: 'text-white',
    entry: '0.0482',
    exit: '0.0496',
    pnl: '+$412.80',
    isProfit: true,
    timestamp: 'Yesterday, 11:30 PM',
    leverage: '1x Spot',
    size: '4.2 ETH',
    fee: '$1.40',
    duration: '14h 10m'
  },
  {
    id: 'tr-perp-04',
    pair: 'BTC-PERP',
    marketType: 'Derivatives',
    badge: 'F',
    badgeBg: 'bg-[#06B6D4]',
    badgeTextColor: 'text-white',
    entry: '$66,950',
    exit: '$67,520',
    pnl: '+$285.00',
    isProfit: true,
    timestamp: 'Yesterday, 04:18 PM',
    leverage: '3x Hedge',
    size: '1.20 BTC',
    fee: '$4.15',
    duration: '3h 30m'
  }
];

export const INITIAL_WATCHLIST: WatchlistItem[] = [
  {
    id: 'w-btc',
    pair: 'BTC/USDT',
    marketType: 'Spot',
    badge: 'B',
    badgeBg: 'bg-[#10B981]',
    badgeTextColor: 'text-white',
    changePercent: '+2.45%',
    isPositive: true,
    price: '$67,245',
    rawPrice: 67245
  },
  {
    id: 'w-p2p',
    pair: 'USDT/VND',
    marketType: 'P2P Rate',
    badge: 'P2P',
    badgeBg: 'bg-[#00BFA5]',
    badgeTextColor: 'text-white',
    changePercent: '+0.15%',
    isPositive: true,
    price: '25,850 ₫',
    rawPrice: 25850
  },
  {
    id: 'w-ethbtc',
    pair: 'ETH/BTC',
    marketType: 'Macro Ratio',
    badge: 'E',
    badgeBg: 'bg-[#FF5252]',
    badgeTextColor: 'text-white',
    changePercent: '-1.24%',
    isPositive: false,
    price: '0.0485',
    rawPrice: 0.0485
  },
  {
    id: 'w-funding',
    pair: 'BTC Funding',
    marketType: '8H Yield',
    badge: 'FR',
    badgeBg: 'bg-[#FF7043]',
    badgeTextColor: 'text-white',
    changePercent: '+10.95% APR',
    isPositive: true,
    price: '+0.010%',
    rawPrice: 0.01
  }
];

export const INITIAL_SIGNALS: AISignal[] = [
  {
    id: 'sig-btc-01',
    pair: 'BTC/USDT',
    type: 'BUY',
    confidence: 94.8,
    entryPrice: 67245,
    target1: 68500,
    target2: 69800,
    target3: 71200,
    stopLoss: 66100,
    riskReward: '1 : 3.4',
    timeframe: '4-Phase Confluence: Deep Accumulation',
    status: 'ACTIVE',
    timestamp: '12m ago',
    reasoning: [
      'Bullish liquidity sweep below $66.8k with aggressive spot delta absorption',
      'Power Law support corridor active at $68,033 (200WMA generational floor)',
      'Order book imbalance: 68% bid volume clustered at $66,900 - $67,200',
      'Half-Kelly tactical accumulation recommended at 1.35x budget'
    ]
  },
  {
    id: 'sig-eth-02',
    pair: 'ETH/BTC',
    type: 'BUY',
    confidence: 91.2,
    entryPrice: 0.0482,
    target1: 0.0515,
    target2: 0.0540,
    target3: 0.0580,
    stopLoss: 0.0468,
    riskReward: '1 : 2.8',
    timeframe: 'Macro Cycle Turnaround',
    status: 'ACTIVE',
    timestamp: '35m ago',
    reasoning: [
      'EMA 20 crossing EMA 50 on 4-hour candle close',
      'Exchange reserves hit 2-month low, showing off-exchange cold wallet outflow',
      'Stochastic oscillator golden crossover confirmed'
    ]
  },
  {
    id: 'sig-btc-03',
    pair: 'BTC-PERP',
    type: 'SELL',
    confidence: 86.4,
    entryPrice: 68900,
    target1: 68100,
    target2: 67500,
    target3: 66800,
    stopLoss: 69450,
    riskReward: '1 : 2.5',
    timeframe: 'Funding Arbitrage Hedge',
    status: 'EXPIRED',
    timestamp: '2h ago',
    reasoning: [
      'Rejection at local order block liquidity pool',
      'Bearish funding rate spike (+0.045%) indicate retail overleveraged longs'
    ]
  }
];
