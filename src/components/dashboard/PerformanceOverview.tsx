import React, { useState } from 'react';

export const PerformanceOverview: React.FC = () => {
  const [activePoint] = useState({
    day: 18,
    pnl: '+$1,450.00',
    total: '$24,892.50'
  });
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | 'YTD'>('1M');

  // Stepped polygon points matching image 4 & 7 (City skyline shape)
  const steps = [
    { x: 0, y: 160 },
    { x: 18, y: 160 },
    { x: 18, y: 110 },
    { x: 38, y: 110 },
    { x: 38, y: 170 },
    { x: 55, y: 170 },
    { x: 55, y: 88 },
    { x: 74, y: 88 },
    { x: 74, y: 118 },
    { x: 92, y: 118 },
    { x: 92, y: 140 },
    { x: 108, y: 140 },
    { x: 108, y: 65 },
    { x: 128, y: 65 },
    { x: 128, y: 135 },
    { x: 144, y: 135 },
    { x: 144, y: 170 },
    { x: 168, y: 170 },
    { x: 168, y: 84 },
    { x: 186, y: 84 }, // Point with green square marker
    { x: 186, y: 115 },
    { x: 202, y: 115 },
    { x: 202, y: 178 },
    { x: 218, y: 178 },
    { x: 218, y: 148 },
    { x: 236, y: 148 },
    { x: 236, y: 65 },
    { x: 254, y: 65 },
    { x: 254, y: 92 },
    { x: 272, y: 92 },
    { x: 272, y: 125 },
    { x: 290, y: 125 },
    { x: 290, y: 88 },
    { x: 320, y: 88 },
    { x: 320, y: 195 },
    { x: 0, y: 195 }
  ];

  // Generate SVG path for stepped polygon
  const pathD = steps.reduce((acc, pt, index) => {
    if (index === 0) return `M ${pt.x},${pt.y}`;
    return `${acc} L ${pt.x},${pt.y}`;
  }, '') + ' Z';

  const strokeD = steps.slice(0, -2).reduce((acc, pt, index) => {
    if (index === 0) return `M ${pt.x},${pt.y}`;
    return `${acc} L ${pt.x},${pt.y}`;
  }, '');

  return (
    <div className="bg-white dark:bg-[#1A2234] rounded-3xl p-6 card-shadow border border-gray-100 dark:border-gray-800/80 flex flex-col justify-between relative overflow-hidden h-full">
      {/* Background Dot Matrix Pattern matching screenshots */}
      <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-80" />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400 block mb-1">
            Your trading performance this month
          </span>
          <h2 className="text-lg lg:text-xl font-bold text-[#111827] dark:text-white tracking-tight">
            Performance Overview
          </h2>
        </div>

        {/* Timeframe pill selector */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-full text-[11px] font-medium text-gray-600 dark:text-gray-300">
          {(['1M', '3M', 'YTD'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-white dark:bg-[#253046] text-black dark:text-white shadow-xs font-semibold'
                  : 'hover:text-black dark:hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Tooltip Callout */}
      <div className="relative z-10 mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40 text-xs self-start">
        <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
        <span className="text-gray-600 dark:text-gray-300 font-medium">Day {activePoint.day}:</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{activePoint.pnl}</span>
        <span className="text-gray-400 dark:text-gray-500">|</span>
        <span className="text-gray-500 dark:text-gray-400">Cumul. P/L: <strong className="text-gray-800 dark:text-white">{activePoint.total}</strong></span>
      </div>

      {/* Stepped City-Skyline SVG Chart */}
      <div className="relative z-10 mt-4 w-full h-48 lg:h-52 overflow-hidden">
        <svg
          className="w-full h-full overflow-visible"
          viewBox="0 0 320 200"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="performance-green-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#10B981" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Stepped Area Fill */}
          <path
            d={pathD}
            fill="url(#performance-green-gradient)"
          />

          {/* Stepped Line Stroke */}
          <path
            d={strokeD}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.4"
            strokeLinejoin="miter"
            strokeLinecap="square"
          />

          {/* Signature Vertical Drop Line from the marker node to the bottom baseline */}
          <line
            x1="172"
            y1="84"
            x2="172"
            y2="195"
            stroke="#10B981"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            opacity="0.85"
          />

          {/* Bottom baseline anchor dot matching image 4 & 7 */}
          <circle
            cx="172"
            cy="195"
            r="3"
            fill="#10B981"
          />

          {/* Signature Square Green Marker Node (■) */}
          <rect
            x="167"
            y="79"
            width="10"
            height="10"
            rx="2"
            fill="#10B981"
            className="cursor-pointer hover:scale-125 transition-transform"
          />
        </svg>
      </div>
    </div>
  );
};

