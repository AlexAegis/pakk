import { defineConfig } from 'vite';

// ? Intentionally imported across packages, this isn't source code so it's fine.
import { autolib } from '../../packages/vite-plugin-autolib/src/index.js';

export default defineConfig({
	plugins: [
		autolib({
			enabledFeatures: ['export'],
			srcDir: 'source',
			exportBaseDir: 'api',
			exports: '**/*',
			dts: false,
		}),
	],
});
