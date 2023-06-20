import { defineConfig } from 'vite';

import { autolib } from 'vite-plugin-autolib';

export default defineConfig({
	plugins: [
		autolib({
			enabledFeatures: ['export', 'bin', 'copy-license', 'export-static'],
			srcDir: 'source',
			binBaseDir: 'cli',
			bins: '**/*',
			binIgnore: ['ignore'],
			staticExports: ['static'],
			dts: true,
		}),
	],
});
