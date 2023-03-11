import { CwdOption, turnIntoExecutable } from '@alexaegis/fs';
import type { LoggerOption } from '@alexaegis/logging';
import { globby } from 'globby';
import type { InternalModuleFormat } from 'rollup';
import { getBundledFileExtension } from './append-bundle-file-extension.function.js';

export interface MakeJavascriptFilesExecutableOptions extends CwdOption, LoggerOption {
	format: InternalModuleFormat;
	packageJsonType: 'module' | 'commonjs';
}

export const makeJavascriptFilesExecutable = async (
	path: string | string[],
	options: MakeJavascriptFilesExecutableOptions
): Promise<void> => {
	const dirtectoryContent = await globby(path, { cwd: options?.cwd });
	const executables = dirtectoryContent.filter((bin) =>
		bin.endsWith(
			getBundledFileExtension({
				format: options.format,
				packageType: options.packageJsonType,
			})
		)
	);
	await Promise.all(executables.map((executable) => turnIntoExecutable(executable, options)));
};
