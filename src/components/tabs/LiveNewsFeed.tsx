import React, { useState } from 'react';
import { useTerminalStore } from '../../store/useTerminalStore';
import { timeAgo } from '../../lib/formatters';
import { Radio, ExternalLink, RefreshCw, Filter } from 'lucide-react';

type NewsCategoryFilter = 'ALL' | 'FED_MACRO' | 'ETF_INSTITUTIONAL' | 'ONCHAIN_MINING' | 'BITCOIN_MARKET';

function decodeHtmlEntities(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]*>?/gm, '')
    .replace(/&#8217;|&#039;|&apos;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;|&#8221;|&quot;/g, '"')
    .replace(/&#8211;|&#8212;|&ndash;|&mdash;/g, '–')
    .replace(/&#8230;|&hellip;/g, '...')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

export const LiveNewsFeed: React.FC = () => {
  const locale = useTerminalStore((s) => s.locale);
  const realNews = useTerminalStore((s) => s.realNews);
  const isLoading = useTerminalStore((s) => s.isLoadingRealData);
  const fetchRealData = useTerminalStore((s) => s.fetchRealData);

  const [activeFilter, setActiveFilter] = useState<NewsCategoryFilter>('ALL');

  const isVi = locale === 'vi';

  // Filter items based on selected category
  const filteredNews = realNews.filter((item) => {
    if (activeFilter === 'ALL') return true;
    return item.category === activeFilter;
  });

  return (
    <div className="rounded-2xl bg-white border border-[#E1E3E3] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] p-4 sm:p-5 flex flex-col font-mono text-xs space-y-3.5 h-[840px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#E1E3E3] shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#191F2C] flex items-center gap-2">
              <span>{isVi ? 'BĂNG TIN BITCOIN & VĨ MÔ THẬT' : 'BITCOIN & MACRO LIVE TERMINAL'}</span>
            </h2>
            <span className="text-[10px] text-[#64748B] font-sans">
              CryptoPanic Standard • Cointelegraph & Bitcoin Magazine RSS
            </span>
          </div>
        </div>

        <button
          onClick={() => fetchRealData()}
          disabled={isLoading}
          title={isVi ? 'Làm mới nguồn tin' : 'Refresh news feed'}
          className="p-1.5 rounded-lg bg-terminal-bg border border-terminal-border text-[#64748B] hover:text-[#191F2C] hover:border-slate-600 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Category Filter Pills (CryptoPanic / FinancialJuice Style) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 no-scrollbar text-[10px]">
        <Filter className="w-3 h-3 text-[#64748B] shrink-0 ml-0.5" />
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-2 py-1 rounded-md transition-all whitespace-nowrap font-semibold ${
            activeFilter === 'ALL'
              ? 'bg-slate-700 text-white border border-slate-500 shadow-sm'
              : 'bg-terminal-bg text-[#64748B] hover:text-[#191F2C] border border-terminal-border'
          }`}
        >
          {isVi ? 'Tất Cả' : 'All Feeds'} ({realNews.length})
        </button>
        <button
          onClick={() => setActiveFilter('FED_MACRO')}
          className={`px-2 py-1 rounded-md transition-all whitespace-nowrap font-semibold ${
            activeFilter === 'FED_MACRO'
              ? 'bg-sky-50 text-sky-800 border border-sky-300 shadow-sm'
              : 'bg-white text-[#64748B] hover:text-sky-800 border border-[#E1E3E3]'
          }`}
        >
          🏛️ {isVi ? 'Vĩ Mô & Fed' : 'Macro & Fed'}
        </button>
        <button
          onClick={() => setActiveFilter('ETF_INSTITUTIONAL')}
          className={`px-2 py-1 rounded-md transition-all whitespace-nowrap font-semibold ${
            activeFilter === 'ETF_INSTITUTIONAL'
              ? 'bg-indigo-50 text-indigo-800 border border-indigo-300 shadow-sm'
              : 'bg-white text-[#64748B] hover:text-indigo-800 border border-[#E1E3E3]'
          }`}
        >
          🐋 {isVi ? 'Dòng Tiền ETF' : 'ETF & Funds'}
        </button>
        <button
          onClick={() => setActiveFilter('ONCHAIN_MINING')}
          className={`px-2 py-1 rounded-md transition-all whitespace-nowrap font-semibold ${
            activeFilter === 'ONCHAIN_MINING'
              ? 'bg-amber-50 text-amber-800 border border-amber-300 shadow-sm'
              : 'bg-white text-[#64748B] hover:text-amber-800 border border-[#E1E3E3]'
          }`}
        >
          ⚡ {isVi ? 'On-Chain & Đào' : 'On-Chain'}
        </button>
        <button
          onClick={() => setActiveFilter('BITCOIN_MARKET')}
          className={`px-2 py-1 rounded-md transition-all whitespace-nowrap font-semibold ${
            activeFilter === 'BITCOIN_MARKET'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm'
              : 'bg-white text-[#64748B] hover:text-emerald-800 border border-[#E1E3E3]'
          }`}
        >
          ₿ {isVi ? 'Bitcoin' : 'Bitcoin'}
        </button>
      </div>

      {/* News Items List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
        {filteredNews.length > 0 ? (
          filteredNews.map((item, idx) => {
            // Category badges
            let categoryBadge = (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F1F5F9] text-[#343B43] border border-[#E1E3E3]">
                ₿ BITCOIN
              </span>
            );
            if (item.category === 'FED_MACRO') {
              categoryBadge = (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                  🏛️ {isVi ? 'VĨ MÔ & FED' : 'FED & MACRO'}
                </span>
              );
            } else if (item.category === 'ETF_INSTITUTIONAL') {
              categoryBadge = (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  🐋 {isVi ? 'DÒNG TIỀN ETF' : 'ETF INFLOW'}
                </span>
              );
            } else if (item.category === 'ONCHAIN_MINING') {
              categoryBadge = (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  ⚡ {isVi ? 'ON-CHAIN & ĐÀO' : 'MINING & ONCHAIN'}
                </span>
              );
            }

            // Sentiment badge
            let sentimentBadge = (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F1F5F9] text-[#64748B] border border-[#E1E3E3]">
                ⚪ {isVi ? 'TRUNG LẬP' : 'NEUTRAL'}
              </span>
            );
            if (item.sentiment === 'BULLISH') {
              sentimentBadge = (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  🟢 {isVi ? 'TÍCH CỰC' : 'BULLISH'}
                </span>
              );
            } else if (item.sentiment === 'BEARISH') {
              sentimentBadge = (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  🔴 {isVi ? 'RỦI RO NGẮN HẠN' : 'BEARISH'}
                </span>
              );
            }

            const displayTitle = decodeHtmlEntities(isVi && item.titleVi ? item.titleVi : item.title);
            const displayDesc = decodeHtmlEntities(isVi && item.descriptionVi ? item.descriptionVi : item.description);

            return (
              <a
                key={item.id || idx}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg bg-[#F8FAFC] hover:bg-white border border-[#E1E3E3] hover:border-[#3C75D5] transition-all group shadow-sm"
              >
                {/* Meta Row: Source, Category, Sentiment, Time */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] mb-2 text-[#64748B]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded font-bold uppercase text-[9px] bg-[#F1F5F9] text-[#191F2C] border border-[#E1E3E3]">
                      {item.source || 'Bitcoin'}
                    </span>
                    {categoryBadge}
                    {sentimentBadge}
                  </div>
                  <span className="text-[#64748B] text-[10px]">
                    {item.timeMs ? timeAgo(item.timeMs, locale) : item.pubDate?.slice(0, 16)}
                  </span>
                </div>

                {/* Headline */}
                <h3 className="font-semibold text-[#191F2C] group-hover:text-cyan-300 text-xs leading-snug mb-1.5 transition-colors flex items-start justify-between gap-2">
                  <span>{displayTitle}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#64748B] group-hover:text-cyan-400 shrink-0 mt-0.5 transition-colors" />
                </h3>

                {/* 1-Sentence Summary */}
                {displayDesc && (
                  <p className="text-[11px] text-[#64748B] font-sans leading-relaxed line-clamp-2">
                    {displayDesc}
                  </p>
                )}
              </a>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center text-[#64748B] space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
            <p className="text-xs">
              {isVi ? 'Đang nạp luồng tin tức thực tế...' : 'Loading live RSS news feed...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
