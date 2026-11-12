import React, { useState } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Check, Zap, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Trade } from './types';
import { useUnifiedMetrics } from '../../lib/metricsSelector';

interface QuickTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTradeExecuted: (newTrade: Trade) => void;
  defaultPair?: string;
  liveBtcPrice?: number;
}

export const QuickTradeModal: React.FC<QuickTradeModalProps> = ({
  isOpen,
  onClose,
  onTradeExecuted,
  defaultPair = 'BTC/USDT',
  liveBtcPrice
}) => {
  const metrics = useUnifiedMetrics();
  const currentPrice = liveBtcPrice || metrics.livePrice || 67245;
  const kellyMultiplier = metrics.confluenceMultiplier || 1.35;

  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [pair, setPair] = useState<string>(defaultPair);
  const [tradeMode, setTradeMode] = useState<'SPOT' | 'LEVERAGE'>('SPOT');
  const [leverage, setLeverage] = useState<number>(1);
  const [amount, setAmount] = useState<string>('500');
  const [takeProfit, setTakeProfit] = useState<string>('72400');
  const [stopLoss, setStopLoss] = useState<string>('66100');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecuting(true);

    setTimeout(() => {
      setIsExecuting(false);
      setIsSuccess(true);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      const entryPrice = currentPrice;
      const profitDelta = direction === 'BUY' ? 245.50 : 180.20;
      
      const newTrade: Trade = {
        id: `tr-${Date.now()}`,
        pair,
        marketType: tradeMode === 'SPOT' ? 'Spot DCA' : 'Tactical',
        badge: 'B',
        badgeBg: 'bg-[#10B981]',
        badgeTextColor: 'text-white',
        entry: `$${Math.round(entryPrice).toLocaleString()}`,
        exit: `$${Math.round(entryPrice + (direction === 'BUY' ? 450 : -450)).toLocaleString()}`,
        pnl: `+$${profitDelta.toFixed(2)}`,
        isProfit: true,
        timestamp: 'Just now',
        leverage: tradeMode === 'SPOT' ? '1x Spot' : `${leverage}x Cross`,
        size: `$${(parseFloat(amount || '0') * (tradeMode === 'SPOT' ? 1 : leverage)).toLocaleString()}`,
        fee: '$0.00',
        duration: 'Active'
      };

      setTimeout(() => {
        onTradeExecuted(newTrade);
        setIsSuccess(false);
        onClose();
      }, 1200);
    }, 850);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#1A2234] rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <Zap className="w-3 h-3" />
            <span>Kelly Tactical Engine · {kellyMultiplier}x Suggested</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Quick Bitcoin Execution
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Execute instant Spot DCA or Tactical Order routed to Binance liquidity.
          </p>
        </div>

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">Order Filled!</h4>
            <p className="text-xs text-gray-500 mt-1">
              Position for {pair} filled at ${Math.round(currentPrice).toLocaleString()}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Long / Short Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-2xl">
              <button
                type="button"
                onClick={() => setDirection('BUY')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  direction === 'BUY'
                    ? 'bg-[#10B981] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                ACCUMULATE / BUY
              </button>
              <button
                type="button"
                onClick={() => setDirection('SELL')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  direction === 'SELL'
                    ? 'bg-[#EF4444] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                DE-RISK / SELL
              </button>
            </div>

            {/* Mode: Spot DCA vs Leverage */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-xs">
              <span className="font-semibold text-gray-600 dark:text-gray-300">Execution Mode:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => { setTradeMode('SPOT'); setLeverage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    tradeMode === 'SPOT'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Spot 1x (Zero Risk)
                </button>
                <button
                  type="button"
                  onClick={() => { setTradeMode('LEVERAGE'); setLeverage(5); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    tradeMode === 'LEVERAGE'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Tactical Margin
                </button>
              </div>
            </div>

            {/* Pair & Current Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                  ASSET
                </label>
                <select
                  value={pair}
                  onChange={(e) => setPair(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BTC/USDT">BTC/USDT (Spot)</option>
                  <option value="BTC/FDUSD">BTC/FDUSD (Zero-fee)</option>
                  <option value="BTC-PERP">BTC-PERP (Futures)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                  LIVE BINANCE PRICE
                </label>
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ${Math.round(currentPrice).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Leverage Slider (if Margin selected) */}
            {tradeMode === 'LEVERAGE' && (
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  <span>LEVERAGE</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{leverage}x</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="15"
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>2x</span>
                  <span>5x</span>
                  <span>10x</span>
                  <span>15x (Max)</span>
                </div>
              </div>
            )}

            {/* Margin Amount */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                ALLOCATION AMOUNT (USDT)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="500"
                />
                <span className="absolute right-3 top-2 text-[11px] text-gray-400 font-medium">USDT</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                <span>Total BTC acquired: ~{((parseFloat(amount || '0') * (tradeMode === 'SPOT' ? 1 : leverage)) / currentPrice).toFixed(6)} BTC</span>
                <span className="text-emerald-500 font-medium">VIP Tier: 0% Maker</span>
              </div>
            </div>

            {/* Take Profit & Stop Loss */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                  TARGET / FAIR VALUE ($)
                </label>
                <input
                  type="text"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                  SAFETY FLOOR 200WMA ($)
                </label>
                <input
                  type="text"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-medium text-rose-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isExecuting}
              className={`w-full py-3 rounded-2xl font-bold text-xs tracking-wide uppercase transition-all shadow-md cursor-pointer ${
                direction === 'BUY'
                  ? 'bg-[#10B981] hover:bg-[#059669] text-white shadow-emerald-500/20'
                  : 'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-rose-500/20'
              }`}
            >
              {isExecuting ? 'Submitting to Binance Orderbook...' : `Confirm ${direction} ${pair}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
