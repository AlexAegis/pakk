import { Defined } from '@alexaegis/common';
import { normalizeCwdOption, type CwdOption } from '@alexaegis/fs';
import { normalizeLoggerOption, type LoggerOption } from '@alexaegis/logging';
import { DEFAULT_OUT_DIR, DEFAULT_STATIC_EXPORT_GLOBS } from '../../internal/defaults.const.js';

export interface AutoExportStaticOptions extends LoggerOption, CwdOption {
	/**
	 * relative to cwd, this is where copied files will end up
	 * @defaultValue 'dist'
	 */
	outDir?: string | undefined;

	/**
	 * Relative to cwd, a folder whats content will be simply copied to
	 * `outDir` and made available using simple, additional export statements.
	 * Make sure their names don't overlap with other exports!
	 *
	 * @defaultValue ["readme.md", "static/\*\*", "export/**"]
	 */
	staticExportGlobs?: string[] | undefined;
}

export type NormalizedAutoExportStaticOptions = Defined<AutoExportStaticOptions>;

export const normalizeAutoExportStaticOptions = (
	options: AutoExportStaticOptions
): NormalizedAutoExportStaticOptions => {
	return {
		...normalizeCwdOption(options),
		...normalizeLoggerOption(options),
		outDir: options.outDir ?? DEFAULT_OUT_DIR,
		staticExportGlobs: options.staticExportGlobs ?? DEFAULT_STATIC_EXPORT_GLOBS,
	};
};
