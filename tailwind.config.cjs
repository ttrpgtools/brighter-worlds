const config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			fontFamily: {
        'title': ['Ander Brush', 'serif'],
        'symbol': ['Ander Symbols', 'serif'],
        'subtitle': ['Fanwood', 'serif']
      },
			borderWidth: {
				'3': '3px',
			},
		}
	},

	plugins: [
		require('@tailwindcss/forms'),
		require('@tailwindcss/typography'),
		require('@tailwindcss/line-clamp'),
	]
};

module.exports = config;
