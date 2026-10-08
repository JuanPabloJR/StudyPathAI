/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tokens del diseño "Panel de Progreso" (UX Pilot)
        ink:     '#1E293B', // texto principal, sidebar, botones primarios
        body:    '#475569', // texto secundario
        muted:   '#94A3B8', // etiquetas y texto terciario
        surface: '#F8FAFC', // fondo de página
        accent: {
          DEFAULT: '#0369A1',
          50:  '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
        },
        success:  '#10B981',
        estimate: '#7C3AED', // serie "Estimado" en gráficas (validada contra accent)
      },
      fontFamily: {
        sans:    ['"Open Sans"', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
