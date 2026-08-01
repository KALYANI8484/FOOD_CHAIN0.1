/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        text: 'var(--text)',
        accent: 'var(--accent)',
        'accent-2': 'var(--accent-2)',
        primary: 'var(--primary)',
        'primary-dark': 'var(--primary-dark)',
        oxblood: '#4A0E17',
        champagne: '#F7F4EF',
        gold: '#C5A059',
        muted: 'var(--muted)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fadeIn 0.4s ease both',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
