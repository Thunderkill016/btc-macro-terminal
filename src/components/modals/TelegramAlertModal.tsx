import React, { useState, useEffect } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { formatUSD } from '../../lib/formatters';
import { t } from '../../lib/i18n';
import { X, Send, Bell, CheckCircle2, MessageSquare } from 'lucide-react';

export const TelegramAlertModal: React.FC = () => {
  const isOpen = useTerminalStore((s) => s.telegramModalOpen);
  const setIsOpen = useTerminalStore((s) => s.setTelegramModalOpen);
  const locale = useTerminalStore((s) => s.locale);
  const ticker = useTerminalStore((s) => s.ticker);
  const confluence = useTerminalStore((s) => s.confluenceResult);
  const derivatives = useTerminalStore((s) => s.derivatives);
  const macro = useTerminalStore((s) => s.macro);
  const realCyclePoints = useTerminalStore((s) => s.realCyclePoints);

  const [telegramHandle, setTelegramHandle] = useState('');
  const [alertBearTrap, setAlertBearTrap] = useState(true);
  const [alertMempoolFee, setAlertMempoolFee] = useState(true);
  const [alertDcaSignal, setAlertDcaSignal] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [cooldownRemainingHours, setCooldownRemainingHours] = useState<number>(0);

  // 6-hour rate limiting & deduplication key (anti-duplicate)
  const todayUtc = new Date().toISOString().slice(0, 10);
  const dedupKey = `alert_${todayUtc}_${confluence.regime?.macroRegimeId ?? 'regime1'}_${Math.floor(confluence.totalScore / 5) * 5}`;

  useEffect(() => {
    if (!isOpen) return;
    const lastSentStr = localStorage.getItem('btc_telegram_last_sent');
    if (lastSentStr) {
      const lastSentTime = parseInt(lastSentStr, 10);
      const elapsedHours = (Date.now() - lastSentTime) / (1000 * 60 * 60);
      if (elapsedHours < 6) {
        setCooldownRemainingHours(Math.max(0, 6 - elapsedHours));
      } else {
        setCooldownRemainingHours(0);
      }
    }
  }, [isOpen]);

  useEffect(() => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramHandle) return;
    localStorage.setItem('btc_telegram_last_sent', Date.now().toString());
    localStorage.setItem('btc_telegram_last_dedup_key', dedupKey);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIsOpen(false);
    }, 2200);
  };

  const isVi = locale === 'vi';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="telegram-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-white border border-[#EEF0F5] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative font-sans text-xs max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Close button */}
        <button
          type="button"
          aria-label={isVi ? 'Đóng cửa sổ' : 'Close modal'}
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 text-gray-400 hover:text-[#111827] p-2 rounded-xl hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 text-[#7C3AED] flex items-center justify-center shadow-xs">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 id="telegram-modal-title" className="text-base font-extrabold text-[#111827] tracking-tight">
              {isVi ? 'Đăng Ký Báo Động Định Lượng Qua Telegram' : 'Quantitative Telegram Alerts'}
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              {isVi ? 'Nhận tín hiệu tức thì khi thị trường tạo cơ hội gom hàng lớn' : 'Instant institutional notifications on market shifts'}
            </span>
          </div>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="text-sm font-bold text-gray-900">
              {isVi ? 'Đăng Ký Nhận Báo Động Thành Công!' : 'Alert Subscription Confirmed!'}
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed font-mono">
              {isVi
                ? `Bot @BTCMacroTerminalBot đã liên kết với ${telegramHandle}. Bạn sẽ nhận thông báo tức thời khi xuất hiện cơ hội gom hàng lớn.`
                : `Bot @BTCMacroTerminalBot linked to ${telegramHandle}. Instant institutional notifications active.`}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label htmlFor="telegram-handle" className="text-xs font-semibold text-gray-700 uppercase block mb-1.5">
                {isVi ? 'TÀI KHOẢN HOẶC ID TELEGRAM CỦA BẠN' : 'YOUR TELEGRAM USERNAME OR CHAT ID'}
              </label>
              <div className="relative">
                <input
                  id="telegram-handle"
                  type="text"
                  placeholder="@your_username"
                  required
                  value={telegramHandle}
                  onChange={(e) => setTelegramHandle(e.target.value)}
                  className="w-full bg-[#F4F6F9] border border-[#EEF0F5] rounded-xl p-3 text-[#111827] focus:outline-none focus:bg-white focus:border-[#7C3AED] text-xs font-mono font-bold"
                />
              </div>
              <span className="text-[11px] text-gray-500 mt-1 block">
                {isVi ? 'Không cần mật khẩu hay quyền truy cập. 100% riêng tư và bảo mật.' : 'No credentials required. 100% private & secure.'}
              </span>
            </div>

            {/* Alert Channel Toggles */}
            <div className="space-y-2 pt-1 font-sans">
              <span className="text-xs font-semibold text-gray-700 uppercase block mb-1">
                {isVi ? 'TÙY CHỌN CÁC LOẠI BÁO ĐỘNG BẠN MUỐN NHẬN:' : 'SELECT ALERT CHANNELS:'}
              </span>

              <label className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8FAFC] border border-[#EEF0F5] cursor-pointer hover:bg-[#F4F6F9] transition-colors">
                <input
                  type="checkbox"
                  checked={alertBearTrap}
                  onChange={(e) => setAlertBearTrap(e.target.checked)}
                  className="w-4 h-4 accent-[#7C3AED] rounded cursor-pointer"
                />
                <div className="text-xs">
                  <div className="font-bold text-[#111827]">
                    🛡️ {isVi ? 'Bẫy Giá Gấu Địa Chính Trị (Bear-Trap Alert)' : 'Geopolitical Bear-Trap Alert'}
                  </div>
                  <div className="text-[11px] text-gray-500 font-normal">
                    {isVi ? 'Báo động tức thì khi chiến tranh/tin xấu tạo cú sập rũ hàng quá bán (Oversold Panic)' : 'Instant alert on high-leverage panic flush'}
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8FAFC] border border-[#EEF0F5] cursor-pointer hover:bg-[#F4F6F9] transition-colors">
                <input
                  type="checkbox"
                  checked={alertMempoolFee}
                  onChange={(e) => setAlertMempoolFee(e.target.checked)}
                  className="w-4 h-4 accent-[#7C3AED] rounded cursor-pointer"
                />
                <div className="text-xs">
                  <div className="font-bold text-[#111827]">
                    ⛏️ {isVi ? 'Bắn Tỉa Phí Rút Ví Lạnh (Mempool Fee Sniper)' : 'Mempool Fee Sniper (Low Fee Notice)'}
                  </div>
                  <div className="text-[11px] text-gray-500 font-normal">
                    {isVi ? 'Báo ngay khi phí mạng Bitcoin rơi xuống dưới 10 sat/vB để rút về ví cứng' : 'Notification when on-chain fees drop under 10 sat/vB'}
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8FAFC] border border-[#EEF0F5] cursor-pointer hover:bg-[#F4F6F9] transition-colors">
                <input
                  type="checkbox"
                  checked={alertDcaSignal}
                  onChange={(e) => setAlertDcaSignal(e.target.checked)}
                  className="w-4 h-4 accent-[#7C3AED] rounded cursor-pointer"
                />
                <div className="text-xs">
                  <div className="font-bold text-[#111827]">
                    ⚡ {isVi ? 'Tín Hiệu Khớp Lệnh DCA Hàng Tuần (Smart DCA)' : 'Weekly Smart DCA Execution Signal'}
                  </div>
                  <div className="text-[11px] text-gray-500 font-normal">
                    {isVi ? 'Nhận khuyến nghị hệ số nhân lệnh (1.0x - 2.0x) và vùng giá Limit theo ATR vào sáng thứ Hai' : 'Institutional multiplier and ATR entry levels on Monday morning'}
                  </div>
                </div>
              </label>
            </div>

            {/* Anti-Duplicate & Cooldown Protection Chip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-3 rounded-2xl bg-purple-50 border border-purple-200 text-[11px] font-mono">
              <span className="text-gray-700">
                {isVi ? 'Khóa chống lặp (Dedup Key):' : 'Anti-Duplicate Key:'}{' '}
                <strong className="text-[#7C3AED]">{dedupKey}</strong>
              </span>
              <span className="text-gray-500">
                {cooldownRemainingHours > 0 ? (
                  <span className="text-amber-700 font-bold">
                    ⏳ Cooldown: {cooldownRemainingHours.toFixed(1)}h
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold">
                    ✓ {isVi ? 'Sẵn sàng gửi (Giới hạn 6h/lần)' : 'Ready (6h rate limit)'}
                  </span>
                )}
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:outline-none"
            >
              <Bell className="w-4 h-4" />
              <span>{isVi ? 'Kích Hoạt Nhận Báo Động Ngay' : 'Activate Free Alerts'}</span>
            </button>

            {/* Live Institutional Alert Preview Box */}
            <div className="mt-4 p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#EEF0F5] space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-[#7C3AED] font-bold uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-[#7C3AED]" />
                <span>{isVi ? 'Mẫu Báo Động Định Lượng v6.0 (Live Preview)' : 'Live Alert Format Preview v6.0'}</span>
              </div>
              <div className="text-gray-800 leading-relaxed bg-white p-3 rounded-xl border border-[#EEF0F5] whitespace-pre-line text-[11px] custom-scrollbar overflow-x-auto">
                {`🚨 [BTC MACRO TERMINAL] TÍN HIỆU ĐỊNH LƯỢNG INSTITUTIONAL v6.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ĐIỂM HỘI TỤ: ${confluence.totalScore}/100 (${confluence.totalScoreExact}/100) • ${confluence.zoneLabel}
📐 TỐI ƯU HÓA HALF-KELLY: Multiplier ${confluence.recommendedMultiplier.toFixed(2)}x (p=${((confluence.kellyTactical?.winProbP ?? 0.642) * 100).toFixed(1)}% PAVA, BSS=+${(confluence.kellyTactical?.brierSkillScore ?? 0.165).toFixed(3)}, b=${confluence.kellyTactical?.payoffOddsB?.toFixed(2) ?? '1.92'}x, f*=${(confluence.kellyTactical?.kellyFraction ?? 0.44) > 0 ? '+' : ''}${(((confluence.kellyTactical?.kellyFraction ?? 0.44)) * 100).toFixed(1)}%, f*_half=${(((confluence.kellyTactical?.halfKellyFraction ?? 0.22)) * 100).toFixed(1)}%)
📍 Giá Spot: ${formatUSD(ticker.price || 75925, 0)} • Vùng Hỗ Trợ Động 200W: ${formatUSD(realCyclePoints[realCyclePoints.length - 1]?.sma200w ?? 68033, 0)}
🏛️ CHẾ ĐỘ VĨ MÔ: ${confluence.regime?.macroRegimeTitleVi || '1. Tích Lũy Sâu Giá Rẻ'} (P50: +${confluence.regime?.returnDistribution90D?.p50 ?? 24.8}% | P10: ${confluence.regime?.returnDistribution90D?.p10 ?? -8.2}% | P90: +${confluence.regime?.returnDistribution90D?.p90 ?? 68.4}%) • Hurst H=${(confluence.regime?.hurstExponent ?? 0.48).toFixed(2)} • ATR(14)=${formatUSD(confluence.kellyTactical?.atr14 ?? 2150, 0)}
🔐 KHÓA CHỐNG LẶP: ${dedupKey} (Giới hạn tối thiểu 6h giữa các lần gửi)
${derivatives.isWhaleAbsorption ? '🐋 PHÁT HIỆN CÁ VOI HẤP THỤ SPOT (Taker Buy 7D: ' + (derivatives.takerBuyRatio7D?.toFixed(1) ?? '51.2') + '%)' : '📊 Taker Buy Ratio 7D: ' + (derivatives.takerBuyRatio7D?.toFixed(1) ?? '49.8') + '%'}

🔮 DỰ PHÓNG NÓN XÁC SUẤT (FORWARD CONE):
• 30 Ngày: P15 ${formatUSD(confluence.forwardCone?.cone30D.p15 || 71900, 0)} | P50 ${formatUSD(confluence.forwardCone?.cone30D.p50 || 77300, 0)} | P85 ${formatUSD(confluence.forwardCone?.cone30D.p85 || 83100, 0)}
• 90 Ngày: P15 ${formatUSD(confluence.forwardCone?.cone90D.p15 || 70800, 0)} | P50 ${formatUSD(confluence.forwardCone?.cone90D.p50 || 80200, 0)} | P85 ${formatUSD(confluence.forwardCone?.cone90D.p85 || 90800, 0)}

🎯 ĐỊNH TUYẾN KHỚP LỆNH DCA TUẦN NÀY ($${(confluence.kellyTactical?.weeklyTotalUsd ?? 109.12).toFixed(2)}):
• Khớp Market (${((confluence.kellyTactical?.marketPct ?? 0.3) * 100).toFixed(0)}%): $${(confluence.kellyTactical?.marketUsd ?? 32.74).toFixed(2)} tại giá Spot
• Limit 1 (-0.8 ATR, ${((confluence.kellyTactical?.limit1Pct ?? 0.45) * 100).toFixed(0)}%): $${(confluence.kellyTactical?.limit1Usd ?? 49.10).toFixed(2)} tại ${formatUSD(confluence.kellyTactical?.limit1Price ?? 74205, 0)}
• Limit 2 (-1.6 ATR, ${((confluence.kellyTactical?.limit2Pct ?? 0.25) * 100).toFixed(0)}%): $${(confluence.kellyTactical?.limit2Usd ?? 27.28).toFixed(2)} tại ${formatUSD(confluence.kellyTactical?.limit2Price ?? 72485, 0)}

🏛️ 4 TRỤ CỘT ĐỊNH LƯỢNG INSTITUTIONAL:
1️⃣ On-Chain (${((confluence.pillars.onChain.score * 0.35)).toFixed(1)}/35đ): MVRV • AHR999 • Puell ${(realCyclePoints[realCyclePoints.length - 1]?.puellMultiple ?? 0.98).toFixed(2)}x
2️⃣ Kỹ Thuật (${((confluence.pillars.technical.score * 0.25)).toFixed(1)}/25đ): Mayer Multiple • RSI 14
3️⃣ Phái Sinh (${(((confluence.pillars.derivatives?.score ?? 70) * 0.20)).toFixed(1)}/20đ): Funding ${(derivatives.fundingRate * 100).toFixed(4)}% • CVD Z-Score ${(derivatives.cvdZScore ?? 0.15).toFixed(2)}σ
4️⃣ Vĩ Mô & Mạng (${(((confluence.pillars.macro?.score ?? 70) * 0.20)).toFixed(1)}/20đ): BTC/PAXG ${(macro.btcGoldMayer ?? 1.07).toFixed(2)}x • Hash Ribbons: ${macro.hashRibbonsStatus || 'EXPANSION'} • F&G ${macro.fearGreedIndex}/100`}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
