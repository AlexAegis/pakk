import { DEFAULT_VITE_LIB_CONFIG } from '@alexaegis/vite';

import { mergeConfig } from 'vite';
import { pakk } from './src/index.js';

export default mergeConfig(DEFAULT_VITE_LIB_CONFIG, {
	plugins: [pakk()],
});
