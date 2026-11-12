import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { WatchlistItem } from './types';
import { useUnifiedMetrics } from '../../lib/metricsSelector';

interface WatchlistProps {
  watchlist: WatchlistItem[];
  onSelectPair: (pair: string) => void;
}

export const Watchlist: React.FC<WatchlistProps> = ({
  watchlist: initialWatchlist,
  onSelectPair
}) => {
  const metrics = useUnifiedMetrics();
  const [items, setItems] = useState<WatchlistItem[]>(initialWatchlist);
  const [flashId, setFlashId] = useState<{ id: string; direction: 'up' | 'down' } | null>(null);

  // Sync live pricing from Binance WebSocket & SSOT Metrics
  useEffect(() => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.pair === 'BTC/USDT' && metrics.livePrice && metrics.livePrice > 1000) {
          const isUp = metrics.livePrice >= item.rawPrice;
          return {
            ...item,
            rawPrice: metrics.livePrice,
            price: `$${Math.round(metrics.livePrice).toLocaleString()}`,
            isPositive: isUp
          };
        }
        if (item.pair === 'USDT/VND' && metrics.p2pRate && metrics.p2pRate > 20000) {
          return {
            ...item,
            rawPrice: metrics.p2pRate,
            price: `${metrics.p2pRate.toLocaleString()} ₫`
          };
        }
        if (item.pair === 'BTC Funding' && typeof metrics.fundingRate8h === 'number') {
          const ratePct = metrics.fundingRate8h;
          return {
            ...item,
            rawPrice: ratePct,
            price: `${ratePct >= 0 ? '+' : ''}${ratePct.toFixed(4)}%`,
            changePercent: `${metrics.annualizedFunding ? (metrics.annualizedFunding >= 0 ? '+' : '') + metrics.annualizedFunding.toFixed(2) + '% APR' : '+10.95% APR'}`,
            isPositive: ratePct >= 0
          };
        }
        return item;
      })
    );
  }, [metrics.livePrice, metrics.p2pRate, metrics.fundingRate8h, metrics.annualizedFunding]);

  // Micro tick simulation for secondary tickers
  useEffect(() => {
    const interval = setInterval(() => {
      const nonBtcIndices = [0, 1, 3];
      const targetIdx = nonBtcIndices[Math.floor(Math.random() * nonBtcIndices.length)];
      const target = items[targetIdx];
      if (!target) return;

      const deltaPercent = (Math.random() * 0.16 - 0.08);
      const isUp = deltaPercent >= 0;

      let newRawPrice = target.rawPrice * (1 + deltaPercent / 100);
      let newPriceStr = '';

      if (target.rawPrice > 1000) {
        newPriceStr = `$${Math.round(newRawPrice).toLocaleString()}`;
      } else if (target.rawPrice > 10) {
        newPriceStr = newRawPrice.toFixed(3);
      } else {
        newPriceStr = newRawPrice.toFixed(4);
      }

      setItems((prev) =>
        prev.map((item, idx) => {
          if (idx !== targetIdx) return item;
          return {
            ...item,
            rawPrice: newRawPrice,
            price: newPriceStr
          };
        })
      );

      setFlashId({ id: target.id, direction: isUp ? 'up' : 'down' });
      setTimeout(() => setFlashId(null), 800);
    }, 4000);

    return () => clearInterval(interval);
  }, [items]);

  return (
    <div className="bg-white dark:bg-[#1A2234] rounded-3xl p-6 card-shadow border border-gray-100 dark:border-gray-800/80 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg lg:text-xl font-bold text-[#111827] dark:text-white tracking-tight">
          Watchlist
        </h2>
        <button
          onClick={() => onSelectPair('BTC/USDT')}
          className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* List */}
      <div className="space-y-3.5">
        {items.map((item) => {
          const isFlashing = flashId?.id === item.id;
          const flashBg = isFlashing
            ? flashId.direction === 'up'
              ? 'bg-emerald-50 dark:bg-emerald-950/40'
              : 'bg-rose-50 dark:bg-rose-950/40'
            : '';

          return (
            <div
              key={item.id}
              onClick={() => onSelectPair(item.pair)}
              className={`flex items-center justify-between p-2 rounded-2xl transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${flashBg}`}
            >
              {/* Left: Circle Badge & Name */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full ${item.badgeBg} ${item.badgeTextColor} flex items-center justify-center font-bold text-xs shadow-xs shrink-0`}
                >
                  {item.badge}
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-[13.5px] leading-tight">
                    {item.pair}
                  </div>
                  <div className="text-[11px] text-gray-400 dark:text-gray-500 font-normal">
                    {item.marketType}
                  </div>
                </div>
              </div>

              {/* Right: Percent change & Current Price */}
              <div className="text-right">
                <div
                  className={`text-xs font-semibold ${
                    item.isPositive
                      ? 'text-[#10B981]'
                      : 'text-[#EF4444]'
                  }`}
                >
                  {item.changePercent}
                </div>
                <div className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5 tracking-tight font-mono">
                  {item.price}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

