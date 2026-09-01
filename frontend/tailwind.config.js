/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        almond: '#d6bd98',
        matcha: '#677d6a',
        forest: '#40534c',
        eclipse: '#1a3636',
        canvas: '#f9f8f5',
        muted: '#efece6',
        border: '#d8d3c8',
        terracotta: '#c86d3b',
        brick: '#a33b3b',
      },
      fontFamily: {
        sans: ['Urbanist', 'Noto Sans Devanagari', 'sans-serif'],
        devanagari: ['Noto Sans Devanagari', 'Urbanist', 'sans-serif'],
        display: ['Rozha One', 'Urbanist', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
