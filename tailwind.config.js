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
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
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
