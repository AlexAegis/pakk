import { defineConfig } from 'vite';

import { autolib } from './src/index.js';

export default defineConfig({
	plugins: [autolib()],
});
