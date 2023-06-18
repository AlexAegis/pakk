import { defineLibConfig } from '@alexaegis/vite';

import dts from 'vite-plugin-dts';

export default defineLibConfig({
	plugins: [
		dts({
			entryRoot: 'src',
			copyDtsFiles: true,
		}),
	],
});
