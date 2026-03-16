/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // เพิ่มบล็อคนี้เข้าไป
      fontFamily: {
        sans: ['Prompt', 'sans-serif'],
      },
    },
  },
  plugins: [],
}