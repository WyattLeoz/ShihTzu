import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        teal: { DEFAULT: '#1D9E75', light: '#E1F5EE', dark: '#0F6E56', border: '#9FE1CB' },
        red: { DEFAULT: '#E24B4A', light: '#FCEBEB', dark: '#A32D2D', border: '#F5C4B3' },
        amber: { DEFAULT: '#EF9F27', light: '#FAEEDA', dark: '#854F0B', border: '#FAC775' },
        navy: { DEFAULT: '#042C53', mid: '#185FA5', light: '#E6F1FB', border: '#B5D4F4' },
        ink: { DEFAULT: '#1A1917', mid: '#3D3D3A', muted: '#888780', faint: '#C4C2BA' },
        paper: { DEFAULT: '#FAFAF8', card: '#FFFFFF', border: '#E8E5DC', hover: '#F5F3EE' },
      },
      ringWidth: {
        '2': '2px',
      },
      ringColor: {
        navy: '#042C53',
      },
    },
  },
  plugins: [],
}

export default config