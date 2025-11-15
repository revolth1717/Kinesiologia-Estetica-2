/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  safelist: [
    // Etiquetas de estado de citas
    'bg-green-100', 'text-green-800',
    'bg-yellow-100', 'text-yellow-800',
    'bg-red-100', 'text-red-800',
    'bg-gray-100', 'text-gray-800',
    'bg-yellow-400', 'ring-yellow-300', 'text-black',
    'dark:bg-yellow-400', 'dark:text-black', 'dark:ring-yellow-300',
    'bg-red-500', 'ring-red-400',
    'dark:bg-red-500', 'dark:ring-red-400',
    'bg-green-500', 'ring-green-400',
    'dark:bg-green-500', 'dark:ring-green-400',
  ],
  theme: {
    extend: {
      colors: {
        pink: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
      },
      fontFamily: {
        poppins: ['var(--font-poppins)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};