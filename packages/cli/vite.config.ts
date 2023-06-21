import { defineConfig } from 'vite';

import { autolib } from '../vite-plugin/src/index.js';

export default defineConfig({
	plugins: [autolib()],
});
