import React from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { formatUSD } from '../../lib/formatters';
import {
  TrendingUp,
  TrendingDown,
  LineChart,
  PieChart,
  History,
  Zap,
  Search,
  Lock,
} from 'lucide-react';

const LivePriceDisplay: React.FC = React.memo(() => {
  const price = useTerminalStore((s) => s.ticker.price) || 75790;
  const change24h = useTerminalStore((s) => s.ticker.change24h) || 0;
  const priceDirection = useTerminalStore((s) => s.ticker.priceDirection);
  const isUp = change24h >= 0;

  const tickClass =
    priceDirection === 'up'
      ? 'price-tick-up'
      : priceDirection === 'down'
      ? 'price-tick-down'
      : '';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#64748B] font-medium hidden xl:inline">BTC/USD:</span>
      <span
        className={`text-base sm:text-lg font-bold text-[#191F2C] font-mono tracking-tight tabular-nums transition-colors ${tickClass}`}
      >
        {formatUSD(price, 0)}
      </span>
      <div
        className={`flex items-center gap-0.5 text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
          isUp
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-rose-50 text-rose-700'
        }`}
      >
        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span className="tabular-nums">
          {isUp ? '+' : ''}
          {change24h.toFixed(2)}%
        </span>
      </div>
    </div>
  );
});

export const TopExecutiveBar: React.FC = () => {
  const locale = useTerminalStore((s) => s.locale);
  const setLocale = useTerminalStore((s) => s.setLocale);
  const activeTab = useTerminalStore((s) => s.activeTab);
  const setActiveTab = useTerminalStore((s) => s.setActiveTab);
  const binancePortfolio = useTerminalStore((s) => s.binancePortfolio);
  const vaultMeta = useTerminalStore((s) => s.vaultMeta);
  const isVaultLocked = useTerminalStore((s) => s.isVaultLocked);
  const setBinanceModalOpen = useTerminalStore((s) => s.setBinanceModalOpen);
  const setCommandPaletteOpen = useTerminalStore((s) => s.setCommandPaletteOpen);
  const isVi = locale === 'vi';
  const isBinanceConnected = binancePortfolio?.connected === true || binancePortfolio?.source === 'api_live';

  return (
    <nav className="w-full bg-white border-b border-[#E1E3E3] sticky top-0 z-50">
      <div className="max-w-[1140px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Live Price */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => setActiveTab('valuation')}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-full bg-[#F7931A] flex items-center justify-center text-white font-black text-base shadow-xs shrink-0">
              ₿
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-[#191F2C] leading-none group-hover:text-[#3C75D5] transition-colors">
                BITCOIN ALPHA
              </span>
              <span className="text-[10px] text-[#64748B] font-medium leading-tight">
                {isVi ? 'Định Lượng Chu Kỳ Chuẩn Quốc Tế' : 'Institutional Macro Terminal'}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-[#E1E3E3] hidden lg:block" />

          {/* Real Live Price */}
          <div className="hidden sm:block">
            <LivePriceDisplay />
          </div>
        </div>

        {/* Center Nav Tabs (LookInto Tab Style) */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            id="tab-valuation"
            role="tab"
            aria-selected={activeTab === 'valuation'}
            data-testid="tab-valuation"
            onClick={() => setActiveTab('valuation')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'valuation'
                ? 'text-[#3C75D5] bg-[#EEF4FD]'
                : 'text-[#4B5563] hover:text-[#191F2C] hover:bg-slate-50'
            }`}
          >
            <LineChart className="w-4 h-4 text-[#3C75D5]" />
            <span>{isVi ? 'Định Giá Chu Kỳ' : 'Cycle Valuation'}</span>
          </button>

          <button
            type="button"
            id="tab-portfolio"
            role="tab"
            aria-selected={activeTab === 'portfolio'}
            data-testid="tab-portfolio"
            onClick={() => setActiveTab('portfolio')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'portfolio'
                ? 'text-[#3C75D5] bg-[#EEF4FD]'
                : 'text-[#4B5563] hover:text-[#191F2C] hover:bg-slate-50'
            }`}
          >
            <PieChart className="w-4 h-4 text-emerald-600" />
            <span>{isVi ? 'Tích Sản & Lệnh' : 'Portfolio'}</span>
          </button>

          <button
            type="button"
            id="tab-research"
            role="tab"
            aria-selected={activeTab === 'research'}
            data-testid="tab-research"
            onClick={() => setActiveTab('research')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'research'
                ? 'text-[#3C75D5] bg-[#EEF4FD]'
                : 'text-[#4B5563] hover:text-[#191F2C] hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4 text-amber-600" />
            <span>{isVi ? 'Nghiên Cứu & Vĩ Mô' : 'Research & Macro'}</span>
          </button>
        </div>

        {/* Right Controls: Binance Sync, Search, Lang */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="command-palette-trigger"
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E1E3E3] text-[#64748B] hover:text-[#191F2C] hover:bg-slate-50 text-xs font-medium transition-all cursor-pointer"
            title="Search (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span>⌘K</span>
          </button>

          {isBinanceConnected ? (
            <button
              type="button"
              onClick={() => setActiveTab('portfolio')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold cursor-pointer"
              title="Ví Binance Live"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Binance Live</span>
            </button>
          ) : vaultMeta.hasVault && isVaultLocked ? (
            <button
              type="button"
              data-testid="unlock-vault-header-btn"
              onClick={() => setBinanceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>{isVi ? 'Mở Khóa Ví' : 'Unlock Vault'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setBinanceModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3C75D5] hover:bg-[#2B63C0] text-white text-xs font-medium transition-colors cursor-pointer shadow-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isVi ? 'Đồng Bộ Binance' : 'Sync Binance'}</span>
            </button>
          )}

          {/* Language Switch */}
          <div className="flex items-center border border-[#E1E3E3] rounded-lg p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setLocale('vi')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                isVi ? 'bg-[#3C75D5] text-white font-semibold' : 'text-[#64748B] hover:text-[#191F2C]'
              }`}
            >
              VI
            </button>
            <button
              type="button"
              onClick={() => setLocale('en')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                !isVi ? 'bg-[#3C75D5] text-white font-semibold' : 'text-[#64748B] hover:text-[#191F2C]'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
