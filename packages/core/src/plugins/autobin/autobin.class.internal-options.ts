import type { Defined } from '@alexaegis/common';
import { normalizeCwdOption, type CwdOption } from '@alexaegis/fs';
import { normalizeLoggerOption, type LoggerOption } from '@alexaegis/logging';
import { DEFAULT_OUT_DIR } from '@alexaegis/vite';
import {
	DEFAULT_BINSHIM_DIR,
	DEFAULT_BIN_DIR,
	DEFAULT_PACKAGE_EXPORT_IGNORES,
	DEFAULT_SRC_DIR,
} from '../../internal/defaults.const.js';
import { ALL_NPM_HOOKS } from '../../package-json/package-json-npm-hooks.const.js';

export interface AutoBinExternalOptions {
	/**
	 * The files to treat as bins elative from the `srcDir + binBaseDir`
	 * directory.
	 * It's usually `*` meaning all files directly here are considered the
	 * entry points of the library.
	 *
	 * @defaultValue '*'
	 */
	bins?: string | string[] | undefined;

	/**
	 * What paths to ignore when collecting bins in addition to
	 * `defaultBinIgnore` so you're not dropping the defaults when you just
	 * want to add additional ignore entries.
	 *
	 * @defaultValue []
	 */
	binIgnore?: string[] | undefined;

	/**
	 * By default test files are excluded
	 *
	 * @defaultValue '*.(spec|test).*'
	 */
	defaultBinIgnore?: string[] | undefined;

	/**
	 * Relative path to `srcDir` if you want your exports to start from a
	 * different directory.
	 *
	 * @defaultValue 'bin'
	 */
	binBaseDir?: string | undefined;
}

export interface AutoBinOptions extends AutoBinExternalOptions, CwdOption, LoggerOption {
	/**
	 * @defaultValue 'src'
	 */
	srcDir?: string | undefined;

	/**
	 * Relative to the package.json, usually './dist'
	 *
	 * used to mark the built scripts as executable
	 *
	 * @defaultValue 'dist'
	 */
	outDir?: string | undefined;

	/**
	 * A directory where shims for the built bins would be placed
	 * All these scripts do is to import the yet-to-be-built binary so
	 * package managers hava something to symlink to before it's built.
	 *
	 * ! This folder has to be ignored by typescript as it contains broken
	 * ! imports before the package is built
	 *
	 * @defaultValue 'shims'
	 */
	shimDir?: string | undefined;

	/**
	 * The hooks this function will search for
	 * @defaultValue ALL_NPM_HOOKS
	 */
	enabledHooks?: string[] | undefined;
}

export type NormalizedAutoBinOptions = Defined<AutoBinOptions>;

export const normalizeAutoBinOptions = (options: AutoBinOptions): NormalizedAutoBinOptions => {
	return {
		...normalizeLoggerOption(options),
		...normalizeCwdOption(options),
		binBaseDir: options.binBaseDir ?? DEFAULT_BIN_DIR,
		binIgnore: options.binIgnore ?? [],
		defaultBinIgnore: options.defaultBinIgnore ?? DEFAULT_PACKAGE_EXPORT_IGNORES,
		bins: options.bins ?? DEFAULT_BIN_DIR,
		srcDir: options.srcDir ?? DEFAULT_SRC_DIR,
		outDir: options.outDir ?? DEFAULT_OUT_DIR,
		shimDir: options.shimDir ?? DEFAULT_BINSHIM_DIR,
		enabledHooks: options.enabledHooks ?? ALL_NPM_HOOKS,
	};
};
