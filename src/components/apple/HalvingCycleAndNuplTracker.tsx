import React, { useState } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { formatUSD, formatVND } from '../../lib/formatters';
import {
  Clock,
  Sparkles,
  Layers,
  Coins,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

export const HalvingCycleAndNuplTracker: React.FC = () => {
  const locale = useTerminalStore((s) => s.locale);
  const ticker = useTerminalStore((s) => s.ticker);
  const liveCoinMetrics = useTerminalStore((s) => s.liveCoinMetrics);
  const realCyclePoints = useTerminalStore((s) => s.realCyclePoints);
  const dcaBudget = useTerminalStore((s) => s.dcaBudget);

  const isVi = locale === 'vi';
  const livePrice = ticker.price || 74900;
  const p2pRate = ticker.p2pUsdtVndRate || 25650;
  const officialRate = ticker.officialUsdVndRate || 25603;

  // Realized Price & MVRV from live CoinMetrics
  const realizedPrice = liveCoinMetrics?.realizedPrice || 53940;
  const liveMvrv = liveCoinMetrics?.mvrv || parseFloat((livePrice / realizedPrice).toFixed(2)) || 1.39;

  // NUPL = (Market Cap - Realized Cap) / Market Cap = (MVRV - 1) / MVRV
  const nupl = liveMvrv > 0 ? parseFloat(((liveMvrv - 1) / liveMvrv).toFixed(2)) : 0.28;
  const nuplPercent = Math.round(nupl * 100);

  // Halving 4 Timing (Block 840,000 was on April 20, 2024)
  const HALVING_4_DATE = new Date('2024-04-20T00:00:00Z').getTime();
  const daysSinceHalving = Math.max(0, Math.floor((Date.now() - HALVING_4_DATE) / 86400000));
  const cycleTotalDays = 1460; // 4 years * 365 days
  const cycleProgressPct = Math.min(100, Math.round((daysSinceHalving / cycleTotalDays) * 100));

  // Vietnam SJC Gold Purchasing Power Benchmark (88,000,000 VND / lượng SJC)
  const SJC_TAEL_VND = 88000000;
  const btcVnd = Math.round(livePrice * p2pRate);
  const btcInSjcTaels = parseFloat((btcVnd / SJC_TAEL_VND).toFixed(1));
  const p2pPremiumPct = parseFloat(
    (((p2pRate - officialRate) / officialRate) * 100).toFixed(2)
  );

  // Interactive Scenario Simulator State
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  const simPrice = selectedScenario !== null ? selectedScenario : livePrice;
  const simMvrv = parseFloat((simPrice / realizedPrice).toFixed(2));
  const simNupl = parseFloat(((simMvrv - 1) / simMvrv).toFixed(2));
  const simSjcTaels = parseFloat(((simPrice * p2pRate) / SJC_TAEL_VND).toFixed(1));

  // NUPL Sentiment Phase Classification (LookIntoBitcoin Standard)
  let nuplPhase = {
    labelVi: 'Lạc Quan / Nghi Ngờ (Optimism)',
    labelEn: 'Optimism / Anxiety',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    descriptionVi: 'Phần lớn nguồn cung đang có lãi vừa phải (~28%). Không có dấu hiệu bong bóng đầu cơ, vùng tích lũy lành mạnh.',
    descriptionEn: 'Healthy mid-cycle expansion. Majority of coins are in modest profit, zero speculative mania.',
  };

  if (simNupl < 0) {
    nuplPhase = {
      labelVi: 'Đầu Hàng / Hoảng Loạn (Capitulation)',
      labelEn: 'Capitulation',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/30',
      descriptionVi: 'Toàn mạng lưới chịu lỗ tổng thể. Vùng cơ hội mua tích sản hiếm có trong lịch sử chu kỳ 4 năm.',
      descriptionEn: 'Network in aggregate unrealized loss. Historic macro accumulation opportunity.',
    };
  } else if (simNupl < 0.25) {
    nuplPhase = {
      labelVi: 'Hy Vọng / Sợ Hãi (Hope / Fear)',
      labelEn: 'Hope / Fear',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
      descriptionVi: 'Thị trường vừa thoát đáy, tâm lý nghi ngờ chiếm ưu thế. Vùng gom hàng bền vững.',
      descriptionEn: 'Emerging from bottom, widespread skepticism. High-conviction DCA accumulation.',
    };
  } else if (simNupl > 0.75) {
    nuplPhase = {
      labelVi: 'Hưng Phấn Cực Độ (Euphoria / Peak)',
      labelEn: 'Euphoria / Greed Peak',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/30',
      descriptionVi: 'Hơn 75% vốn hóa là lãi chưa chốt. Vùng rủi ro đảo chiều đỉnh chu kỳ, kích hoạt thang chốt lời.',
      descriptionEn: 'Over 75% market cap in profit. Extreme cycle top risk, initiate systematic exit ladder.',
    };
  } else if (simNupl >= 0.50) {
    nuplPhase = {
      labelVi: 'Niềm Tin / Tham Lam (Belief)',
      labelEn: 'Belief / Greed',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/30',
      descriptionVi: 'Sóng tăng gia tốc mạnh, niềm tin vững chắc. Tiếp tục giữ vị thế, chuẩn bị thang bán chốt gốc.',
      descriptionEn: 'Strong trending momentum and belief. Hold existing position, prepare principal recovery.',
    };
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-sans">
      {/* 1. BITCOIN 4TH HALVING CYCLE TIMELINE & PEAK RADAR (7 of 12 cols) */}
      <div className="lg:col-span-7 rounded-3xl bg-slate-900/60 border border-white/[0.08] p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>{isVi ? 'TIẾN TRÌNH CHU KỲ HALVING 4' : '4TH HALVING CYCLE PROGRESS'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {isVi ? 'ĐÃ QUA' : 'ELAPSED'} {daysSinceHalving} {isVi ? 'NGÀY' : 'DAYS'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {isVi
                  ? 'Theo dõi vị trí chu kỳ 4 năm so với các đỉnh lịch sử (Chu kỳ 2: 525 ngày, Chu kỳ 3: 546 ngày).'
                  : 'Tracking current 4-year cycle progress against historical peaks (2016: 525d, 2020: 546d).'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-amber-400 font-bold">
            {cycleProgressPct}% {isVi ? 'Chu Kỳ' : 'Epoch'}
          </span>
        </div>

        {/* Visual Epoch Progress Bar */}
        <div className="space-y-2">
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/[0.06] relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-emerald-400 to-cyan-400 transition-all duration-700"
              style={{ width: `${cycleProgressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Halving 4 (20/04/2024)</span>
            <span className="text-amber-400 font-bold">Hiện tại: Ngày {daysSinceHalving}</span>
            <span>Halving 5 (~Tháng 4/2028)</span>
          </div>
        </div>

        {/* 3 Historical Benchmark Comparison Cards */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              {isVi ? 'Chu Kỳ 2 (2016)' : 'Cycle 2 (2016)'}
            </span>
            <div className="text-sm font-bold text-white font-mono">525 {isVi ? 'ngày' : 'days'}</div>
            <span className="text-[10px] text-emerald-400 block font-sans">
              {isVi ? 'Đạt ATH $19.8k' : 'ATH $19.8k'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              {isVi ? 'Chu Kỳ 3 (2020)' : 'Cycle 3 (2020)'}
            </span>
            <div className="text-sm font-bold text-white font-mono">546 {isVi ? 'ngày' : 'days'}</div>
            <span className="text-[10px] text-cyan-400 block font-sans">
              {isVi ? 'Đạt ATH $69k' : 'ATH $69k'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
            <span className="text-[10px] text-amber-300 uppercase font-semibold block">
              {isVi ? 'Chu Kỳ 4 (Hiện Tại)' : 'Cycle 4 (Current)'}
            </span>
            <div className="text-sm font-bold text-amber-400 font-mono">
              ~{Math.round(daysSinceHalving / 30)} {isVi ? 'tháng' : 'mo'}
            </div>
            <span className="text-[10px] text-amber-300 block font-sans">
              {isVi ? 'Đang gom & tích lũy' : 'Accumulation phase'}
            </span>
          </div>
        </div>

        {/* 2. LOOKINTOBITCOIN NUPL (NET UNREALIZED PROFIT / LOSS) GAUGE */}
        <div className="pt-3 border-t border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {isVi ? 'CHỈ SỐ NUPL ON-CHAIN' : 'ON-CHAIN NUPL INDICATOR'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">(LookIntoBitcoin Standard)</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-xs text-slate-400">NUPL:</span>
              <span className={`text-sm font-black ${nuplPhase.color}`}>
                {simNupl > 0 ? `+${(simNupl * 100).toFixed(0)}%` : `${(simNupl * 100).toFixed(0)}%`}
              </span>
            </div>
          </div>

          {/* 5-Phase Color Band */}
          <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden flex relative border border-white/[0.06]">
            <div className="h-full bg-rose-500" style={{ width: '20%' }} title="Đầu Hàng (<0%)" />
            <div className="h-full bg-amber-500" style={{ width: '20%' }} title="Hy Vọng (0-25%)" />
            <div className="h-full bg-emerald-500" style={{ width: '25%' }} title="Lạc Quan (25-50%)" />
            <div className="h-full bg-cyan-500" style={{ width: '20%' }} title="Niềm Tin (50-75%)" />
            <div className="h-full bg-purple-500" style={{ width: '15%' }} title="Hưng Phấn (>75%)" />
          </div>

          <div className={`p-3 rounded-2xl border ${nuplPhase.bg} flex items-start gap-2.5`}>
            <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${nuplPhase.color}`} />
            <div className="text-xs space-y-0.5">
              <span className={`font-bold block ${nuplPhase.color}`}>
                {isVi ? nuplPhase.labelVi : nuplPhase.labelEn}
              </span>
              <p className="text-slate-300 font-normal leading-relaxed">
                {isVi ? nuplPhase.descriptionVi : nuplPhase.descriptionEn}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. VIETNAM GOLD BENCHMARK & QUICK PRICE SIMULATOR (5 of 12 cols) */}
      <div className="lg:col-span-5 rounded-3xl bg-slate-900/60 border border-white/[0.08] p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {isVi ? 'SỨC MUA VÀNG SJC & P2P' : 'SJC GOLD & P2P BENCHMARK'}
              </h2>
              <span className="text-[10px] text-slate-400">
                {isVi ? 'Định giá sức mua thực theo tiền đồng Việt Nam' : 'Purchasing power vs SJC Gold 9999'}
              </span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            SJC: 88Tr/Lượng
          </span>
        </div>

        {/* SJC Tael & P2P Metric Display */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              {isVi ? '1 BITCOIN BẰNG' : '1 BITCOIN EQUALS'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-yellow-400 font-mono tracking-tight">
              {simSjcTaels} {isVi ? 'Lượng Vàng' : 'Taels Gold'}
            </div>
            <span className="text-[10px] text-slate-400 block font-sans">
              ≈ {formatVND(simPrice * p2pRate)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              {isVi ? 'CHÊNH LỆCH P2P USDT' : 'P2P PREMIUM RATE'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono tracking-tight">
              {p2pPremiumPct >= 0 ? `+${p2pPremiumPct}%` : `${p2pPremiumPct}%`}
            </div>
            <span className="text-[10px] text-slate-400 block font-mono">
              P2P: {p2pRate.toLocaleString()} đ
            </span>
          </div>
        </div>

        {/* 3. INTERACTIVE PRICE SCENARIO SIMULATOR */}
        <div className="pt-2 border-t border-white/[0.06] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isVi ? 'MÔ PHỎNG KỊCH BẢN GIÁ' : 'PRICE SCENARIO SIMULATOR'}</span>
            </span>
            {selectedScenario !== null && (
              <button
                type="button"
                onClick={() => setSelectedScenario(null)}
                className="text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
              >
                {isVi ? 'Về giá Live' : 'Reset to Live'}
              </button>
            )}
          </div>

          {/* 4 Quick Scenario Pills */}
          <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => setSelectedScenario(65000)}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                selectedScenario === 65000
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold'
                  : 'bg-white/[0.03] border-white/[0.08] text-slate-300 hover:border-slate-500'
              }`}
            >
              $65K
              <span className="text-[9px] block text-slate-400 font-sans">{isVi ? 'Quét Râu' : 'Dip'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedScenario(null)}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                selectedScenario === null
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                  : 'bg-white/[0.03] border-white/[0.08] text-slate-300 hover:border-slate-500'
              }`}
            >
              ${Math.round(livePrice / 1000)}K
              <span className="text-[9px] block text-emerald-400 font-sans">{isVi ? 'Live Sàn' : 'Live'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedScenario(100000)}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                selectedScenario === 100000
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold'
                  : 'bg-white/[0.03] border-white/[0.08] text-slate-300 hover:border-slate-500'
              }`}
            >
              $100K
              <span className="text-[9px] block text-slate-400 font-sans">{isVi ? 'Bứt Phá' : 'Break'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedScenario(150000)}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                selectedScenario === 150000
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 font-bold'
                  : 'bg-white/[0.03] border-white/[0.08] text-slate-300 hover:border-slate-500'
              }`}
            >
              $150K
              <span className="text-[9px] block text-slate-400 font-sans">{isVi ? 'Đỉnh Sóng' : 'Top'}</span>
            </button>
          </div>

          {/* Scenario Result Summary */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.06] space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">{isVi ? 'Giá giả định:' : 'Simulated Price:'}</span>
              <strong className="text-white">{formatUSD(simPrice, 0)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{isVi ? 'MVRV tương ứng:' : 'Resulting MVRV:'}</span>
              <strong className={simMvrv > 2.5 ? 'text-rose-400' : 'text-emerald-400'}>
                {simMvrv}x ({simMvrv < 1.5 ? (isVi ? 'Vùng Gom' : 'Buy') : simMvrv < 2.5 ? (isVi ? 'Cân Bằng' : 'Fair') : (isVi ? 'Bong Bóng' : 'Bubble')})
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{isVi ? 'Hành động khuyến nghị:' : 'Recommended Action:'}</span>
              <strong className="text-amber-400 font-sans font-semibold">
                {simPrice <= 68000
                  ? (isVi ? 'Tăng 1.5x - 2.0x ngân sách DCA' : 'Boost DCA 1.5x - 2.0x')
                  : simPrice >= 120000
                  ? (isVi ? 'Kích hoạt Thang Chốt Gốc Lớp 1' : 'Trigger Rung 1 Principal Exit')
                  : (isVi ? 'Duy trì kỷ luật DCA chuẩn 1.0x' : 'Maintain standard DCA')}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
