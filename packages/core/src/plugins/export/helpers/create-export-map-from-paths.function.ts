import { Defined } from '@alexaegis/common';
import { basename, join, posix } from 'node:path';
import { AllBinPathCombinations } from '../../bin/auto-bin.class.js';
import { AllExportPathCombinations } from '../auto-export.class.js';
import { EntryPathVariantMap, PathVariantMap } from '../export-map.type.js';
import { stripFileExtension } from './strip-file-extension.function.js';

export interface CreateExportMapFromPathsOptions {
	/**
	 * Where the paths were searched from, can be extended further using
	 * the basepath.
	 */
	srcDir: string;

	/**
	 * Where the bundler will place the resulting files
	 */
	outDir: string;

	/**
	 * The directory where shims for the bins are placed
	 */
	shimDir?: string;

	/**
	 * A path every other path was search from, so in the result they will
	 * be prefixed with this
	 *
	 * @defaultValue '.'
	 */
	basePath?: string;

	/**
	 * What kind of keys shall the resulting object contain?
	 * - If set to 'extensionless-relative-path-from-base' then the keys will
	 *   equal to the input paths minus the extension
	 * - If set to 'extensionless-filename-only' then the keys will be set to
	 *   the filename only.
	 */
	keyKind: 'extensionless-relative-path-from-base' | 'extensionless-filename-only';
}

export type NormalizedCreateExportMapFromPathsOptions = Defined<CreateExportMapFromPathsOptions>;

/**
 * The resulting paths still contain their original extensions.
 */
export const createExportMapFromPaths = <
	Variants extends AllExportPathCombinations | AllBinPathCombinations =
		| AllExportPathCombinations
		| AllBinPathCombinations
>(
	pathsFromBase: string[],
	options: CreateExportMapFromPathsOptions
): EntryPathVariantMap<Variants> => {
	const basePath = options.basePath ?? '.';
	const exportMap: EntryPathVariantMap<Variants> = {};

	for (const path of pathsFromBase) {
		const key =
			options.keyKind === 'extensionless-filename-only'
				? stripFileExtension(basename(path))
				: './' + stripFileExtension(path);

		/**
		 * This is the path where we assume the file will be once it's bundled.
		 * In case this assumption is broken and this has to be amended,
		 * amend this variable. The '*-to-source' entry is not using
		 * this variable because that is not an assumption, but thruth.
		 */
		const assumedDistributionPath = posix.join(basePath, path);

		const pathVariants: Record<string, string> = {
			'development-to-source': './' + posix.join(options.srcDir, basePath, path), // The original full path, not used by default but there's an option if preferred
			'development-to-dist': './' + posix.join(options.outDir, assumedDistributionPath), // It is assumed that files in the outDir replicate their folder structure from the srcDir
			'distribution-to-dist': './' + assumedDistributionPath,
		};

		if (options.shimDir) {
			pathVariants['development-to-shim'] = './' + join(options.shimDir, path);
		}

		exportMap[key] = pathVariants as PathVariantMap<Variants>;
	}

	return exportMap;
};
