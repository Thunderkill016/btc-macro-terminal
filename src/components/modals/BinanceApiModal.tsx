import React, { useState } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { formatUSD, formatVND } from '../../lib/formatters';
import { validatePassphraseStrength } from '../../lib/cryptoVault';
import {
  X,
  Key,
  ShieldCheck,
  CheckCircle2,
  Lock,
  AlertTriangle,
  RefreshCw,
  Zap,
  Cloud,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';

export const BinanceApiModal: React.FC = () => {
  const isOpen = useTerminalStore((s) => s.binanceModalOpen);
  const setIsOpen = useTerminalStore((s) => s.setBinanceModalOpen);
  const config = useTerminalStore((s) => s.binanceApiConfig);
  const setConfig = useTerminalStore((s) => s.setBinanceApiConfig);
  const binancePortfolio = useTerminalStore((s) => s.binancePortfolio);
  const fetchBinancePortfolio = useTerminalStore((s) => s.fetchBinancePortfolio);
  const isBinanceSyncing = useTerminalStore((s) => s.isBinanceSyncing);
  const setActiveTab = useTerminalStore((s) => s.setActiveTab);
  const locale = useTerminalStore((s) => s.locale);
  const vaultMeta = useTerminalStore((s) => s.vaultMeta);
  const isVaultLocked = useTerminalStore((s) => s.isVaultLocked);
  const saveVaultWithPin = useTerminalStore((s) => s.saveVaultWithPin);
  const unlockVaultWithPin = useTerminalStore((s) => s.unlockVaultWithPin);
  const deleteVault = useTerminalStore((s) => s.deleteVault);

  const [apiKey, setApiKey] = useState(config.apiKey || vaultMeta.apiKey || '');
  const [apiSecret, setApiSecret] = useState(config.apiSecret || '');
  const [setupPin, setSetupPin] = useState('');
  const [unlockPin, setUnlockPin] = useState('');
  const [showUnlockPassphrase, setShowUnlockPassphrase] = useState(false);
  const [showSetupPassphrase, setShowSetupPassphrase] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    totalBtc: number;
    dryPowderUsd: number;
    totalVnd: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const isVi = locale === 'vi';
  const isConnected = binancePortfolio?.connected === true;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();
    const cleanSecret = apiSecret.trim();

    if (!cleanKey || !cleanSecret) {
      setErrorMsg(isVi ? 'Vui lòng nhập cả API Key và Secret' : 'Please provide both Key and Secret');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessInfo(null);

    if (setupPin.trim()) {
      const validation = validatePassphraseStrength(setupPin.trim());
      if (!validation.valid) {
        setErrorMsg(isVi ? validation.errorVi! : validation.errorEn!);
        setIsLoading(false);
        return;
      }
      try {
        await saveVaultWithPin(cleanKey, cleanSecret, setupPin.trim());
      } catch (err: any) {
        setErrorMsg(err?.message || (isVi ? 'Lỗi mã hóa WebCrypto AES-GCM' : 'WebCrypto encryption failed'));
        setIsLoading(false);
        return;
      }
    } else {
      // Save locally (session RAM)
      setConfig({ apiKey: cleanKey, apiSecret: cleanSecret });
    }

    // Test live connection with Binance and persist to server
    const res = await fetchBinancePortfolio({ apiKey: cleanKey, apiSecret: cleanSecret, saveToServer: true });
    setIsLoading(false);

    if (res.success && res.portfolio) {
      setSuccessInfo({
        totalBtc: res.portfolio.wallets.totalBtc,
        dryPowderUsd: res.portfolio.wallets.totalDryPowderUsd,
        totalVnd: res.portfolio.costBasis.currentValueVnd,
      });

      // Switch to Portfolio Tab and close after 2.5s
      setTimeout(() => {
        setActiveTab('portfolio');
        setIsOpen(false);
        setShowEditForm(false);
      }, 2500);
    } else {
      setErrorMsg(
        res.error ||
          (isVi
            ? 'Binance từ chối kết nối. Hãy kiểm tra lại Key/Secret hoặc quyền Enable Reading.'
            : 'Binance rejected connection. Check Key/Secret or Enable Reading permission.')
      );
    }
  };

  const handleConnectDefault = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessInfo(null);

    const res = await fetchBinancePortfolio({ useWorkerDefault: true });
    setIsLoading(false);

    if (res.success && res.portfolio) {
      setSuccessInfo({
        totalBtc: res.portfolio.wallets.totalBtc,
        dryPowderUsd: res.portfolio.wallets.totalDryPowderUsd,
        totalVnd: res.portfolio.costBasis.currentValueVnd,
      });

      setTimeout(() => {
        setActiveTab('portfolio');
        setIsOpen(false);
        setShowEditForm(false);
      }, 2500);
    } else {
      setErrorMsg(
        res.error ||
          (isVi
            ? 'Không thể tải khóa mặc định từ Cloudflare Worker. Bạn có thể tự dán API Key & Secret bên dưới.'
            : 'Could not load worker default keys. You can paste your API Key & Secret below.')
      );
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockPin.trim().length < 8) {
      setUnlockError(isVi ? 'Passphrase bảo mật phải gồm tối thiểu 8 ký tự' : 'Passphrase must be at least 8 characters');
      return;
    }
    setIsUnlocking(true);
    setUnlockError(null);
    const res = await unlockVaultWithPin(unlockPin.trim());
    setIsUnlocking(false);
    if (res.success) {
      setIsOpen(false);
      setActiveTab('portfolio');
    } else {
      setUnlockError(
        res.error || (isVi ? 'Passphrase không đúng hoặc giải mã thất bại' : 'Incorrect Passphrase or decryption failed')
      );
    }
  };

  const handleDeleteVault = () => {
    deleteVault();
    setApiKey('');
    setApiSecret('');
    setShowEditForm(true);
  };

  const handleClear = () => {
    setApiKey('');
    setApiSecret('');
    setConfig({ apiKey: '', apiSecret: '' });
    setErrorMsg(null);
    setSuccessInfo(null);
    setShowEditForm(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="binance-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn text-xs"
    >
      <div className="bg-[#0D1322] border border-cyan-500/30 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative space-y-4">
        {/* Close Button */}
        <button
          type="button"
          aria-label={isVi ? 'Đóng cửa sổ' : 'Close modal'}
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold shadow-sm">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 id="binance-modal-title" className="text-base font-extrabold text-white tracking-wide flex items-center gap-2">
              {isVi ? 'Đồng Bộ Ví Binance' : 'Binance Wallet Sync'}
              {isConnected && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold uppercase tracking-wider">
                  Cloud Live
                </span>
              )}
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {isVi ? 'Kết nối an toàn chỉ đọc (Read-Only) qua Cloudflare' : 'Secure read-only connection via Cloudflare'}
            </span>
          </div>
        </div>

        {/* Success Alert Banner if just connected */}
        {successInfo && (
          <div className="py-5 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                {isVi ? 'KẾT NỐI & LƯU CLOUDFLARE THÀNH CÔNG!' : 'CONNECTED & PERSISTED TO CLOUDFLARE!'}
              </h4>
              <p className="text-xs text-slate-300">
                {isVi ? 'Đã tải số dư ví thật từ tài khoản Binance của bạn:' : 'Real balance loaded from your Binance account:'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/30 space-y-1 font-mono">
              <div className="text-xs text-slate-300">
                BTC: <strong className="text-emerald-400">{successInfo.totalBtc.toFixed(8)} BTC</strong>
              </div>
              <div className="text-xs text-slate-300">
                Tiền mặt: <strong className="text-emerald-400">${successInfo.dryPowderUsd.toFixed(2)} USD</strong>
              </div>
              <div className="text-sm font-bold text-white pt-1 border-t border-slate-800">
                Tổng: ~{formatVND(successInfo.totalVnd)}
              </div>
            </div>
          </div>
        )}

        {/* View 0: LOCKED AES-256-GCM PASSPHRASE VAULT (OWASP 600K PBKDF2) */}
        {vaultMeta.hasVault && isVaultLocked && !showEditForm ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                  <span>{isVi ? 'KÉT KHÓA BINANCE ĐƯỢC BẢO MẬT' : 'ENCRYPTED BINANCE VAULT'}</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-mono">
                    AES-256-GCM • 600k PBKDF2
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {isVi
                    ? 'API Secret được bảo vệ bằng WebCrypto AES-GCM 256-bit kết hợp PBKDF2 600,000 vòng trong trình duyệt. Nhập Passphrase bảo mật (tối thiểu 8 ký tự) để giải mã trực tiếp vào RAM.'
                    : 'API Secret is securely encrypted with AES-256-GCM and 600k PBKDF2 rounds. Enter passphrase (min 8 chars) to decrypt into RAM.'}
                </p>
                {vaultMeta.apiKey && (
                  <div className="mt-2 text-[11px] font-mono text-slate-400 bg-black/40 py-1 px-2.5 rounded-lg inline-block border border-white/5">
                    API Key: {vaultMeta.apiKey.slice(0, 8)}...{vaultMeta.apiKey.slice(-6)}
                  </div>
                )}
              </div>
            </div>

            {unlockError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-medium">
                {unlockError}
              </div>
            )}

            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-2 text-center">
                <label htmlFor="vault-unlock-pin" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  {isVi ? 'Nhập Passphrase Mở Khóa' : 'Enter Passphrase To Unlock'}
                </label>
                <div className="relative max-w-xs mx-auto">
                  <input
                    id="vault-unlock-pin"
                    data-testid="vault-unlock-pin"
                    type={showUnlockPassphrase ? 'text' : 'password'}
                    minLength={8}
                    autoFocus
                    value={unlockPin}
                    onChange={(e) => setUnlockPin(e.target.value)}
                    placeholder={isVi ? 'Passphrase (tối thiểu 8 ký tự)...' : 'Passphrase (min 8 chars)...'}
                    className="w-full text-center text-sm font-mono font-bold bg-[#070A12] border border-amber-500/40 focus:border-amber-400 rounded-xl p-3 text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUnlockPassphrase(!showUnlockPassphrase)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    title={showUnlockPassphrase ? 'Ẩn' : 'Hiện'}
                  >
                    {showUnlockPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  data-testid="delete-vault-btn"
                  onClick={handleDeleteVault}
                  className="py-2.5 px-3 rounded-xl bg-white/[0.05] hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 font-bold text-xs transition-colors"
                >
                  {isVi ? 'Xóa Ví Đã Lưu' : 'Delete Vault'}
                </button>
                <button
                  type="submit"
                  data-testid="vault-unlock-submit-btn"
                  disabled={isUnlocking || unlockPin.trim().length < 8}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isUnlocking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isVi ? 'Đang Giải Mã...' : 'Decrypting...'}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{isVi ? 'Mở Khóa Ví' : 'Unlock Vault'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : isConnected && !showEditForm && !successInfo ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{isVi ? 'ĐÃ ĐỒNG BỘ TRỰC TIẾP TỪ CLOUDFLARE' : 'SYNCED DIRECTLY VIA CLOUDFLARE'}</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                  {binancePortfolio?.wallets?.totalSats?.toLocaleString()} sats
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                  <div className="text-[10px] text-slate-400 uppercase">{isVi ? 'Số dư BTC' : 'Total BTC'}</div>
                  <div className="text-emerald-400 font-bold text-sm">
                    {(binancePortfolio?.wallets?.totalBtc ?? 0).toFixed(8)} BTC
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                  <div className="text-[10px] text-slate-400 uppercase">{isVi ? 'Giá trị hiện tại' : 'Current Value'}</div>
                  <div className="text-slate-100 font-bold text-sm">
                    ${(binancePortfolio?.costBasis?.currentValueUsd ?? 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                <Cloud className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>
                  {isVi 
                    ? 'Khóa API được lưu trữ trực tiếp trên Cloudflare. Không mất key khi đổi domain hay mở trên thiết bị khác.'
                    : 'Credentials stored directly in Cloudflare. Persists across domains and devices.'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fetchBinancePortfolio()}
                disabled={isBinanceSyncing}
                className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isBinanceSyncing ? 'animate-spin' : ''}`} />
                <span>{isBinanceSyncing ? (isVi ? 'Đang cập nhật...' : 'Syncing...') : (isVi ? 'Làm Mới Số Dư' : 'Refresh Balance')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('portfolio');
                  setIsOpen(false);
                }}
                className="py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] text-white font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <span>{isVi ? 'Xem Danh Mục' : 'Portfolio'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setShowEditForm(true)}
                className="text-[11px] text-slate-400 hover:text-amber-400 underline transition-colors"
              >
                {isVi ? 'Đổi sang tài khoản hoặc API Key khác' : 'Switch or update API credentials'}
              </button>
            </div>
          </div>
        ) : (
          /* View 2: FORM VIEW (INPUT NEW / EDIT CREDENTIALS) */
          <form onSubmit={handleConnect} className="space-y-4">
            {/* Quick 1-Click Sync with Worker's Default Secrets */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>{isVi ? 'Đồng Bộ Nhanh 1-Click (Khóa Worker)' : '1-Click Fast Sync (Worker Key)'}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  Cloudflare Env
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-snug">
                {isVi
                  ? 'Dùng trực tiếp khóa API Binance đã lưu an toàn trong biến môi trường của Cloudflare Worker (không cần nhập thủ công).'
                  : 'Sync immediately using Binance API keys securely configured in Cloudflare Worker environment.'}
              </p>
              <button
                type="button"
                onClick={handleConnectDefault}
                disabled={isLoading}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isVi ? 'Đang kết nối...' : 'Connecting...'}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isVi ? '⚡ Dùng Khóa API Mặc Định Của Worker' : '⚡ Use Worker Default API Keys'}</span>
                  </>
                )}
              </button>
            </div>

            {/* 3-Step Visual Security Guide */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-[11px] font-sans">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 font-mono uppercase">
                <ShieldCheck className="w-4 h-4" />
                <span>{isVi ? '3 Bước Thiết Lập Khóa API Chỉ Đọc Chuẩn Thể Chế:' : '3-Step Strict Read-Only API Setup Guide:'}</span>
              </div>
              <div className="space-y-1.5 text-slate-300 pl-1">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>{isVi ? 'Vào Binance > Quản lý API > Tạo API HMAC mới.' : 'Go to Binance > API Management > Create HMAC API Key.'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>{isVi ? 'CHỈ TÍCH DUY NHẤT ô "Enable Reading" (Đọc thông tin ví & lệnh spot).' : 'ONLY check "Enable Reading" (Read-only wallet & trade history).'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span className="text-rose-300 font-medium">{isVi ? 'TUYỆT ĐỐI KHÔNG tích "Giao Dịch (Trading)" và KHÔNG tích "Rút Tiền (Withdrawals)".' : 'NEVER check "Spot & Margin Trading" or "Enable Withdrawals".'}</span>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-1">
                <strong className="block font-bold">
                  {isVi ? 'Kết Nối Thất Bại:' : 'Connection Error:'}
                </strong>
                <p className="font-mono text-[11px]">{errorMsg}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="binance-api-key-input" className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block cursor-pointer">
                {isVi ? 'Binance API Key (Chỉ Đọc)' : 'Binance API Key (Read-Only)'}
              </label>
              <input
                id="binance-api-key-input"
                type="text"
                required
                placeholder="Dán chuỗi API Key 64 ký tự..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-[#070A12] border border-white/[0.1] rounded-xl p-3 text-slate-100 focus:outline-none focus:border-cyan-400 text-xs font-mono font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="binance-api-secret-input" className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block cursor-pointer">
                {isVi ? 'Binance API Secret' : 'Binance API Secret'}
              </label>
              <input
                id="binance-api-secret-input"
                type="password"
                required
                placeholder="Dán chuỗi API Secret..."
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="w-full bg-[#070A12] border border-white/[0.1] rounded-xl p-3 text-slate-100 focus:outline-none focus:border-cyan-400 text-xs font-mono font-medium"
              />
            </div>

            {/* OWASP Compliant Passphrase Vault Encryption (PBKDF2 600k rounds) */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25">
              <div className="flex items-center justify-between">
                <label htmlFor="binance-setup-pin-input" className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block cursor-pointer flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isVi ? 'Passphrase Bảo Mật (Tối thiểu 8 ký tự) - Chuẩn OWASP' : 'Security Passphrase (8+ chars) - OWASP Standard'}</span>
                </label>
                <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                  AES-256-GCM • 600k PBKDF2
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-tight">
                {isVi
                  ? 'Đặt Passphrase dài (tối thiểu 8 ký tự) để mã hóa API Secret bằng PBKDF2 600,000 vòng + Salt 32 bytes chống vét cạn GPU. Để trống nếu chỉ dùng trong phiên RAM tạm thời.'
                  : 'Set an 8+ character passphrase to encrypt API Secret using 600,000 PBKDF2 iterations + 32-byte salt. Leave blank for temporary session RAM.'}
              </p>
              <div className="relative">
                <input
                  id="binance-setup-pin-input"
                  data-testid="binance-setup-pin-input"
                  type={showSetupPassphrase ? 'text' : 'password'}
                  minLength={8}
                  placeholder={isVi ? "VD: MySecretVault#2026 (tối thiểu 8 ký tự)" : "e.g. MySecretVault#2026 (min 8 chars)"}
                  value={setupPin}
                  onChange={(e) => setSetupPin(e.target.value)}
                  className="w-full bg-[#070A12] border border-amber-500/30 rounded-xl p-2.5 text-amber-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 text-xs font-mono font-medium pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSetupPassphrase(!showSetupPassphrase)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  title={showSetupPassphrase ? 'Ẩn' : 'Hiện'}
                >
                  {showSetupPassphrase ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-amber-400/90 font-mono">
                {isVi
                  ? '🛡️ Yêu cầu bắt buộc: Chỉ tạo API Key có quyền ĐỌC (Read-Only) và ĐÃ BẬT giới hạn IP Whitelist trên Binance. Tuyệt đối không cấp quyền Giao dịch hoặc Rút tiền.'
                  : '🛡️ Mandatory: Use a Read-Only API Key with IP Whitelist restriction enabled on Binance. Never grant trading or withdrawal permissions.'}
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              {isConnected && (
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="py-3 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 font-bold text-xs transition-colors"
                >
                  {isVi ? 'Hủy' : 'Cancel'}
                </button>
              )}

              <button
                type="button"
                onClick={handleClear}
                className="py-3 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 font-bold text-xs transition-colors"
              >
                {isVi ? 'Xóa' : 'Clear'}
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isVi ? 'Đang Lưu Lên Cloudflare...' : 'Saving to Cloudflare...'}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>{isVi ? 'Lưu Trực Tiếp Vào Cloudflare' : 'Save Directly to Cloudflare'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
