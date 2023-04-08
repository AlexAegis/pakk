import type { Defined } from '@alexaegis/common';
import { normalizeCwdOption, type CwdOption } from '@alexaegis/fs';
import { normalizeLoggerOption, type LoggerOption } from '@alexaegis/logging';
import { DEFAULT_SRC_DIR } from '../plugins/autolib.plugin.options.js';
import { ALL_NPM_HOOKS } from './auto-bin.class.js';
import { DEFAULT_OUT_DIR } from './defaults.const.js';

export const DEFAULT_BIN_DIR = 'bin';
export const DEFAULT_BINSHIM_DIR = 'shims';

export interface AutoBinOptions extends CwdOption, LoggerOption {
	/**
	 * @defaultValue 'src'
	 */
	srcDir?: string | undefined;

	/**
	 * Every script directly in this folder will be treated as a bin
	 *
	 * Relative to `srcDir`.
	 *
	 * @defaultValue 'bin'
	 */
	binDir?: string | undefined;

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

export const normalizeAutoBinOptions = (options: AutoBinOptions): Defined<AutoBinOptions> => {
	return {
		...normalizeLoggerOption(options),
		...normalizeCwdOption(options),
		srcDir: options.srcDir ?? DEFAULT_SRC_DIR,
		outDir: options.outDir ?? DEFAULT_OUT_DIR,
		binDir: options.binDir ?? DEFAULT_BIN_DIR,
		shimDir: options.shimDir ?? DEFAULT_BINSHIM_DIR,
		enabledHooks: options.enabledHooks ?? ALL_NPM_HOOKS,
	};
};
