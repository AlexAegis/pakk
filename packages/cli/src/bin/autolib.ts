import { autolibStandaloneRunner } from '../index.js';

console.log('autolib cli');
// Todo add some yargs

void (async () => {
	await autolibStandaloneRunner({ dry: true });
})();
