import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, CheckCircle2, Zap, Copy, Check } from 'lucide-react';
import type { AISignal } from './types';

interface LiveSignalsViewProps {
  signals: AISignal[];
  onQuickTrade: (pair: string) => void;
}

export const LiveSignalsView: React.FC<LiveSignalsViewProps> = ({ signals, onQuickTrade }) => {
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = signals.filter(s => filter === 'ALL' || s.type === filter);

  const handleCopy = (signal: AISignal) => {
    const text = `BTC Signal AI: ${signal.pair} ${signal.type}\nEntry: $${signal.entryPrice}\nTP1: $${signal.target1} | TP2: $${signal.target2}\nSL: $${signal.stopLoss}\nConfidence: ${signal.confidence}%`;
    navigator.clipboard.writeText(text);
    setCopiedId(signal.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 lg:p-7 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Real-time Neural Engine · High Accuracy</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Active Crypto AI Signals</h2>
          <p className="text-xs text-blue-100 mt-1 max-w-xl">
            Live quantitative setups detected across multi-timeframe liquidity pools, open interest delta, and orderbook imbalance.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1 rounded-full">
          {(['ALL', 'BUY', 'SELL'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filter === tab ? 'bg-white text-blue-900 shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              {tab === 'ALL' ? 'All Signals' : tab === 'BUY' ? 'Bullish / Long' : 'Bearish / Short'}
            </button>
          ))}
        </div>
      </div>

      {/* Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(signal => {
          const isBuy = signal.type === 'BUY';
          return (
            <div
              key={signal.id}
              className="bg-white dark:bg-[#1A2234] rounded-3xl p-6 card-shadow border border-gray-100 dark:border-gray-800/80 flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden"
            >
              {/* Top Row */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-9 h-9 rounded-full bg-[#10B981]/10 dark:bg-[#10B981]/20 flex items-center justify-center font-bold text-xs text-[#10B981]">
                      {signal.pair.split('/')[0]}
                    </span>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">
                        {signal.pair}
                      </h3>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {signal.timeframe} · {signal.timestamp}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                      isBuy
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981]'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-[#EF4444]'
                    }`}
                  >
                    {isBuy ? <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" /> : <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />}
                    {isBuy ? 'STRONG BUY' : 'SCALP SELL'}
                  </span>
                </div>

                {/* Accuracy meter */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 mb-4">
                  <span className="text-xs text-gray-500 font-medium">AI Confidence</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                        style={{ width: `${signal.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {signal.confidence}%
                    </span>
                  </div>
                </div>

                {/* Targets Matrix */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                    <span className="text-[10px] text-gray-400 block">ENTRY</span>
                    <span className="font-bold text-gray-900 dark:text-white font-mono">${signal.entryPrice.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                    <span className="text-[10px] text-gray-400 block">STOP LOSS</span>
                    <span className="font-bold text-rose-500 font-mono">${signal.stopLoss.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">TARGET 1</span>
                    <span className="font-bold text-emerald-600 font-mono">${signal.target1.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">TARGET 2</span>
                    <span className="font-bold text-emerald-600 font-mono">${signal.target2.toLocaleString()}</span>
                  </div>
                </div>

                {/* Key Logic */}
                <div className="space-y-1.5 mb-5 text-[11px] text-gray-500 dark:text-gray-400">
                  {signal.reasoning.slice(0, 2).map((r, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => onQuickTrade(signal.pair)}
                  className="flex-1 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
                >
                  Quick Trade
                </button>
                <button
                  onClick={() => handleCopy(signal)}
                  className="px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition cursor-pointer"
                  title="Copy signal parameters"
                >
                  {copiedId === signal.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

