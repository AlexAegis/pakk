import {
	defaultYargsFromPackageJson,
	yargsForCwdOption,
	yargsForDryOption,
	yargsForLogLevelOption,
} from '@alexaegis/cli-tools';
import { createLogger } from '@alexaegis/logging';
import type { PackageJson } from '@alexaegis/workspace-tools';
import yargs from 'yargs';
import packageJson from '../../package.json';
import { pakkStandaloneRunner } from '../internal/pakk-standalone-runner.function.js';
import { yargsForAutoBin } from '../internal/yargs-for-auto-bin.function.js';
import { yargsForAutoExportStatic } from '../internal/yargs-for-auto-export-static.function.js';
import { yargsForAutoExport } from '../internal/yargs-for-auto-export.function.js';
import { yargsForAutoMetadata } from '../internal/yargs-for-auto-metadata.function.js';
import { yargsForPakk } from '../internal/yargs-for-pakk.function.js';

const yarguments = yargsForDryOption(
	yargsForCwdOption(
		yargsForAutoMetadata(
			yargsForAutoExportStatic(
				yargsForAutoExport(
					yargsForAutoBin(
						yargsForLogLevelOption(
							yargsForPakk(
								defaultYargsFromPackageJson(packageJson as PackageJson)(
									yargs(process.argv.splice(2)),
								),
							),
						),
					),
				),
			),
		),
	),
);

void (async () => {
	const options = await yarguments.parseAsync();
	const logger = createLogger({
		name: 'pakk',
		minLevel: options.logLevel as number,
	});

	logger.trace('Parsed options', options);
	await pakkStandaloneRunner({ ...options, logger });
})();
