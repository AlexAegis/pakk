import { defineLibConfig } from '@alexaegis/vite';

import dts from 'vite-plugin-dts';

export default defineLibConfig({
	build: {
		lib: {
			entry: ['src/index.ts'],
		},
	},
	plugins: [
		dts({
			entryRoot: 'src',
			copyDtsFiles: true,
		}),
	],
});
