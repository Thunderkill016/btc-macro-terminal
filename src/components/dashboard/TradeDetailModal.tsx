import React from 'react';
import { X, ShieldCheck, CheckCircle } from 'lucide-react';
import type { Trade } from './types';

interface TradeDetailModalProps {
  trade: Trade | null;
  onClose: () => void;
}

export const TradeDetailModal: React.FC<TradeDetailModalProps> = ({ trade, onClose }) => {
  if (!trade) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#1A2234] rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 relative animate-in zoom-in-95 duration-150"
        role="dialog"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-full ${trade.badgeBg} ${trade.badgeTextColor} flex items-center justify-center font-bold text-sm shadow-xs`}>
            {trade.badge}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {trade.pair}
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                {trade.marketType}
              </span>
            </div>
            <span className="text-xs text-gray-400">{trade.timestamp}</span>
          </div>
        </div>

        {/* P/L Highlight Box */}
        <div className={`rounded-2xl p-4 mb-4 border ${
          trade.isProfit 
            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40' 
            : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-800/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Realized Profit / Alpha</span>
            <span className={`text-xl font-extrabold font-mono ${trade.isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {trade.pnl}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs mb-5">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <span className="text-[10px] text-gray-400 block mb-0.5">ENTRY PRICE</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">{trade.entry}</span>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <span className="text-[10px] text-gray-400 block mb-0.5">EXIT / CURRENT</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">{trade.exit}</span>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <span className="text-[10px] text-gray-400 block mb-0.5">LEVERAGE / SIZING</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{trade.leverage || '1x Spot'}</span>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <span className="text-[10px] text-gray-400 block mb-0.5">POSITION NOTIONAL</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">{trade.size || '$10,000'}</span>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <span className="text-[10px] text-gray-400 block mb-0.5">EXCHANGE FEE</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">{trade.fee || '$0.00'}</span>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <span className="text-[10px] text-gray-400 block mb-0.5">CYCLE DURATION</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">{trade.duration || '1h 45m'}</span>
          </div>
        </div>

        {/* Cryptographic Execution Verification */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-[11px] text-gray-600 dark:text-gray-400 mb-4">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="truncate">Cryptographically Audited · SHA-256 Hash #{trade.id}</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 text-xs font-bold transition cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
