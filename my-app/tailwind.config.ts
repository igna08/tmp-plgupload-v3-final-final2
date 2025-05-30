import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        shopifyGreen: '#1AAB9B',
        neutralLightest: '#F6F8FA',
        neutralLighter: '#F2F4F6',
        neutralLight: '#E1E5EA',
        neutralMedium: '#CDD2DD',
        neutralDark: '#1F2933',
        neutralDarker: '#111827',
        neutralTextSecondary: '#4B5563',
        accentBlue: '#2B8FAA',
        accentYellow: '#FFC857',
        accentRed: '#EF4444',
      },
      borderRadius: {
        radiusSmall: '6px',
        radiusMedium: '8px',
        radiusLarge: '12px',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
    },
  },
  plugins: [],
}
export default config
