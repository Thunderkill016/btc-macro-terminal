import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import type { Trade } from './types';

interface RecentTradesProps {
  trades: Trade[];
  onSelectTrade: (trade: Trade) => void;
}

export const RecentTrades: React.FC<RecentTradesProps> = ({
  trades,
  onSelectTrade
}) => {
  const [filter, setFilter] = useState<'All' | 'Spot DCA' | 'Tactical' | 'Derivatives'>('All');

  const filteredTrades = trades.filter((t) => {
    if (filter === 'All') return true;
    return t.marketType === filter;
  });

  return (
    <div className="bg-white dark:bg-[#1A2234] rounded-3xl p-6 card-shadow border border-gray-100 dark:border-gray-800/80 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-[#111827] dark:text-white tracking-tight">
            Recent Trades
          </h2>
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400 block mt-0.5">
            Your latest quantitative trading & DCA activity
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-full text-[11px] font-medium text-gray-600 dark:text-gray-300">
          {(['All', 'Spot DCA', 'Tactical', 'Derivatives'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                filter === type
                  ? 'bg-white dark:bg-[#253046] text-black dark:text-white shadow-xs font-semibold'
                  : 'hover:text-black dark:hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold">
              <th className="pb-3 pl-1">PAIR</th>
              <th className="pb-3 text-center">ENTRY</th>
              <th className="pb-3 text-center">EXIT / CURR</th>
              <th className="pb-3 text-right">P/L</th>
              <th className="pb-3 text-right pr-1 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60 text-xs">
            {filteredTrades.map((trade) => (
              <tr 
                key={trade.id} 
                className="group hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
              >
                {/* PAIR & MARKET TYPE */}
                <td className="py-3 pl-1">
                  <div className="flex items-center gap-2.5">
                    {/* Circle badge matching image */}
                    <div 
                      className={`w-8 h-8 rounded-full ${trade.badgeBg} ${trade.badgeTextColor} flex items-center justify-center font-bold text-xs shadow-xs shrink-0`}
                    >
                      {trade.badge}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-[13px] leading-tight">
                        {trade.pair}
                      </div>
                      <div className="text-[11px] text-gray-400 dark:text-gray-500 font-normal">
                        {trade.marketType}
                      </div>
                    </div>
                  </div>
                </td>

                {/* ENTRY */}
                <td className="py-3 text-center font-medium text-gray-700 dark:text-gray-300 font-mono">
                  {trade.entry}
                </td>

                {/* EXIT */}
                <td className="py-3 text-center font-medium text-gray-700 dark:text-gray-300 font-mono">
                  {trade.exit}
                </td>

                {/* P/L */}
                <td className="py-3 text-right font-bold font-mono">
                  <span className={trade.isProfit ? 'text-[#10B981]' : 'text-[#EF4444]'}>
                    {trade.pnl}
                  </span>
                </td>

                {/* ACTION EYE */}
                <td className="py-3 text-right pr-1">
                  <button
                    onClick={() => onSelectTrade(trade)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                    title="View trade details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
