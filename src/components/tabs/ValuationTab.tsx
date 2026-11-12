import React from 'react';
import { AppleDailySignalHero } from '../apple/AppleDailySignalHero';
import { AppleCycleChart } from '../apple/AppleCycleChart';
import { AppleCyclePeakRadar } from '../apple/AppleCyclePeakRadar';

export const ValuationTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Block 1: Institutional Hero (Objective Cycle Positioning, Kelly Execution & 30D/90D Cone) */}
      <AppleDailySignalHero />

      {/* Block 2: Full-Width Multi-Cycle Chart & Oscillator (TradingView Pro & Multi-Cycle Quantitative Models 2011-2026) */}
      <div className="w-full">
        <AppleCycleChart />
      </div>

      {/* Block 3: Consolidated Quantitative Radar Matrix (3 Segmented Sub-Tabs: Peak Radar, Downside Tactical, Halving & Miners) */}
      <AppleCyclePeakRadar />
    </div>
  );
};
