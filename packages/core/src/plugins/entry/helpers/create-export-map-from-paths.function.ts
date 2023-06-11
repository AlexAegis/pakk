import { basename } from 'node:path';
import { ExportMap } from '../../autolib-plugin.type.js';
import { stripFileExtension } from './strip-file-extension.function.js';

export interface CreateExportMapFromPathsOptions {
	/**
	 * @defaultValue true
	 */
	keyOnlyFilename?: boolean;
}

/**
 * TODO: Enchance this by annotating each path with what kind of paths they are, relative to what targeting what (dist-to-dist, src-to-src, src-to-dist)
 */
export const createExportMapFromPaths = (
	paths: string[],
	options?: CreateExportMapFromPathsOptions
): ExportMap => {
	const keyOnlyFilename = options?.keyOnlyFilename ?? true;
	return paths.reduce<ExportMap>((accumulator, next) => {
		let key = stripFileExtension(next);
		if (keyOnlyFilename) {
			key = basename(key);
		}
		accumulator[key] = next;
		return accumulator;
	}, {});
};
