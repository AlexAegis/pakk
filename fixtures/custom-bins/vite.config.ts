import { defineConfig } from 'vite';

// ? Intentionally imported across packages, this isn't source code so it's fine.
import { autolib } from '../../packages/vite-plugin-autolib/src/index.js';

export default defineConfig({
	plugins: [
		autolib({
			enabledFeatures: [
				'export',
				'copy-license',
				'bin',
				'sort-package-json',
				'peer',
				'export-static',
			],
			srcDir: 'source',
			binBaseDir: 'cli',
			bins: '**/*',
			binIgnore: ['ignore'],
			staticExports: ['static'],
			dts: true,
		}),
	],
});
