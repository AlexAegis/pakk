import { normalizeCwdOption, type CwdOption } from '@alexaegis/fs';
import { normalizeLoggerOption, type LoggerOption } from '@alexaegis/logging';
import { DEFAULT_OUT_DIR } from '../index.js';

export const DEFAULT_STATIC_EXPORT_GLOBS = ['readme.md', 'static/**/*', 'export/**/*'];

export interface AutoExportStaticOptions extends LoggerOption, CwdOption {
	/**
	 * relative to cwd, this is where copied files will end up
	 * @defaultValue 'dist'
	 */
	outDir?: string;

	/**
	 * Relative to cwd, a folder whats content will be simply copied to
	 * `outDir` and made available using simple, additional export statements.
	 * Make sure their names don't overlap with other exports!
	 *
	 * @defaultValue ["readme.md", "static/\*\*", "export/**"]
	 */
	staticExportGlobs?: string[];
}

export const normalizeAutoExportStaticOptions = (
	options: AutoExportStaticOptions
): Required<AutoExportStaticOptions> => {
	return {
		...normalizeCwdOption(options),
		...normalizeLoggerOption(options),
		outDir: options.outDir ?? DEFAULT_OUT_DIR,
		staticExportGlobs: options.staticExportGlobs ?? DEFAULT_STATIC_EXPORT_GLOBS,
	};
};
