import { defineConfig } from 'vite';

import { pakk } from './src/index.js';

export default defineConfig({
	plugins: [pakk()],
});
