import { posix } from 'node:path';

import { DEFAULT_OUT_DIR } from '@alexaegis/vite';
import { DEFAULT_BINSHIM_DIR, DEFAULT_BIN_DIR } from '../../../internal/defaults.const.js';
import { PackageJsonExportTarget, PackageJsonKind } from '../../../package-json/index.js';
import { enterPathPosix } from './enter-path.function.js';
import { offsetRelativePathPosix } from './offset-relative-path-posix.function.js';

export interface RetargetPackageJsonOptions {
	packageJsonKind: PackageJsonKind;
	packageJsonExportTarget: PackageJsonExportTarget;

	/**
	 * @defaultValue 'dist'
	 */
	outDir?: string;

	/**
	 * @defaultValue 'shims'
	 */
	shimDir?: string;

	/**
	 * @defaultValue 'bin
	 */
	binDir?: string;
}

/**
 * This function should be able to turn a relative path from cwd pointing to
 * a source file, into a path that will point to a
 * different projection of the same file, like it's built equivalent or its
 * shim
 *
 */
export const retargetPackageJsonPath = (
	path: string,
	options: RetargetPackageJsonOptions
): string => {
	const outDir = options.outDir ?? DEFAULT_OUT_DIR;
	const binDir = options.binDir ?? DEFAULT_BIN_DIR;
	const shimDir = options.shimDir ?? DEFAULT_BINSHIM_DIR;
	// How many path segments to pop off from the beginning of the path
	let enterCount = 0;
	// Path segment to prepend the path with
	let offsetPath = '';

	if (options.packageJsonKind === PackageJsonKind.SOURCE) {
		switch (options.packageJsonExportTarget) {
			case PackageJsonExportTarget.SOURCE: {
				offsetPath = '';
				enterCount = 0;
				break;
			}
			case PackageJsonExportTarget.DIST: {
				offsetPath = outDir;
				enterCount = 1;
				break;
			}
			case PackageJsonExportTarget.SHIM: {
				offsetPath = shimDir;
				enterCount = 1 + posix.normalize(binDir).split(posix.sep).length;
				break;
			}
		}
	} else {
		switch (options.packageJsonExportTarget) {
			case PackageJsonExportTarget.SOURCE: {
				throw new Error(
					'Invalid configuration! The distrubuted packageJson can only target the distributed exports!'
				);
			}
			case PackageJsonExportTarget.DIST: {
				offsetPath = '';
				enterCount = 1;

				break;
			}
			case PackageJsonExportTarget.SHIM: {
				throw new Error(
					'Invalid configuration! The distrubuted packageJson can only target the distributed exports!'
				);
			}
		}
	}

	const enteredPath = enterPathPosix(path, enterCount);
	return offsetRelativePathPosix(offsetPath, enteredPath);
};
