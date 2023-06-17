import { YargsBuilder, yargsForDryOption } from '@alexaegis/cli-tools';
import { createLogger } from '@alexaegis/logging';
import { DEFAULT_PACKAGE_JSON_SORTING_PREFERENCE, PackageJson } from '@alexaegis/workspace-tools';
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

	const sortResults = await Promise.all(
		options._.map((positional) => {
			const defaultSort =
				basename(positional.toString()) === 'package.json'
					? DEFAULT_PACKAGE_JSON_SORTING_PREFERENCE
					: [];

			return sortJsonFile(positional.toString(), {
				sortingPreference: defaultSort,
				check: options.check,
				dry: options.dry,
				logger,
			});
		})
	);

	if (options.check && sortResults.some((status) => !status)) {
		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(1);
	}
})();
