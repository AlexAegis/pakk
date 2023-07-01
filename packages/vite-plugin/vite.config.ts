import { defineLibConfig } from '@alexaegis/vite';

import { pakk } from './src/index.js';

export default defineLibConfig({
	plugins: [pakk()],
});
