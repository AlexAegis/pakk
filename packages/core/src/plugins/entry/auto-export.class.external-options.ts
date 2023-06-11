import { Defined } from '@alexaegis/common';
import {
	DEFAULT_PACKAGE_EXPORTS,
	DEFAULT_PACKAGE_EXPORT_BASEDIR,
	DEFAULT_PACKAGE_EXPORT_IGNORES,
} from '../../internal/defaults.const.js';

export interface AutoEntryExternalOptions {
	/**
	 * The files to treat as entry points to be exported from relative from
	 * the `srcDir + exportBaseDir` directory.
	 * It's usually `*` meaning all files directly here are considered the
	 * entry points of the library.
	 *
	 * @defaultValue '*'
	 */
	exports?: string | string[] | undefined;

	/**
	 * What paths to ignore when collecting exports in addition to
	 * `defaultExportsIgnore` so you're not dropping the defaults when you just
	 * want to add additional ignore entries.
	 *
	 * @defaultValue undefiend
	 */
	exportsIgnore?: string | string[] | undefined;

	/**
	 * By default test files are excluded
	 *
	 * @defaultValue '*.(spec|test).*'
	 */
	defaultExportsIgnore?: string | string[] | undefined;

	/**
	 * Relative path to `srcDir` if you want your exports to start from a
	 * different directory.
	 *
	 * @example With the default settings src/index.ts will be the "." export
	 * on your package json. If `exportBaseDir` is set to 'api' then
	 * "src/api/index.ts" will be the "." export. If on top of this, you
	 * change exports to be ["*", "sub/*"]
	 *
	 * @defaultValue '.'
	 */
	exportBaseDir?: string | undefined;
}

export type NormalizedAutoEntryExternalOptions = Defined<AutoEntryExternalOptions>;

export const normalizeAutoEntryExternalOptions = (
	options: AutoEntryExternalOptions
): NormalizedAutoEntryExternalOptions => {
	return {
		exportBaseDir: options.exportBaseDir ?? DEFAULT_PACKAGE_EXPORT_BASEDIR,
		exports: options.exports ?? DEFAULT_PACKAGE_EXPORTS,
		defaultExportsIgnore: options.defaultExportsIgnore ?? DEFAULT_PACKAGE_EXPORT_IGNORES,
		exportsIgnore: options.exportsIgnore ?? [],
	};
};
