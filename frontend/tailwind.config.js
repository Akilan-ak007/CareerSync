/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#000000',
          silver: '#D1D0D0',
          rosy: '#988686',
          cocoa: '#5C4E4E',
          dark: '#1C1717',
          darker: '#0F0B0B',
          card: '#292121',
        }
      }
    },
  },
  plugins: [],
}
