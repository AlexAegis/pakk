import { Defined } from '@alexaegis/common';
import { posix } from 'node:path';
import { ExportMap } from '../export-map.type.js';
import { stripFileExtension } from './strip-file-extension.function.js';

export interface CreateExportMapFromPathsOptions {
	/**
	 * Where the paths were searched from, can be extended further using
	 * the basepath.
	 */
	srcDir: string;

	outDir: string;
	/**
	 * A path every other path was search from, so in the result they will
	 * be prefixed with this
	 *
	 * @defaultValue '.'
	 */
	basePath?: string;
}

export type NormalizedCreateExportMapFromPathsOptions = Defined<CreateExportMapFromPathsOptions>;

export const normalizeCreateExportMapFromPathsOptions = (
	options: CreateExportMapFromPathsOptions
): NormalizedCreateExportMapFromPathsOptions => {
	return {
		srcDir: options.srcDir,
		outDir: options.outDir,
		basePath: options.basePath ?? '.',
	};
};

/**
 * TODO: Enchance this by annotating each path with what kind of paths they are, relative to what targeting what (dist-to-dist, src-to-src, src-to-dist)
 */
export const createExportMapFromPaths = (
	pathsFromBase: string[],
	rawOptions: CreateExportMapFromPathsOptions
): ExportMap => {
	const options = normalizeCreateExportMapFromPathsOptions(rawOptions);
	return pathsFromBase.reduce<ExportMap>((exportMap, path) => {
		const exportKey = './' + stripFileExtension(path);
		// TODO: remove this block if not needed
		// if (!exportKey.startsWith('./')) {
		// 	exportKey = './' + exportKey;
		// }

		/**
		 * This is the path where we assume the file will be once it's bundled.
		 * In case this assumption is broken and this has to be amended,
		 * amend this variable. The '*-to-source' entry is not using
		 * this variable because that is not an assumption, but thruth.
		 */
		const assumedDistributionPath = posix.join(options.basePath, path);

		exportMap[exportKey] = {
			'development-to-source': './' + posix.join(options.srcDir, options.basePath, path), // The original full path, not used by default but there's an option if preferred
			'development-to-dist': './' + posix.join(options.outDir, assumedDistributionPath), // It is assumed that files in the outDir replicate their folder structure from the srcDir
			'distribution-to-dist': './' + assumedDistributionPath,
		};
		return exportMap;
	}, {});
};
