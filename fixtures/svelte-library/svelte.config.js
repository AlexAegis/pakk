// managed-by-autotool

import sveltePreprocess from 'svelte-preprocess';

export default {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: sveltePreprocess(),
	vitePlugin: {
		inspector: {
			holdMode: true,
			toggleKeyCombo: 'shift',
		},
	},
};