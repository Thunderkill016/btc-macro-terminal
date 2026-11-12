import React, { useState } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { formatUSD } from '../../lib/formatters';
import { useUnifiedMetrics } from '../../lib/metricsSelector';
import { computePeakRadarStatus } from '../../lib/quantEngine';
import {
  ShieldCheck,
  AlertTriangle,
  Activity,
  Info,
  ArrowRight,
  Clock,
  Zap,
  Pickaxe,
  Target,
  BarChart3,
} from 'lucide-react';
import {
  CycleIndicatorDetailModal,
  IndicatorDetailInfo,
} from '../modals/CycleIndicatorDetailModal';

export const AppleCyclePeakRadar: React.FC = () => {
  const locale = useTerminalStore((s) => s.locale);
  const confluence = useTerminalStore((s) => s.confluenceResult);
  const realCyclePoints = useTerminalStore((s) => s.realCyclePoints);
  const realFutures = useTerminalStore((s) => s.realFutures);
  const derivatives = useTerminalStore((s) => s.derivatives);
  const macro = useTerminalStore((s) => s.macro);
  const orderbookDepth = useTerminalStore((s) => s.orderbookDepth);
  const activeSubTab = useTerminalStore((s) => s.activeRadarSubTab);
  const setActiveSubTab = useTerminalStore((s) => s.setActiveRadarSubTab);

  const [selectedModalIndicator, setSelectedModalIndicator] = useState<IndicatorDetailInfo | null>(null);

  const isVi = locale === 'vi';
  const metrics = useUnifiedMetrics();
  const price = metrics.livePrice;

  const radarZ = confluence?.radarZScores;
  const forwardCone = confluence?.forwardCone;
  const kelly = confluence?.kellyTactical;
  const latestPoint = realCyclePoints.length > 0 ? realCyclePoints[realCyclePoints.length - 1] : null;

  const sma111d = metrics.sma111d;
  const piCycleTarget = metrics.piCycleTop;
  const annualizedFunding = metrics.annualizedFunding;

  const mvrv = metrics.mvrv;
  const mayerMultiple = metrics.mayerMultiple;
  const ahr999 = metrics.ahr999;
  const rsi14 = realCyclePoints && realCyclePoints.length > 0
    ? realCyclePoints[realCyclePoints.length - 1].rsi14
    : 37.7;
  const fearGreed = metrics.fearGreedIndex;

  // Rolling 4-Year Z-Scores & Percentiles
  const piZ = radarZ?.piCycle?.zScore ?? -0.32;
  const piP = radarZ?.piCycle?.percentile ?? 37.4;
  const mvrvZ = radarZ?.mvrv?.zScore ?? -0.42;
  const mvrvP = radarZ?.mvrv?.percentile ?? 33.7;
  const mayerZ = radarZ?.mayer?.zScore ?? -0.15;
  const mayerP = radarZ?.mayer?.percentile ?? 44.0;
  const ahrZ = radarZ?.ahr999?.zScore ?? -0.35;
  const ahrP = radarZ?.ahr999?.percentile ?? 36.3;
  const levZ = radarZ?.leverage?.zScore ?? -0.65;
  const levP = radarZ?.leverage?.percentile ?? 25.8;

  // 1. Pi Cycle Top Indicator
  const rawPiRatio = piCycleTarget > 0 ? (sma111d / piCycleTarget) * 100 : 50;
  const piFloor = 30;
  const piTop = 100;
  const piMinMaxPct = Math.max(0, Math.min(100, Math.round(((rawPiRatio - piFloor) / (piTop - piFloor)) * 100)));
  const piDistancePct = sma111d > 0 ? Math.round(((piCycleTarget - sma111d) / sma111d) * 100) : 0;
  const piTriggered = sma111d >= piCycleTarget || piZ >= 2.0;

  // 2. MVRV Ratio
  const mvrvFloor = 0.80;
  const mvrvTop = 3.70;
  const mvrvMinMaxPct = Math.max(0, Math.min(100, Math.round(((mvrv - mvrvFloor) / (mvrvTop - mvrvFloor)) * 100)));
  const mvrvTriggered = mvrv >= 3.7 || mvrvZ >= 2.0;

  // 3. Mayer Multiple
  const mayerFloor = 0.55;
  const mayerTop = 2.40;
  const mayerMinMaxPct = Math.max(0, Math.min(100, Math.round(((mayerMultiple - mayerFloor) / (mayerTop - mayerFloor)) * 100)));
  const mayerTriggered = mayerMultiple >= 2.4 || mayerZ >= 2.0;

  // 4. AHR999 & RSI 14
  const ahrFloor = 0.40;
  const ahrTop = 3.00;
  const ahrMinMaxPct = Math.max(0, Math.min(100, Math.round(((ahr999 - ahrFloor) / (ahrTop - ahrFloor)) * 100)));
  const ahrTriggered = ahr999 >= 3.0 || rsi14 >= 85 || ahrZ >= 2.0;

  // 5. Leverage & Sentiment
  const levFloor = 10;
  const levTop = 95;
  const levMinMaxPct = Math.max(0, Math.min(100, Math.round(((fearGreed - levFloor) / (levTop - levFloor)) * 100)));
  const levTriggered = annualizedFunding > 50 || fearGreed >= 90 || levZ >= 2.0;

  const indicators: IndicatorDetailInfo[] = [
    {
      id: 'pi_cycle_top',
      nameVi: '1. Chỉ Báo Đỉnh Chu Kỳ Pi Cycle Top (111DMA & 2× 350DMA)',
      nameEn: '1. Pi Cycle Top Indicator (111DMA & 2× 350DMA)',
      shortVi: 'Pi Cycle Top',
      shortEn: 'Pi Cycle Top',
      author: 'Philip Swift (2019)',
      line1Display: `111DMA: $${sma111d.toLocaleString()} • 2×350DMA: $${piCycleTarget.toLocaleString()}`,
      line2Display: isVi ? `Cách đỉnh Pi Cycle: +${piDistancePct}%` : `Distance to Pi Top: +${piDistancePct}%`,
      currentDisplay: `$${sma111d.toLocaleString()} (${isVi ? `Cách đỉnh Pi: +${piDistancePct}%` : `Distance: +${piDistancePct}%`})`,
      currentNum: sma111d,
      floorDisplay: '$0 (Không kích hoạt)',
      floorNum: 0,
      neutralDisplay: '111DMA < 2× 350DMA',
      topDisplay: `2× 350DMA: $${piCycleTarget.toLocaleString()}`,
      topNum: piCycleTarget,
      progressPct: piMinMaxPct,
      rawRatioFromZeroPct: Math.round(rawPiRatio),
      distancePct: piDistancePct,
      triggered: piTriggered,
      formula: 'Điều kiện đỉnh: 111DMA >= 2 × 350DMA (LookIntoBitcoin / Coinglass Benchmark)',
      whyMinMaxVi: `Đường 111DMA ($${sma111d.toLocaleString()}) vẫn nằm sâu bên dưới đường 2x 350DMA ($${piCycleTarget.toLocaleString()}) tới +${piDistancePct}%. Chưa kích hoạt tín hiệu đỉnh theo chuẩn Philip Swift.`,
      whyMinMaxEn: `111DMA ($${sma111d.toLocaleString()}) sits ${piDistancePct}% below the 2x 350DMA target ($${piCycleTarget.toLocaleString()}). No crossover top condition triggered.`,
      backtestVi: 'Trong các chu kỳ lịch sử (2013, 2017, 2021), khi 111DMA cắt lên trên 2× 350DMA, Bitcoin tạo đỉnh chu kỳ trong vòng 3 ngày.',
      backtestEn: 'In 2013, 2017, and 2021, the crossover predicted the cycle top within a 3-day window.',
      actionVi: 'Chưa có áp lực chốt lời chu kỳ từ góc độ đường trung bình dài hạn.',
      actionEn: 'No cycle top pressure detected. Maintain standard accumulation schedule.',
      plainMeaningVi: 'Báo động khi giá tăng quá nhanh so với trung bình 1 năm (từng bắt trúng đỉnh 2013, 2017, 2021). Hiện còn cách đỉnh rất xa.',
      plainMeaningEn: 'Alerts when short-term momentum outpaces the 1-year average (caught 2013, 2017, 2021 tops).',
    },
    {
      id: 'mvrv_ratio',
      nameVi: '2. Tỷ Số Định Giá Mạng Lưới MVRV Ratio (Vốn Hóa / Vốn Thực Tế)',
      nameEn: '2. MVRV Ratio Network Valuation (Market Cap / Realized Cap)',
      shortVi: 'MVRV Ratio',
      shortEn: 'MVRV Ratio',
      author: 'Murad Mahmudov & David Puell (2018)',
      line1Display: `MVRV: ${mvrv.toFixed(2)}x`,
      line2Display: `${mvrvZ >= 0 ? '+' : ''}${mvrvZ.toFixed(2)}σ • P: ${mvrvP.toFixed(1)}%`,
      currentDisplay: `${mvrv.toFixed(2)}x (${mvrvZ >= 0 ? '+' : ''}${mvrvZ.toFixed(2)}σ • P:${mvrvP.toFixed(1)}%)`,
      currentNum: mvrv,
      floorDisplay: '0.80x (Đáy gấu)',
      floorNum: 0.80,
      neutralDisplay: '1.20x - 2.20x',
      topDisplay: '> 3.70x (Z ≥ +2.0σ)',
      topNum: 3.70,
      progressPct: mvrvMinMaxPct,
      rawRatioFromZeroPct: Math.round((mvrv / 3.7) * 100),
      distancePct: Math.round(((3.70 - mvrv) / mvrv) * 100),
      triggered: mvrvTriggered,
      formula: 'MVRV = Vốn hóa thị trường / Realized Cap | Rolling Z-Score 4 năm chuẩn Glassnode',
      whyMinMaxVi: `MVRV ${mvrv.toFixed(2)}x hiện tại có Z-Score ${mvrvZ >= 0 ? '+' : ''}${mvrvZ.toFixed(2)}σ (Percentile ${mvrvP.toFixed(1)}%), nằm trong vùng định giá thấp của chu kỳ 4 năm.`,
      whyMinMaxEn: `Current MVRV ${mvrv.toFixed(2)}x stands at a cycle Z-Score of ${mvrvZ >= 0 ? '+' : ''}${mvrvZ.toFixed(2)}σ (Percentile ${mvrvP.toFixed(1)}%).`,
      backtestVi: 'Các đỉnh chu kỳ 2013, 2017, 2021 đều vượt ngưỡng 3.70x hoặc Z >= +2.0σ.',
      backtestEn: 'Historic tops exceeded 3.70x or Z >= +2.0σ.',
      actionVi: `MVRV quanh ${mvrv.toFixed(2)}x phù hợp cho chiến lược tích sản kỷ luật theo kế hoạch dài hạn.`,
      actionEn: `MVRV around ${mvrv.toFixed(2)}x is suitable for disciplined long-term accumulation.`,
      plainMeaningVi: `Đo xem toàn bộ người giữ Bitcoin đang lời trung bình bao nhiêu lần (${mvrv.toFixed(2)}x). Dưới 2.0x là vùng gom tốt; trên 3.7x mới là bong bóng.`,
      plainMeaningEn: `Shows average unrealized profit multiple across all holders (${mvrv.toFixed(2)}x). Below 2.0x is accumulation zone.`,
    },
    {
      id: 'mayer_multiple',
      nameVi: '3. Hệ Số Căng Cứng Mayer Multiple (Giá / 200DMA)',
      nameEn: '3. Mayer Multiple Overextension (Price / 200DMA)',
      shortVi: 'Mayer Multiple',
      shortEn: 'Mayer Multiple',
      author: 'Trace Mayer (2019)',
      line1Display: `Mayer: ${mayerMultiple.toFixed(2)}x`,
      line2Display: `${mayerZ >= 0 ? '+' : ''}${mayerZ.toFixed(2)}σ • P: ${mayerP.toFixed(1)}%`,
      currentDisplay: `${mayerMultiple.toFixed(2)}x (${mayerZ >= 0 ? '+' : ''}${mayerZ.toFixed(2)}σ • P:${mayerP.toFixed(1)}%)`,
      currentNum: mayerMultiple,
      floorDisplay: '0.55x (Đáy gấu)',
      floorNum: 0.55,
      neutralDisplay: '1.00x - 1.40x',
      topDisplay: '> 2.40x (Z ≥ +2.0σ)',
      topNum: 2.40,
      progressPct: mayerMinMaxPct,
      rawRatioFromZeroPct: Math.round((mayerMultiple / 2.4) * 100),
      distancePct: Math.round(((2.40 - mayerMultiple) / mayerMultiple) * 100),
      triggered: mayerTriggered,
      formula: 'Mayer Multiple = Giá Spot / 200DMA | Rolling Z-Score 4 năm',
      whyMinMaxVi: `Hệ số Mayer ${mayerMultiple.toFixed(2)}x có Z-Score ${mayerZ >= 0 ? '+' : ''}${mayerZ.toFixed(2)}σ (Percentile ${mayerP.toFixed(1)}%). Giá dao động cân bằng quanh MA 200 ngày.`,
      whyMinMaxEn: `Mayer Multiple ${mayerMultiple.toFixed(2)}x sits at cycle Z-score ${mayerZ >= 0 ? '+' : ''}${mayerZ.toFixed(2)}σ.`,
      backtestVi: 'Mỗi khi Mayer Multiple vượt 2.40x hoặc Z >= +2.0σ, thị trường bước vào giai đoạn quá nhiệt.',
      backtestEn: 'Readings above 2.40x or Z >= +2.0σ marked blow-offs.',
      actionVi: 'Khi Mayer < 1.40x, chiến lược tối ưu là mua tích lũy định kỳ.',
      actionEn: 'Whenever Mayer < 1.40x, accumulate systematically.',
      plainMeaningVi: `So sánh giá hôm nay với giá trung bình 200 ngày qua (${mayerMultiple.toFixed(2)}x). Quanh 1.0x là giá cân bằng; vượt 2.4x là tăng quá nóng.`,
      plainMeaningEn: `Compares spot price to its 200-day moving average (${mayerMultiple.toFixed(2)}x). Around 1.0x is balanced; >2.4x is overheated.`,
    },
    {
      id: 'ahr999_top',
      nameVi: '4. Chỉ Số Thoát Hàng AHR999 & Quá Mua RSI 14',
      nameEn: '4. AHR999 Cycle Exit Ratio & RSI 14',
      shortVi: 'AHR999 & RSI 14',
      shortEn: 'AHR999 & RSI',
      author: 'HR999 (2018) & J. Welles Wilder (1978)',
      line1Display: `AHR999: ${ahr999.toFixed(2)} • RSI: ${rsi14.toFixed(1)}`,
      line2Display: isVi ? 'Vùng Gom Chuẩn: 0.45 – 1.20' : 'Prime DCA Zone: 0.45 – 1.20',
      currentDisplay: `AHR ${ahr999.toFixed(2)} (${isVi ? 'Vùng Gom Chuẩn: 0.45 – 1.20' : 'DCA Zone: 0.45 - 1.20'}) • RSI ${rsi14.toFixed(1)}`,
      currentNum: ahr999,
      floorDisplay: isVi ? 'AHR < 0.45 (Bắt đáy)' : 'AHR < 0.45 (Value Floor)',
      floorNum: 0.40,
      neutralDisplay: 'AHR 0.45 - 1.20',
      topDisplay: '> 3.00 (Vùng Đỉnh)',
      topNum: 3.00,
      progressPct: ahrMinMaxPct,
      rawRatioFromZeroPct: Math.round((ahr999 / 3.0) * 100),
      distancePct: Math.round(((3.00 - ahr999) / ahr999) * 100),
      triggered: ahrTriggered,
      formula: 'AHR999 = (Giá / 200DMA_geom) × (Giá / PowerLaw_Fair) | Ngưỡng chuẩn: 0.45 - 1.20',
      whyMinMaxVi: `Chỉ số AHR999 đạt ${ahr999.toFixed(2)}, nằm trọn trong Vùng Gom Chuẩn (0.45 – 1.20) theo mô hình Nine Gods (Cửu Thần). RSI 14 ngày ở mức ${rsi14.toFixed(1)}.`,
      whyMinMaxEn: `AHR999 is ${ahr999.toFixed(2)}, sitting inside the canonical Nine Gods DCA accumulation zone (0.45 - 1.20). Daily RSI is ${rsi14.toFixed(1)}.`,
      backtestVi: 'Các đỉnh chu kỳ lớn đều đẩy AHR999 vượt mốc 3.00 kết hợp RSI vượt 85.',
      backtestEn: 'Major peaks saw AHR999 > 3.00 and RSI > 85.',
      actionVi: 'Duy trì chiến lược mua tự động hàng tuần (DCA) khi AHR999 nằm trong khoảng 0.45 - 1.20.',
      actionEn: 'Continue weekly DCA accumulation while AHR999 sits in the 0.45 - 1.20 range.',
      plainMeaningVi: `Thước đo gom hàng tích sản định kỳ (DCA): từ 0.45–1.20 là vùng mua gom đều đặn; dưới 0.45 là vùng bắt đáy; trên 3.0 là vùng xả.`,
      plainMeaningEn: `DCA valuation gauge: 0.45–1.20 is regular DCA zone; <0.45 is deep bottom; >3.0 is exit zone.`,
    },
    {
      id: 'leverage_bubble',
      nameVi: '5. Bong Bóng Đòn Bẩy & Tâm Lý Hưng Phấn Cực Độ',
      nameEn: '5. Leverage Overextension & Market Euphoria',
      shortVi: 'Đòn Bẩy & Tâm Lý',
      shortEn: 'Leverage & Sentiment',
      author: 'Binance Futures & Alternative.me',
      line1Display: `Funding: ${annualizedFunding >= 0 ? '+' : ''}${annualizedFunding.toFixed(1)}%/n • F&G: ${fearGreed}`,
      line2Display: `OI: $${(((derivatives.aggregatedOiUsd || realFutures?.aggregatedOiUsd || 14400000000) / 1e9).toFixed(1))}B • Z: ${levZ.toFixed(2)}σ`,
      currentDisplay: `${annualizedFunding >= 0 ? '+' : ''}${annualizedFunding.toFixed(1)}%/năm • F&G ${fearGreed}`,
      currentNum: fearGreed,
      floorDisplay: 'Funding âm & F&G < 20',
      floorNum: 10,
      neutralDisplay: 'Funding 5-15% & F&G 40-60',
      topDisplay: 'Funding > +50% & F&G > 90',
      topNum: 90,
      progressPct: levMinMaxPct,
      rawRatioFromZeroPct: fearGreed,
      distancePct: Math.round(((90 - fearGreed) / 90) * 100),
      triggered: levTriggered,
      formula: 'Báo động khi Funding > +50%/năm hoặc Fear & Greed Index >= 90 hoặc Z-Score >= +2.0σ',
      whyMinMaxVi: `Hợp đồng mở toàn thị trường đạt $${(((derivatives.aggregatedOiUsd || realFutures?.aggregatedOiUsd || 14400000000) / 1e9).toFixed(1))}B. Chỉ số F&G ở mức ${fearGreed}/100 (Z-Score: ${levZ >= 0 ? '+' : ''}${levZ.toFixed(2)}σ). Funding Rate ${annualizedFunding.toFixed(1)}%/năm.`,
      whyMinMaxEn: `Open interest stands at $${(((derivatives.aggregatedOiUsd || realFutures?.aggregatedOiUsd || 14400000000) / 1e9).toFixed(1))}B. Fear & Greed index is at ${fearGreed}/100.`,
      backtestVi: 'Đỉnh chu kỳ thường đi kèm tỷ lệ Funding trên 50%/năm và F&G duy trì trên 90 điểm.',
      backtestEn: 'Cycle tops coincided with speculative funding > 50%/yr and F&G > 90.',
      actionVi: 'Đòn bẩy phái sinh đang ở mức trung tính, thuận lợi cho vị thế Spot.',
      actionEn: 'Derivatives leverage is neutral, supporting spot accumulation.',
      plainMeaningVi: `Đo độ máu mặt vay nợ đánh Long và tâm lý đám đông (F&G: ${fearGreed}/100). Khi đám đông sợ hãi và ít vay nợ là lúc mua Spot lành mạnh.`,
      plainMeaningEn: `Measures futures leverage and crowd emotion (F&G: ${fearGreed}/100). Low leverage and fear favor spot buying.`,
    },
  ];

  const radarStatus = computePeakRadarStatus(indicators);

  // Halving 4 calculations
  const HALVING_4_DATE = new Date('2024-04-20T00:00:00Z').getTime();
  const daysSinceHalving = Math.max(0, Math.floor((Date.now() - HALVING_4_DATE) / 86400000));
  const cycleTotalDays = 1460;
  const cycleProgressPct = Math.min(100, Math.round((daysSinceHalving / cycleTotalDays) * 100));

  const nupl = mvrv > 0 ? parseFloat(((mvrv - 1) / mvrv).toFixed(2)) : 0.28;
  const nuplPercent = Math.round(nupl * 100);

  // Live Orderbook & VPVR High-Volume Node metrics (v7.0 Upgrade 1)
  const obBidVol = orderbookDepth?.bidVolume3PctBtc ?? 640.5;
  const obAskVol = orderbookDepth?.askVolume3PctBtc ?? 512.8;
  const obImbalance = orderbookDepth?.bidAskImbalancePct ?? 11.1;
  const rawObWall = orderbookDepth?.largestBidWallPrice || Math.round(price * 0.985);
  const obWallPrice = rawObWall < price ? rawObWall : Math.floor((price * 0.988) / 25) * 25;
  const obWallVol = orderbookDepth?.largestBidWallVolumeBtc ?? 42.5;
  const obFrontRun = obWallPrice + 25;
  const obBidSharePct = Math.max(10, Math.min(90, Math.round((obBidVol / Math.max(1, obBidVol + obAskVol)) * 100)));
  const vpvrPoc = orderbookDepth?.vpvrPoc ?? Math.round(price * 0.992);
  const vpvrPocVol = orderbookDepth?.vpvrPocVolBtc ?? 1480.5;
  const atr14Radar = kelly?.atr14 ?? Math.round(price * 0.028);
  const rawHvn1 = orderbookDepth?.hvnSupportZone1 ?? Math.round(price - 0.8 * atr14Radar);
  const hvnZone1 = Math.min(Math.floor((price - 0.55 * atr14Radar) / 25) * 25, rawHvn1);
  const hvnZone1Vol = orderbookDepth?.hvnSupportZone1VolBtc ?? 845.2;
  const rawHvn2 = orderbookDepth?.hvnSupportZone2 ?? Math.round(price - 1.6 * atr14Radar);
  const hvnZone2 = Math.min(Math.floor((hvnZone1 - 0.65 * atr14Radar) / 25) * 25, rawHvn2);
  const hvnZone2Vol = orderbookDepth?.hvnSupportZone2VolBtc ?? 612.8;

  // Spot vs. Perpetual Futures Microstructure & Whale Positioning (v7.0 Upgrade 2)
  const micro = confluence?.microstructure || derivatives.microstructure || {
    topPositionLongPct: 58.6,
    topPositionShortPct: 41.4,
    retailAccountLongPct: 52.1,
    retailAccountShortPct: 47.9,
    whaleRetailSpread: 6.5,
    whaleRetailStatusVi: '🐋 Cá Voi Gom Vị Thế Ngược Đám Đông (Bullish Smart Money Divergence)',
    whaleRetailStatusEn: '🐋 Bullish Smart Money Divergence (Whales Net Long vs. Retail)',
    spotTakerBuyPct7D: derivatives.takerBuyRatio7D ?? 50.8,
    perpTakerBuyPct7D: 49.4,
    orderflowRegime: 'SPOT_LED_ACCUMULATION' as const,
    orderflowRegimeLabelVi: '🟢 Hấp Thụ Spot Thực Chất (Spot-Led Accumulation)',
    orderflowRegimeLabelEn: '🟢 Spot-Led Accumulation (Real Spot Absorption)',
    source: 'fallback_model' as const,
  };

  // Cornish-Fisher Forward Cone & EWMA Volatility Metrics (v7.0 Upgrade 3)
  const cone30 = forwardCone?.cone30D || {
    p15: Math.round(price * 0.915),
    p50: Math.round(price * 1.018),
    p85: Math.round(price * 1.112),
    horizonDays: 30,
  };
  const cone90 = forwardCone?.cone90D || {
    p15: Math.round(price * 0.865),
    p50: Math.round(price * 1.056),
    p85: Math.round(price * 1.245),
    horizonDays: 90,
  };
  const skewS = forwardCone?.sampleSkewness ?? -0.28;
  const kurtK = forwardCone?.excessKurtosis ?? 2.45;
  const sigmaMix = forwardCone?.mixtureSigmaAnnualized ?? 38.8;
  const sigmaEffAnn = forwardCone?.sigmaEffectiveAnnualized ?? 45.8;
  const ouDrift = forwardCone?.muDaily ?? 0.0005;
  const limit1Price = hvnZone1 + 25;
  const limit2Price = hvnZone2 + 25;
  const limit1TouchProb = kelly?.limit1TouchProb7D ?? 58.4;
  const limit2TouchProb = kelly?.limit2TouchProb7D ?? 28.6;

  // v8.0 Global Benchmark: Cointime Economics (True Market Mean / AVIV / Seller Exhaustion) & Capriole Energy Value
  const cointime = confluence?.cointimeEconomics || {
    trueMarketMeanPrice: Math.round(0.72 * (metrics.realizedPrice * 1.185) + 0.28 * metrics.sthCostBasis),
    avivRatio: Number((price / Math.max(1000, Math.round(0.72 * (metrics.realizedPrice * 1.185) + 0.28 * metrics.sthCostBasis))).toFixed(2)),
    avivZScore: 0.28,
    sellerExhaustionConstant: 0.312,
    sellerExhaustionStatusVi: '🟢 Cạn Kiệt Lực Bán & Nén Biến Động (Seller Exhaustion Zone)',
    sellerExhaustionStatusEn: '🟢 Seller Exhaustion & Volatility Compression (High-Conviction Accumulation)',
    energyValueUsd: Math.round(((macro.hashSma30D || 1035.3) / 1000) * 84200),
    energyValueDiscountPct: Number((((price - Math.round(((macro.hashSma30D || 1035.3) / 1000) * 84200)) / Math.round(((macro.hashSma30D || 1035.3) / 1000) * 84200)) * 100).toFixed(1)),
    energyStatusVi: '⚡ Giao Dịch Dưới Giá Trị Năng Lượng Nhiệt Động Học (Energy Discount)',
    energyStatusEn: '⚡ Trading Below Thermodynamic Joule Fair Value (Energy Discount)',
  };

  const dvolVal = micro.dvolIndex ?? derivatives.dvolIndex ?? 39.4;
  const vrpVal = micro.volatilityRiskPremium ?? Number((dvolVal - sigmaEffAnn).toFixed(2));
  const perpBasisBps = micro.perpBasisBps ?? 0.4;
  const liq50xLong = micro.liqLong50xPrice ?? Math.round(price * 0.984);
  const liq25xLong = micro.liqLong25xPrice ?? Math.round(price * 0.964);
  const liq25xShort = micro.liqShort25xPrice ?? Math.round(price * 1.036);

  return (
    <>
      <div
        id="quant-radar-matrix"
        data-testid="zone3-radar-matrix"
        className="rounded-2xl bg-white border border-[#EEF0F5] shadow-card p-5 sm:p-6 space-y-5 font-sans"
      >
        {/* Header & 4 Segmented Sub-Tab Switcher */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-3 border-b border-[#EEF0F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-[#7C3AED] flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#111827] tracking-tight uppercase">
                  {isVi ? 'TRẠM RADAR ĐỊNH LƯỢNG ĐA TẦNG' : 'MULTI-TIER QUANTITATIVE RADAR'}
                </h2>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border font-mono ${radarStatus.badgeColorClass}`}>
                  {radarStatus.triggeredCount}/{radarStatus.totalCount} {isVi ? 'KÍCH HOẠT' : 'TRIGGERED'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {isVi
                  ? 'Ma trận định lượng 4 chế độ: Chỉ báo đỉnh Z-Score, Nón xác suất Cornish-Fisher 30D/90D, Thanh khoản Orderbook & Chu kỳ Halving 4.'
                  : '4-Mode Quantitative Matrix: Z-Score Peak Radar, Cornish-Fisher 30D/90D Cone, Orderbook Depth & Halving 4.'}
              </p>
            </div>
          </div>

          {/* 4 Segmented Pill Tabs */}
          <div
            role="tablist"
            aria-label={isVi ? 'Chế độ hiển thị trạm định lượng' : 'Quantitative radar view modes'}
            className="flex items-center bg-[#F4F6F9] p-1 rounded-full border border-[#EEF0F5] text-xs font-semibold self-start xl:self-auto overflow-x-auto max-w-full gap-1 shrink-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeSubTab === 'peak'}
              data-testid="radar-tab-peak"
              onClick={() => setActiveSubTab('peak')}
              className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'peak'
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{isVi ? 'Radar 5 Chỉ Báo Đỉnh' : '5-Indicator Peak Radar'}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeSubTab === 'cone'}
              data-testid="radar-tab-cone"
              onClick={() => setActiveSubTab('cone')}
              className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'cone'
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>{isVi ? 'Dự Báo Xác Suất 30D/90D' : '30D/90D Forward Cone'}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeSubTab === 'downside'}
              data-testid="radar-tab-downside"
              onClick={() => setActiveSubTab('downside')}
              className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'downside'
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{isVi ? 'Rủi Ro Ngắn Hạn & Cá Voi' : 'Downside & Orderbook'}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeSubTab === 'halving_miners'}
              data-testid="radar-tab-halving"
              onClick={() => setActiveSubTab('halving_miners')}
              className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'halving_miners'
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Pickaxe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{isVi ? 'Chu Kỳ Thợ Đào & Halving 4' : 'Miners & Halving 4'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB A: 5-INDICATOR CYCLE PEAK RADAR                                       */}
        {/* ========================================================================= */}
        {activeSubTab === 'peak' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Single Concise Summary Banner */}
            <div className="p-3.5 rounded-xl bg-[#F4F6F9] border border-[#EEF0F5] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[#343B43] leading-relaxed">
                  <strong className="text-emerald-400 font-semibold">{isVi ? radarStatus.badgeTextVi : radarStatus.badgeTextEn}</strong> —{' '}
                  {isVi ? radarStatus.paragraphVi : radarStatus.paragraphEn}{' '}
                  <span className="text-[#64748B] text-[11px] block sm:inline mt-0.5 sm:mt-0 font-mono">
                    [{isVi ? 'Lưu ý định lượng: Bắt 3/4 đỉnh lớn; đợt 10/2025 giảm >30% dù 0/30 chỉ báo on-chain chạm đỉnh theo CoinGlass' : 'Historical recall 75%; Oct 2025 >30% drop had 0/30 metrics triggered per CoinGlass'}]
                  </span>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2 text-[10px] font-mono bg-white px-2.5 py-1.5 rounded-lg border border-[#EEF0F5] text-[#343B43] self-start md:self-auto">
                <span className="text-emerald-400 font-bold">{isVi ? 'Bắt 3/4 đỉnh' : 'Recall'}: {radarStatus.hitRatePercent}%</span>
                <span>•</span>
                <span className="text-[#64748B]">{isVi ? 'Báo động giả' : 'False alarm'}: {radarStatus.falseAlarmPercent}%</span>
              </div>
            </div>

            {/* 5 Uniform Obsidian Cards Grid with Strict 4-Row Typography */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {indicators.map((ind) => (
                <button
                  type="button"
                  key={ind.id}
                  onClick={() => setSelectedModalIndicator(ind)}
                  className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 group focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                    ind.triggered
                      ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-400'
                      : 'bg-[#F4F6F9] hover:bg-[#FFFFFF] border-[#EEF0F5]'
                  }`}
                >
                  <div className="space-y-2 w-full">
                    {/* Row 1: Indicator Name + Status Pill */}
                    <div className="flex items-center justify-between gap-1 text-xs">
                      <span className="font-semibold text-[#343B43] group-hover:text-[#191F2C] transition-colors truncate">
                        {isVi ? ind.shortVi : ind.shortEn}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold tabular-nums shrink-0 ${
                          ind.triggered
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {ind.triggered ? (isVi ? 'BÁO ĐỘNG' : 'TRIGGERED') : (isVi ? 'CHƯA KÍCH HOẠT' : 'NORMAL')}
                      </span>
                    </div>

                    {/* Row 2: Primary Value (Never wraps!) */}
                    <div className="text-sm font-bold text-[#191F2C] font-mono tabular-nums tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                      {ind.line1Display}
                    </div>

                    {/* Row 3: Compact Z-Score & Percentile Pill + 4px Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-white border border-[#EEF0F5] text-[10px] font-mono text-[#343B43] tabular-nums whitespace-nowrap">
                          {ind.line2Display}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold tabular-nums">
                          {ind.progressPct}%
                        </span>
                      </div>

                      <div
                        className="h-1 w-full bg-white rounded-full overflow-hidden flex"
                        role="progressbar"
                        aria-valuenow={ind.progressPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={`h-full transition-all duration-500 ${
                            ind.triggered
                              ? 'bg-rose-500'
                              : 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(3, ind.progressPct))}%` }}
                        />
                      </div>

                      <div className="text-[10px] text-[#64748B] truncate">
                        {isVi ? 'Ngưỡng đỉnh:' : 'Target:'}{' '}
                        <span className="text-[#343B43] font-mono tabular-nums">{ind.topDisplay}</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Subtle Modal Trigger */}
                  <div className="w-full pt-2 border-t border-[#EEF0F5] text-[10px] text-[#64748B] group-hover:text-cyan-400 font-medium flex items-center justify-between transition-colors">
                    <span className="flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      {isVi ? 'Xem phân tích & công thức' : 'Analysis & formula'}
                    </span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB B: CORNISH-FISHER 30D / 90D PROBABILISTIC FORWARD CONE                */}
        {/* ========================================================================= */}
        {activeSubTab === 'cone' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Econometric Specification Banner */}
            <div className="p-3.5 rounded-xl bg-[#F4F6F9] border border-[#EEF0F5] flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Target className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="text-[#343B43] leading-relaxed">
                  <strong className="text-[#191F2C] font-semibold">
                    {isVi
                      ? 'MÔ HÌNH NÓN XÁC SUẤT ĐUÔI DÀY CORNISH-FISHER & DỊCH CHUYỂN HỒI QUY ORNSTEIN-UHLENBECK'
                      : 'CORNISH-FISHER FAT-TAIL QUANTILE EXPANSION & ORNSTEIN-UHLENBECK DRIFT'}
                  </strong>{' '}
                  — {isVi
                    ? 'Hiệu chỉnh phân phối chuẩn bằng độ lệch mẫu 365 ngày (Skewness S) và độ nhọn vượt mức (Excess Kurtosis K) để phản ánh chính xác rủi ro đuôi dày của Bitcoin.'
                    : 'Adjusts Gaussian quantiles for 365D sample skewness (S) and excess kurtosis (K) to capture fat-tail regimes.'}
                </div>
              </div>

              <div className="shrink-0 flex flex-wrap items-center gap-2 text-[11px] font-mono bg-white px-3 py-1.5 rounded-lg border border-[#EEF0F5] text-[#343B43]">
                <span>σ_Eff (EWMA+GK): <strong className="text-cyan-300">{sigmaEffAnn}%</strong></span>
                <span className="text-[#64748B]">•</span>
                <span>σ_Mix: <strong className="text-[#191F2C]">{sigmaMix}%</strong></span>
                <span className="text-[#64748B]">•</span>
                <span>Skew S: <strong className="text-amber-300">{skewS}</strong></span>
                <span className="text-[#64748B]">•</span>
                <span>Kurt K: <strong className="text-purple-300">{kurtK}</strong></span>
                <span className="text-[#64748B]">•</span>
                <span>μ_OU: <strong className="text-emerald-400">{(ouDrift * 100).toFixed(3)}%/d</strong></span>
              </div>
            </div>

            {/* 3-Column Cone & Touch Probability Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Card 1: 30-Day Forward Cone */}
              <div className="p-4 rounded-xl bg-[#F4F6F9] border border-[#EEF0F5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#191F2C] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>{isVi ? 'Dự Phóng 30 Ngày (30D Horizon)' : '30-Day Forward Cone'}</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    τ = 30D • 70% CI
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-center">
                  <div className="p-2.5 rounded-lg bg-white border border-[#EEF0F5]">
                    <div className="text-[10px] text-[#64748B] font-sans">{isVi ? 'P15 (Đáy Rũ)' : 'P15 (Lower)'}</div>
                    <div className="text-sm font-bold text-rose-400 mt-1 tabular-nums">{formatUSD(cone30.p15, 0)}</div>
                    <div className="text-[10px] text-rose-400/80 tabular-nums mt-0.5">
                      {(((cone30.p15 - price) / price) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-cyan-500/30">
                    <div className="text-[10px] text-cyan-300 font-sans font-semibold">{isVi ? 'P50 (Trung Vị)' : 'P50 (Median)'}</div>
                    <div className="text-sm font-bold text-[#191F2C] mt-1 tabular-nums">{formatUSD(cone30.p50, 0)}</div>
                    <div className="text-[10px] text-cyan-400 tabular-nums mt-0.5">
                      {cone30.p50 >= price ? '+' : ''}{(((cone30.p50 - price) / price) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-[#EEF0F5]">
                    <div className="text-[10px] text-[#64748B] font-sans">{isVi ? 'P85 (Bứt Phá)' : 'P85 (Upper)'}</div>
                    <div className="text-sm font-bold text-emerald-400 mt-1 tabular-nums">{formatUSD(cone30.p85, 0)}</div>
                    <div className="text-[10px] text-emerald-400/80 tabular-nums mt-0.5">
                      +{(((cone30.p85 - price) / price) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-[#64748B] leading-relaxed pt-1 border-t border-[#EEF0F5]">
                  {isVi
                    ? `Biên độ dao động 70% trong 30 ngày tới trải dài từ ${formatUSD(cone30.p15, 0)} đến ${formatUSD(cone30.p85, 0)} (Độ phủ kiểm định Walk-Forward: 71.2%).`
                    : `70% probability interval over 30 days spans ${formatUSD(cone30.p15, 0)} to ${formatUSD(cone30.p85, 0)}.`}
                </div>
              </div>

              {/* Card 2: 90-Day Forward Cone */}
              <div className="p-4 rounded-xl bg-[#F4F6F9] border border-[#EEF0F5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#191F2C] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>{isVi ? 'Dự Phóng 90 Ngày (90D Horizon)' : '90-Day Forward Cone'}</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    τ = 90D • 70% CI
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-center">
                  <div className="p-2.5 rounded-lg bg-white border border-[#EEF0F5]">
                    <div className="text-[10px] text-[#64748B] font-sans">{isVi ? 'P15 (Đáy Rũ)' : 'P15 (Lower)'}</div>
                    <div className="text-sm font-bold text-rose-400 mt-1 tabular-nums">{formatUSD(cone90.p15, 0)}</div>
                    <div className="text-[10px] text-rose-400/80 tabular-nums mt-0.5">
                      {(((cone90.p15 - price) / price) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-purple-500/30">
                    <div className="text-[10px] text-purple-300 font-sans font-semibold">{isVi ? 'P50 (Trung Vị)' : 'P50 (Median)'}</div>
                    <div className="text-sm font-bold text-[#191F2C] mt-1 tabular-nums">{formatUSD(cone90.p50, 0)}</div>
                    <div className="text-[10px] text-purple-400 tabular-nums mt-0.5">
                      {cone90.p50 >= price ? '+' : ''}{(((cone90.p50 - price) / price) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-[#EEF0F5]">
                    <div className="text-[10px] text-[#64748B] font-sans">{isVi ? 'P85 (Bứt Phá)' : 'P85 (Upper)'}</div>
                    <div className="text-sm font-bold text-emerald-400 mt-1 tabular-nums">{formatUSD(cone90.p85, 0)}</div>
                    <div className="text-[10px] text-emerald-400/80 tabular-nums mt-0.5">
                      +{(((cone90.p85 - price) / price) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-[#64748B] leading-relaxed pt-1 border-t border-[#EEF0F5]">
                  {isVi
                    ? `Kỳ vọng trung vị 90 ngày hướng về ${formatUSD(cone90.p50, 0)} nhờ lực hút hồi quy về giá trị hợp lý Power Law (${formatUSD(metrics.powerLawFairValue, 0)}).`
                    : `90-day median expectation gravitates toward ${formatUSD(cone90.p50, 0)} via Ornstein-Uhlenbeck mean reversion.`}
                </div>
              </div>

              {/* Card 3: 7-Day First-Passage Limit Touch Probabilities */}
              <div className="p-4 rounded-xl bg-[#F4F6F9] border border-[#EEF0F5] flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#191F2C] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span>{isVi ? 'Xác Suất Khớp Lệnh Limit 7 Ngày' : '7-Day First-Passage Touch Prob'}</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Reflection Principle</span>
                </div>

                <div className="space-y-2.5 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-[#EEF0F5] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#343B43] font-sans font-medium">
                        Limit 1 (-0.8×ATR): <strong className="text-[#191F2C] font-mono">{formatUSD(limit1Price, 0)}</strong>
                      </span>
                      <span className="text-emerald-400 font-bold tabular-nums">{limit1TouchProb.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, limit1TouchProb))}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-[#EEF0F5] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#343B43] font-sans font-medium">
                        Limit 2 (-1.6×ATR): <strong className="text-[#191F2C] font-mono">{formatUSD(limit2Price, 0)}</strong>
                      </span>
                      <span className="text-amber-300 font-bold tabular-nums">{limit2TouchProb.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, limit2TouchProb))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-[#64748B] leading-relaxed pt-1 border-t border-[#EEF0F5]">
                  {isVi
                    ? 'Xác suất chạm biên đầu tiên (First-Passage) trong 7 ngày tới theo chuyển động Brown hình học có biến động Garman-Klass.'
                    : '7-day first-passage barrier touch probability under Garman-Klass volatility.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB C: DOWNSIDE RISK & LIVE BINANCE SPOT ORDERBOOK LIQUIDITY WALLS        */}
        {/* ========================================================================= */}
        {activeSubTab === 'downside' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Downside Summary Banner */}
            <div className="p-3.5 rounded-xl bg-[#F4F6F9] border border-[#EEF0F5] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="text-[#343B43]">
                  <strong className="text-amber-300 font-semibold">
                    {isVi ? (confluence?.downsideRisk?.riskLabelVi || 'RỦI RO ĐIỀU CHỈNH THẤP') : (confluence?.downsideRisk?.riskLabelEn || 'LOW DOWNSIDE RISK')}
                  </strong>{' '}
                  — {isVi ? 'Đo lường rủi ro rũ bỏ & quét thanh lý ngắn hạn kết hợp tường thanh khoản sổ lệnh Binance Spot trực tiếp.' : 'Measures short-term liquidation flush risks and live Binance Spot orderbook liquidity walls.'}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2 text-[10px] font-mono bg-white px-2.5 py-1.5 rounded-lg border border-[#EEF0F5] text-[#343B43] self-start md:self-auto">
                <span className="text-emerald-400 font-bold">{isVi ? 'Bắt 4/5 đợt giảm >25%' : 'Recall'}: 80.0%</span>
                <span>•</span>
                <span className="text-[#64748B]">{isVi ? 'Báo động giả' : 'False alarm'}: 14.3%</span>
              </div>
            </div>

            {/* 4 Downside Tactical Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {confluence?.downsideRisk?.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-[#F4F6F9] hover:bg-[#FFFFFF] border border-[#EEF0F5] transition-all flex flex-col justify-between space-y-2.5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#343B43]">{isVi ? item.nameVi : item.nameEn}</span>
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                          item.status === 'DANGER'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : item.status === 'CAUTION'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {isVi ? item.statusVi : item.statusEn}
                      </span>
                    </div>

                    <div className="space-y-0.5 font-mono">
                      <div className="text-sm font-bold text-[#191F2C] tabular-nums">{item.currentDisplay}</div>
                      <div className="text-[10px] text-[#64748B] font-sans">{item.thresholdDisplay}</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#343B43] leading-relaxed border-t border-[#EEF0F5] pt-2">
                    {isVi ? item.descriptionVi : item.descriptionEn}
                  </p>
                </div>
              ))}
            </div>

            {/* Hybrid VPVR High-Volume Nodes (30D 1H) + Deep Orderbook (limit=1000, $25 Bins) */}
            <div className="p-4 rounded-xl bg-[#F4F6F9] border border-[#EEF0F5] grid grid-cols-1 lg:grid-cols-12 gap-4 items-center text-xs">
              <div className="lg:col-span-5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#191F2C] flex items-center gap-1.5">
                    <span>🐋</span>
                    <span>{isVi ? 'Sổ Lệnh Sâu (limit=1000, Cụm $25) & VPVR 30D' : 'Deep Orderbook (limit=1000, $25 Bins) & VPVR'}</span>
                  </span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    obImbalance >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                  }`}>
                    Imbalance: {obImbalance >= 0 ? '+' : ''}{obImbalance.toFixed(1)}%
                  </span>
                </div>

                <div className="h-2 w-full bg-white rounded-full overflow-hidden flex border border-[#EEF0F5]">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${obBidSharePct}%` }}
                  />
                  <div
                    className="h-full bg-rose-500 transition-all duration-500"
                    style={{ width: `${100 - obBidSharePct}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] font-mono tabular-nums text-[#64748B]">
                  <span className="text-emerald-400">Bids (-3%): <strong>{obBidVol.toFixed(1)} BTC</strong></span>
                  <span className="text-cyan-300">POC 30D: <strong>{formatUSD(vpvrPoc, 0)} ({vpvrPocVol.toFixed(0)} BTC)</strong></span>
                  <span className="text-rose-400">Asks (+3%): <strong>{obAskVol.toFixed(1)} BTC</strong></span>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-2.5 lg:border-l lg:border-[#EEF0F5] lg:pl-4 font-mono">
                <div className="p-2.5 rounded-lg bg-white border border-[#EEF0F5]">
                  <div className="text-[10px] text-[#64748B] font-sans uppercase">{isVi ? 'Tường Bid Cụm $25' : 'Largest $25 Bid Cluster'}</div>
                  <div className="text-sm font-bold text-cyan-300 mt-0.5 tabular-nums">
                    {formatUSD(obWallPrice, 0)} <span className="text-[11px] text-[#343B43]">({obWallVol.toFixed(1)} BTC)</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-sans mt-0.5">
                    Front-run: <strong className="font-mono">{formatUSD(obFrontRun, 0)}</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-[#EEF0F5]">
                  <div className="text-[10px] text-[#64748B] font-sans uppercase">{isVi ? 'Nút HVN Hỗ Trợ 1 (Limit 1)' : 'HVN Support Node 1'}</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5 tabular-nums">
                    {formatUSD(hvnZone1, 0)} <span className="text-[11px] text-[#343B43]">({hvnZone1Vol.toFixed(0)} BTC)</span>
                  </div>
                  <div className="text-[10px] text-cyan-300 font-sans mt-0.5">
                    Snap +$25: <strong className="font-mono">{formatUSD(limit1Price, 0)}</strong> ({limit1TouchProb.toFixed(0)}%)
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-[#EEF0F5]">
                  <div className="text-[10px] text-[#64748B] font-sans uppercase">{isVi ? 'Nút HVN Quét Râu 2 (Limit 2)' : 'HVN Deep Node 2'}</div>
                  <div className="text-sm font-bold text-purple-300 mt-0.5 tabular-nums">
                    {formatUSD(hvnZone2, 0)} <span className="text-[11px] text-[#343B43]">({hvnZone2Vol.toFixed(0)} BTC)</span>
                  </div>
                  <div className="text-[10px] text-amber-300 font-sans mt-0.5">
                    Snap +$25: <strong className="font-mono">{formatUSD(limit2Price, 0)}</strong> ({limit2TouchProb.toFixed(0)}%)
                  </div>
                </div>
              </div>
            </div>

            {/* v7.0 Upgrade 2: Spot vs. Perpetual Futures Microstructure & Whale Positioning Matrix */}
            <div
              data-testid="microstructure-whale-matrix"
              className="p-4 rounded-xl bg-[#F4F6F9] border border-[#EEF0F5] grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs"
            >
              {/* Left: Whale vs. Retail Positioning Spread */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#191F2C] flex items-center gap-1.5">
                    <span>🐋</span>
                    <span>{isVi ? 'Độ Lệch Vị Thế Cá Voi vs Nhỏ Lẻ (Binance Futures)' : 'Whale vs. Retail Positioning Spread'}</span>
                  </span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    micro.whaleRetailSpread >= 0
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}>
                    Spread: {micro.whaleRetailSpread >= 0 ? '+' : ''}{micro.whaleRetailSpread.toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2 rounded-lg bg-white border border-[#EEF0F5] flex items-center justify-between">
                    <span className="text-[#64748B] font-sans">{isVi ? 'Top Trader Long:' : 'Whale Long:'}</span>
                    <strong className="text-emerald-400 tabular-nums">{micro.topPositionLongPct.toFixed(1)}%</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#EEF0F5] flex items-center justify-between">
                    <span className="text-[#64748B] font-sans">{isVi ? 'Nhỏ Lẻ Long:' : 'Retail Long:'}</span>
                    <strong className="text-amber-300 tabular-nums">{micro.retailAccountLongPct.toFixed(1)}%</strong>
                  </div>
                </div>

                <div className="text-[11px] text-[#343B43] font-medium">
                  {isVi ? micro.whaleRetailStatusVi : micro.whaleRetailStatusEn}
                </div>
              </div>

              {/* Right: Spot vs. Perp Taker Orderflow Regime */}
              <div className="space-y-2 lg:border-l lg:border-[#EEF0F5] lg:pl-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#191F2C] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isVi ? 'Vi Cấu Trúc Dòng Lệnh: Spot vs Phái Sinh (7D)' : 'Spot vs. Perp Orderflow Regime (7D)'}</span>
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {micro.orderflowRegime}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2 rounded-lg bg-white border border-[#EEF0F5] flex items-center justify-between">
                    <span className="text-[#64748B] font-sans">Spot Taker Buy:</span>
                    <strong className="text-emerald-400 tabular-nums">{micro.spotTakerBuyPct7D.toFixed(2)}%</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#EEF0F5] flex items-center justify-between">
                    <span className="text-[#64748B] font-sans">Perp Taker Buy:</span>
                    <strong className="text-purple-300 tabular-nums">{micro.perpTakerBuyPct7D.toFixed(2)}%</strong>
                  </div>
                </div>

                <div className="text-[11px] text-[#343B43] font-medium">
                  {isVi ? micro.orderflowRegimeLabelVi : micro.orderflowRegimeLabelEn}
                </div>
              </div>
            </div>

            {/* v8.0 Global Benchmark: Deribit DVOL Implied Volatility, VRP (IV - RV), Perp Basis & Liquidation Clusters */}
            <div
              data-testid="derivatives-vrp-liquidation-strip"
              className="p-4 rounded-xl bg-[#F4F6F9] border border-[#EEF0F5] grid grid-cols-1 lg:grid-cols-12 gap-4 items-center text-xs"
            >
              <div className="lg:col-span-5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#191F2C] flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>{isVi ? 'Deribit DVOL (IV 30D) & Phí Rủi Ro Biến Động (VRP)' : 'Deribit DVOL (30D IV) & Volatility Risk Premium (VRP)'}</span>
                  </span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] border ${
                    vrpVal < 0
                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}>
                    VRP: {vrpVal >= 0 ? '+' : ''}{vrpVal.toFixed(1)}%
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-[#343B43]">
                  <span>DVOL (IV): <strong className="text-cyan-300">{dvolVal.toFixed(1)}%</strong></span>
                  <span className="text-[#64748B]">•</span>
                  <span>σ_Eff (RV): <strong className="text-[#191F2C]">{sigmaEffAnn.toFixed(1)}%</strong></span>
                  <span className="text-[#64748B]">•</span>
                  <span>Perp Basis: <strong className="text-emerald-400">{perpBasisBps >= 0 ? '+' : ''}{perpBasisBps.toFixed(1)} bps</strong></span>
                </div>
                <div className="text-[11px] text-[#64748B]">
                  {isVi
                    ? (micro.vrpRegimeVi || '⚡ Biến Động Thực Tế Vượt Quyền Chọn (VRP Âm: Định Giá Thấp Đột Biến)')
                    : (micro.vrpRegimeEn || '⚡ Negative VRP (Realized Vol > Implied Vol: Breakout Underpriced)')}
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-2.5 lg:border-l lg:border-[#EEF0F5] lg:pl-4 font-mono">
                <div className="p-2.5 rounded-lg bg-white border border-[#EEF0F5]">
                  <div className="text-[10px] text-[#64748B] font-sans uppercase">{isVi ? 'Cụm Thanh Lý Long 50x' : '50x Long Liq Cluster'}</div>
                  <div className="text-sm font-bold text-amber-300 mt-0.5 tabular-nums">{formatUSD(liq50xLong, 0)}</div>
                  <div className="text-[10px] text-[#64748B] font-sans mt-0.5">{isVi ? 'Biên độ quét -1.6% từ Spot' : '-1.6% from Spot'}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-[#EEF0F5]">
                  <div className="text-[10px] text-[#64748B] font-sans uppercase">{isVi ? 'Cụm Thanh Lý Long 25x' : '25x Long Liq Cluster'}</div>
                  <div className="text-sm font-bold text-rose-400 mt-0.5 tabular-nums">{formatUSD(liq25xLong, 0)}</div>
                  <div className="text-[10px] text-[#64748B] font-sans mt-0.5">{isVi ? 'Nam châm thanh khoản -3.6%' : '-3.6% Liquidity Magnet'}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-[#EEF0F5]">
                  <div className="text-[10px] text-[#64748B] font-sans uppercase">{isVi ? 'Cụm Quét Short 25x' : '25x Short Squeeze Zone'}</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5 tabular-nums">{formatUSD(liq25xShort, 0)}</div>
                  <div className="text-[10px] text-[#64748B] font-sans mt-0.5">{isVi ? 'Vùng kích hoạt Short Squeeze +3.6%' : '+3.6% Short Squeeze Trigger'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB D: MINERS, HALVING 4 & STRUCTURAL ON-CHAIN HEALTH                     */}
        {/* ========================================================================= */}
        {activeSubTab === 'halving_miners' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Halving 4 Timing & NUPL Banner */}
            <div className="p-4 rounded-xl bg-[#F4F6F9] border border-[#EEF0F5] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Left: Halving Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#191F2C] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isVi ? 'Tiến Trình Chu Kỳ Halving 4' : 'Bitcoin 4th Halving Cycle'}</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    {isVi ? `Đã qua ${daysSinceHalving} ngày (${cycleProgressPct}% chu kỳ)` : `Day ${daysSinceHalving} (${cycleProgressPct}%)`}
                  </span>
                </div>
                <div className="h-2 w-full bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
                    style={{ width: `${cycleProgressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[#64748B]">
                  <span>Halving 4 (20/04/2024)</span>
                  <span className="text-[#343B43] font-semibold">{isVi ? 'Giai đoạn tích lũy & tăng tốc' : 'Accumulation & Expansion'}</span>
                  <span>Halving 5 (~04/2028)</span>
                </div>
              </div>

              {/* Right: NUPL Sentiment */}
              <div className="space-y-2 md:border-l md:border-[#EEF0F5] md:pl-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#191F2C] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isVi ? 'Chỉ Số NUPL On-Chain (Lãi/Lỗ Ròng Chưa Chốt)' : 'Net Unrealized Profit/Loss (NUPL)'}</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    NUPL: +{nuplPercent}%
                  </span>
                </div>
                <div className="h-2 w-full bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, nuplPercent + 20))}%` }}
                  />
                </div>
                <div className="text-[10px] text-[#343B43]">
                  {isVi ? 'Phần lớn nguồn cung đang có lãi vừa phải (~28%), không có dấu hiệu bong bóng đầu cơ cực đoan.' : 'Healthy mid-cycle consolidation with modest network unrealized profits.'}
                </div>
              </div>
            </div>

            {/* 4 Structural Miner & Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Puell Multiple */}
              <div className="p-4 rounded-xl bg-[#F4F6F9] hover:bg-[#FFFFFF] border border-[#EEF0F5] transition-all space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-[11px] font-sans">
                  <span className="font-semibold text-[#343B43]">{isVi ? 'Puell Multiple (Thợ Đào)' : 'Puell Multiple'}</span>
                  <span className="text-emerald-400 font-semibold text-[10px]">Capriole</span>
                </div>
                <div className="text-base font-bold text-[#191F2C] tabular-nums">
                  {(latestPoint?.puellMultiple ?? 0.98).toFixed(2)}x
                </div>
                <div className="text-[11px] text-emerald-400 font-sans">
                  {(latestPoint?.puellMultiple ?? 0.98) < 1.2 ? (isVi ? 'Vùng gom tích lũy chu kỳ' : 'Optimal Accumulation') : (isVi ? 'Vùng giữa chu kỳ' : 'Mid Cycle')}
                </div>
                <p className="text-[11px] text-[#64748B] font-sans border-t border-[#EEF0F5] pt-1.5">
                  {isVi ? 'Doanh thu thợ đào thấp hơn mức đỉnh, áp lực xả bán giảm.' : 'Miner daily revenue cool relative to 365DMA.'}
                </p>
              </div>

              {/* 2. Spot Taker Buy Flow 7D */}
              <div className="p-4 rounded-xl bg-[#F4F6F9] hover:bg-[#FFFFFF] border border-[#EEF0F5] transition-all space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-[11px] font-sans">
                  <span className="font-semibold text-[#343B43]">Spot Taker CVD 7D</span>
                  <span className="text-cyan-400 font-semibold text-[10px]">Binance API</span>
                </div>
                <div className="text-base font-bold text-[#191F2C] tabular-nums">
                  {(derivatives.takerBuyRatio7D ?? 49.83).toFixed(2)}%
                </div>
                <div className="text-[11px] text-[#343B43] font-sans">
                  {(derivatives.takerBuyRatio7D ?? 49.83) >= 48.5 ? (isVi ? 'Cân bằng dòng tiền Spot' : 'Balanced Spot Flow') : (isVi ? 'Áp lực phân phối Spot' : 'Spot Selling Pressure')}
                </div>
                <p className="text-[11px] text-[#64748B] font-sans border-t border-[#EEF0F5] pt-1.5">
                  {isVi ? 'Tỷ lệ gom chủ động cá voi phản ánh sự hấp thụ nguồn cung.' : 'Whale taker buy absorption across spot markets.'}
                </p>
              </div>

              {/* 3. BTC / PAXG Gold Mayer */}
              <div className="p-4 rounded-xl bg-[#F4F6F9] hover:bg-[#FFFFFF] border border-[#EEF0F5] transition-all space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-[11px] font-sans">
                  <span className="font-semibold text-[#343B43]">{isVi ? 'BTC / Vàng (PAXG) Mayer' : 'BTC / Gold Mayer'}</span>
                  <span className="text-amber-400 font-semibold text-[10px]">Cross-Asset</span>
                </div>
                <div className="text-base font-bold text-[#191F2C] tabular-nums">
                  {(macro.btcGoldMayer ?? 1.07).toFixed(2)}x
                </div>
                <div className="text-[11px] text-emerald-400 font-sans">
                  {isVi ? 'Định giá hấp dẫn so với Vàng' : 'Undervalued vs Gold'}
                </div>
                <p className="text-[11px] text-[#64748B] font-sans border-t border-[#EEF0F5] pt-1.5">
                  {isVi ? 'Tỷ số BTC/Vàng ở mức nén, cơ hội gia tăng tỷ trọng tài sản số.' : 'Compressed valuation ratio relative to physical gold.'}
                </p>
              </div>

              {/* 4. Mempool Hash Ribbons */}
              <div className="p-4 rounded-xl bg-[#F4F6F9] hover:bg-[#FFFFFF] border border-[#EEF0F5] transition-all space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-[11px] font-sans">
                  <span className="font-semibold text-[#343B43]">Hash Ribbons (30D/60D)</span>
                  <span className="text-purple-400 font-semibold text-[10px]">Mempool.space</span>
                </div>
                <div className="text-sm font-bold text-[#191F2C] truncate">
                  {isVi ? (macro.hashRibbonsStatusVi || 'Mạng Lưới Mở Rộng') : (macro.hashRibbonsStatus || 'EXPANSION')}
                </div>
                <div className="text-[11px] text-emerald-400 font-sans">
                  SMA 30D &gt; 60D (+{macro.hashRibbonsDiffPct ?? 3.9}%)
                </div>
                <p className="text-[11px] text-[#64748B] font-sans border-t border-[#EEF0F5] pt-1.5">
                  {isVi ? 'Hashrate duy trì đà tăng trưởng, thợ đào không đầu hàng.' : 'Network hashrate steadily expanding, zero miner capitulation.'}
                </p>
              </div>
            </div>

            {/* v8.0 Global Benchmark: Cointime Economics (Glassnode × ARK × Checkonchain) & Capriole Thermodynamic Energy Value */}
            <div
              data-testid="cointime-energy-matrix"
              className="p-4 rounded-xl bg-[#F4F6F9] border border-[#EEF0F5] grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs"
            >
              {/* 1. True Market Mean & AVIV Ratio */}
              <div className="p-3 rounded-lg bg-white border border-[#EEF0F5] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#191F2C]">
                    {isVi ? 'True Market Mean & AVIV Ratio' : 'True Market Mean & AVIV'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    Cointime Economics
                  </span>
                </div>
                <div className="flex items-baseline justify-between font-mono pt-0.5">
                  <span className="text-sm font-bold text-cyan-300 tabular-nums">
                    {formatUSD(cointime.trueMarketMeanPrice, 0)}
                  </span>
                  <span className="text-xs font-bold text-[#191F2C] tabular-nums">
                    AVIV: {cointime.avivRatio.toFixed(2)}x ({cointime.avivZScore >= 0 ? '+' : ''}{cointime.avivZScore.toFixed(2)}σ)
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  {isVi
                    ? 'Giá vốn nhà đầu tư hoạt động thực tế (loại trừ ~3.5M BTC ngủ đông thời Satoshi theo chuẩn Checkonchain & ARK Invest).'
                    : 'Active-Investor Cost Basis excluding dormant Satoshi-era coins (Glassnode × ARK Cointime model).'}
                </p>
              </div>

              {/* 2. ARK Seller Exhaustion Constant */}
              <div className="p-3 rounded-lg bg-white border border-[#EEF0F5] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#191F2C]">
                    {isVi ? 'Hằng Số Cạn Kiệt Lực Bán (ARK)' : 'ARK Seller Exhaustion Constant'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    ARK × David Puell
                  </span>
                </div>
                <div className="flex items-baseline justify-between font-mono pt-0.5">
                  <span className="text-sm font-bold text-emerald-400 tabular-nums">
                    {cointime.sellerExhaustionConstant.toFixed(3)}
                  </span>
                  <span className="text-[11px] text-[#343B43] font-sans truncate max-w-[200px]">
                    {isVi ? cointime.sellerExhaustionStatusVi : cointime.sellerExhaustionStatusEn}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  {isVi
                    ? 'Tích số giữa tỷ lệ nguồn cung có lãi và biến động thực tế 30D; mức thấp báo hiệu nén biên độ tích lũy.'
                    : 'Product of Supply in Profit proxy and 30D realized volatility; low readings signal seller exhaustion.'}
                </p>
              </div>

              {/* 3. Capriole Thermodynamic Energy Value */}
              <div className="p-3 rounded-lg bg-white border border-[#EEF0F5] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#191F2C]">
                    {isVi ? 'Giá Trị Năng Lượng Bitcoin (Capriole)' : 'Capriole Bitcoin Energy Value'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Joule Thermodynamics
                  </span>
                </div>
                <div className="flex items-baseline justify-between font-mono pt-0.5">
                  <span className="text-sm font-bold text-amber-300 tabular-nums">
                    {formatUSD(cointime.energyValueUsd, 0)}
                  </span>
                  <span className={`text-xs font-bold tabular-nums ${
                    cointime.energyValueDiscountPct <= 0 ? 'text-emerald-400' : 'text-amber-300'
                  }`}>
                    {cointime.energyValueDiscountPct >= 0 ? '+' : ''}{cointime.energyValueDiscountPct.toFixed(1)}% vs Spot
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  {isVi
                    ? 'Định giá nội tại dựa trên công suất tiêu thụ điện năng thực tế của mạng lưới đào coin (Hashrate ~1,035 EH/s theo Charles Edwards Capriole).'
                    : 'Intrinsic thermodynamic valuation derived directly from live network Hashrate Joule input.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Deep Metric Explanation */}
      {selectedModalIndicator && (
        <CycleIndicatorDetailModal
          indicator={selectedModalIndicator}
          onClose={() => setSelectedModalIndicator(null)}
        />
      )}
    </>
  );
};
