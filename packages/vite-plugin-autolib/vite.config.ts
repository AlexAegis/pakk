import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { autolib } from './src/plugins/index.js';

console.log('env', process.env);

export default defineConfig({
	plugins: [
		autolib(),
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
