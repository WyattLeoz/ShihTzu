/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1D9E75',
          dark: '#0F6E56',
          50: '#E1F5EE',
          100: '#C3E9D8',
          200: '#96DDC1',
          300: '#68D1A9',
          400: '#3CC492',
          500: '#1D9E75',
          600: '#0F6E56',
          700: '#0D5C47',
          800: '#0A4A39',
          900: '#07382A',
        },
        danger: '#E24B4A',
        amber: '#EF9F27',
        navy: '#042C53',
        background: '#F8F7F4',
        card: '#FFFFFF',
        text: {
          primary: '#2C2C2A',
          muted: '#888780',
        },
        border: '#E5E3DC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'card-elevated': '0 4px 16px rgba(0, 0, 0, 0.10)',
      },
      borderRadius: {
        'card': '8px',
        'card-lg': '12px',
        'pill': '999px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}