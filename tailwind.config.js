/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: { colors: { obsidian: { 900: '#202123', 700: '#343541', 500: '#10A37F', 100: '#F4F4F4' }, border: '#DCE3F0', muted: '#5B6B82' }, fontFamily: { sans: ['Inter', 'sans-serif'] }, boxShadow: { card: '0 8px 28px rgba(10,26,47,.045)' } } },
  plugins: []
};
