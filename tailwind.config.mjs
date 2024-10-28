/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			screens: {
				xs: "384px",
			},
			fontFamily: {
				sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
				mono: ['"Fira Code"', ...`ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace`.split(',')],
			}
		},
	},
	plugins: [require("@tailwindcss/typography"), function ({ addVariant }) {
		addVariant('child', '& > *');
		addVariant('child-hover', '& > *:hover');
	}],
};
