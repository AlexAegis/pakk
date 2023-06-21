import { defineConfig } from 'vite';

import { autolib } from 'vite-plugin-pakk';

export default defineConfig({
	plugins: [
		autolib({
			enabledFeatures: ['export'],
			srcDir: 'source',
			exportBaseDir: 'api',
			exports: '**/*',
			dts: true,
		}),
	],
});
