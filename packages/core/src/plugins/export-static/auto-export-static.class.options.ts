import { Defined } from '@alexaegis/common';
import { normalizeCwdOption, type CwdOption } from '@alexaegis/fs';
import { normalizeLoggerOption, type LoggerOption } from '@alexaegis/logging';
import { DEFAULT_OUT_DIR, DEFAULT_STATIC_EXPORT_GLOBS } from '../../internal/defaults.const.js';

export interface AutoExportStaticExternalOptions {
	/**
	 * Relative to cwd, a folder whats content will be simply copied to
	 * `outDir` and made available using simple, additional export statements.
	 * Make sure their names don't overlap with other exports!
	 *
	 * @defaultValue ["readme.md", "static/\*\*", "export/**"]
	 */
	staticExports?: string[] | undefined;
}

export type NormalizedAutoExportStaticExternalOptions = Defined<AutoExportStaticExternalOptions>;

export const normalizeAutoExportStaticExternalOptions = (
	options: AutoExportStaticExternalOptions
): NormalizedAutoExportStaticExternalOptions => {
	return {
		staticExports: options.staticExports ?? DEFAULT_STATIC_EXPORT_GLOBS,
	};
};

export interface AutoExportStaticInternalOptions
	extends AutoExportStaticExternalOptions,
		LoggerOption,
		CwdOption {
	/**
	 * relative to cwd, this is where copied files will end up
	 * @defaultValue 'dist'
	 */
	outDir?: string | undefined;
}

export type NormalizedAutoExportStaticInternalOptions = Defined<AutoExportStaticInternalOptions>;

export const normalizeAutoExportStaticInternalOptions = (
	options: AutoExportStaticInternalOptions
): NormalizedAutoExportStaticInternalOptions => {
	return {
		...normalizeCwdOption(options),
		...normalizeLoggerOption(options),
		...normalizeAutoExportStaticExternalOptions(options),
		outDir: options.outDir ?? DEFAULT_OUT_DIR,
	};
};
