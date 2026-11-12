/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#FFFFFF',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          cardHover: '#F8FAFC',
          border: '#E1E3E3',
          borderLight: '#E5E7EB',
          textMuted: '#64748B',
          textSub: '#4B5563',
          textMain: '#191F2C',
        },
        lookinto: {
          bg: '#FFFFFF',
          surface: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E1E3E3',
          borderLight: '#E5E7EB',
          textMain: '#191F2C',
          textBody: '#343B43',
          textMuted: '#64748B',
          blue: '#3C75D5',
          blueHover: '#2B63C0',
          blueLight: '#EEF4FD',
        },
        bull: {
          DEFAULT: '#10B981',
          light: '#059669',
          dim: 'rgba(16, 185, 129, 0.1)',
        },
        bear: {
          DEFAULT: '#EF4444',
          light: '#DC2626',
          dim: 'rgba(239, 68, 68, 0.1)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#D97706',
          dim: 'rgba(245, 158, 11, 0.1)',
        },
        shock: {
          DEFAULT: '#8B5CF6',
          light: '#7C3AED',
          dim: 'rgba(139, 92, 246, 0.1)',
        },
        cyan: {
          accent: '#0284C7',
          dim: 'rgba(2, 132, 199, 0.1)',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'specular': '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        'specular-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-green': 'flashGreen 0.6s ease-out',
        'flash-red': 'flashRed 0.6s ease-out',
      },
      keyframes: {
        flashGreen: {
          '0%': { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
          '100%': { backgroundColor: 'transparent' },
        },
        flashRed: {
          '0%': { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
}