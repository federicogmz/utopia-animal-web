/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Elim Refugio Animal — verde bosque
        elim: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
          lavender: '#c4b5fd',
        },
        // Utopía Animal Vet — morado + naranja
        utopia: {
          50:  '#f5f0ff',
          100: '#ede5ff',
          200: '#ddd0ff',
          300: '#c4aeff',
          400: '#a87dff',
          500: '#8c52ff',
          600: '#7a3df0',
          700: '#6929d4',
          800: '#5720ae',
          900: '#481d8c',
          950: '#2d0f60',
          orange: '#f9854f',
          'orange-light': '#fdd4bc',
          'orange-dark': '#d95f25',
          gold:  '#fdd268',
          blue:  '#3a83ee',
          'blue-light': '#e0f2fe',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      typography: (theme) => ({
        elim: {
          css: {
            '--tw-prose-body': theme('colors.gray[700]'),
            '--tw-prose-headings': theme('colors.elim[900]'),
            '--tw-prose-links': theme('colors.elim[700]'),
            '--tw-prose-bold': theme('colors.elim[900]'),
            '--tw-prose-counters': theme('colors.elim[600]'),
            '--tw-prose-bullets': theme('colors.elim[500]'),
            '--tw-prose-hr': theme('colors.elim[100]'),
            '--tw-prose-quotes': theme('colors.elim[900]'),
            '--tw-prose-quote-borders': theme('colors.elim[400]'),
            '--tw-prose-code': theme('colors.elim[900]'),
            '--tw-prose-pre-bg': theme('colors.elim[950]'),
          },
        },
        utopia: {
          css: {
            '--tw-prose-body': theme('colors.gray[700]'),
            '--tw-prose-headings': theme('colors.utopia[900]'),
            '--tw-prose-links': theme('colors.utopia[600]'),
            '--tw-prose-bold': theme('colors.utopia[900]'),
            '--tw-prose-counters': theme('colors.utopia[500]'),
            '--tw-prose-bullets': theme('colors.utopia[400]'),
            '--tw-prose-hr': theme('colors.utopia[100]'),
            '--tw-prose-quotes': theme('colors.utopia[900]'),
            '--tw-prose-quote-borders': theme('colors.utopia[400]'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
