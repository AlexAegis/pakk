import { basename } from 'node:path';
import { stripFileExtension } from './strip-file-extension.function.js';

export interface CreatePathRecordFromPathsOptions {
	/**
	 * @defaultValue true
	 */
	keyOnlyFilename?: boolean;
}

export const createPathRecordFromPaths = (
	paths: string[],
	options?: CreatePathRecordFromPathsOptions
): Record<string, string> => {
	const keyOnlyFilename = options?.keyOnlyFilename ?? true;
	return paths.reduce<Record<string, string>>((accumulator, next) => {
		let key = stripFileExtension(next);
		if (keyOnlyFilename) {
			key = basename(key);
		}
		accumulator[key] = next;
		return accumulator;
	}, {});
};
