import { defineConfig } from 'vite';
import { pakk } from 'vite-plugin-pakk';

export default defineConfig({
	plugins: [
		pakk({
			enabledFeatures: ['export'],
			srcDir: 'source',
			exportBaseDir: 'api',
			exports: '**/*',
			dts: true,
		}),
	],
});
