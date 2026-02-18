import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gorgon: {
          dark: '#0d0f14',
          panel: '#13161d',
          card: '#1a1e28',
          hover: '#222736',
          border: '#2a2f3d',
          'border-light': '#363c4e',
          text: '#c8cdd8',
          'text-dim': '#6b7280',
          'text-bright': '#e8ecf4',
        },
        action: {
          green: '#34d399',
          'green-dim': '#065f46',
          red: '#f87171',
          'red-dim': '#7f1d1d',
          yellow: '#fbbf24',
          'yellow-dim': '#78350f',
          blue: '#60a5fa',
          'blue-dim': '#1e3a5f',
          purple: '#a78bfa',
          'purple-dim': '#3b1f7a',
          orange: '#fb923c',
          'orange-dim': '#7c2d12',
          cyan: '#22d3ee',
          teal: '#2dd4bf',
          'teal-dim': '#134e4a',
        },
        rarity: {
          common: '#9ca3af',
          uncommon: '#4ade80',
          rare: '#60a5fa',
          exceptional: '#c084fc',
          epic: '#f59e0b',
          legendary: '#f97316',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Source Sans 3', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
