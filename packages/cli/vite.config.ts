import { defineConfig } from 'vite';

import { autolib } from 'vite-plugin-pakk';

export default defineConfig({
	plugins: [autolib()],
});
