import { Defined } from '@alexaegis/common';
import { normalizeCwdOption, type CwdOption } from '@alexaegis/fs';
import { normalizeLoggerOption, type LoggerOption } from '@alexaegis/logging';
import type { LibraryFormats } from 'vite';
import {
	DEFAULT_ENTRY_DIR,
	DEFAULT_EXPORT_FORMATS,
	DEFAULT_OUT_DIR,
	DEFAULT_SRC_DIR,
} from '../../internal/defaults.const.js';

export interface AutoEntryOptions extends CwdOption, LoggerOption {
	/**
	 * @defaultValue 'src'
	 */
	srcDir?: string | undefined;

	/**
	 * @defaultValue '["es", "cjs"]'
	 */
	formats?: LibraryFormats[] | undefined;

	/**
	 * @defaultValue 'dist'
	 */
	outDir?: string | undefined;

	/**
	 * The files to treat as entry points to be exported from relative from
	 * the `srcDir` directory.
	 * It's usually `.` meaning files directly in `src` are considered the
	 * entry points of the library
	 *
	 * @defaultValue '.'
	 */
	entryDir?: string | undefined;
}

export type NormalizedAutoEntryOptions = Defined<AutoEntryOptions>;

export const normalizeAutoEntryOptions = (
	options: AutoEntryOptions
): NormalizedAutoEntryOptions => {
	return {
		...normalizeCwdOption(options),
		...normalizeLoggerOption(options),
		entryDir: options.entryDir ?? DEFAULT_ENTRY_DIR,
		formats: options.formats ?? DEFAULT_EXPORT_FORMATS,
		outDir: options.outDir ?? DEFAULT_OUT_DIR,
		srcDir: options.srcDir ?? DEFAULT_SRC_DIR,
	};
};
