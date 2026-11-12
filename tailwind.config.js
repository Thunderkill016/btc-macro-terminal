/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        appBg: '#F3F5F9',
        brandDark: '#111827',
        cardBg: '#FFFFFF',
        cardBorder: '#EEF0F5',
        brandPurple: '#8B5CF6',
        brandViolet: '#7C3AED',
        brandGreen: '#10B981',
        brandRed: '#EF4444',
        brandOrange: '#F97316',
        terminal: {
          bg: '#05070B',
          surface: '#0A0E17',
          card: '#0F1522',
          cardHover: '#141C2E',
          border: 'rgba(255, 255, 255, 0.06)',
          borderLight: 'rgba(255, 255, 255, 0.12)',
          textMuted: '#64748B',
          textSub: '#CBD5E1',
          textMain: '#F8FAFC',
        },
        bull: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dim: 'rgba(16, 185, 129, 0.15)',
        },
        bear: {
          DEFAULT: '#EF4444',
          light: '#F87171',
          dim: 'rgba(239, 68, 68, 0.15)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          dim: 'rgba(245, 158, 11, 0.15)',
        },
        shock: {
          DEFAULT: '#8B5CF6',
          light: '#A78BFA',
          dim: 'rgba(139, 92, 246, 0.15)',
        },
        cyan: {
          accent: '#06B6D4',
          dim: 'rgba(6, 182, 212, 0.15)',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
        'float-pill': '0 12px 30px -5px rgba(139, 92, 246, 0.18), 0 8px 16px -6px rgba(15, 23, 42, 0.08)',
        'elevated-tooltip': '0 10px 25px -3px rgba(15, 23, 42, 0.12), 0 4px 10px -2px rgba(15, 23, 42, 0.06)',
        'specular': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'specular-lg': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 20px 40px -15px rgba(0, 0, 0, 0.7)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-green': 'flashGreen 0.6s ease-out',
        'flash-red': 'flashRed 0.6s ease-out',
      },
      keyframes: {
        flashGreen: {
          '0%': { backgroundColor: 'rgba(16, 185, 129, 0.35)' },
          '100%': { backgroundColor: 'transparent' },
        },
        flashRed: {
          '0%': { backgroundColor: 'rgba(239, 68, 68, 0.35)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
}
