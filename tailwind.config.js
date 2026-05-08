/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6fd',
          100: '#d8eafd',
          200: '#a2c8ee',
          500: '#0b64c3',
          600: '#1464c0',
          700: '#084a90',
          800: '#174c81',
          900: '#1c2c34',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
