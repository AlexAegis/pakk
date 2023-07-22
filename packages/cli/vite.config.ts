import { defineLibConfig } from '@alexaegis/vite';

import { pakk } from 'vite-plugin-pakk';

export default defineLibConfig({
	plugins: [
		pakk({
			developmentPackageJsonExportsTarget: 'source',
		}),
	],
});
