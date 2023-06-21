import { defineConfig } from 'vite';

// Intentionally imported across packages, this isn't source code so it's fine.
// It is to avoid cyclic dependencies.
import { pakk } from '../vite-plugin/src/index.js';

export default defineConfig({
	plugins: [pakk()],
});
