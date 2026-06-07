const { purple } = require('tailwindcss/colors');

const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        title: ['Ander Brush', 'serif'],
        symbol: ['Ander Symbols', 'serif'],
        subtitle: ['Fanwood', 'serif'],
      },
      borderWidth: {
        3: '3px',
      },
      colors: {
        primary: purple,
      },
      aria: {
        current: 'current="page"',
      },
    },
  },

  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};

module.exports = config;
