import { turnIntoExecutable } from '@alexaegis/fs';
import { globby } from 'globby';
import { getBundledFileExtension } from './append-bundle-file-extension.function.js';
import {
	normalizeMakeJavascriptFilesExecutableOptions,
	type MakeJavascriptFilesExecutableOptions,
} from './make-javascript-files-executable.function.options.js';

export const makeJavascriptFilesExecutable = async (
	path: string | string[],
	rawOptions: MakeJavascriptFilesExecutableOptions
): Promise<void> => {
	const options = normalizeMakeJavascriptFilesExecutableOptions(rawOptions);
	const dirtectoryContent = await globby(path, { cwd: options.cwd });
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
