import { globby } from 'globby';
import { basename, posix } from 'node:path';
import { stripFileExtension } from '../../../core/src/plugins/entry/helpers/strip-file-extension.function.js';

export const collectFileMap = async (
	cwd: string,
	globs: string[]
): Promise<Record<string, string>> => {
	const globbyResult = await globby(globs, { cwd, dot: true });
	return globbyResult.reduce<Record<string, string>>((accumulator, next) => {
		const key = `.${posix.sep}${basename(stripFileExtension(next))}`;
		accumulator[key] = `.${posix.sep}${next}`;
		return accumulator;
	}, {});
};
