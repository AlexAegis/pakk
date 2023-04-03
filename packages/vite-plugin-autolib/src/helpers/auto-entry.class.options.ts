import { normalizeCwdOption, type CwdOption } from '@alexaegis/fs';
import { normalizeLoggerOption, type LoggerOption } from '@alexaegis/logging';
import type { LibraryFormats } from 'vite';
import { DEFAULT_EXPORT_FORMATS, DEFAULT_OUT_DIR } from '../index.js';
import { DEFAULT_SRC_DIR } from '../plugins/autolib.plugin.options.js';

export const DEFAULT_ENTRY_DIR = './';

export interface AutoEntryOptions extends CwdOption, LoggerOption {
	/**
	 * @defaultValue 'src'
	 */
	sourceDirectory?: string;

	/**
	 * @defaultValue '["es", "cjs"]'
	 */
	formats?: LibraryFormats[];

	/**
	 * @defaultValue 'dist'
	 */
	outDir?: string;

	/**
	 * The files to treat as entry points to be exported from relative from
	 * the `srcDir` directory.
	 * It's usually `.` meaning files directly in `src` are considered the
	 * entry points of the library
	 *
	 * @defaultValue '.'
	 */
	entryDir?: string;
}

export const normalizeAutoEntryOptions = (
	options: AutoEntryOptions
): Required<AutoEntryOptions> => {
	return {
		...normalizeCwdOption(options),
		...normalizeLoggerOption(options),
		entryDir: options.entryDir ?? DEFAULT_ENTRY_DIR,
		formats: options.formats ?? DEFAULT_EXPORT_FORMATS,
		outDir: options.outDir ?? DEFAULT_OUT_DIR,
		sourceDirectory: options.sourceDirectory ?? DEFAULT_SRC_DIR,
	};
};
