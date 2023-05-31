import { DEFAULT_VITE_LIB_CONFIG, defineConfigWithDefaults } from '@alexaegis/vite';
import { mergeConfig } from 'vite';

import dts from 'vite-plugin-dts';

export default defineConfigWithDefaults(
	mergeConfig(DEFAULT_VITE_LIB_CONFIG, {
		plugins: [
			dts({
				entryRoot: 'src',
				copyDtsFiles: true,
			}),
		],
	})
);
