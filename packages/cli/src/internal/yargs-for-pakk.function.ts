import { PakkOptions, pakkFeatures } from '@pakk/core';
import type { Argv } from 'yargs';

export const yargsForPakk = <T>(yargs: Argv<T>): Argv<T & PakkOptions> => {
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
			choices: pakkFeatures,
			array: true,
			string: true,
		})
		.option('disabledFeatures', {
			description: 'When defined these features will be disabled.',
			choices: pakkFeatures,
			array: true,
			string: true,
		});
};