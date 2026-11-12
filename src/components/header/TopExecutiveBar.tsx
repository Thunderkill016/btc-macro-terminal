import React from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { formatUSD, formatVND } from '../../lib/formatters';
import {
  TrendingUp,
  TrendingDown,
  LineChart,
  PieChart,
  History,
  Zap,
  Compass,
  Lock,
  Search,
  Sparkles,
} from 'lucide-react';

const LivePriceDisplay: React.FC = React.memo(() => {
  const price = useTerminalStore((s) => s.ticker.price) || 75790;
  const change24h = useTerminalStore((s) => s.ticker.change24h) || 0;
  const priceDirection = useTerminalStore((s) => s.ticker.priceDirection);
  const priceVnd = useTerminalStore((s) => s.ticker.priceVnd) || 1959171508;
  const confluence = useTerminalStore((s) => s.confluenceResult);
  const liveCoinMetrics = useTerminalStore((s) => s.liveCoinMetrics);
  const locale = useTerminalStore((s) => s.locale);
  const isVi = locale === 'vi';
  const isUp = change24h >= 0;

  const score = confluence?.totalScore ?? 71;
  const mvrv = liveCoinMetrics?.mvrv ?? 1.39;

  let trafficStatus = {
    labelVi: 'VÙNG TÍCH LŨY ĐỊNH GIÁ',
    labelEn: 'ACCUMULATION REGIME',
    dotColor: 'bg-emerald-400',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };

  if (mvrv > 2.8 || score < 40) {
    trafficStatus = {
      labelVi: 'CẢNH BÁO RỦI RO ĐỈNH',
      labelEn: 'HIGH RISK / TOP',
      dotColor: 'bg-rose-400',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    };
  } else if (score < 60) {
    trafficStatus = {
      labelVi: 'VÙNG QUAN SÁT',
      labelEn: 'NEUTRAL HOLD',
      dotColor: 'bg-amber-400',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    };
  }

  const tickClass =
    priceDirection === 'up'
      ? 'price-tick-up'
      : priceDirection === 'down'
      ? 'price-tick-down'
      : '';

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="flex items-baseline gap-2">
        <span
          className={`text-2xl sm:text-[28px] font-bold text-[#F8FAFC] font-mono tracking-[-0.03em] tabular-nums transition-colors ${tickClass}`}
        >
          {formatUSD(price, 0)}
        </span>
        <div
          className={`flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
            isUp
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
          }`}
        >
          {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span className="tabular-nums">
            {isUp ? '+' : ''}
            {change24h.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Traffic Light Quick Risk Badge */}
      <div
        className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold tracking-wide shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] ${trafficStatus.badgeColor}`}
        title={isVi ? 'Đánh giá rủi ro tổng hợp đa chỉ số' : 'Multi-metric risk consensus'}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${trafficStatus.dotColor} animate-pulse`} />
        <span>{isVi ? trafficStatus.labelVi : trafficStatus.labelEn}</span>
      </div>

      <span className="text-xs text-[#64748B] hidden xl:inline-block font-mono tabular-nums">
        ≈ {formatVND(priceVnd)}
      </span>
    </div>
  );
});

export interface TopExecutiveBarProps {
  onSwitchToHorizon?: () => void;
}

export const TopExecutiveBar: React.FC<TopExecutiveBarProps> = ({ onSwitchToHorizon }) => {
  const locale = useTerminalStore((s) => s.locale);
  const setLocale = useTerminalStore((s) => s.setLocale);
  const activeTab = useTerminalStore((s) => s.activeTab);
  const setActiveTab = useTerminalStore((s) => s.setActiveTab);
  const binancePortfolio = useTerminalStore((s) => s.binancePortfolio);
  const vaultMeta = useTerminalStore((s) => s.vaultMeta);
  const isVaultLocked = useTerminalStore((s) => s.isVaultLocked);
  const setBinanceModalOpen = useTerminalStore((s) => s.setBinanceModalOpen);
  const setInstitutionalModalOpen = useTerminalStore((s) => s.setInstitutionalModalOpen);
  const setCommandPaletteOpen = useTerminalStore((s) => s.setCommandPaletteOpen);
  const confluence = useTerminalStore((s) => s.confluenceResult);
  const derivatives = useTerminalStore((s) => s.derivatives);
  const mempool = useTerminalStore((s) => s.mempool);

  const isVi = locale === 'vi';
  const isBinanceConnected = binancePortfolio?.connected === true || binancePortfolio?.source === 'api_live';

  return (
    <header className="sticky top-0 z-40 bg-[#05070B]/95 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Live Price */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.25),inset_0_1px_0_0_rgba(255,255,255,0.4)] shrink-0">
              ₿
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold tracking-wider text-[#F8FAFC] uppercase">
                  BITCOIN ALPHA
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono font-bold border border-emerald-500/30">
                  SPOT
                </span>
              </div>
              <div className="text-[11px] text-[#64748B] font-medium">
                {isVi ? 'Định Lượng Chu Kỳ Chuẩn Quốc Tế' : 'Institutional Cycle Intelligence'}
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-white/[0.06] hidden sm:block" />

          {/* Real Live Price Display */}
          <LivePriceDisplay />
        </div>

        {/* Center / Navigation Segmented Control (Linear × Fey Specular Pill Bar) */}
        <nav aria-label={isVi ? 'Điều hướng thẻ chức năng' : 'Terminal Navigation'} className="flex items-center gap-2 overflow-x-auto py-0.5">
          <div role="tablist" aria-orientation="horizontal" className="flex items-center bg-[#0A0E17] border border-white/[0.06] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] rounded-xl p-1 text-xs font-semibold">
            <button
              type="button"
              id="tab-valuation"
              role="tab"
              aria-selected={activeTab === 'valuation'}
              aria-controls="panel-valuation"
              data-testid="tab-valuation"
              onClick={() => setActiveTab('valuation')}
              className={`px-4 py-1.5 min-h-[38px] rounded-lg flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                activeTab === 'valuation'
                  ? 'bg-[#141C2E] text-[#F8FAFC] font-semibold border border-white/[0.12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_4px_12px_rgba(0,0,0,0.4)]'
                  : 'text-[#64748B] hover:text-[#CBD5E1]'
              }`}
            >
              <LineChart className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isVi ? 'Tín Hiệu & Chu Kỳ' : 'Signals & Cycle'}</span>
            </button>

            <button
              type="button"
              id="tab-portfolio"
              role="tab"
              aria-selected={activeTab === 'portfolio'}
              aria-controls="panel-portfolio"
              data-testid="tab-portfolio"
              onClick={() => setActiveTab('portfolio')}
              className={`px-4 py-1.5 min-h-[38px] rounded-lg flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                activeTab === 'portfolio'
                  ? 'bg-[#141C2E] text-[#F8FAFC] font-semibold border border-white/[0.12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_4px_12px_rgba(0,0,0,0.4)]'
                  : 'text-[#64748B] hover:text-[#CBD5E1]'
              }`}
            >
              <PieChart className="w-3.5 h-3.5 text-cyan-400" />
              <span className="flex items-center gap-1.5">
                <span>{isVi ? 'Danh Mục & Ví' : 'Portfolio & Wallet'}</span>
                {isBinanceConnected && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono font-bold uppercase tracking-wider">
                    Live
                  </span>
                )}
              </span>
            </button>

            <button
              type="button"
              id="tab-research"
              role="tab"
              aria-selected={activeTab === 'research'}
              aria-controls="panel-research"
              data-testid="tab-research"
              onClick={() => setActiveTab('research')}
              className={`px-4 py-1.5 min-h-[38px] rounded-lg flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                activeTab === 'research'
                  ? 'bg-[#141C2E] text-[#F8FAFC] font-semibold border border-white/[0.12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_4px_12px_rgba(0,0,0,0.4)]'
                  : 'text-[#64748B] hover:text-[#CBD5E1]'
              }`}
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>{isVi ? 'Kiểm Chứng & Vĩ Mô' : 'Research & News'}</span>
            </button>
          </div>
        </nav>

        {/* Right Controls: Command Palette, Methodology, Connect Binance & Language */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            data-testid="command-palette-trigger"
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-2 min-h-[38px] rounded-xl bg-[#0F1522] hover:bg-[#141C2E] border border-white/[0.06] hover:border-white/[0.12] text-[#CBD5E1] text-xs font-medium transition-all cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
            title={isVi ? 'Bảng điều khiển lệnh nhanh (Ctrl+K / ⌘K)' : 'Command Palette (Ctrl+K / ⌘K)'}
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline text-[#CBD5E1]">
              {isVi ? 'Tìm nhanh' : 'Search'}
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-[#64748B] bg-[#05070B] border border-white/[0.08] rounded">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => setInstitutionalModalOpen(true)}
            className="hidden xl:flex items-center gap-2 px-3.5 py-2 min-h-[38px] rounded-xl bg-[#0F1522] hover:bg-[#141C2E] border border-white/[0.06] hover:border-white/[0.12] text-[#CBD5E1] text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
            title={isVi ? 'Tìm hiểu phương pháp luận tín hiệu' : 'Learn institutional methodology'}
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isVi ? 'Mô Hình Thể Chế' : 'Methodology'}</span>
          </button>

          {isBinanceConnected ? (
            <button
              type="button"
              onClick={() => setActiveTab('portfolio')}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 min-h-[38px] rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all shadow-[inset_0_1px_0_0_rgba(16,185,129,0.2)] focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
              title={isVi ? 'Đã kết nối ví Binance - Nhấp để xem danh mục' : 'Binance Connected - Click to view portfolio'}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="tabular-nums font-mono">
                {(binancePortfolio?.wallets?.totalBtc ?? 0) > 0
                  ? `${binancePortfolio!.wallets.totalBtc.toFixed(8)} BTC`
                  : (binancePortfolio?.wallets?.totalDryPowderUsd ?? 0) >= 1.0
                  ? `$${binancePortfolio!.wallets.totalDryPowderUsd.toFixed(1)} USDT`
                  : isVi ? 'Ví Binance Live' : 'Binance Live'}
              </span>
            </button>
          ) : vaultMeta.hasVault && isVaultLocked ? (
            <button
              type="button"
              data-testid="unlock-vault-header-btn"
              onClick={() => setBinanceModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 min-h-[38px] rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shadow-lg shadow-amber-500/10 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none animate-pulse"
              title={isVi ? 'Ví Binance đã mã hóa trên máy - Nhập Passphrase để mở khóa' : 'Encrypted Binance Vault - Enter Passphrase to unlock'}
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>{isVi ? '🔒 Mở Khóa Ví' : '🔒 Unlock Vault'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setBinanceModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 min-h-[38px] rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isVi ? 'Đồng Bộ Binance' : 'Sync Binance'}</span>
            </button>
          )}

          {/* Stitch Horizon UI View Switcher Button */}
          {onSwitchToHorizon && (
            <button
              type="button"
              onClick={onSwitchToHorizon}
              className="flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md transition-all hover:scale-105 active:scale-95"
              title="Chuyển sang giao diện Stitch Horizon Pro"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Horizon UI</span>
            </button>
          )}

          {/* Geist / Linear Language Capsule */}
          <div className="flex items-center bg-[#0A0E17] border border-white/[0.06] rounded-xl p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLocale('vi')}
              aria-label="Chọn tiếng Việt"
              className={`px-2.5 py-1.5 min-h-[34px] rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                isVi ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-[#64748B] hover:text-[#CBD5E1]'
              }`}
            >
              🇻🇳 VI
            </button>
            <button
              type="button"
              onClick={() => setLocale('en')}
              aria-label="Select English"
              className={`px-2.5 py-1.5 min-h-[34px] rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                !isVi ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-[#64748B] hover:text-[#CBD5E1]'
              }`}
            >
              🇺🇸 EN
            </button>
          </div>
        </div>
      </div>

      {/* Velo × Fey Contextual Institutional Telemetry Strip (Displayed on Tab 2 & Tab 3 so Tab 1 stays 100% Zero-Duplication) */}
      {activeTab !== 'valuation' && (
        <div className="bg-[#070A10] border-t border-white/[0.05] px-4 sm:px-6 py-1.5 text-[11px] font-mono text-[#64748B]">
          <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[#CBD5E1] font-sans font-semibold">{isVi ? 'Hội Tụ Chu Kỳ:' : 'Cycle Score:'}</span>
                <strong className="text-emerald-400">{confluence?.totalScore ?? 71}/100</strong>
              </span>
              <span>•</span>
              <span>
                True Market Mean: <strong className="text-cyan-300">{formatUSD(confluence?.cointimeEconomics?.trueMarketMeanPrice || 68664, 0)}</strong>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">
                Capriole Energy: <strong className="text-amber-300">{formatUSD(confluence?.cointimeEconomics?.energyValueUsd || 87172, 0)}</strong>
              </span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">
                Deribit DVOL: <strong className="text-purple-300">{(derivatives?.dvolIndex ?? 39.5).toFixed(1)}%</strong>
              </span>
              <span className="hidden lg:inline">•</span>
              <span className="hidden lg:inline">
                Mempool: <strong className="text-emerald-300">{(mempool?.halfHourFee || 1.0).toFixed(1)} sat/vB</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('valuation')}
              className="text-cyan-400 hover:text-cyan-300 font-sans font-semibold transition-colors cursor-pointer"
            >
              {isVi ? '← Quay về Trạm Tín Hiệu & Biểu Đồ' : '← Back to Cycle Signals'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};