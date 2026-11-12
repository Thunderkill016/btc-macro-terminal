import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useTerminalStore } from '../store/useTerminalStore';
import {
  Search,
  Command,
  LineChart,
  PieChart,
  History,
  ShieldCheck,
  Target,
  Zap,
  Pickaxe,
  Lock,
  RefreshCw,
  Share2,
  Bell,
  Compass,
  Globe,
  Plus,
  X,
  ArrowRight,
} from 'lucide-react';

interface CommandItem {
  id: string;
  categoryVi: string;
  categoryEn: string;
  titleVi: string;
  titleEn: string;
  subtitleVi: string;
  subtitleEn: string;
  keywords: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const isOpen = useTerminalStore((s) => s.commandPaletteOpen);
  const setIsOpen = useTerminalStore((s) => s.setCommandPaletteOpen);
  const locale = useTerminalStore((s) => s.locale);
  const setLocale = useTerminalStore((s) => s.setLocale);
  const setActiveTab = useTerminalStore((s) => s.setActiveTab);
  const setActiveRadarSubTab = useTerminalStore((s) => s.setActiveRadarSubTab);
  const setBinanceModalOpen = useTerminalStore((s) => s.setBinanceModalOpen);
  const fetchBinancePortfolio = useTerminalStore((s) => s.fetchBinancePortfolio);
  const fetchOrderbookLiquidity = useTerminalStore((s) => s.fetchOrderbookLiquidity);
  const setShareCardModalOpen = useTerminalStore((s) => s.setShareCardModalOpen);
  const setTelegramModalOpen = useTerminalStore((s) => s.setTelegramModalOpen);
  const setAddTransactionModalOpen = useTerminalStore((s) => s.setAddTransactionModalOpen);
  const setInstitutionalModalOpen = useTerminalStore((s) => s.setInstitutionalModalOpen);

  const isVi = locale === 'vi';
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToRadarMatrix = () => {
    setTimeout(() => {
      const el = document.getElementById('quant-radar-matrix');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: 'nav-tab-1',
        categoryVi: 'Điều Hướng & Trạm Radar',
        categoryEn: 'Navigation & Radar Matrix',
        titleVi: 'Chuyển tới Tab 1: Tín Hiệu & Chu Kỳ',
        titleEn: 'Switch to Tab 1: Signals & Cycle',
        subtitleVi: 'Luận điểm chu kỳ, Kelly/ATR Sniper & Biểu đồ 2011-2026',
        subtitleEn: 'Cycle thesis, Kelly/ATR Sniper & 2011-2026 Chart',
        keywords: 'tab 1 tin hieu chu ky valuation signals chart hero',
        shortcut: 'G 1',
        icon: <LineChart className="w-4 h-4 text-emerald-400" />,
        action: () => setActiveTab('valuation'),
      },
      {
        id: 'nav-tab-2',
        categoryVi: 'Điều Hướng & Trạm Radar',
        categoryEn: 'Navigation & Radar Matrix',
        titleVi: 'Chuyển tới Tab 2: Danh Mục & Ví Tích Sản',
        titleEn: 'Switch to Tab 2: Portfolio & Wallet',
        subtitleVi: 'Thước đo cột mốc giá, Máy tính hạ giá vốn & UTXO Guard',
        subtitleEn: 'Milestone ruler, Average-down calculator & UTXO Guard',
        keywords: 'tab 2 danh muc vi portfolio wallet utxo',
        shortcut: 'G 2',
        icon: <PieChart className="w-4 h-4 text-cyan-400" />,
        action: () => setActiveTab('portfolio'),
      },
      {
        id: 'nav-tab-3',
        categoryVi: 'Điều Hướng & Trạm Radar',
        categoryEn: 'Navigation & Radar Matrix',
        titleVi: 'Chuyển tới Tab 3: Kiểm Chứng & Vĩ Mô',
        titleEn: 'Switch to Tab 3: Backtest & Macro Flows',
        subtitleVi: 'Backtest BTC vs Vàng SJC, Thanh khoản M2 & 11 Quỹ ETF Mỹ',
        subtitleEn: 'BTC vs Gold backtest, Global M2 & 11 US Spot ETFs',
        keywords: 'tab 3 kiem chung vi mo research backtest m2 etf sjc gold',
        shortcut: 'G 3',
        icon: <History className="w-4 h-4 text-amber-400" />,
        action: () => setActiveTab('research'),
      },
      {
        id: 'radar-peak',
        categoryVi: 'Điều Hướng & Trạm Radar',
        categoryEn: 'Navigation & Radar Matrix',
        titleVi: 'Trạm Radar — Tab A: 🛡️ Radar 5 Chỉ Báo Đỉnh Chu Kỳ',
        titleEn: 'Radar Matrix — Tab A: 🛡️ 5-Indicator Peak Radar',
        subtitleVi: 'Pi Cycle Top, MVRV Ratio, Mayer Multiple, AHR999 & Đòn Bẩy',
        subtitleEn: 'Pi Cycle Top, MVRV Ratio, Mayer Multiple, AHR999 & Leverage',
        keywords: 'tab a radar 5 chi bao dinh peak pi cycle mvrv mayer ahr999',
        shortcut: 'R 1',
        icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
        action: () => {
          setActiveTab('valuation');
          setActiveRadarSubTab('peak');
          scrollToRadarMatrix();
        },
      },
      {
        id: 'radar-cone',
        categoryVi: 'Điều Hướng & Trạm Radar',
        categoryEn: 'Navigation & Radar Matrix',
        titleVi: 'Trạm Radar — Tab B: 🎯 Dự Báo Xác Suất 30D / 90D (Forward Cone)',
        titleEn: 'Radar Matrix — Tab B: 🎯 30D / 90D Probabilistic Forward Cone',
        subtitleVi: 'Khai triển Cornish-Fisher đuôi béo, Độ lệch S, Độ nhọn K & OU Drift',
        subtitleEn: 'Cornish-Fisher fat-tail expansion, Skewness, Kurtosis & OU Drift',
        keywords: 'tab b du bao xac suat 30d 90d forward cone cornish fisher p15 p50 p85',
        shortcut: 'R 2',
        icon: <Target className="w-4 h-4 text-purple-400" />,
        action: () => {
          setActiveTab('valuation');
          setActiveRadarSubTab('cone');
          scrollToRadarMatrix();
        },
      },
      {
        id: 'radar-downside',
        categoryVi: 'Điều Hướng & Trạm Radar',
        categoryEn: 'Navigation & Radar Matrix',
        titleVi: 'Trạm Radar — Tab C: ⚡ Rủi Ro Ngắn Hạn & Tường Thanh Khoản Spot',
        titleEn: 'Radar Matrix — Tab C: ⚡ Downside Risk & Spot Liquidity Wall',
        subtitleVi: 'Giá vốn STH, 200DMA, Spot CVD 7D & Tường đỡ cá voi Orderbook ±3%',
        subtitleEn: 'STH Cost Basis, 200DMA, Spot CVD 7D & Orderbook Bid Wall ±3%',
        keywords: 'tab c rui ro ngan han ca voi downside sth 200dma orderbook bid wall',
        shortcut: 'R 3',
        icon: <Zap className="w-4 h-4 text-amber-400" />,
        action: () => {
          setActiveTab('valuation');
          setActiveRadarSubTab('downside');
          scrollToRadarMatrix();
        },
      },
      {
        id: 'radar-miners',
        categoryVi: 'Điều Hướng & Trạm Radar',
        categoryEn: 'Navigation & Radar Matrix',
        titleVi: 'Trạm Radar — Tab D: ⛏️ Chu Kỳ Thợ Đào & Halving 4',
        titleEn: 'Radar Matrix — Tab D: ⛏️ Miners & 4th Halving Cycle',
        subtitleVi: 'Puell Multiple, Hash Ribbons 30D/60D, BTC/PAXG Mayer & NUPL',
        subtitleEn: 'Puell Multiple, Hash Ribbons 30D/60D, BTC/PAXG Mayer & NUPL',
        keywords: 'tab d chu ky tho dao halving 4 puell hash ribbons nupl paxg',
        shortcut: 'R 4',
        icon: <Pickaxe className="w-4 h-4 text-cyan-400" />,
        action: () => {
          setActiveTab('valuation');
          setActiveRadarSubTab('halving_miners');
          scrollToRadarMatrix();
        },
      },
      {
        id: 'vault-unlock',
        categoryVi: 'Thực Thi & Bảo Mật Ví',
        categoryEn: 'Vault & Execution',
        titleVi: 'Mở Khóa / Cấu Hình WebCrypto AES-GCM PIN Vault (Binance)',
        titleEn: 'Unlock / Configure WebCrypto AES-GCM PIN Vault (Binance)',
        subtitleVi: 'Mã hóa PBKDF2 600,000 vòng chuẩn OWASP trên trình duyệt',
        subtitleEn: 'Client-side PBKDF2 600,000-iteration OWASP encryption',
        keywords: 'vault pin binance api key unlock lock ma hoa',
        shortcut: 'V',
        icon: <Lock className="w-4 h-4 text-amber-400" />,
        action: () => setBinanceModalOpen(true),
      },
      {
        id: 'sync-binance',
        categoryVi: 'Thực Thi & Bảo Mật Ví',
        categoryEn: 'Vault & Execution',
        titleVi: 'Làm Mới Số Dư Binance & Quét Sổ Lệnh Orderbook',
        titleEn: 'Refresh Binance Balances & Scan Spot Orderbook Walls',
        subtitleVi: 'Đồng bộ tức thời ví Spot/Earn và quét tường mua cá voi ±3%',
        subtitleEn: 'Sync live Spot/Earn balances and scan ±3% bid liquidity walls',
        keywords: 'lam moi refresh sync binance orderbook depth',
        shortcut: 'S',
        icon: <RefreshCw className="w-4 h-4 text-emerald-400" />,
        action: () => {
          fetchBinancePortfolio();
          fetchOrderbookLiquidity();
        },
      },
      {
        id: 'add-tx',
        categoryVi: 'Thực Thi & Bảo Mật Ví',
        categoryEn: 'Vault & Execution',
        titleVi: 'Ghi Chép Lệnh Mua Tích Sản Mới (Sổ Cái Local)',
        titleEn: 'Record New Spot Accumulation Buy (Local Ledger)',
        subtitleVi: 'Cập nhật giá vốn trung bình và vẽ mốc ▲ MUA lên biểu đồ',
        subtitleEn: 'Update average cost basis and plot ▲ BUY marker on chart',
        keywords: 'them giao dich mua ban add transaction ledger',
        shortcut: 'N',
        icon: <Plus className="w-4 h-4 text-cyan-400" />,
        action: () => setAddTransactionModalOpen(true),
      },
      {
        id: 'formula-glassnode',
        categoryVi: 'Công Thức & Mô Hình Định Chế',
        categoryEn: 'Institutional Formulas & Models',
        titleVi: 'Toán Học Định Giá On-Chain: MVRV, Realized Price & NUPL',
        titleEn: 'On-Chain Valuation Math: MVRV, Realized Price & NUPL',
        subtitleVi: 'Cơ sở lý thuyết Glassnode & kiểm định phân vị chu kỳ',
        subtitleEn: 'Glassnode theoretical framework & cycle percentile calibration',
        keywords: 'mvrv realized price nupl glassnode formula cong thuc',
        icon: <Compass className="w-4 h-4 text-cyan-400" />,
        action: () => setInstitutionalModalOpen(true, 'glassnode'),
      },
      {
        id: 'formula-lookintobitcoin',
        categoryVi: 'Công Thức & Mô Hình Định Chế',
        categoryEn: 'Institutional Formulas & Models',
        titleVi: 'Toán Học Chu Kỳ: Power Law, Sàn 200W & Pi Cycle Top',
        titleEn: 'Cycle Models: Power Law, 200W Floor & Pi Cycle Top',
        subtitleVi: 'Hồi quy lũy thừa Santostasi & giao cắt trung bình động Pi Cycle',
        subtitleEn: 'Santostasi power law regression & Pi Cycle moving averages',
        keywords: 'power law 200w pi cycle top lookintobitcoin formula cong thuc',
        icon: <Compass className="w-4 h-4 text-emerald-400" />,
        action: () => setInstitutionalModalOpen(true, 'lookintobitcoin'),
      },
      {
        id: 'formula-coinglass',
        categoryVi: 'Công Thức & Mô Hình Định Chế',
        categoryEn: 'Institutional Formulas & Models',
        titleVi: 'Toán Học Thực Thi: Kelly Criterion, ATR Sniper & Funding Rate',
        titleEn: 'Execution Math: Kelly Criterion, ATR Sniper & Funding Rate',
        subtitleVi: 'Tối ưu hóa tỷ trọng Half-Kelly PAVA & rải lệnh đón râu ATR-14D',
        subtitleEn: 'PAVA-calibrated Half-Kelly sizing & 14D-ATR wick sniper',
        keywords: 'kelly criterion atr sniper funding rate coinglass formula cong thuc',
        icon: <Compass className="w-4 h-4 text-amber-400" />,
        action: () => setInstitutionalModalOpen(true, 'coinglass'),
      },
      {
        id: 'export-png',
        categoryVi: 'Tiện Ích Hệ Thống',
        categoryEn: 'System Utilities',
        titleVi: 'Xuất Báo Cáo Alpha Report Card (PNG Độ Phân Giải Cao)',
        titleEn: 'Export High-Res Alpha Report Card (PNG)',
        subtitleVi: 'Tạo thẻ báo cáo định lượng chu kỳ và danh mục để lưu trữ',
        subtitleEn: 'Generate institutional cycle & portfolio snapshot card',
        keywords: 'xuat bao cao png export share card image',
        icon: <Share2 className="w-4 h-4 text-purple-400" />,
        action: () => setShareCardModalOpen(true),
      },
      {
        id: 'telegram-alert',
        categoryVi: 'Tiện Ích Hệ Thống',
        categoryEn: 'System Utilities',
        titleVi: 'Cấu Hình Báo Động Telegram (Chống Lặp Dedup & Rate-Limit)',
        titleEn: 'Configure Telegram Alerts (Anti-Duplicate & 6h Cooldown)',
        subtitleVi: 'Nhận thông báo tự động khi chạm vùng hỗ trợ hoặc quá nhiệt đòn bẩy',
        subtitleEn: 'Receive automated alerts on support tests or leverage flushes',
        keywords: 'telegram alert bao dong thong bao',
        icon: <Bell className="w-4 h-4 text-cyan-400" />,
        action: () => setTelegramModalOpen(true),
      },
      {
        id: 'toggle-locale',
        categoryVi: 'Tiện Ích Hệ Thống',
        categoryEn: 'System Utilities',
        titleVi: isVi ? 'Chuyển Ngôn Ngữ Sang Tiếng Anh (Switch to English)' : 'Switch Language to Vietnamese (Chuyển sang Tiếng Việt)',
        titleEn: isVi ? 'Switch Language to English' : 'Switch Language to Vietnamese',
        subtitleVi: 'Thay đổi ngôn ngữ giao diện toàn hệ thống ngay lập tức',
        subtitleEn: 'Instantly toggle terminal interface language (VI <-> EN)',
        keywords: 'language ngon ngu tieng viet english vi en',
        shortcut: 'L',
        icon: <Globe className="w-4 h-4 text-emerald-400" />,
        action: () => setLocale(isVi ? 'en' : 'vi'),
      },
    ],
    [
      isVi,
      setActiveTab,
      setActiveRadarSubTab,
      setBinanceModalOpen,
      fetchBinancePortfolio,
      fetchOrderbookLiquidity,
      setAddTransactionModalOpen,
      setInstitutionalModalOpen,
      setShareCardModalOpen,
      setTelegramModalOpen,
      setLocale,
    ]
  );

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (cmd) =>
        cmd.titleVi.toLowerCase().includes(q) ||
        cmd.titleEn.toLowerCase().includes(q) ||
        cmd.subtitleVi.toLowerCase().includes(q) ||
        cmd.subtitleEn.toLowerCase().includes(q) ||
        cmd.keywords.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global Keyboard Shortcut Listener (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(!useTerminalStore.getState().commandPaletteOpen);
        return;
      }

      if (!useTerminalStore.getState().commandPaletteOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredCommands.length > 0 ? (prev + 1) % filteredCommands.length : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredCommands.length > 0
            ? (prev - 1 + filteredCommands.length) % filteredCommands.length
            : 0
        );
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        const item = filteredCommands[selectedIndex];
        setIsOpen(false);
        item.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={() => setIsOpen(false)}
      data-testid="command-palette-backdrop"
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#0A0E17] border border-white/[0.10] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_25px_70px_-15px_rgba(0,0,0,0.9)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isVi ? 'Bảng điều khiển lệnh nhanh Command Palette' : 'Command Palette'}
        data-testid="command-palette-dialog"
      >
        {/* Top Search Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06] bg-[#0F1522]/60">
          <Search className="w-4 h-4 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isVi
                ? 'Tìm nhanh chỉ báo, chuyển phân hệ (Tab 1/2/3, Radar A/B/C/D), mở công thức hoặc đồng bộ ví...'
                : 'Type a command or search indicators (Tab 1/2/3, Radar A/B/C/D, Vault, Formulas)...'
            }
            className="w-full bg-transparent text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none font-sans"
            data-testid="command-palette-input"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-white/[0.05] border border-white/[0.08] rounded">
              ESC
            </kbd>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label={isVi ? 'Đóng bảng lệnh' : 'Close command palette'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Command List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredCommands.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 font-sans">
              {isVi
                ? `Không tìm thấy lệnh phù hợp với "${query}".`
                : `No commands matching "${query}".`}
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  data-testid={`cmd-item-${cmd.id}`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => {
                    setIsOpen(false);
                    cmd.action();
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#141C2E] border border-emerald-500/30 text-white shadow-sm'
                      : 'border border-transparent text-slate-300 hover:bg-[#0F1522]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#05070B] border border-white/[0.06] flex items-center justify-center shrink-0">
                      {cmd.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#F8FAFC] truncate">
                          {isVi ? cmd.titleVi : cmd.titleEn}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-[#64748B] font-medium hidden sm:inline-block">
                          {isVi ? cmd.categoryVi : cmd.categoryEn}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748B] truncate mt-0.5">
                        {isVi ? cmd.subtitleVi : cmd.subtitleEn}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cmd.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-[#05070B] border border-white/[0.08] rounded">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    <ArrowRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected ? 'text-emerald-400 translate-x-0.5' : 'text-slate-600'
                      }`}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Bottom Status Footer */}
        <div className="px-4 py-2.5 border-t border-white/[0.06] bg-[#05070B]/90 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#64748B]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Command className="w-3 h-3 text-emerald-400" />
              <strong className="text-slate-300">Bitcoin Alpha v6.0 Apex</strong>
            </span>
            <span>•</span>
            <span>
              {isVi
                ? '↑↓ Di chuyển • Enter Thực thi • Esc Đóng'
                : '↑↓ Navigate • Enter Execute • Esc Close'}
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">
            ⌘K / Ctrl+K
          </span>
        </div>
      </div>
    </div>
  );
};
