import { defineLibConfig } from '@alexaegis/vite';

import dts from 'vite-plugin-dts';

// ? Intentionally imported across packages, this isn't source code so it's fine.
import { autolib } from '../vite-plugin-autolib/src/index.js';

export default defineLibConfig({
	plugins: [
		autolib({
			enabledFeatures: ['export'],
		}),
		dts({
			entryRoot: 'src',
			copyDtsFiles: true,
		}),
	],
});
