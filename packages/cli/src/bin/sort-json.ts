import { YargsBuilder, yargsForDryOption } from '@alexaegis/cli-tools';
import { createLogger } from '@alexaegis/logging';
import type { PackageJson } from '@alexaegis/workspace-tools';
import { createJsonSortingPreferenceNormalizer } from '@alexaegis/workspace-tools/sort';

import { basename } from 'node:path';
import { type Argv } from 'yargs';
import packageJson from '../../package.json';

import { sortJsonFile } from '../sort/index.js';

// TODO: not implemented
const yargsForSortJson = <T>(yargs: Argv<T>): Argv<T & { check: boolean }> => {
	return yargs.option('check', {
		boolean: true,
		description:
			'Checks if every packageJson in a workspace conforms to the ordering, fails if not',
		default: false,
	});
};

const yarguments = YargsBuilder.withDefaults(packageJson as PackageJson)
	.add(yargsForSortJson)
	.add(yargsForDryOption)
	.build();

void (async () => {
	const options = await yarguments.parseAsync();
	const logger = createLogger({ name: 'sort-json' });

	const sortResults = await Promise.allSettled(
		options._.map(async (positional) => {
			const fileName = basename(positional.toString());
			const sortNormalizer = await createJsonSortingPreferenceNormalizer(fileName);
			const sortingPreference = sortNormalizer();

			return await sortJsonFile(positional.toString(), {
				sortingPreference,
				check: options.check,
				dry: options.dry,
				logger,
			});
		}),
	);

	if (
		options.check &&
		sortResults.some((result) => result.status === 'rejected' || !result.value)
	) {
		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(1);
	}
})();
