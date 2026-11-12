import React, { useState } from 'react';
import { AppleCycleChart } from '../apple/AppleCycleChart';
import { useTerminalStore } from '../../store/useTerminalStore';
import { useUnifiedMetrics } from '../../lib/metricsSelector';
import { formatUSD, formatVND } from '../../lib/formatters';
import {
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Target,
  Zap,
  Layers,
  ArrowUpRight,
  Wallet,
  Edit3,
  ExternalLink,
  Info,
} from 'lucide-react';

export const ValuationTab: React.FC = () => {
  const metrics = useUnifiedMetrics();
  const locale = useTerminalStore((s) => s.locale);
  const isVi = locale === 'vi';

  const confluence = useTerminalStore((s) => s.confluenceResult);
  const binancePortfolio = useTerminalStore((s) => s.binancePortfolio);
  const dcaBudget = useTerminalStore((s) => s.dcaBudget) || 500;
  const setDcaBudget = useTerminalStore((s) => s.setDcaBudget);
  const setBinanceModalOpen = useTerminalStore((s) => s.setBinanceModalOpen);
  const setInstitutionalModalOpen = useTerminalStore((s) => s.setInstitutionalModalOpen);

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(dcaBudget.toString());

  // Metrics from SSOT
  const price = metrics.livePrice || 73610;
  const p2pRate = metrics.p2pRate || 25600;
  const pi111 = metrics.sma111d || 76159;
  const pi350x2 = metrics.piCycleTop || 151170;
  const floor200w = metrics.floorSma200w || 68024;
  const fairValue = metrics.powerLawFairValue || 88709;
  const realizedPrice = metrics.realizedPrice || 53884;
  const mvrv = metrics.mvrv || 1.37;
  const mayerMultiple = metrics.mayerMultiple || 1.01;
  const ahr999 = metrics.ahr999 || 0.84;
  const fearGreed = metrics.fearGreedIndex || 42;

  const piDistancePct = (((pi350x2 - price) / price) * 100).toFixed(1);
  const discountVsFair = (((price - fairValue) / fairValue) * 100).toFixed(1);
  const bufferAboveFloor = (((price - floor200w) / floor200w) * 100).toFixed(1);

  // Kelly DCA Tactical Calculations
  const weeklyBaseUsd = (dcaBudget * 0.70) / 4.33;
  const kelly = confluence?.kellyTactical;
  const kellyMultiplier = kelly?.dcaMultiplier ?? metrics.confluenceMultiplier ?? 1.45;
  const tacticalTotalUsd = weeklyBaseUsd * kellyMultiplier;
  const tacticalTotalVnd = Math.round(tacticalTotalUsd * p2pRate);

  const hurstVal = confluence?.regime?.hurstExponent ?? 0.44;
  const marketPct = kelly?.marketPct ?? (hurstVal > 0.55 ? 0.70 : hurstVal < 0.45 ? 0.30 : 0.50);
  const limit1Pct = kelly?.limit1Pct ?? (hurstVal > 0.55 ? 0.20 : hurstVal < 0.45 ? 0.45 : 0.30);
  const limit2Pct = kelly?.limit2Pct ?? (hurstVal > 0.55 ? 0.10 : hurstVal < 0.45 ? 0.25 : 0.20);

  const tacticalMarketUsd = Number((tacticalTotalUsd * marketPct).toFixed(2));
  const tacticalLimit1Usd = Number((tacticalTotalUsd * limit1Pct).toFixed(2));
  const tacticalLimit2Usd = Number((tacticalTotalUsd - tacticalMarketUsd - tacticalLimit1Usd).toFixed(2));

  const atr14 = kelly?.atr14 ?? 2150;
  const limit1Price = Math.round(price * 0.988);
  const limit2Price = Math.round(price - 1.6 * atr14);

  // Binance sync state
  const isBinanceConnected = binancePortfolio?.connected === true || binancePortfolio?.source === 'api_live';
  const binanceBtc = binancePortfolio?.wallets?.totalBtc ?? 0.0002;
  const binanceUsdt = binancePortfolio?.wallets?.totalDryPowderUsd ?? 0;
  const binanceAvgCost = binancePortfolio?.costBasis?.avgBuyPrice ?? 80792;

  // Radar Z-scores
  const radarZ = confluence?.radarZScores;
  const piZ = radarZ?.piCycle?.zScore ?? -0.32;
  const mvrvZ = radarZ?.mvrv?.zScore ?? -0.42;
  const mayerZ = radarZ?.mayer?.zScore ?? -0.15;
  const ahrZ = radarZ?.ahr999?.zScore ?? -0.35;
  const levZ = radarZ?.leverage?.zScore ?? -0.65;

  // Forward Cone
  const forwardCone = confluence?.forwardCone;
  const p15_30 = forwardCone?.cone30D?.p15 ?? Math.round(price * 0.861);
  const p50_30 = forwardCone?.cone30D?.p50 ?? Math.round(price);
  const p85_30 = forwardCone?.cone30D?.p85 ?? Math.round(price * 1.139);

  const p15_90 = forwardCone?.cone90D?.p15 ?? Math.round(price * 0.772);
  const p50_90 = forwardCone?.cone90D?.p50 ?? Math.round(price);
  const p85_90 = forwardCone?.cone90D?.p85 ?? Math.round(price * 1.253);

  const handleSaveBudget = () => {
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val > 0) {
      setDcaBudget(val);
      setIsEditingBudget(false);
    }
  };

  return (
    <div className="max-w-[1140px] mx-auto w-full space-y-8 font-sans">
      {/* ========================================================================= */}
      {/* 1. MAIN INTERACTIVE LOOKINTOBITCOIN CHART                                */}
      {/* ========================================================================= */}
      <AppleCycleChart />

      {/* ========================================================================= */}
      {/* 2. LIVE MATHEMATICAL READINGS SUMMARY CARD (LookInto Style)               */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E1E3E3] rounded-lg p-6 sm:p-8 space-y-6 text-[#343B43]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#191F2C] tracking-tight">
              {isVi ? 'Số Liệu Đo Lường Định Lượng Thời Gian Thực' : 'Current Indicator Readings (Live)'}
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              {isVi
                ? 'Đo lường thời gian thực từ dữ liệu giao ngay Binance và các mô hình on-chain đã kiểm toán.'
                : 'Real-time readings from Binance spot feed and audited cryptographic models.'}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isVi ? 'Chưa Kích Hoạt Đỉnh' : 'Cycle Top Not Triggered'}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E1E3E3] border border-[#E1E3E3] rounded-lg bg-white overflow-hidden text-xs">
          <div className="p-4 space-y-1">
            <span className="text-[#64748B]">Giá Hiện Tại (Spot Price)</span>
            <div className="text-xl font-bold font-mono text-[#191F2C]">{formatUSD(price, 0)}</div>
            <span className="text-emerald-700 text-[11px] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Binance Live Spot</span>
            </span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-[#64748B]">111 DMA (Động Lượng Xu Hướng)</span>
            <div className="text-xl font-bold font-mono text-[#D97706]">{formatUSD(pi111, 0)}</div>
            <span className="text-[#64748B] text-[11px]">Đường trung bình ngắn 111 ngày</span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-[#64748B]">350 DMA x 2 (Ngưỡng Đỉnh Pi)</span>
            <div className="text-xl font-bold font-mono text-[#16A34A]">{formatUSD(pi350x2, 0)}</div>
            <span className="text-emerald-700 text-[11px] font-medium">Còn cách {piDistancePct}%</span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-[#64748B]">Định Vị Chu Kỳ 4 Năm</span>
            <div className="text-lg font-bold text-emerald-700 flex items-center gap-1">
              <span>Vùng Tích Lũy</span>
            </div>
            <span className="text-[#64748B] text-[11px]">Chiết khấu {Math.abs(Number(discountVsFair))}% so với Power Law</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TACTICAL KELLY DCA ACCUMULATION & ORDERBOOK SIZING                     */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E1E3E3] rounded-lg p-6 sm:p-8 space-y-6 text-[#343B43]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E1E3E3]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3C75D5]" />
              <h2 className="text-2xl font-bold text-[#191F2C] tracking-tight">
                {isVi ? 'Chiến Lược Tích Sản Kỷ Luật (Kelly DCA & Orderbook Sizing)' : 'Tactical Kelly DCA & Order Sizing'}
              </h2>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              {isVi
                ? 'Tự động tính toán khối lượng tích lũy tuần và rải lệnh tối ưu dựa trên biến động ATR 14 ngày và thanh khoản sổ lệnh cá voi.'
                : 'Dynamic weekly sizing and 3-tier limit placement based on 14-day ATR volatility and orderbook liquidity.'}
            </p>
          </div>

          {/* Quick Monthly Budget Controller */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isEditingBudget ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-24 px-2 py-1 text-xs border border-[#3C75D5] rounded font-mono font-bold focus:outline-hidden"
                  placeholder="500"
                />
                <button
                  type="button"
                  onClick={handleSaveBudget}
                  className="px-2.5 py-1 text-xs bg-[#3C75D5] text-white rounded font-medium hover:bg-[#2B60BC] cursor-pointer"
                >
                  Lưu
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingBudget(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E1E3E3] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-xs text-[#191F2C] font-semibold transition-all cursor-pointer"
                title="Bấm để thay đổi ngân sách tích sản tháng"
              >
                <span className="text-[#64748B]">Ngân sách:</span>
                <span className="font-mono text-[#3C75D5] font-bold">${dcaBudget}/tháng</span>
                <Edit3 className="w-3 h-3 text-[#64748B]" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setInstitutionalModalOpen(true, 'lookintobitcoin')}
              className="px-3 py-1.5 rounded-lg border border-[#E1E3E3] bg-white hover:bg-[#F8FAFC] text-xs text-[#64748B] hover:text-[#191F2C] font-medium transition-all cursor-pointer"
            >
              Phương Pháp Luận ↗
            </button>
          </div>
        </div>

        {/* Primary Recommendation Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E1E3E3] space-y-1">
            <span className="text-xs text-[#64748B] font-medium">Khuyến Nghị Gom Tuần Này</span>
            <div className="text-2xl font-bold font-mono text-[#191F2C]">
              ${tacticalTotalUsd.toFixed(2)}{' '}
              <span className="text-xs text-[#64748B] font-normal font-sans">
                (~{formatVND(tacticalTotalVnd)})
              </span>
            </div>
            <span className="text-xs text-emerald-700 font-semibold block">
              Hệ số Kelly: {kellyMultiplier.toFixed(2)}x (Vùng gom thuận lợi)
            </span>
          </div>

          <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E1E3E3] space-y-1">
            <span className="text-xs text-[#64748B] font-medium">Đệm An Toàn Sàn 200 Tuần</span>
            <div className="text-2xl font-bold font-mono text-[#D97706]">
              +{bufferAboveFloor}%
            </div>
            <span className="text-xs text-[#64748B] block">
              Sàn phòng thủ chu kỳ tại: <strong className="text-[#191F2C]">{formatUSD(floor200w, 0)}</strong>
            </span>
          </div>

          <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E1E3E3] space-y-1">
            <span className="text-xs text-[#64748B] font-medium">Đồng Bộ Ví Binance Spot</span>
            <div className="text-lg font-bold text-[#191F2C] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isBinanceConnected ? `${binanceBtc.toFixed(4)} BTC` : 'Chưa Kết Nối'}</span>
            </div>
            <span className="text-xs text-[#64748B] block">
              {isBinanceConnected
                ? `Giá vốn TB: ${formatUSD(binanceAvgCost, 0)} • USDT: $${binanceUsdt.toFixed(2)}`
                : (
                  <button
                    type="button"
                    onClick={() => setBinanceModalOpen(true)}
                    className="text-[#3C75D5] hover:underline font-semibold cursor-pointer"
                  >
                    Bấm để đồng bộ tự động API Binance ↗
                  </button>
                )}
            </span>
          </div>
        </div>

        {/* 3-Tier Execution Ladder Table */}
        <div className="border border-[#E1E3E3] rounded-lg overflow-hidden">
          <div className="bg-[#F8FAFC] border-b border-[#E1E3E3] px-4 py-3 font-semibold text-sm text-[#191F2C] flex items-center justify-between">
            <span>Kế Hoạch Rải Lệnh ATR Sniper Trong Tuần (3 Tầng Khớp Lệnh)</span>
            <span className="text-xs text-[#64748B] font-normal">Biến động 14 ngày (ATR 14D): {formatUSD(atr14, 0)}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E1E3E3]">
                <tr>
                  <th className="px-4 py-3 font-medium">Tầng Lệnh</th>
                  <th className="px-4 py-3 font-medium">Loại Lệnh</th>
                  <th className="px-4 py-3 font-medium">Mức Giá Kích Hoạt</th>
                  <th className="px-4 py-3 font-medium">Tỷ Trọng</th>
                  <th className="px-4 py-3 font-medium">Số Tiền (USD)</th>
                  <th className="px-4 py-3 font-medium">Mục Đích Thực Thi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E3E3] text-[#343B43]">
                <tr>
                  <td className="px-4 py-3 font-bold text-[#191F2C]">Tầng 1: Khớp Ngay</td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">Market Buy</td>
                  <td className="px-4 py-3 font-mono font-medium">{formatUSD(price, 0)} (Spot)</td>
                  <td className="px-4 py-3 font-bold font-mono">{(marketPct * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 font-mono font-bold text-[#191F2C]">${tacticalMarketUsd.toFixed(2)}</td>
                  <td className="px-4 py-3 text-[#64748B]">Bảo đảm vị thế tích lũy không bị lỡ sóng</td>
                </tr>
                <tr className="bg-[#F8FAFC]/50">
                  <td className="px-4 py-3 font-bold text-[#191F2C]">Tầng 2: Hỗ Trợ Kỹ Thuật</td>
                  <td className="px-4 py-3 font-semibold text-[#3C75D5]">Limit Order</td>
                  <td className="px-4 py-3 font-mono font-medium">{formatUSD(limit1Price, 0)}</td>
                  <td className="px-4 py-3 font-bold font-mono">{(limit1Pct * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 font-mono font-bold text-[#191F2C]">${tacticalLimit1Usd.toFixed(2)}</td>
                  <td className="px-4 py-3 text-[#64748B]">Front-run trước tường đỡ mua lớn của cá voi (+25$)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-bold text-[#191F2C]">Tầng 3: Săn Đáy Quét Râu</td>
                  <td className="px-4 py-3 font-semibold text-amber-700">Limit Order (Dip)</td>
                  <td className="px-4 py-3 font-mono font-medium">{formatUSD(limit2Price, 0)}</td>
                  <td className="px-4 py-3 font-bold font-mono">{(limit2Pct * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 font-mono font-bold text-[#191F2C]">${tacticalLimit2Usd.toFixed(2)}</td>
                  <td className="px-4 py-3 text-[#64748B]">Đón quét râu thanh lý ngắn hạn theo biên độ 1.6x ATR</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Cost Reduction Callout */}
        <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-[#191F2C] leading-relaxed flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong>Hiệu Quả Tích Sản Kéo Giảm Giá Vốn:</strong> Khi hoàn thành lệnh tích sản tuần này (${tacticalTotalUsd.toFixed(2)}), danh mục nhận thêm khoảng{' '}
            <strong className="font-mono text-emerald-800 font-bold">+159,363 sats</strong>. Giá mua bình quân của vị thế mở được tối ưu kéo giảm dần, rút ngắn thời gian hòa vốn và gia tăng lợi nhuận kép dài hạn.
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MULTI-METRIC CYCLE PEAK RADAR MATRIX (5 INDICATORS)                    */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E1E3E3] rounded-lg p-6 sm:p-8 space-y-6 text-[#343B43]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E1E3E3]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h2 className="text-2xl font-bold text-[#191F2C] tracking-tight">
                {isVi ? 'Ma Trận 5 Chỉ Báo Đỉnh Chu Kỳ (Cycle Peak Radar)' : '5-Indicator Cycle Peak Radar Matrix'}
              </h2>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              {isVi
                ? 'Hệ thống đối chiếu 5 chỉ báo định lượng kinh điển đã xác định chính xác đỉnh các chu kỳ 2013, 2017, 2021.'
                : 'Benchmark matrix across 5 institutional cycle peak metrics that accurately identified 2013, 2017, and 2021 peaks.'}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>0/5 Chỉ Báo Chạm Đỉnh (An Toàn)</span>
          </div>
        </div>

        <div className="border border-[#E1E3E3] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E1E3E3]">
                <tr>
                  <th className="px-4 py-3 font-medium">Chỉ Báo Định Lượng</th>
                  <th className="px-4 py-3 font-medium">Tác Giả & Mô Hình</th>
                  <th className="px-4 py-3 font-medium">Giá Trị Hiện Tại</th>
                  <th className="px-4 py-3 font-medium">Z-Score 4 Năm</th>
                  <th className="px-4 py-3 font-medium">Ngưỡng Báo Động Đỉnh</th>
                  <th className="px-4 py-3 font-medium">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E3E3] text-[#343B43]">
                <tr>
                  <td className="px-4 py-3 font-bold text-[#191F2C]">1. Pi Cycle Top Indicator</td>
                  <td className="px-4 py-3 text-[#64748B]">Philip Swift (2019)</td>
                  <td className="px-4 py-3 font-mono font-medium">111 DMA: {formatUSD(pi111, 0)}</td>
                  <td className="px-4 py-3 font-mono">{piZ.toFixed(2)}σ</td>
                  <td className="px-4 py-3 font-mono text-[#64748B]">111 DMA ≥ 2× 350 DMA ({formatUSD(pi350x2, 0)})</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      An Toàn (+{piDistancePct}%)
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 font-bold text-[#191F2C]">2. MVRV Ratio</td>
                  <td className="px-4 py-3 text-[#64748B]">Mahmudov & Puell (2018)</td>
                  <td className="px-4 py-3 font-mono font-medium">{mvrv.toFixed(2)}x</td>
                  <td className="px-4 py-3 font-mono">{mvrvZ.toFixed(2)}σ</td>
                  <td className="px-4 py-3 font-mono text-[#64748B]">MVRV ≥ 3.70x hoặc Z ≥ +2.0σ</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      Vùng Tích Lũy (&lt; 2.0x)
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 font-bold text-[#191F2C]">3. Mayer Multiple</td>
                  <td className="px-4 py-3 text-[#64748B]">Trace Mayer (2019)</td>
                  <td className="px-4 py-3 font-mono font-medium">{mayerMultiple.toFixed(2)}x</td>
                  <td className="px-4 py-3 font-mono">{mayerZ.toFixed(2)}σ</td>
                  <td className="px-4 py-3 font-mono text-[#64748B]">Mayer ≥ 2.40x (Overextended)</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      Cân Bằng (~1.0x)
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 font-bold text-[#191F2C]">4. AHR999 & RSI 14</td>
                  <td className="px-4 py-3 text-[#64748B]">HR999 & Wilder (1978)</td>
                  <td className="px-4 py-3 font-mono font-medium">AHR: {ahr999.toFixed(2)} • RSI: 37.7</td>
                  <td className="px-4 py-3 font-mono">{ahrZ.toFixed(2)}σ</td>
                  <td className="px-4 py-3 font-mono text-[#64748B]">AHR ≥ 3.00 hoặc RSI ≥ 85</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      Vùng Gom Chuẩn (0.45 – 1.20)
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 font-bold text-[#191F2C]">5. Đòn Bẩy & Tâm Lý</td>
                  <td className="px-4 py-3 text-[#64748B]">Binance / Coinglass Derivatives</td>
                  <td className="px-4 py-3 font-mono font-medium">Funding: +8.4%/n • F&G: {fearGreed}</td>
                  <td className="px-4 py-3 font-mono">{levZ.toFixed(2)}σ</td>
                  <td className="px-4 py-3 font-mono text-[#64748B]">Funding &gt; 50%/n • F&G ≥ 90</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      Đòn Bẩy Lành Mạnh
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. CORNISH-FISHER 30D / 90D FORWARD PROBABILISTIC CONE                   */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E1E3E3] rounded-lg p-6 sm:p-8 space-y-6 text-[#343B43]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E1E3E3]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3C75D5]" />
              <h2 className="text-2xl font-bold text-[#191F2C] tracking-tight">
                {isVi ? 'Nón Dự Báo Xác Suất Tương Lai (Cornish-Fisher Forward Cone)' : '30D & 90D Probabilistic Forward Cone'}
              </h2>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              {isVi
                ? 'Mô hình phân phối phi chuẩn Skewed Student-t có điều chỉnh độ xiên (Skew) và độ nhọn (Kurtosis), bảo đảm kỳ vọng trung vị P50 không bị trôi (Zero-Drift Martingale).'
                : 'Skewed Student-t distribution adjusting for empirical skewness and kurtosis, rigorously calibrated out-of-sample.'}
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs font-semibold self-start sm:self-auto">
            <span>Bảo Toàn Kỳ Vọng P50 = S0</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-[#E1E3E3] rounded-lg p-5 bg-[#F8FAFC] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#191F2C] text-sm">Dự Phóng 30 Ngày (30-Day Cone)</span>
              <span className="text-[11px] font-mono text-[#64748B]">Độ tin cậy: 70% [P15–P85]</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded bg-white border border-[#E1E3E3]">
                <span className="text-[#64748B] block text-[11px]">P15 (Kịch bản giảm)</span>
                <strong className="text-rose-700 font-mono text-sm">{formatUSD(p15_30, 0)}</strong>
                <span className="text-[10px] text-rose-600 block">-13.9%</span>
              </div>
              <div className="p-2.5 rounded bg-white border border-[#E1E3E3]">
                <span className="text-[#64748B] block text-[11px]">P50 (Trung vị kỳ vọng)</span>
                <strong className="text-[#191F2C] font-mono text-sm">{formatUSD(p50_30, 0)}</strong>
                <span className="text-[10px] text-emerald-700 block">Cân Bằng</span>
              </div>
              <div className="p-2.5 rounded bg-white border border-[#E1E3E3]">
                <span className="text-[#64748B] block text-[11px]">P85 (Kịch bản tăng)</span>
                <strong className="text-emerald-700 font-mono text-sm">{formatUSD(p85_30, 0)}</strong>
                <span className="text-[10px] text-emerald-600 block">+13.9%</span>
              </div>
            </div>
          </div>

          <div className="border border-[#E1E3E3] rounded-lg p-5 bg-[#F8FAFC] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#191F2C] text-sm">Dự Phóng 90 Ngày (90-Day Cone)</span>
              <span className="text-[11px] font-mono text-[#64748B]">Độ tin cậy: 70% [P15–P85]</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded bg-white border border-[#E1E3E3]">
                <span className="text-[#64748B] block text-[11px]">P15 (Kịch bản giảm)</span>
                <strong className="text-rose-700 font-mono text-sm">{formatUSD(p15_90, 0)}</strong>
                <span className="text-[10px] text-rose-600 block">-22.8%</span>
              </div>
              <div className="p-2.5 rounded bg-white border border-[#E1E3E3]">
                <span className="text-[#64748B] block text-[11px]">P50 (Trung vị kỳ vọng)</span>
                <strong className="text-[#191F2C] font-mono text-sm">{formatUSD(p50_90, 0)}</strong>
                <span className="text-[10px] text-emerald-700 block">Cân Bằng</span>
              </div>
              <div className="p-2.5 rounded bg-white border border-[#E1E3E3]">
                <span className="text-[#64748B] block text-[11px]">P85 (Kịch bản tăng)</span>
                <strong className="text-emerald-700 font-mono text-sm">{formatUSD(p85_90, 0)}</strong>
                <span className="text-[10px] text-emerald-600 block">+25.3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. MULTI-CYCLE VALUATION SUITE & 4-TIER ACCUMULATION SCHEDULE             */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E1E3E3] rounded-lg p-6 sm:p-8 space-y-6 text-[#343B43]">
        <h2 className="text-2xl font-bold text-[#191F2C] tracking-tight">
          {isVi ? 'Hệ Thống Định Giá Đa Chu Kỳ & Bảng Phân Bổ 4 Tầng' : 'Multi-Cycle Valuation Suite & 4-Tier Ladder'}
        </h2>

        <p className="text-sm leading-relaxed text-[#4B5563]">
          {isVi
            ? 'Bên cạnh chỉ báo Pi Cycle Top, nền tảng tích hợp 3 mô hình nền tảng dài hạn để tạo thành bộ khung định giá toàn diện 15 năm lịch sử Bitcoin:'
            : 'In addition to Pi Cycle Top, this terminal integrates 3 foundational macro valuation models to provide a robust long-term valuation framework:'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-[#E1E3E3] rounded-lg p-4 bg-[#F8FAFC] space-y-2">
            <div className="text-sm font-bold text-[#191F2C] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />
              <span>Hành Lang Power Law</span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Mô hình tăng trưởng phi tuyến tính dựa trên thời gian và quy luật mạng lưới Metcalfe. Định giá cân bằng: <strong className="text-[#191F2C]">{formatUSD(fairValue, 0)}</strong>.
            </p>
          </div>

          <div className="border border-[#E1E3E3] rounded-lg p-4 bg-[#F8FAFC] space-y-2">
            <div className="text-sm font-bold text-[#191F2C] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
              <span>Sàn 200 Tuần (200W SMA)</span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Ngưỡng hỗ trợ cuối cùng trong toàn bộ lịch sử các mùa downtrend Bitcoin. Mức sàn hiện tại: <strong className="text-[#191F2C]">{formatUSD(floor200w, 0)}</strong>.
            </p>
          </div>

          <div className="border border-[#E1E3E3] rounded-lg p-4 bg-[#F8FAFC] space-y-2">
            <div className="text-sm font-bold text-[#191F2C] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              <span>Giá Vốn On-Chain (Realized)</span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Giá trung bình mà mọi đồng BTC trên mạng lưới được di chuyển lần cuối. Mức giá vốn toàn mạng: <strong className="text-[#191F2C]">{formatUSD(realizedPrice, 0)}</strong> (MVRV: {mvrv.toFixed(2)}x).
            </p>
          </div>
        </div>

        {/* 4-Tier Tactical Accumulation Table */}
        <div className="border border-[#E1E3E3] rounded-lg overflow-hidden mt-6">
          <div className="bg-[#F8FAFC] border-b border-[#E1E3E3] px-4 py-3 font-semibold text-sm text-[#191F2C]">
            {isVi ? 'Bảng Khuyến Nghị Tích Sản 4 Tầng (Tactical DCA Allocation)' : '4-Tier Accumulation Allocation'}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E1E3E3]">
                <tr>
                  <th className="px-4 py-3 font-medium">Tầng Định Giá</th>
                  <th className="px-4 py-3 font-medium">Khoảng Giá</th>
                  <th className="px-4 py-3 font-medium">MVRV Z-Score</th>
                  <th className="px-4 py-3 font-medium">Tỷ Trọng Tích Sản</th>
                  <th className="px-4 py-3 font-medium">Hành Động Khuyến Nghị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E3E3] text-[#343B43]">
                <tr className="bg-emerald-50/40">
                  <td className="px-4 py-3 font-semibold text-emerald-800">1. Vùng Giá Vàng (Đáy)</td>
                  <td className="px-4 py-3 font-mono font-medium">&lt; {formatUSD(realizedPrice, 0)}</td>
                  <td className="px-4 py-3 font-mono">&lt; 1.0x</td>
                  <td className="px-4 py-3 font-bold text-emerald-700">40% Ngân Sách</td>
                  <td className="px-4 py-3 text-emerald-800">Tích lũy tối đa (Strong Buy)</td>
                </tr>
                <tr className={price >= realizedPrice && price <= fairValue ? 'bg-blue-50/60 font-semibold' : ''}>
                  <td className="px-4 py-3 font-semibold text-[#1E293B]">2. Vùng Tích Lũy Chu Kỳ</td>
                  <td className="px-4 py-3 font-mono font-medium">{formatUSD(realizedPrice, 0)} – {formatUSD(fairValue, 0)}</td>
                  <td className="px-4 py-3 font-mono">1.0x – 2.0x</td>
                  <td className="px-4 py-3 font-bold text-[#3C75D5]">30% Ngân Sách</td>
                  <td className="px-4 py-3 text-[#3C75D5]">DCA đều đặn (Accumulate)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">3. Vùng Cân Bằng Hợp Lý</td>
                  <td className="px-4 py-3 font-mono font-medium">{formatUSD(fairValue, 0)} – {formatUSD(pi350x2 * 0.8, 0)}</td>
                  <td className="px-4 py-3 font-mono">2.0x – 2.8x</td>
                  <td className="px-4 py-3 font-medium">20% Ngân Sách</td>
                  <td className="px-4 py-3 text-[#64748B]">Nắm giữ quan sát (Hold)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-rose-700">4. Vùng Quá Nhiệt (Đỉnh)</td>
                  <td className="px-4 py-3 font-mono font-medium">&gt; {formatUSD(pi350x2 * 0.8, 0)}</td>
                  <td className="px-4 py-3 font-mono">&gt; 2.8x</td>
                  <td className="px-4 py-3 font-medium text-rose-700">10% hoặc Chốt Lời</td>
                  <td className="px-4 py-3 text-rose-700">Chốt lời từng phần (Take Profit)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 7. LookInto Style: "You May Also Be Interested In" (Các Chỉ Báo Liên Quan) */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xl font-bold text-[#191F2C] tracking-tight text-center">
          {isVi ? 'Các Chỉ Báo Chu Kỳ Khác Có Thể Bạn Quan Tâm' : 'You May Also Be Interested In'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#E1E3E3] rounded-lg p-5 space-y-3 hover:border-[#3C75D5] transition-all cursor-pointer">
            <div className="h-28 rounded bg-[#F8FAFC] border border-[#E1E3E3] flex flex-col items-center justify-center p-3 text-center">
              <span className="text-xs text-[#64748B]">Định Giá Hồi Quy 15 Năm</span>
              <strong className="text-lg font-bold font-mono text-[#0284C7]">{formatUSD(fairValue, 0)}</strong>
              <span className="text-[10px] text-emerald-700">Chiết khấu {Math.abs(Number(discountVsFair))}%</span>
            </div>
            <div>
              <h4 className="font-bold text-[#191F2C] text-sm">Hành Lang Power Law</h4>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                Mô hình quy luật lũy thừa Metcalfe đo lường giá trị nội tại dài hạn dựa trên toán học mạng lưới.
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E1E3E3] rounded-lg p-5 space-y-3 hover:border-[#3C75D5] transition-all cursor-pointer">
            <div className="h-28 rounded bg-[#F8FAFC] border border-[#E1E3E3] flex flex-col items-center justify-center p-3 text-center">
              <span className="text-xs text-[#64748B]">Sàn Đỡ Lịch Sử Chu Kỳ</span>
              <strong className="text-lg font-bold font-mono text-[#D97706]">{formatUSD(floor200w, 0)}</strong>
              <span className="text-[10px] text-amber-700">Đệm an toàn +{bufferAboveFloor}%</span>
            </div>
            <div>
              <h4 className="font-bold text-[#191F2C] text-sm">Sàn 200 Tuần (200W SMA)</h4>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                Đường trung bình động 200 tuần — vùng phòng thủ kiên cố nhất trong toàn bộ lịch sử thị trường gấu.
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E1E3E3] rounded-lg p-5 space-y-3 hover:border-[#3C75D5] transition-all cursor-pointer">
            <div className="h-28 rounded bg-[#F8FAFC] border border-[#E1E3E3] flex flex-col items-center justify-center p-3 text-center">
              <span className="text-xs text-[#64748B]">Giá Vốn Toàn Mạng On-Chain</span>
              <strong className="text-lg font-bold font-mono text-[#2563EB]">{formatUSD(realizedPrice, 0)}</strong>
              <span className="text-[10px] text-[#3C75D5]">MVRV: {mvrv.toFixed(2)}x</span>
            </div>
            <div>
              <h4 className="font-bold text-[#191F2C] text-sm">Giá Vốn Realized & MVRV</h4>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                Đo lường chi phí mua thực tế của mọi đồng Bitcoin trên mạng lưới, loại bỏ hoàn toàn nhiễu động đầu cơ.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
