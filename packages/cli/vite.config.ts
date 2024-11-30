import { DEFAULT_VITE_LIB_CONFIG } from '@alexaegis/vite';
import { mergeConfig } from 'vite';
import { pakk } from 'vite-plugin-pakk';

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
export default mergeConfig(DEFAULT_VITE_LIB_CONFIG, {
	plugins: [
		pakk({
			developmentPackageJsonExportsTarget: 'source',
		}),
	],
});
