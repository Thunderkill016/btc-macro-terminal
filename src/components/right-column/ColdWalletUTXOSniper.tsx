import React from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { formatVND, formatUSD } from '../../lib/formatters';
import {
  ShieldCheck,
  ShieldAlert,
  Pickaxe,
  Bell,
  Coins,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const ColdWalletUTXOSniper: React.FC = () => {
  const mempool = useTerminalStore((s) => s.mempool);
  const ticker = useTerminalStore((s) => s.ticker);
  const locale = useTerminalStore((s) => s.locale);
  const setTelegramModalOpen = useTerminalStore((s) => s.setTelegramModalOpen);
  const binancePortfolio = useTerminalStore((s) => s.binancePortfolio);
  const summary = useTerminalStore((s) => s.portfolioSummary);

  const isVi = locale === 'vi';
  const fee = mempool.halfHourFee || 1.0;
  const isFeeLow = fee <= 10;
  const livePrice = ticker.price || 75925;
  const p2pRate = ticker.p2pUsdtVndRate || 25600;
  const bankRate = ticker.officialUsdVndRate || 25600;

  const totalBtc = binancePortfolio?.wallets?.totalBtc ?? summary.totalBtc;
  const totalSats = Math.round(totalBtc * 100_000_000);

  // Safe withdrawal threshold: 500,000 sats (~0.005 BTC / ~$380)
  const safeThresholdSats = 500_000;
  const isSafeToWithdraw = totalSats >= safeThresholdSats;
  const thresholdProgress = Math.min(100, Math.max(3, (totalSats / safeThresholdSats) * 100));

  // Single transaction network cost estimation
  const singleTxSats = Math.round(140 * fee);
  const singleTxUsd = (singleTxSats / 1e8) * livePrice;
  const singleTxVnd = Math.round(singleTxUsd * p2pRate);

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* 1. SMART COLD-STORAGE ADVISORY CARD */}
      <div className={`p-5 rounded-2xl border shadow-card space-y-3.5 transition-all ${
        isSafeToWithdraw
          ? 'bg-white border-emerald-200'
          : 'bg-white border-amber-200'
      }`}>
        {/* Header Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className={`w-4 h-4 ${isSafeToWithdraw ? 'text-emerald-600' : 'text-amber-500'}`} />
            <h3 className="font-bold text-[#111827] uppercase tracking-wider text-xs">
              {isVi ? 'TRỢ LÝ RÚT VÍ LẠNH' : 'COLD STORAGE ADVISOR'}
            </h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-mono ${
            isSafeToWithdraw
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {isSafeToWithdraw
              ? (isVi ? 'ĐÃ ĐẠT CHUẨN RÚT' : 'READY TO WITHDRAW')
              : (isVi ? 'TIẾP TỤC GOM TRÊN SÀN' : 'ACCUMULATE ON EXCHANGE')}
          </span>
        </div>

        {/* Action Recommendation in Plain Language */}
        <div className="flex items-start gap-3">
          {isSafeToWithdraw ? (
            <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h4 className="font-bold text-[#111827] text-xs sm:text-sm leading-snug">
              {isSafeToWithdraw
                ? (isVi ? 'An toàn để rút về ví lạnh lưu ký lâu dài!' : 'Safe to withdraw to cold storage!')
                : (isVi ? 'Chưa nên rút về ví lạnh lúc này' : 'Keep accumulating on exchange for now')}
            </h4>
            <p className="text-[11px] text-gray-600 leading-relaxed font-normal">
              {isSafeToWithdraw
                ? (isVi
                    ? `Số dư của bạn đã đạt ${totalSats.toLocaleString()} sats và phí mạng cực thấp (${fee.toFixed(1)} sat/vB). Đây là thời điểm lý tưởng để rút về Trezor, Coldcard hoặc BitBox02.`
                    : `Your balance has reached ${totalSats.toLocaleString()} sats with optimal fee (${fee.toFixed(1)} sat/vB). Ideal time to withdraw to hardware wallet.`)
                : (isVi
                    ? `Số dư hiện tại (${totalSats.toLocaleString()} sats ≈ ${formatUSD(totalBtc * livePrice, 2)}) còn nhỏ. Rút lúc này sẽ chịu phí cố định của sàn và tốn phí gộp về sau. Hãy tiếp tục tích lũy đến mốc 500.000 sats (~$380) rồi hãy rút một lần.`
                    : `Balance (${totalSats.toLocaleString()} sats) is small. Keep stacking on exchange until 500,000 sats (~$380) to minimize withdrawal and future consolidation fees.`)}
            </p>
          </div>
        </div>

        {/* Withdrawal Threshold Progress */}
        <div className="p-3.5 rounded-xl bg-[#F4F6F9] border border-[#EEF0F5] space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-gray-500 font-sans">{isVi ? 'Tiến độ gom ví lạnh:' : 'Vault Progress:'}</span>
            <span className="font-bold text-amber-600">{thresholdProgress.toFixed(1)}%</span>
          </div>

          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden border border-gray-300/40">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isSafeToWithdraw ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-amber-500'
              }`}
              style={{ width: `${thresholdProgress}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-gray-500 font-mono">
            <span>{totalSats.toLocaleString()} sats</span>
            <span>Mục tiêu: {safeThresholdSats.toLocaleString()} sats (0.005 BTC)</span>
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME NETWORK FEE & TRANSACTION COST (Mempool Live) */}
      <div className="p-5 rounded-2xl bg-white border border-[#EEF0F5] shadow-card space-y-3 font-mono">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-[#EEF0F5]">
          <span className="font-bold text-[#111827] uppercase flex items-center gap-1.5 font-sans">
            <Coins className="w-4 h-4 text-[#7C3AED]" />
            <span>{isVi ? 'PHÍ MẠNG BITCOIN (MEMPOOL)' : 'BITCOIN MEMPOOL FEE'}</span>
          </span>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-200 font-bold">
            {fee.toFixed(1)} sat/vB
          </span>
        </div>

        {/* Fee Status Box */}
        <div className="p-2.5 rounded-xl bg-[#F4F6F9] border border-[#EEF0F5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <span className="text-[#111827] font-bold block text-xs font-sans">
                {isFeeLow
                  ? (isVi ? 'Phí mạng đang ở mức cực rẻ' : 'Mempool fee is ultra low')
                  : (isVi ? 'Mạng lưới đang bận rộn' : 'Mempool congested')}
              </span>
              <span className="text-[10px] text-gray-500 font-sans">
                {isVi ? 'Mạng thông thoáng, giao dịch xác nhận nhanh' : 'Uncongested blocks, fast confirmation'}
              </span>
            </div>
          </div>
        </div>

        {/* Estimated Real Cost in VND */}
        <div className="space-y-1.5 pt-1 text-[11px]">
          <div className="flex justify-between items-center text-gray-700">
            <span className="text-gray-500 font-sans">{isVi ? 'Chi phí 1 lệnh chuyển:' : 'Est. transfer cost:'}</span>
            <span className="font-bold text-emerald-600">
              ~{singleTxSats} sats ({formatUSD(singleTxUsd, 2)} • ~{formatVND(singleTxVnd)})
            </span>
          </div>
          <div className="flex justify-between items-center text-gray-500 text-[10px]">
            <span className="font-sans">{isVi ? 'Gộp 10 địa chỉ (800 vB):' : 'Consolidate 10 UTXOs:'}</span>
            <span>~{Math.round(800 * fee).toLocaleString()} sats (~{formatVND(Math.round(((800 * fee) / 1e8) * livePrice * p2pRate))})</span>
          </div>
        </div>
      </div>

      {/* 3. P2P USDT/VND SPREAD & BITCOIN NETWORK SECURITY */}
      <div className="p-5 rounded-2xl bg-white border border-[#EEF0F5] shadow-card space-y-3 font-mono">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-[#EEF0F5]">
          <span className="font-bold text-[#111827] uppercase flex items-center gap-1.5 font-sans">
            <Pickaxe className="w-4 h-4 text-amber-500" />
            <span>{isVi ? 'TỶ GIÁ P2P & AN NINH MẠNG' : 'P2P SPREAD & SECURITY'}</span>
          </span>
          <span className="text-[10px] text-emerald-600 font-sans font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Live Data</span>
        </div>

        {/* P2P Comparison */}
        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-sans">{isVi ? 'Tỷ giá Binance P2P:' : 'Binance P2P Rate:'}</span>
            <span className="font-bold text-[#111827]">{formatVND(p2pRate)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-sans">{isVi ? 'Tỷ giá Ngân hàng (VCB):' : 'Bank FX (VCB):'}</span>
            <span className="text-gray-500">{formatVND(bankRate)}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] pt-0.5">
            <span className="text-gray-500 font-sans">{isVi ? 'Chênh lệch P2P:' : 'P2P Spread:'}</span>
            <span className={`font-bold ${ticker.p2pPremiumPercent > 2.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {ticker.p2pPremiumPercent > 0 ? '+' : ''}{ticker.p2pPremiumPercent.toFixed(2)}% {isVi ? '(An toàn)' : '(Safe)'}
            </span>
          </div>
        </div>

        {/* Network Hashrate Security Metric */}
        <div className="pt-2 border-t border-[#EEF0F5] flex items-center justify-between text-[11px]">
          <span className="text-gray-500 font-sans">{isVi ? 'Sức mạnh mạng lưới:' : 'Network Hashrate:'}</span>
          <span className="font-bold text-[#111827] font-mono">
            ~{mempool.hashrateEh ? mempool.hashrateEh.toFixed(1) : '992.1'} EH/s
          </span>
        </div>
      </div>

      {/* 4. TELEGRAM ALERT BUTTON */}
      <button
        type="button"
        onClick={() => setTelegramModalOpen(true)}
        className="w-full py-3 px-4 rounded-full bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-300 text-[#7C3AED] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs text-xs group"
      >
        <Bell className="w-4 h-4 text-[#7C3AED] group-hover:rotate-12 transition-transform" />
        <span>{isVi ? 'Bật Cảnh Báo Phí Mempool Qua Telegram' : 'Configure Telegram Fee Alerts'}</span>
      </button>
    </div>
  );
};
