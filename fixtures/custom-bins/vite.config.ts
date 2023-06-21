import { defineConfig } from 'vite';

import { autolib } from 'vite-plugin-pakk';

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
