import { defineConfig } from 'vite';

// ? Intentionally imported across packages, this isn't source code so it's fine.
import { autolib } from '../vite-plugin-autolib/src/index.js';

export default defineConfig({
	plugins: [autolib()],
});
