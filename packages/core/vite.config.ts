import { DEFAULT_VITE_LIB_CONFIG } from '@alexaegis/vite';
import { mergeConfig } from 'vite';

// Intentionally imported across packages, this isn't source code so it's fine.
// It is to avoid cyclic dependencies.
import { pakk } from '../vite-plugin/src/index.js';

export default mergeConfig(DEFAULT_VITE_LIB_CONFIG, {
	plugins: [pakk()],
});
