const { purple } = require('tailwindcss/colors');

const config = {
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

  plugins: [],
};

module.exports = config;
