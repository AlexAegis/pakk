import {
	YargsBuilder,
	yargsForCwdOption,
	yargsForDryOption,
	yargsForLogLevelOption,
} from '@alexaegis/cli-tools';
import { createLogger } from '@alexaegis/logging';
import { PackageJson } from '@alexaegis/workspace-tools';
import packageJson from '../../package.json';
import { autolibStandaloneRunner } from '../internal/autolib-standalone-runner.function.js';
import { yargsForAutoBin } from '../internal/yargs-for-auto-bin.function.js';
import { yargsForAutoExportStatic } from '../internal/yargs-for-auto-export-static.function.js';
import { yargsForAutoExport } from '../internal/yargs-for-auto-export.function.js';
import { yargsForAutoLib } from '../internal/yargs-for-auto-lib.function.js';
import { yargsForAutoMetadata } from '../internal/yargs-for-auto-metadata.function.js';

const yarguments = YargsBuilder.withDefaults(packageJson as PackageJson)
	.add(yargsForAutoLib)
	.add(yargsForLogLevelOption)
	.add(yargsForAutoBin)
	.add(yargsForAutoExport)
	.add(yargsForAutoExportStatic)
	.add(yargsForAutoMetadata)
	.add(yargsForCwdOption)
	.add(yargsForDryOption)
	.build();

void (async () => {
	const options = await yarguments.parseAsync();
	const logger = createLogger({
		name: 'autolib',
		minLevel: options.logLevel,
	});

	logger.trace('Parsed options', options);
	await autolibStandaloneRunner({ ...options, logger });
})();
