import { defineConfig } from 'vite';

// Intentionally imported across packages, this isn't source code so it's fine.
// It is to avoid cyclic dependencies.
import { autolib } from '../vite-plugin-pakk/src/index.js';

export default defineConfig({
	plugins: [autolib()],
});
