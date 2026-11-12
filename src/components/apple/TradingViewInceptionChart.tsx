import React, { useEffect, useRef, useState } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { Sparkles, BarChart2, Check } from 'lucide-react';

interface SymbolPreset {
  id: string;
  label: string;
  symbol: string;
  badgeVi: string;
  badgeEn: string;
}

const SYMBOL_PRESETS: SymbolPreset[] = [
  {
    id: 'binance',
    label: 'Binance Spot',
    symbol: 'BINANCE:BTCUSDT',
    badgeVi: 'Thanh khoản lớn nhất thế giới',
    badgeEn: 'Highest Global Liquidity',
  },
  {
    id: 'index',
    label: 'BraveNewCoin Index',
    symbol: 'INDEX:BTCUSD',
    badgeVi: 'Index chuẩn lịch sử từ 2010',
    badgeEn: 'Benchmark Index from 2010',
  },
  {
    id: 'coinbase',
    label: 'Coinbase Spot',
    symbol: 'COINBASE:BTCUSD',
    badgeVi: 'Dòng tiền ETF & Phố Wall',
    badgeEn: 'US Institutional ETF Flow',
  },
];

export const TradingViewInceptionChart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const locale = useTerminalStore((s) => s.locale);
  const isVi = locale === 'vi';

  const [activeSymbol, setActiveSymbol] = useState<string>('BINANCE:BTCUSDT');
  const [activeInterval, setActiveInterval] = useState<string>('W');

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'tradingview-widget-container';
    container.style.height = '100%';
    container.style.width = '100%';

    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    widget.style.height = 'calc(100% - 32px)';
    widget.style.width = '100%';
    container.appendChild(widget);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: activeSymbol,
      interval: activeInterval,
      timezone: 'Asia/Ho_Chi_Minh',
      theme: 'dark',
      style: '1',
      locale: isVi ? 'vi_VN' : 'en',
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    });

    container.appendChild(script);
    containerRef.current.appendChild(container);
  }, [activeSymbol, activeInterval, isVi]);

  return (
    <div className="space-y-3">
      {/* Top Source & Interval Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3 text-xs">
        {/* Symbol Quick Selectors */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">
            {isVi ? 'Nguồn dữ liệu:' : 'Data Feed:'}
          </span>
          {SYMBOL_PRESETS.map((preset) => {
            const isSelected = activeSymbol === preset.symbol;
            return (
              <button
                key={preset.id}
                onClick={() => setActiveSymbol(preset.symbol)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold'
                    : 'bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-slate-300'
                }`}
                title={isVi ? preset.badgeVi : preset.badgeEn}
              >
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                <span>{preset.label}</span>
                <span className="text-[10px] text-slate-400 hidden md:inline">
                  ({isVi ? preset.badgeVi : preset.badgeEn})
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Timeframe Interval Selection */}
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-0.5">
          {[
            { key: 'W', labelVi: '1W (Tuần - Chu Kỳ)', labelEn: '1W (Weekly)' },
            { key: 'D', labelVi: '1D (Ngày)', labelEn: '1D (Daily)' },
            { key: 'M', labelVi: '1M (Tháng)', labelEn: '1M (Monthly)' },
            { key: '240', labelVi: '4H (Ngắn hạn)', labelEn: '4H' },
          ].map((int) => (
            <button
              key={int.key}
              onClick={() => setActiveInterval(int.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeInterval === int.key
                  ? 'bg-white/20 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isVi ? int.labelVi : int.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* TradingView Advanced Canvas with Max Viewport */}
      <div className="rounded-3xl overflow-hidden bg-[#090D16] border border-white/[0.08] shadow-2xl h-[650px] w-full p-1 relative">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {/* Bottom Features Info Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-2 pt-1 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">
            {isVi
              ? 'Tích hợp đầy đủ công cụ vẽ & 100+ chỉ báo PTKT miễn phí từ TradingView'
              : 'Full access to 100+ technical indicators & drawing tools 100% free'}
          </span>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          {isVi
            ? 'Bấm nút "Các chỉ báo" trên thanh công cụ để thêm RSI, MACD, Bollinger Bands, MA...'
            : 'Click "Indicators" on the top toolbar to search and apply any technical study'}
        </div>
      </div>
    </div>
  );
};
