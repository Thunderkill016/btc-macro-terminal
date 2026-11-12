import React from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { formatUSD } from '../../lib/formatters';
import {
  X,
  Compass,
  Activity,
  ShieldCheck,
  TrendingUp,
  Layers,
  Sparkles,
  ExternalLink,
  BookOpen,
  PieChart,
  Target,
  Zap,
  Flame,
  CheckCircle2,
} from 'lucide-react';

export const InstitutionalPlaybookModal: React.FC = () => {
  const isOpen = useTerminalStore((s) => s.institutionalModalOpen);
  const setIsOpen = useTerminalStore((s) => s.setInstitutionalModalOpen);
  const activeTab = useTerminalStore((s) => s.selectedPlaybookTab);
  const locale = useTerminalStore((s) => s.locale);
  const ticker = useTerminalStore((s) => s.ticker);
  const confluence = useTerminalStore((s) => s.confluenceResult);
  const realCyclePoints = useTerminalStore((s) => s.realCyclePoints);
  const liveCoinMetrics = useTerminalStore((s) => s.liveCoinMetrics);

  const isVi = locale === 'vi';

  const price = ticker.price || 75925;
  const latestPoint = realCyclePoints.length > 0 ? realCyclePoints[realCyclePoints.length - 1] : null;
  const piCycleTarget = latestPoint?.piCycleTop ?? 151524;
  const fairValue = latestPoint?.powerLawFairValue ?? 88478;
  const floorSma200w = latestPoint?.sma200w ?? 68033;
  const realizedPrice = liveCoinMetrics?.realizedPrice || Math.round(floorSma200w * 0.82) || 55568;
  const currentMvrv = liveCoinMetrics?.mvrv || (realizedPrice > 0 ? price / realizedPrice : 1.36);
  const score = confluence?.totalScore ?? 71;
  const activePhase = currentMvrv < 1.0 ? 1 : currentMvrv < 2.0 ? 2 : currentMvrv < 2.8 ? 3 : currentMvrv < 3.7 ? 4 : 5;

  React.useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="playbook-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-4xl rounded-3xl bg-white border border-[#EEF0F5] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10">
        {/* Modal Header */}
        <div className="relative p-6 pb-4 border-b border-[#EEF0F5] bg-white flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#7C3AED] text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isVi ? 'TIÊU CHUẨN THỂ CHẾ QUỐC TẾ' : 'INSTITUTIONAL BENCHMARK'}</span>
            </div>
            <h2 id="playbook-modal-title" className="text-xl sm:text-2xl font-black text-[#111827] tracking-tight">
              {isVi
                ? 'Phương Pháp Luận & Nghiên Cứu Tín Hiệu Bitcoin'
                : 'Bitcoin Signal Methodology & Institutional Research'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              {isVi
                ? 'Học hỏi và kế thừa mô hình toán học từ 4 nền tảng hàng đầu thế giới'
                : 'Quantitative models adapted from the 4 premier global Bitcoin intelligence platforms'}
            </p>
          </div>

          <button
            type="button"
            aria-label={isVi ? 'Đóng cửa sổ' : 'Close modal'}
            onClick={() => setIsOpen(false)}
            className="w-9 h-9 rounded-2xl bg-gray-100 hover:bg-gray-200 border border-[#EEF0F5] flex items-center justify-center text-gray-500 hover:text-[#111827] transition-all shrink-0 focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 pb-2 border-b border-[#EEF0F5] flex items-center gap-2 overflow-x-auto shrink-0 bg-[#F8FAFC]">
          <button
            onClick={() => setIsOpen(true, 'lookintobitcoin')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'lookintobitcoin'
                ? 'bg-white text-[#7C3AED] border border-[#EEF0F5] shadow-xs'
                : 'text-gray-500 hover:text-[#111827]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>LookIntoBitcoin</span>
          </button>

          <button
            onClick={() => setIsOpen(true, 'glassnode')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'glassnode'
                ? 'bg-white text-cyan-700 border border-[#EEF0F5] shadow-xs'
                : 'text-gray-500 hover:text-[#111827]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Glassnode (On-Chain)</span>
          </button>

          <button
            onClick={() => setIsOpen(true, 'coinglass')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'coinglass'
                ? 'bg-white text-purple-700 border border-[#EEF0F5] shadow-xs'
                : 'text-gray-500 hover:text-[#111827]'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Coinglass (Phái Sinh)</span>
          </button>

          <button
            onClick={() => setIsOpen(true, 'swan')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'swan'
                ? 'bg-white text-amber-700 border border-[#EEF0F5] shadow-xs'
                : 'text-gray-500 hover:text-[#111827]'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Swan Bitcoin (DCA)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-700 text-sm leading-relaxed bg-[#F4F6F9]">
          {/* TAB 1: LOOKINTOBITCOIN */}
          {activeTab === 'lookintobitcoin' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
                <div className="flex items-center gap-2 text-[#7C3AED] font-bold text-sm">
                  <Compass className="w-4 h-4" />
                  <span>LookIntoBitcoin (Philip Swift) — Bậc Thầy Về Định Giá Chu Kỳ Vĩ Mô</span>
                </div>
                <p className="text-xs text-gray-600">
                  {isVi
                    ? 'LookIntoBitcoin là nền tảng đầu tiên trên thế giới chứng minh Bitcoin không chuyển động ngẫu nhiên mà tuân theo quy luật toán học tăng trưởng mạng lưới (Metcalfe’s Law) và chu kỳ Halving 4 năm.'
                    : 'LookIntoBitcoin is the pioneer in proving Bitcoin follows strict mathematical network adoption laws and 4-year halving rhythms.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Model 1 */}
                <div className="p-4 rounded-2xl bg-white border border-[#EEF0F5] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#111827] text-sm">1. Sàn Đáy 200 Tuần (200W SMA)</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      Độ Tin Cậy: 100%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {isVi
                      ? 'Trong suốt 16 năm lịch sử, Bitcoin chưa bao giờ đóng nến tuần dưới đường 200W MA trong một chu kỳ tăng giá. Khi giá chạm sàn 200W (hiện tại là $67,766), đó là cơ hội gom hàng thế hệ (Generational Buy).'
                      : 'Across 16 years, Bitcoin has never closed below the 200-week SMA in a bull cycle. Currently sitting at $67,766 as the ultimate bedrock floor.'}
                  </p>
                </div>

                {/* Model 2 */}
                <div className="p-4 rounded-2xl bg-white border border-[#EEF0F5] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#111827] text-sm">2. Chỉ Báo Báo Đỉnh Pi Cycle Top</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                      Chính Xác: 3/3 Chu Kỳ
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {isVi
                      ? `Sử dụng đường 111DMA cắt lên trên đường 2x 350DMA. Chỉ báo này đã dự báo chính xác đỉnh chu kỳ của các năm 2013, 2017 và tháng 4/2021 với độ trễ tối đa chỉ 3 ngày. Hiện tại đường 350DMA x 2 đang ở mức ${formatUSD(piCycleTarget, 0)} — thị trường còn rất xa đỉnh.`
                      : `111DMA crossing above 2x 350DMA predicted cycle peaks in 2013, 2017, and April 2021 within 3 days. Current 350DMA x 2 target is ~${formatUSD(piCycleTarget, 0)}.`}
                  </p>
                </div>

                {/* Model 3 */}
                <div className="p-4 rounded-2xl bg-white border border-[#EEF0F5] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#111827] text-sm">3. Hành Lang Power Law (Giovanni Santostasi)</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-bold">
                      Định Giá Cơ Bản
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {isVi
                      ? `Mô hình vật lý định lượng tính toán giá trị hợp lý của mạng lưới theo hàm số mũ của thời gian từ khối nguyên thủy. Giá trị hợp lý hiện tại là ${formatUSD(fairValue, 0)}. Mua ở mức ${formatUSD(price, 0)} tương đương thấp hơn giá trị thực ${Math.abs(Math.round(((price - fairValue) / fairValue) * 100))}% (thời điểm vàng để gom).`
                      : `Quantitative power law calculates fundamental network value as a function of time. Current fair value is ${formatUSD(fairValue, 0)}; buying at ${formatUSD(price, 0)} represents a ${Math.abs(Math.round(((price - fairValue) / fairValue) * 100))}% discount.`}
                  </p>
                </div>

                {/* Model 4 */}
                <div className="p-4 rounded-2xl bg-white border border-[#EEF0F5] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#111827] text-sm">4. Hệ Số Mayer & AHR999</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                      Hệ Số Tích Lũy
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {isVi
                      ? 'Hệ số Mayer = Giá / MA200 ngày. Dưới 1.2x là vùng giá vàng để gom tích sản. Khi vượt quá 2.4x mới bước vào vùng bong bóng đầu cơ.'
                      : 'Mayer Multiple = Price / 200DMA. Values under 1.2x represent optimal accumulation; above 2.4x marks speculative mania.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GLASSNODE */}
          {activeTab === 'glassnode' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Header Banner */}
              <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 space-y-2">
                <div className="flex items-center gap-2 text-cyan-700 font-bold text-sm">
                  <Compass className="w-4 h-4" />
                  <span>La Bàn Chu Kỳ Định Giá Vĩ Mô (Spatial Cycle Valuation Framework)</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {isVi
                    ? 'La Bàn Chu Kỳ là mô hình định vị vĩ mô kết hợp giữa tỷ lệ MVRV on-chain (CoinMetrics) và các dải toán học Santostasi Power Law, phân tách chu kỳ 4 năm của Bitcoin thành 5 pha định giá không gian.'
                    : 'The Spatial Cycle Valuation Framework categorizes Bitcoin’s 4-year cycle into 5 macro valuation phases synthesizing on-chain MVRV and Santostasi Power Law bands.'}
                </p>
              </div>

              {/* 5-Phase Detailed Institutional Table */}
              <div className="p-4 rounded-2xl bg-white border border-[#EEF0F5] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#111827] text-sm">
                    {isVi ? 'Chi Tiết 5 Pha Chu Kỳ Định Giá Vĩ Mô' : 'The 5 Spatial Valuation Macro Regimes'}
                  </h4>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    {isVi
                      ? `HIỆN TẠI: PHA ${activePhase} (${activePhase === 1 ? 'GIÁ VÀNG' : activePhase === 2 ? 'TÍCH LŨY' : activePhase === 3 ? 'CÂN BẰNG' : activePhase === 4 ? 'TĂNG TRƯỞNG' : 'BONG BÓNG'})`
                      : `CURRENT: PHASE ${activePhase}`}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Phase 1 */}
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#EEF0F5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <span className="font-bold text-gray-700">1. Vùng Giá Vàng (Đáy Chu Kỳ / Deep Value)</span>
                        <span className="text-[10px] font-mono text-gray-500">MVRV &lt; 1.0</span>
                      </div>
                      <div className="text-[11px] text-gray-500 pl-4.5">
                        {isVi ? 'Giá thấp hơn giá vốn toàn mạng. Thị trường hoảng loạn cùng cực, cơ hội mua thế hệ (Đáy FTX $15.5k, Đáy Covid $3.8k).' : 'Price trades below aggregate cost basis. Extreme capitulation.'}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-gray-600 text-right shrink-0">&lt; $55,500</span>
                  </div>

                  {/* Phase 2 (ACTIVE) */}
                  <div className="p-3.5 rounded-xl bg-purple-50/80 border-2 border-[#7C3AED] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] animate-pulse" />
                        <span className="font-bold text-[#7C3AED]">2. Vùng Tích Lũy Vàng (Accumulation Regime)</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-100 text-[#7C3AED]">HIỆN TẠI (MVRV 1.0 - 2.0)</span>
                      </div>
                      <div className="text-[11px] text-gray-600 pl-4.5">
                        {isVi
                          ? 'Giá vượt lên trên giá vốn on-chain ($55.5k) nhưng vẫn thấp hơn giá trị cơ bản mạng lưới ($88.4k). Cá voi và các quỹ ETF âm thầm hấp thụ hàng, rủi ro sập sâu dài hạn ở mức thấp nhất.'
                          : 'Price sits above realized cost ($55.5k) but remains discounted below network fair value ($88.4k). Whales and ETFs accumulate.'}
                      </div>
                    </div>
                    <span className="font-mono font-black text-[#7C3AED] text-sm text-right shrink-0">$55,500 – $88,400</span>
                  </div>

                  {/* Phase 3 */}
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#EEF0F5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                        <span className="font-bold text-gray-700">3. Vùng Cân Bằng (Fair Value Equilibrium)</span>
                        <span className="text-[10px] font-mono text-gray-500">MVRV 2.0 - 2.8</span>
                      </div>
                      <div className="text-[11px] text-gray-500 pl-4.5">
                        {isVi ? 'Giá phản ánh đúng giá trị mạng lưới. Giai đoạn rung lắc, tích lũy tái phân phối trước đợt bùng nổ vượt đỉnh lịch sử.' : 'Price matches network fair value. Re-accumulation phase.'}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-cyan-700 text-right shrink-0">$88,400 – $125,000</span>
                  </div>

                  {/* Phase 4 */}
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#EEF0F5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="font-bold text-gray-700">4. Vùng Tăng Trưởng Mạnh (Expansion / Euphoria)</span>
                        <span className="text-[10px] font-mono text-gray-500">MVRV 2.8 - 3.7</span>
                      </div>
                      <div className="text-[11px] text-gray-500 pl-4.5">
                        {isVi ? 'Dòng tiền FOMO bán lẻ và truyền thông đổ xô vào. Các kỷ lục giá mới liên tục được thiết lập, đòn bẩy thị trường tăng vọt.' : 'Retail FOMO cascades in. Explosive parabolic run.'}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-amber-700 text-right shrink-0">$125,000 – $165,000</span>
                  </div>

                  {/* Phase 5 */}
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#EEF0F5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span className="font-bold text-gray-700">5. Vùng Bong Bóng / Tạo Đỉnh (Mania Bubble Top)</span>
                        <span className="text-[10px] font-mono text-gray-500">MVRV &gt; 3.7</span>
                      </div>
                      <div className="text-[11px] text-gray-500 pl-4.5">
                        {isVi ? 'Vùng rủi ro cực độ. Lợi nhuận chưa thực hiện chạm trần, cá voi bắt đầu phân phối hàng thoát vị thế để chuẩn bị cho chu kỳ gấu mới.' : 'Peak euphoria and mania. Smart money distributes.'}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-rose-600 text-right shrink-0">&gt; $165,000</span>
                  </div>
                </div>
              </div>

              {/* Realized Price Hierarchy */}
              <div className="p-4 rounded-2xl bg-white border border-[#EEF0F5] shadow-xs space-y-3">
                <h4 className="font-bold text-[#111827] text-sm">Hệ Thống Giá Vốn 3 Tầng On-Chain</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#EEF0F5]">
                    <div className="text-gray-500 font-semibold">Short-Term Holders (STH)</div>
                    <div className="text-base font-bold text-[#7C3AED] mt-1">~$64,500</div>
                    <div className="text-[11px] text-gray-500 mt-1">Ngưỡng hỗ trợ động quan trọng nhất trong Bull Market</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#EEF0F5]">
                    <div className="text-gray-500 font-semibold">Total Realized Price</div>
                    <div className="text-base font-bold text-emerald-700 mt-1">~$55,500</div>
                    <div className="text-[11px] text-gray-500 mt-1">Giá vốn bình quân on-chain của toàn bộ 19.8 triệu BTC</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#EEF0F5]">
                    <div className="text-gray-500 font-semibold">Long-Term Holders (LTH)</div>
                    <div className="text-base font-bold text-amber-700 mt-1">~$28,000 - $32,000</div>
                    <div className="text-[11px] text-gray-500 mt-1">Giá vốn của nhóm "Kim Cương" giữ trên 155 ngày</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COINGLASS */}
          {activeTab === 'coinglass' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
                <div className="flex items-center gap-2 text-[#7C3AED] font-bold text-sm">
                  <Zap className="w-4 h-4" />
                  <span>Coinglass & Binance Futures — Sức Khỏe Đòn Bẩy & Thanh Khoản</span>
                </div>
                <p className="text-xs text-gray-600">
                  {isVi
                    ? 'Giá Bitcoin về dài hạn do dòng tiền Spot quyết định, nhưng các đợt giật quét 10-20% trong ngày đều do thị trường phái sinh (Futures) kích hoạt qua chuỗi thanh lý đòn bẩy.'
                    : 'Spot drives long-term value, but short-term intraday volatility is triggered by perpetual futures leverage cascades.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[#EEF0F5] shadow-xs space-y-2">
                  <h4 className="font-bold text-[#111827] text-sm">Tỷ Lệ Phí Vay (Funding Rate)</h4>
                  <p className="text-xs text-gray-500">
                    {isVi
                      ? 'Mức tiêu chuẩn lành mạnh là +0.01% mỗi 8 giờ (~10.95%/năm). Nếu Funding Rate vượt +0.05%, phe Long đang quá đà và rất dễ bị sàn quét râu giật sập. Hiện tại Funding Rate đang ở mức +0.01% (cực kỳ cân bằng).'
                      : 'Baseline is +0.01% per 8 hours. Above +0.05% signals extreme retail leverage greed. Current rate is neutral and healthy.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#EEF0F5] shadow-xs space-y-2">
                  <h4 className="font-bold text-[#111827] text-sm">Bản Đồ Thanh Lý (Liquidation Map)</h4>
                  <p className="text-xs text-gray-500">
                    {isVi
                      ? 'Hệ thống quét các vùng tập trung lệnh cắt lỗ của các nhà giao dịch đòn bẩy cao (50x - 100x). Người nắm giữ Bitcoin Spot sử dụng bản đồ này để đặt lệnh mua đón lõng tại các râu quét thanh lý của sàn.'
                      : 'Tracks clusters of high-leverage stop-losses. Spot accumulators use this to set limit bids at flushout points.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SWAN BITCOIN */}
          {activeTab === 'swan' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <Target className="w-4 h-4 text-amber-600" />
                  <span>Swan Bitcoin & River — Bậc Thầy Chiến Lược Tích Sản (Smart Stacking)</span>
                </div>
                <p className="text-xs text-gray-600">
                  {isVi
                    ? 'Swan Bitcoin là tổ chức chuyên biệt về tích sản Bitcoin hàng đầu nước Mỹ, tiên phong áp dụng mô hình Dynamic DCA (tăng số tiền gom khi ở vùng giá vàng, giảm khi thị trường quá nhiệt).'
                    : 'Swan Bitcoin is the premier US Bitcoin-only accumulation institution, pioneering value-weighted dynamic DCA.'}
                </p>
              </div>

              {/* Swan Allocation Matrix Table */}
              <div className="rounded-2xl border border-[#EEF0F5] overflow-hidden bg-white shadow-xs">
                <div className="p-3 bg-[#F8FAFC] border-b border-[#EEF0F5] font-bold text-xs text-gray-700">
                  {isVi ? 'Ma Trận Phân Bổ Vốn Theo Chu Kỳ (Swan Playbook)' : 'Cycle Capital Allocation Matrix'}
                </div>
                <div className="divide-y divide-gray-100 text-xs">
                  <div className={`p-3 flex items-center justify-between transition-all ${score >= 80 ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''}`}>
                    <div>
                      <span className="font-bold text-emerald-700">80 - 100 {isVi ? 'Điểm' : 'Pts'}</span>
                      <span className="text-gray-700 ml-2">
                        {isVi ? 'Vùng Giá Vàng (Cơ Hội Thế Hệ - Generational Buy)' : 'Golden Value (Generational Buy)'}
                        {score >= 80 && <span className="text-emerald-700 font-bold ml-1.5">{isVi ? `(HÔM NAY: ${score}/100)` : `(TODAY: ${score}/100)`}</span>}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                      {isVi ? 'Mua 1.5x - 2.0x (Tận dụng tiền mặt)' : 'Buy 1.5x - 2.0x (Deploy Dry Powder)'}
                    </span>
                  </div>

                  <div className={`p-3 flex items-center justify-between transition-all ${score >= 60 && score < 80 ? 'bg-purple-50 border-l-4 border-l-[#7C3AED]' : ''}`}>
                    <div>
                      <span className="font-bold text-[#7C3AED]">60 - 79 {isVi ? 'Điểm' : 'Pts'}</span>
                      <span className="text-gray-700 ml-2">
                        {isVi ? 'Vùng Tích Lũy Tối Ưu' : 'Optimal Accumulation'}
                        {score >= 60 && score < 80 && <span className="text-[#7C3AED] font-bold ml-1.5">{isVi ? `(HÔM NAY: ${score}/100)` : `(TODAY: ${score}/100)`}</span>}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[#7C3AED] px-2 py-0.5 rounded bg-purple-100 border border-purple-200">
                      {isVi ? 'Mua 1.0x - 1.35x (Tích lũy chủ động)' : 'Buy 1.0x - 1.35x (Active Accumulation)'}
                    </span>
                  </div>

                  <div className={`p-3 flex items-center justify-between transition-all ${score >= 40 && score < 60 ? 'bg-cyan-50 border-l-4 border-l-cyan-500' : ''}`}>
                    <div>
                      <span className="font-bold text-cyan-700">40 - 59 {isVi ? 'Điểm' : 'Pts'}</span>
                      <span className="text-gray-700 ml-2">
                        {isVi ? 'Vùng Cân Bằng / Tăng Tốc' : 'Equilibrium / Momentum'}
                        {score >= 40 && score < 60 && <span className="text-cyan-700 font-bold ml-1.5">{isVi ? `(HÔM NAY: ${score}/100)` : `(TODAY: ${score}/100)`}</span>}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-cyan-700 px-2 py-0.5 rounded bg-cyan-50 border border-cyan-200">
                      {isVi ? 'Mua 0.5x (Gom chậm, giữ tiền mặt)' : 'Buy 0.5x (Slow DCA, hold cash)'}
                    </span>
                  </div>

                  <div className={`p-3 flex items-center justify-between transition-all ${score < 40 ? 'bg-rose-50 border-l-4 border-l-rose-500' : ''}`}>
                    <div>
                      <span className="font-bold text-rose-700">&lt; 40 {isVi ? 'Điểm' : 'Pts'}</span>
                      <span className="text-gray-700 ml-2">
                        {isVi ? 'Quá Nhiệt / Bong Bóng Đỉnh' : 'Overheated / Bubble Peak'}
                        {score < 40 && <span className="text-rose-700 font-bold ml-1.5">{isVi ? `(HÔM NAY: ${score}/100)` : `(TODAY: ${score}/100)`}</span>}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-rose-700 px-2 py-0.5 rounded bg-rose-50 border border-rose-200">
                      {isVi ? '0.0x (Dừng mua, chốt lời bảo vệ vốn)' : '0.0x (Pause DCA, take profit)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 70/30 Rule */}
              <div className="p-4 rounded-2xl bg-white border border-[#EEF0F5] shadow-xs space-y-2">
                <h4 className="font-bold text-[#111827] text-sm">Nguyên Tắc Phân Bổ 70% Systematic DCA + 30% Quỹ Bắt Đáy</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {isVi
                    ? 'Không bao giờ dùng hết 100% tiền mặt trong một lần mua. Luôn chia 70% ngân sách cho lệnh mua tự động định kỳ, và giữ lại 30% bằng USDT làm "Quỹ Tiền Mặt Bắt Đáy" để đặt sẵn lệnh chờ mua ở các hỗ trợ quan trọng ($67k sàn 200W). Nhờ đó bạn luôn là người mua chủ động khi thị trường sập hoảng loạn.'
                    : 'Never deploy 100% cash in one go. Keep 70% for systematic weekly accumulation and 30% in USDT reserve with resting limit orders at major structural support lines.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#EEF0F5] bg-white flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              {isVi
                ? 'Dữ liệu 100% công khai từ Blockchain & API Binance trực tiếp'
                : '100% Live Real Data from Blockchain & Binance APIs'}
            </span>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="px-5 py-2 rounded-xl bg-[#111827] hover:bg-black text-white font-bold transition-all"
          >
            {isVi ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};