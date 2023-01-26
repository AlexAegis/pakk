import { DEFAULT_BINSHIM_DIR, DEFAULT_BIN_DIR } from '../helpers/auto-bin.class.options.js';
import { DEFAULT_ENTRY_DIR } from '../helpers/auto-entry.class.options.js';
import { DEFAULT_STATIC_EXPORT_GLOBS } from '../helpers/auto-export-static.class.options.js';
import { DEFAULT_PACKAGE_JSON_SORTING_PREFERENCE } from '../helpers/auto-reorder.class.options.js';
import type { ObjectKeyOrder } from '../helpers/object-key-order.type.js';
import type { WriteJsonOptions } from '../helpers/write-json.function.js';

export const DEFAULT_SRC_DIR = 'src';

export enum PackageJsonKind {
	/**
	 * Used in the repository as the source packageJson
	 */
	DEVELOPMENT = 'development',
	/**
	 * The packageJson that will be in the distributed package
	 */
	DISTRIBUTION = 'distribution',
}

export enum PackageJsonExportTarget {
	/**
	 * This targets the source files.
	 *
	 * For example the `development` packageJson targets the local entry points
	 * for types
	 */
	SOURCE = 'source',
	/**
	 * This targets the directory where compiled files end up in. Wherever
	 * `outDir` points to.
	 *
	 * For example both the `development` and `distribution` packageJson files
	 * target this for the actual imports.
	 */
	DIST = 'dist',
	/**
	 * The shim folder is used for local bins
	 *
	 * For example the `development` packageJson files bin entries target the
	 * shim directory. So pnpm can link them event before the package is built.
	 */
	SHIM = 'shim',
}

export interface AutolibPluginOptions extends WriteJsonOptions {
	/**
	 * source root, relative to cwd
	 * @default 'src'
	 */
	src?: string;

	/**
	 * The directory of the package
	 * @default process.cwd()
	 */
	cwd?: string;

	/**
	 * packageJson to modify and put in the artifact, relative to `cwd`
	 * @default './package.json'
	 */
	sourcePackageJson?: string;

	/**
	 * Generates exports entries form rollup inputs, from a directory relative
	 * to `srcDir`
	 *
	 * If autoExport is disabled, the plugin expects you to either set
	 * `build.lib.entry` yourself or have a `src/index.ts` file as the entry
	 * point
	 *
	 * @default '["."]'
	 */
	autoEntryDir?: string | false;

	/**
	 * Automatically export the content of a directory as is
	 *
	 * @default '["export/**", "static/**"]'
	 */
	autoExportStaticGlobs?: string[] | false;

	/**
	 * Automatically order the keys in the packageJson files.
	 *
	 * @default DEFAULT_PACKAGE_JSON_ORDER_PREFERENCE
	 */
	autoOrderPackageJson?: ObjectKeyOrder | false;

	/**
	 * Generates bin entries from files under `srcDir` + `autoBinDirectory`
	 * It also treats all files named as npm hooks as npm hooks, prefixing them
	 * and adding them as hooks for the npm artifact
	 *
	 * For example a file called `postinstall.ts` in a package called
	 * `@org/name`, it will generate an npm script entry as such:
	 * `"postinstall": "bin/postinstall.js"`. The hook is still treated as a
	 * `bin` so you can invoke it directly. To avoid name collisions, all
	 * "hookbins" are prefixed with the normalized packagename like so:
	 * `org-name-postinstall`
	 *
	 * @default '["./bin/*.ts"]'
	 */
	autoBin?: AutoLibraryAutoBinOptions | false;
}

export const normalizeAutolibOptions = (
	options?: AutolibPluginOptions
): Required<AutolibPluginOptions> => {
	return {
		autoBin: normalizeAutoBinOption(options?.autoBin),
		autoEntryDir:
			options?.autoEntryDir === false ? false : options?.autoEntryDir ?? DEFAULT_ENTRY_DIR,
		autoExportStaticGlobs:
			options?.autoExportStaticGlobs === false
				? false
				: options?.autoExportStaticGlobs ?? DEFAULT_STATIC_EXPORT_GLOBS,
		autoOrderPackageJson:
			options?.autoOrderPackageJson === false
				? false
				: options?.autoOrderPackageJson ?? DEFAULT_PACKAGE_JSON_SORTING_PREFERENCE,
		sourcePackageJson: options?.sourcePackageJson ?? 'package.json',
		cwd: options?.cwd ?? process.cwd(),
		dry: options?.dry ?? false,
		autoPrettier: options?.autoPrettier ?? true,
		src: options?.src ?? DEFAULT_SRC_DIR,
	};
};

interface AutoLibraryAutoBinOptions {
	binDir?: string;
	shimDir?: string;
}

const normalizeAutoBinOption = (
	autoBin?: AutoLibraryAutoBinOptions | false
): Required<AutoLibraryAutoBinOptions> | false => {
	return autoBin === false
		? false
		: {
				binDir: autoBin?.binDir ?? DEFAULT_BIN_DIR,
				shimDir: autoBin?.shimDir ?? DEFAULT_BINSHIM_DIR,
		  };
};
