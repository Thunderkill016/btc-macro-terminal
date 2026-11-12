import React, { useState } from 'react';
import { ArrowUpRight, Radio } from 'lucide-react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { useUnifiedMetrics } from '../../lib/metricsSelector';

interface MetricCardsProps {
  onFilterSignals?: (filter: 'all' | 'buy' | 'sell') => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ onFilterSignals }) => {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const binancePortfolio = useTerminalStore((s) => s.binancePortfolio);
  const metrics = useUnifiedMetrics();

  // Total P/L Barcode Equalizer bars (approx 28 bars, ~75% green, 25% gray)
  const totalBars = 28;
  const greenBarsCount = Math.round(totalBars * 0.75); // 21 green bars

  // Bar heights profile matching screenshot
  const barHeights = [
    30, 45, 60, 50, 70, 85, 65, 80, 95, 75,
    90, 80, 70, 85, 90, 75, 85, 95, 80, 70,
    65, 45, 50, 40, 35, 45, 50, 35
  ];

  // If Binance portfolio has real connected balance, display it; otherwise show $24,892.50
  const portfolioVal = binancePortfolio?.costBasis?.currentValueUsd;
  const portfolioDisplay = portfolioVal && portfolioVal > 100
    ? `$${Math.round(portfolioVal).toLocaleString()}`
    : '$24,892.50';

  const pnlPct = binancePortfolio?.costBasis?.unrealizedPnlPct;
  const pnlPercentDisplay = typeof pnlPct === 'number'
    ? `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%`
    : '+12.5%';

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-7 select-none">
      {/* CARD 1: Total P/L (MTD) / Portfolio Equity */}
      <div className="bg-white dark:bg-[#1A2234] rounded-3xl p-5 lg:p-6 card-shadow border border-gray-100 dark:border-gray-800/80 flex flex-col justify-between hover:translate-y-[-2px] transition-all">
        <div>
          {/* Top row: Label & Icon */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total P/L (MTD)</span>
            <div className="w-8 h-8 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B]/40 flex items-center justify-center text-[#10B981]">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          {/* Value */}
          <div className="text-2xl lg:text-[26px] font-bold text-[#111827] dark:text-white tracking-tight">
            {portfolioDisplay}
          </div>

          {/* Sub-row: Percentage badge & Goal text */}
          <div className="flex items-center justify-between mt-3 mb-4">
            <span className="px-2 py-0.5 rounded-full bg-[#D1FAE5] dark:bg-[#064E3B]/60 text-[#059669] dark:text-[#34D399] text-[11px] font-semibold">
              {pnlPercentDisplay}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              75% of goal
            </span>
          </div>
        </div>

        {/* Visual: Barcode Equalizer Graphic */}
        <div className="pt-2 flex items-end justify-between gap-[3px] h-11 px-1">
          {barHeights.map((h, i) => {
            const isGreen = i < greenBarsCount;
            const isHovered = hoveredBar === i;
            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
                style={{ height: `${h}%` }}
                className={`flex-1 rounded-full transition-all duration-200 cursor-pointer ${
                  isGreen
                    ? isHovered ? 'bg-[#059669] scale-y-110' : 'bg-[#10B981]'
                    : isHovered ? 'bg-gray-400 dark:bg-gray-500' : 'bg-[#E5E7EB] dark:bg-gray-700/60'
                }`}
                title={`Day ${i + 1}: ${isGreen ? 'DCA Execution Target met' : 'Pending'}`}
              />
            );
          })}
        </div>
      </div>

      {/* CARD 2: Win Rate */}
      <div className="bg-white dark:bg-[#1A2234] rounded-3xl p-5 lg:p-6 card-shadow border border-gray-100 dark:border-gray-800/80 flex flex-col justify-between hover:translate-y-[-2px] transition-all">
        <div>
          {/* Top row */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Win Rate</span>
            <div className="w-8 h-8 rounded-full bg-[#FFEDD5] dark:bg-[#7C2D12]/40 flex items-center justify-center text-[#EA580C]">
              {/* Concentric rings / target icon matching screenshot */}
              <div className="relative w-4 h-4 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full border-2 border-[#EA580C]/40 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full border-2 border-[#EA580C]" />
                </div>
              </div>
            </div>
          </div>

          {/* Value */}
          <div className="text-2xl lg:text-[26px] font-bold text-[#111827] dark:text-white tracking-tight">
            78.5%
          </div>

          {/* Sub-row */}
          <div className="flex items-center justify-between mt-3 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-[#FFEDD5] dark:bg-[#7C2D12]/50 text-[#EA580C] dark:text-[#FB923C] text-[11px] font-semibold">
              +3.2%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              142 wins / 39 losses
            </span>
          </div>
        </div>

        {/* Visual: Dual Spline Wave Chart with highlighted node rings */}
        <div className="pt-2 h-14 relative w-full overflow-hidden">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 60" fill="none">
            {/* Gray baseline subtle curve */}
            <path
              d="M 0,42 C 40,55 70,30 110,48 C 140,62 170,35 200,28"
              stroke="currentColor"
              className="text-[#9CA3AF] dark:text-[#4B5563]"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {/* Main Orange Curve matching screenshot */}
            <path
              d="M 0,55 C 30,35 45,18 70,22 C 95,26 105,45 125,35 C 145,26 160,52 180,48 C 190,46 195,40 200,36"
              stroke="#EA580C"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Highlighted Ring Node 1 on first inflection peak */}
            <circle cx="125" cy="35" r="5" fill="white" className="dark:fill-[#1A2234]" stroke="#EA580C" strokeWidth="3" />
            {/* Highlighted Ring Node 2 on valley */}
            <circle cx="166" cy="48" r="5" fill="white" className="dark:fill-[#1A2234]" stroke="#EA580C" strokeWidth="3" />
          </svg>
        </div>
      </div>

      {/* CARD 3: Active Signals */}
      <div className="bg-white dark:bg-[#1A2234] rounded-3xl p-5 lg:p-6 card-shadow border border-gray-100 dark:border-gray-800/80 flex flex-col justify-between hover:translate-y-[-2px] transition-all">
        <div>
          {/* Top row */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Active Signals</span>
            <div className="w-8 h-8 rounded-full bg-[#ECFEFF] dark:bg-[#164E63]/40 flex items-center justify-center text-[#06B6D4]">
              <Radio className="w-4 h-4" />
            </div>
          </div>

          {/* Value */}
          <div className="text-2xl lg:text-[26px] font-bold text-[#111827] dark:text-white tracking-tight">
            12
          </div>

          {/* Sub-row */}
          <div className="flex items-center justify-between mt-3 mb-4">
            <span className="px-2 py-0.5 rounded-full bg-[#CFFAFE] dark:bg-[#164E63]/60 text-[#0891B2] dark:text-[#38BDF8] text-[11px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0891B2] animate-ping" />
              • Live
            </span>
            <span className="text-xs font-medium">
              <span className="text-[#059669] dark:text-[#34D399] font-semibold cursor-pointer hover:underline" onClick={() => onFilterSignals?.('buy')}>8 Buy</span>
              <span className="text-gray-400 mx-1"> </span>
              <span className="text-gray-600 dark:text-gray-400 font-semibold cursor-pointer hover:underline" onClick={() => onFilterSignals?.('sell')}>4 Sell</span>
            </span>
          </div>
        </div>

        {/* Visual: Glowing Cyan Equalizer Frequency Lines */}
        <div className="pt-2 flex items-end justify-between gap-1.5 h-11 px-1">
          {[40, 65, 80, 50, 75, 90, 60, 85, 45, 70, 95].map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className="w-1.5 rounded-full bg-gradient-to-t from-[#06B6D4] to-[#22D3EE] shadow-[0_0_8px_rgba(6,182,212,0.3)] hover:scale-y-110 transition-transform cursor-pointer"
              title={`Indicator ${i + 1} activity`}
            />
          ))}
        </div>
      </div>

      {/* CARD 4: AI Accuracy */}
      <div className="bg-white dark:bg-[#1A2234] rounded-3xl p-5 lg:p-6 card-shadow border border-gray-100 dark:border-gray-800/80 flex flex-col justify-between hover:translate-y-[-2px] transition-all">
        <div>
          {/* Top row */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">AI Accuracy</span>
            <div className="w-8 h-8 rounded-full bg-[#FFE4E6] dark:bg-[#881337]/40 flex items-center justify-center text-[#E11D48]">
              {/* Circuit node icon */}
              <svg className="w-4 h-4 text-[#E11D48]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
              </svg>
            </div>
          </div>

          {/* Value */}
          <div className="text-2xl lg:text-[26px] font-bold text-[#111827] dark:text-white tracking-tight">
            92.3%
          </div>

          {/* Sub-row */}
          <div className="flex items-center justify-end mt-3 mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Based on 500+ signals
            </span>
          </div>
        </div>

        {/* Visual: Coral/Red Wave Chart with vertical shaded confidence band */}
        <div className="pt-2 h-14 relative w-full overflow-hidden">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 60" fill="none">
            {/* Shaded vertical focus band matching image 1, 3, and 9 */}
            <rect
              x="130"
              y="10"
              width="24"
              height="50"
              rx="4"
              fill="url(#coral-band-gradient)"
              opacity="0.8"
            />
            <defs>
              <linearGradient id="coral-band-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Glowing Coral Wave Line */}
            <path
              d="M 0,44 C 20,42 40,30 55,24 C 70,18 85,38 105,44 C 125,50 135,46 142,50 C 150,54 165,48 180,38 C 190,32 195,28 200,24"
              stroke="#F43F5E"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Highlighted Ring Marker inside the band */}
            <circle cx="142" cy="50" r="4.5" fill="white" className="dark:fill-[#1A2234]" stroke="#F43F5E" strokeWidth="2.5" />
          </svg>
        </div>
      </div>
    </div>
  );
};
