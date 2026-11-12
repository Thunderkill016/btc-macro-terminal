import React, { useState } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { formatUSD, formatVND, formatBtc, formatSats } from '../../lib/formatters';
import { useUnifiedMetrics } from '../../lib/metricsSelector';
import {
  TrendingUp,
  Target,
  ShieldCheck,
  Zap,
  Sparkles,
  Lock,
  ArrowRight,
  Calculator,
  CheckCircle2,
  DollarSign,
  Crown,
} from 'lucide-react';

export const ExitLadderStrategy: React.FC = () => {
  const locale = useTerminalStore((s) => s.locale);
  const metrics = useUnifiedMetrics();
  const livePrice = metrics.livePrice;
  const p2pRate = metrics.p2pRate;
  const binancePortfolio = useTerminalStore((s) => s.binancePortfolio);
  const summary = useTerminalStore((s) => s.portfolioSummary);

  const isVi = locale === 'vi';
  const piCycleTarget = metrics.piCycleTop;

  // Real user data
  const realTotalBtc = (binancePortfolio?.connected || binancePortfolio?.source === 'api_live')
    ? binancePortfolio.wallets.totalBtc
    : summary.totalBtc;
  const realAvgPrice = (binancePortfolio?.connected || binancePortfolio?.source === 'api_live')
    ? binancePortfolio.costBasis.avgBuyPrice
    : summary.averageBuyPriceUsd;

  // Presets / Scenarios for simulation
  type PresetType = 'my_portfolio' | 'demo_10m' | 'demo_100m' | 'demo_1btc';
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('my_portfolio');

  // Compute active BTC and Avg Price based on preset
  let activeBtc = realTotalBtc > 0 ? realTotalBtc : 0.00019760;
  let activeAvgPrice = realAvgPrice > 0 ? realAvgPrice : 80792;

  if (selectedPreset === 'demo_10m') {
    // 10,000,000 VND (~$390)
    activeAvgPrice = 80000;
    activeBtc = 390 / activeAvgPrice; // ~0.004875 BTC (~487,500 sats)
  } else if (selectedPreset === 'demo_100m') {
    // 100,000,000 VND (~$3,900)
    activeAvgPrice = 80000;
    activeBtc = 3900 / activeAvgPrice; // ~0.04875 BTC (~4,875,000 sats)
  } else if (selectedPreset === 'demo_1btc') {
    // 1.0 BTC
    activeAvgPrice = 75000;
    activeBtc = 1.0;
  }

  const activeSats = Math.round(activeBtc * 100_000_000);
  const initialCapitalUsd = activeBtc * activeAvgPrice;
  const initialCapitalVnd = Math.round(initialCapitalUsd * p2pRate);

  // 4 Ladder Rungs Definition - Strictly Ascending Progression (Target 1 < Target 2 < Target 3)
  const target2Price = piCycleTarget > 0 ? piCycleTarget : 151444; // Pi Cycle Top Target (~$151.4k)
  const target1Price = Math.min(115000, Math.round(target2Price * 0.76)); // Psychological Milestone 1 (~$115k)
  const target3Price = metrics.powerLawBubbleCeiling; // Power Law Bubble Ceiling ($203,500) unified with Tab 1 SSOT

  // Calculations for Rung 1 (Sell 35% at Milestone 1 ~$115k)
  const r1Btc = activeBtc * 0.35;
  const r1Sats = Math.round(r1Btc * 1e8);
  const r1Usd = r1Btc * target1Price;
  const r1Vnd = Math.round(r1Usd * p2pRate);
  const r1DistPct = ((target1Price - livePrice) / livePrice) * 100;

  // Calculations for Rung 2 (Sell 35% at Pi Cycle ~$151.4k)
  const r2Btc = activeBtc * 0.35;
  const r2Sats = Math.round(r2Btc * 1e8);
  const r2Usd = r2Btc * target2Price;
  const r2Vnd = Math.round(r2Usd * p2pRate);
  const r2DistPct = ((target2Price - livePrice) / livePrice) * 100;

  // Calculations for Rung 3 (Sell 15% at Power Law Bubble ~$203.5k)
  const r3Btc = activeBtc * 0.15;
  const r3Sats = Math.round(r3Btc * 1e8);
  const r3Usd = r3Btc * target3Price;
  const r3Vnd = Math.round(r3Usd * p2pRate);
  const r3DistPct = ((target3Price - livePrice) / livePrice) * 100;

  // Calculations for Rung 4 (Keep 15% Moonbag in Cold Storage)
  const r4Btc = activeBtc * 0.15;
  const r4Sats = Math.round(r4Btc * 1e8);

  // Total summary of returns
  const totalCashOutUsd = r1Usd + r2Usd + r3Usd;
  const totalCashOutVnd = Math.round(totalCashOutUsd * p2pRate);
  const netProfitUsd = totalCashOutUsd - initialCapitalUsd;
  const roiPct = initialCapitalUsd > 0 ? (netProfitUsd / initialCapitalUsd) * 100 : 0;

  const rungs = [
    {
      id: 1,
      badgeVi: 'Nấc 1 • Cột Mốc Tâm Lý $115K',
      badgeEn: 'Rung 1 • Psychological Milestone $115K',
      targetPrice: target1Price,
      distPct: r1DistPct,
      sellPct: 'Bán 35% Vị Thế',
      sellBtc: r1Btc,
      sellSats: r1Sats,
      cashOutUsd: r1Usd,
      cashOutVnd: r1Vnd,
      color: 'border-cyan-500/40 bg-cyan-500/5',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      priceColor: 'text-cyan-300',
      taglineVi: 'BẢO TOÀN VỐN & THU HỒI DẦN',
      taglineEn: 'PRINCIPAL CAPITAL RECOVERY',
      descVi: `Chốt 35% vị thế (${r1Sats.toLocaleString()} sats) tại cột mốc tâm lý $115k để thu hồi phần lớn vốn đầu tư ban đầu ($${r1Usd.toFixed(2)} • ~${formatVND(r1Vnd)}). Giảm thiểu rủi ro biến động và bảo toàn vốn an toàn.`,
      descEn: `Sell 35% of holdings (${r1Sats.toLocaleString()} sats) at $115k to derisk and lock in principal recovery ($${r1Usd.toFixed(2)}).`,
      icon: ShieldCheck,
    },
    {
      id: 2,
      badgeVi: 'Nấc 2 • Chốt Lời Giao Cắt Pi Cycle',
      badgeEn: 'Rung 2 • Pi Cycle Crossover Exit',
      targetPrice: target2Price,
      distPct: r2DistPct,
      sellPct: 'Bán 35% Vị Thế',
      sellBtc: r2Btc,
      sellSats: r2Sats,
      cashOutUsd: r2Usd,
      cashOutVnd: r2Vnd,
      color: 'border-emerald-500/40 bg-emerald-500/5',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      priceColor: 'text-emerald-400',
      taglineVi: 'HIỆN THỰC HÓA LỢI NHUẬN RÒNG',
      taglineEn: 'NET PROFIT REALIZATION',
      descVi: `Chốt tiếp 35% vị thế (${r2Sats.toLocaleString()} sats) khi kích hoạt sự kiện giao cắt động Pi Cycle Top (111DMA cắt lên trên 2× 350DMA, hiện ước tính ~$${target2Price.toLocaleString()}), thu về $${r2Usd.toFixed(2)} (~${formatVND(r2Vnd)}).`,
      descEn: `Sell 35% (${r2Sats.toLocaleString()} sats) when the 111DMA crosses above 2x 350DMA (~$${target2Price.toLocaleString()}), yielding $${r2Usd.toFixed(2)}.`,
      icon: TrendingUp,
    },
    {
      id: 3,
      badgeVi: 'Nấc 3 • Trần Bong Bóng Power Law',
      badgeEn: 'Rung 3 • Power Law Bubble Exit',
      targetPrice: target3Price,
      distPct: r3DistPct,
      sellPct: 'Bán 15% Vị Thế',
      sellBtc: r3Btc,
      sellSats: r3Sats,
      cashOutUsd: r3Usd,
      cashOutVnd: r3Vnd,
      color: 'border-purple-500/40 bg-purple-500/5',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      priceColor: 'text-purple-300',
      taglineVi: 'TỐI ƯU HÓA ĐỈNH HƯNG PHẤN',
      taglineEn: 'EUPHORIA MAXIMUM EXIT',
      descVi: `Chốt tiếp 15% số BTC (${r3Sats.toLocaleString()} sats) tại trần bong bóng mô hình Power Law ($${target3Price.toLocaleString()}, đồng bộ với mức trần Tab 1 khi MVRV > 3.8 và thị trường hưng phấn cực đại), thu về $${r3Usd.toFixed(2)} (~${formatVND(r3Vnd)}).`,
      descEn: `Sell 15% (${r3Sats.toLocaleString()} sats) at the Power Law Bubble Ceiling ($${target3Price.toLocaleString()}) when MVRV > 3.8, yielding $${r3Usd.toFixed(2)}.`,
      icon: Sparkles,
    },
    {
      id: 4,
      badgeVi: 'Nấc 4 • Moonbag Thế Hệ Ví Lạnh',
      badgeEn: 'Rung 4 • Cold Storage Generational Bag',
      targetPrice: 0,
      distPct: 0,
      sellPct: 'Giữ 15% Dài Hạn',
      sellBtc: r4Btc,
      sellSats: r4Sats,
      cashOutUsd: 0,
      cashOutVnd: 0,
      color: 'border-amber-500/40 bg-amber-500/5',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      priceColor: 'text-amber-400',
      taglineVi: 'LƯU TRỮ VÍ LẠNH (HODL XUYÊN CHU KỲ)',
      taglineEn: 'COLD STORAGE CYCLE HODL',
      descVi: `Giữ nguyên 15% số BTC (${r4Sats.toLocaleString()} sats) lưu trữ trong ví lạnh cá nhân (Cold Storage) như tài sản bảo chứng xuyên chu kỳ, duy trì hiện diện nếu mạng lưới tiếp tục mở rộng quy mô toàn cầu (phần BTC còn lại vẫn chịu rủi ro biến động giá theo thị trường).`,
      descEn: `Keep 15% (${r4Sats.toLocaleString()} sats) in cold custody as a permanent institutional store-of-value (remaining BTC position still bears market price volatility risk).`,
      icon: Crown,
    },
  ];

  return (
    <div className="rounded-2xl bg-white border border-[#E1E3E3] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] p-5 sm:p-6 backdrop-blur-xl space-y-5 font-sans">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E1E3E3]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center shadow-sm">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-[#191F2C] tracking-tight uppercase">
                {isVi ? 'BẢNG KẾ HOẠCH THU HỒI GỐC & CHỐT LỜI TỪNG NẤC (EXIT LADDER)' : 'STRATEGIC EXIT LADDER'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">
                THIẾT CHẾ CHU KỲ
              </span>
            </div>
            <p className="text-xs text-[#64748B] font-normal">
              {isVi
                ? 'Kế hoạch giảm thiểu rủi ro (De-risking) từng phần: Giảm tỷ trọng khi định giá mở rộng, bảo toàn vốn đầu tư và duy trì vị thế dài hạn.'
                : 'Disciplined multi-stage de-risking framework: Systematic exposure reduction as valuation expands, capital preservation, and core holding retention.'}
            </p>
          </div>
        </div>

        {/* Portfolio Presets / Sandbox Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F8FAFC] border border-[#E1E3E3] text-xs">
          <button
            type="button"
            onClick={() => setSelectedPreset('my_portfolio')}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              selectedPreset === 'my_portfolio'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#191F2C]'
            }`}
          >
            {isVi ? 'Ví Của Bạn' : 'My Wallet'} ({activeSats.toLocaleString()} sats)
          </button>
          <button
            type="button"
            onClick={() => setSelectedPreset('demo_10m')}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              selectedPreset === 'demo_10m'
                ? 'bg-purple-600 text-white shadow-sm font-bold'
                : 'text-[#64748B] hover:text-[#191F2C]'
            }`}
          >
            {isVi ? 'Ví 10 Triệu' : '10M VND'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedPreset('demo_100m')}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              selectedPreset === 'demo_100m'
                ? 'bg-purple-600 text-white shadow-sm font-bold'
                : 'text-[#64748B] hover:text-[#191F2C]'
            }`}
          >
            {isVi ? 'Ví 100 Triệu' : '100M VND'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedPreset('demo_1btc')}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer font-mono ${
              selectedPreset === 'demo_1btc'
                ? 'bg-purple-600 text-white shadow-sm font-bold'
                : 'text-[#64748B] hover:text-[#191F2C]'
            }`}
          >
            1.0 BTC
          </button>
        </div>
      </div>

      {/* Overview Metric Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-black/40 border border-[#E1E3E3] text-xs font-mono">
        <div>
          <span className="text-[10px] text-[#64748B] font-sans block">{isVi ? 'Vốn Gốc Ban Đầu:' : 'Initial Principal:'}</span>
          <span className="font-bold text-[#191F2C] text-sm">{formatUSD(initialCapitalUsd, 2)}</span>
          <span className="text-[10px] text-[#64748B] block font-sans">≈ {formatVND(initialCapitalVnd)}</span>
        </div>
        <div>
          <span className="text-[10px] text-[#64748B] font-sans block">{isVi ? 'Tổng Tiền Mặt Thu Hồi:' : 'Total Cash Out:'}</span>
          <span className="font-bold text-emerald-400 text-sm">{formatUSD(totalCashOutUsd, 2)}</span>
          <span className="text-[10px] text-emerald-300 block font-sans">≈ {formatVND(totalCashOutVnd)}</span>
        </div>
        <div>
          <span className="text-[10px] text-[#64748B] font-sans block">{isVi ? 'Lợi Nhuận Ròng (Net ROI):' : 'Net ROI:'}</span>
          <span className="font-bold text-cyan-300 text-sm">+{roiPct.toFixed(0)}%</span>
          <span className="text-[10px] text-cyan-200 block font-sans">+{formatUSD(netProfitUsd, 2)}</span>
        </div>
        <div>
          <span className="text-[10px] text-[#64748B] font-sans block">{isVi ? 'Moonbag Vĩnh Cửu:' : 'Forever Bag:'}</span>
          <span className="font-bold text-amber-300 text-sm">{r4Sats.toLocaleString()} sats</span>
          <span className="text-[10px] text-amber-200 block font-sans">{r4Btc.toFixed(8)} BTC</span>
        </div>
      </div>

      {/* 4 Ladder Rungs */}
      <div className="space-y-3">
        {rungs.map((rung) => {
          const Icon = rung.icon;
          const isForever = rung.id === 4;

          return (
            <div
              key={rung.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${rung.color}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E1E3E3]">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border font-mono ${rung.badgeColor}`}>
                    {isVi ? rung.badgeVi : rung.badgeEn}
                  </span>
                  <span className="text-xs font-bold text-[#191F2C] uppercase tracking-wide">
                    {isVi ? rung.taglineVi : rung.taglineEn}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  {!isForever ? (
                    <>
                      <span className="text-[#64748B]">{isVi ? 'Giá Kích Hoạt:' : 'Target Price:'}</span>
                      <span className={`text-sm sm:text-base font-black ${rung.priceColor}`}>
                        {formatUSD(rung.targetPrice, 0)}
                      </span>
                      <span className="text-[10px] text-[#64748B] font-sans">
                        (+{rung.distPct.toFixed(1)}% {isVi ? 'từ giá hiện tại' : 'away'})
                      </span>
                    </>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1 font-sans">
                      <Lock className="w-3.5 h-3.5" />
                      {isVi ? 'Không Bao Giờ Bán' : 'Never Sell'}
                    </span>
                  )}
                </div>
              </div>

              {/* Rung Action & Details */}
              <div className="pt-3 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                <div className="lg:col-span-8 text-xs text-[#343B43] leading-relaxed font-normal">
                  {isVi ? rung.descVi : rung.descEn}
                </div>

                <div className="lg:col-span-4 p-3 rounded-xl bg-[#F8FAFC] border border-[#E1E3E3] text-xs font-mono space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B] font-sans">{isVi ? 'Thao tác:' : 'Action:'}</span>
                    <strong className="text-[#191F2C] font-sans">{rung.sellPct}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B] font-sans">{isVi ? 'Khối lượng:' : 'Volume:'}</span>
                    <strong className="text-amber-300">
                      {isForever ? `${rung.sellSats.toLocaleString()} sats` : `-${rung.sellSats.toLocaleString()} sats`}
                    </strong>
                  </div>
                  {!isForever && (
                    <div className="flex justify-between items-center pt-0.5 border-t border-[#E1E3E3]">
                      <span className="text-[#64748B] font-sans">{isVi ? 'Thu tiền mặt:' : 'Cash Out:'}</span>
                      <strong className="text-emerald-400">
                        +{formatUSD(rung.cashOutUsd, 2)} ({formatVND(rung.cashOutVnd)})
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
