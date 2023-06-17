import { AutoMetadataOptions, DEFAULT_AUTO_METADATA_KEYS_FROM_WORKSPACE } from '@autolib/core';
import type { Argv } from 'yargs';

/**
 * fallbackEntries and overrideEntries area missing from here, but they are
 * objects, would be awkward to use them through the cli.
 */
export const yargsForAutoMetadata = <T>(yargs: Argv<T>): Argv<T & AutoMetadataOptions> => {
	return yargs
		.group(['keysFromWorkspace', 'mandatoryKeys'], 'auto-metadata')
		.option('keysFromWorkspace', {
			description:
				'A list of packageJson keys from the workspace root package.json to autofill ' +
				'in built artifacts.',
			string: true,
			array: true,
			default: DEFAULT_AUTO_METADATA_KEYS_FROM_WORKSPACE,
		})
		.option('mandatoryKeys', {
			description:
				'A list of packageJson keys from the workspace root package.json to autofill ' +
				'in built artifacts.',
			string: true,
			array: true,
			default: DEFAULT_AUTO_METADATA_KEYS_FROM_WORKSPACE,
		});
};
