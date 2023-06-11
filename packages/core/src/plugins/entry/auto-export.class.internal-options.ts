import { Defined } from '@alexaegis/common';
import { normalizeCwdOption, type CwdOption } from '@alexaegis/fs';
import { normalizeLoggerOption, type LoggerOption } from '@alexaegis/logging';
import type { LibraryFormats } from 'vite';
import {
	DEFAULT_EXPORT_FORMATS,
	DEFAULT_OUT_DIR,
	DEFAULT_SRC_DIR,
} from '../../internal/defaults.const.js';
import {
	AutoEntryExternalOptions,
	normalizeAutoEntryExternalOptions,
} from './auto-export.class.external-options.js';

export interface AutoEntryInternalOptions
	extends AutoEntryExternalOptions,
		CwdOption,
		LoggerOption {
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
}

export type NormalizedAutoEntryInternalOptions = Defined<AutoEntryInternalOptions>;

export const normalizeAutoEntryInternalOptions = (
	options: AutoEntryInternalOptions
): NormalizedAutoEntryInternalOptions => {
	return {
		...normalizeCwdOption(options),
		...normalizeLoggerOption(options),
		...normalizeAutoEntryExternalOptions(options),
		srcDir: options.srcDir ?? DEFAULT_SRC_DIR,
		outDir: options.outDir ?? DEFAULT_OUT_DIR,
		formats: options.formats ?? DEFAULT_EXPORT_FORMATS,
	};
};
