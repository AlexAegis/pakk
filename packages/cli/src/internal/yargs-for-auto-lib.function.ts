import { ALL_AUTOLIB_FEATURES, AutolibOptions } from '@autolib/core';
import type { Argv } from 'yargs';

export const yargsForAutoLib = <T>(yargs: Argv<T>): Argv<T & AutolibOptions> => {
	return yargs
		.option('srcDir', {
			description: 'Source root, relative to the package directory',
			string: true,
			default: 'src',
		})
		.option('outDir', {
			description: "The expected output directory relative to the package's directory.",
			string: true,
			default: 'dist',
		})
		.option('sourcePackageJson', {
			description:
				"packageJson to modify and put in the artifact, relative to the package's directory.",
			string: true,
			default: 'package.json',
		})
		.option('autoPrettier', {
			description: 'Enable prettier integration',
			boolean: true,
			default: true,
		})
		.option('enabledFeatures', {
			description: 'When defined only these features will be enabled.',
			choices: Object.values(ALL_AUTOLIB_FEATURES),
			array: true,
			string: true,
			default: undefined,
		})
		.option('disabledFeatures', {
			description: 'When defined these features will be disabled.',
			choices: Object.values(ALL_AUTOLIB_FEATURES),
			array: true,
			string: true,
			default: undefined,
		});
};
