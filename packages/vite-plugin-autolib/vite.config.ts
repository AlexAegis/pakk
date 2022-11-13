import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { autolib } from './src/plugins/index.js';

export default defineConfig({
	plugins: [
		autolib({
			packageJsonTarget: 'out',
		}),
		dts({
			copyDtsFiles: true,
			insertTypesEntry: true,
			tsConfigFilePath: 'tsconfig.json',
			entryRoot: 'src',
		}),
	],
	build: {
		lib: {
			entry: './src/index.ts',
			formats: ['es', 'cjs'],
		},
	},
});
