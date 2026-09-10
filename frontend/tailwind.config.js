/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bx-canvas': 'var(--bx-canvas)',
        'bx-surface': 'var(--bx-surface-solid)',
        'bx-primary': 'var(--bx-primary)',
        'bx-primary-hover': 'var(--bx-primary-hover)',
        'bx-title': 'var(--bx-title)',
        'bx-text': 'var(--bx-text)',
        'bx-muted': 'var(--bx-muted)',
        'bx-border': 'var(--bx-border)',
        'bx-border-strong': 'var(--bx-border-strong)',
        'bx-divider': 'var(--bx-divider)',
        'bx-pill': 'var(--bx-pill)',
        'bx-table-header': 'var(--bx-table-header)',
        'bx-row-hover': 'var(--bx-row-hover)',
        'bx-danger': 'var(--bx-danger)',
        'bx-success': 'var(--bx-success)',
        'bx-warning': 'var(--bx-warning)',
        'bx-info': 'var(--bx-info)',
      },
      borderColor: {
        'bx-border': 'var(--bx-border)',
        'bx-border-strong': 'var(--bx-border-strong)',
        'bx-divider': 'var(--bx-divider)',
        'bx-primary': 'var(--bx-primary)',
        'bx-danger': 'var(--bx-danger)',
        'bx-success': 'var(--bx-success)',
        'bx-warning': 'var(--bx-warning)',
        'bx-info': 'var(--bx-info)',
      },
      fontFamily: {
        sans: ['Tajawal', 'Cairo', 'sans-serif'],
        display: ['Syne', 'Alexandria', 'Tajawal', 'sans-serif'],
        geo: ['Alexandria', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
