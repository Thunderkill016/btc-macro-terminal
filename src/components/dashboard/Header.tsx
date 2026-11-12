import React, { useState, useEffect } from 'react';
import { Moon, Sun, Bell } from 'lucide-react';
import type { ActiveTab } from '../../types';

interface HeaderProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenQuickTrade: () => void;
  unreadNotifications?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickTrade,
  unreadNotifications = 3
}) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const meta = document.querySelector('meta[name="color-scheme"]')?.getAttribute('content');
      if (meta === 'dark') return true;
      if (meta === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Sync color-scheme to meta, html class and localStorage
  const toggleTheme = (targetMode: 'light' | 'dark') => {
    const isDark = targetMode === 'dark';
    setIsDarkMode(isDark);
    
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.setAttribute('content', targetMode);
    }
    localStorage.setItem('color-scheme', targetMode);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'color-scheme') {
        const val = e.newValue;
        if (val === 'dark') {
          setIsDarkMode(true);
          document.documentElement.classList.add('dark');
        } else if (val === 'light') {
          setIsDarkMode(false);
          document.documentElement.classList.remove('dark');
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'valuation', label: 'Market Overview' },
    { id: 'signals', label: 'Live Signals' },
    { id: 'portfolio', label: 'AI Risk Analyzer' }
  ];

  return (
    <header className="w-full flex items-center justify-between pb-6 pt-1 select-none">
      {/* Left: Brand Logo & Navigation Capsule */}
      <div className="flex items-center gap-4 lg:gap-6 flex-wrap">
        {/* Brand Logo matching the blue round icon with upward chart */}
        <div 
          onClick={() => onSelectTab('dashboard')}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#1E6BFF] to-[#3B82F6] flex items-center justify-center shadow-md shadow-blue-500/25 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          title="BTC Signal AI Dashboard"
        >
          <div className="relative flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l6-6 4 4 8-8" />
              <path d="M14 7h7v7" />
              <path d="M3 21h18" strokeWidth="1.5" strokeOpacity="0.4" />
            </svg>
          </div>
        </div>

        {/* Navigation Pill Group */}
        <nav 
          aria-label="Main Navigation"
          className="bg-[#EFF2F6] dark:bg-[#1A2234] p-1 rounded-full flex items-center gap-1 shadow-inner border border-black/5 dark:border-white/5"
        >
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-5 py-2 rounded-full text-[13.5px] font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-[#253046] text-[#111827] dark:text-white shadow-sm font-semibold'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right: Theme Toggle, Notifications & User Avatar */}
      <div className="flex items-center gap-3">
        {/* Dark/Light mode buttons capsule */}
        <div className="bg-[#EFF2F6] dark:bg-[#1A2234] p-1 rounded-full flex items-center gap-1 border border-black/5 dark:border-white/5">
          <button
            type="button"
            onClick={() => toggleTheme('dark')}
            title="Switch to Dark theme"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-[#253046] text-amber-300 shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span className="sr-only">Dark theme</span>
          </button>
          
          <button
            type="button"
            onClick={() => toggleTheme('light')}
            title="Switch to Light theme"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              !isDarkMode
                ? 'bg-white text-amber-500 shadow-sm'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span className="sr-only">Light theme</span>
          </button>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-full bg-[#EFF2F6] dark:bg-[#1A2234] flex items-center justify-center text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white transition-colors relative cursor-pointer border border-black/5 dark:border-white/5"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#1A2234] animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <span className="font-semibold text-sm text-gray-900 dark:text-white">Signals & Alerts</span>
                <span className="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full">
                  3 New
                </span>
              </div>
              <div className="space-y-2.5 pt-3 text-xs">
                <div 
                  onClick={() => { onSelectTab('signals'); setShowNotifications(false); }}
                  className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>⚡ Confluence Signal: 71/100</span>
                    <span className="text-[10px] text-gray-400">2m ago</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Deep Accumulation zone detected · Half-Kelly multiplier 1.35x active.</p>
                </div>

                <div 
                  onClick={() => { onSelectTab('valuation'); setShowNotifications(false); }}
                  className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between font-semibold text-blue-600 dark:text-blue-400">
                    <span>🛡️ 200WMA Generational Floor</span>
                    <span className="text-[10px] text-gray-400">18m ago</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">BTC testing $68,033 multi-cycle support with positive spot CVD absorption.</p>
                </div>

                <div 
                  onClick={() => { onSelectTab('portfolio'); setShowNotifications(false); }}
                  className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between font-semibold text-amber-600 dark:text-amber-400">
                    <span>📊 STH Cost Basis Discount</span>
                    <span className="text-[10px] text-gray-400">1h ago</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Short-term holders in aggregate loss (-1.2%) · High historical risk-reward.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar matching John's portrait in screenshot */}
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-0.5 rounded-full ring-2 ring-transparent hover:ring-blue-400 transition cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm relative">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" 
                alt="John Trader" 
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-3 z-50">
              <div className="px-2 py-1.5 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Institutional Portfolio</p>
                <p className="text-xs text-gray-500">Macro Quant VIP · Account #84920</p>
              </div>
              <div className="pt-2 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                <button 
                  onClick={() => { onOpenQuickTrade(); setShowProfileMenu(false); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer font-medium"
                >
                  ⚡ Quick DCA / Spot Order
                </button>
                <button 
                  onClick={() => { onSelectTab('valuation'); setShowProfileMenu(false); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  📐 Power Law & Cycle Valuation
                </button>
                <button 
                  onClick={() => { onSelectTab('portfolio'); setShowProfileMenu(false); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  💼 Binance API Sync & Half-Kelly
                </button>
                <button 
                  onClick={() => { onSelectTab('research'); setShowProfileMenu(false); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  🔬 Research & Backtesting Lab
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

