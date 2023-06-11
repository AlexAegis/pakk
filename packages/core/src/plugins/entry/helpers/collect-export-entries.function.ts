import { readdir } from 'node:fs/promises';

import { basename, join } from 'node:path';
import { enterPathPosix } from './enter-path.function.js';
import { existsDirectory } from './exists-directory.function.js';
import { offsetRelativePathPosix } from './offset-relative-path-posix.function.js';
import { stripFileExtension } from './strip-file-extension.function.js';

export const isTestFileName = (fileName: string): boolean =>
	fileName.includes('.spec.') || fileName.includes('.test.');

/**
 * @deprecated use globby
 */
export const collectImmediate = async (
	path: string = process.cwd(),
	kind?: 'file' | 'directory'
): Promise<string[]> => {
	if (existsDirectory(path)) {
		const entries = await readdir(path, { withFileTypes: true });
		return entries
			.filter((entry) =>
				kind
					? (kind === 'file' && entry.isFile()) ||
					  (kind === 'directory' && entry.isDirectory())
					: true
			)
			.map((entry) => entry.name)
			.filter((fileName) => !isTestFileName(fileName));
	} else {
		return [];
	}
};

/**
 * @param rootPath path entry will be relative to this
 * @param exportPath path from which files are collected
 * @deprecated garbage only used in autobin
 */
export const collectFileNamePathEntries = async (
	rootPath: string,
	exportPath = '.'
): Promise<Record<string, string>> => {
	const collectPath = join(rootPath, exportPath);
	const immediateFileNames = await collectImmediate(collectPath, 'file');

	return immediateFileNames.reduce<Record<string, string>>((accumulator, next) => {
		const fileName = basename(next);
		const namestub = stripFileExtension(next);
		accumulator[namestub] = join(exportPath, fileName);
		return accumulator;
	}, {});
};

export const offsetPathArray = (
	pathArray: string[],
	offsetPath: string,
	skipOffset?: string[]
): string[] => {
	return pathArray.map((path) =>
		skipOffset?.includes(path) ? path : offsetRelativePathPosix(offsetPath, path)
	);
};

export const offsetPathRecordValues = (
	pathRecord: Record<string, string>,
	offsetPath: string,
	enterCount = 0,
	skipOffset: string[] = []
): Record<string, string> => {
	return Object.entries(pathRecord).reduce<Record<string, string>>((result, [key, path]) => {
		if (path) {
			const enteredPath = enterPathPosix(path, enterCount);
			result[key] = skipOffset.includes(path)
				? enteredPath
				: offsetRelativePathPosix(offsetPath, enteredPath);
		}
		return result;
	}, {});
};
