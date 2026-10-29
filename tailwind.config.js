/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: { colors: { obsidian: { 900: '#0A1A2F', 700: '#12305C', 500: '#1E4FD8', 100: '#E8EEFB' }, border: '#DCE3F0', muted: '#5B6B82' }, fontFamily: { sans: ['Inter', 'sans-serif'] }, boxShadow: { card: '0 8px 28px rgba(10,26,47,.045)' } } },
  plugins: []
};
