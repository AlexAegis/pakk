import type { ObjectKeyOrder } from '@alexaegis/common';
import {
	CwdOption,
	normalizeCwdOption,
	normalizeWriteJsonOptions,
	WriteJsonOptions,
} from '@alexaegis/fs';
import { LoggerOption, normalizeLoggerOption } from '@alexaegis/logging';
import { DEFAULT_PACKAGE_JSON_SORTING_PREFERENCE } from '@alexaegis/workspace-tools';
import { DEFAULT_BINSHIM_DIR, DEFAULT_BIN_DIR } from '../helpers/auto-bin.class.options.js';
import { DEFAULT_ENTRY_DIR } from '../helpers/auto-entry.class.options.js';
import { DEFAULT_STATIC_EXPORT_GLOBS } from '../helpers/auto-export-static.class.options.js';
import {
	AutoMetadataOptions,
	normalizeAutoMetadataOptions,
} from '../helpers/auto-metadata.class.options.js';

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

export interface AutolibPluginOptions extends WriteJsonOptions, CwdOption, LoggerOption {
	/**
	 * source root, relative to cwd
	 * @defaultValue 'src'
	 */
	src?: string;

	/**
	 * packageJson to modify and put in the artifact, relative to `cwd`
	 * @defaultValue './package.json'
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
	 * @defaultValue ["."]
	 */
	autoEntryDir?: string | false;

	/**
	 * Automatically export the content of a directory as is
	 *
	 * @defaultValue ["export/**", "static/**"]
	 */
	autoExportStaticGlobs?: string[] | false;

	/**
	 * Automatically order the keys in the packageJson files.
	 *
	 * @defaultValue DEFAULT_PACKAGE_JSON_ORDER_PREFERENCE
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
	 * @defaultValue ["./bin/*.ts"]
	 */
	autoBin?: AutoLibraryAutoBinOptions | false;

	/**
	 * Fills out packageJson fields of the distributed packageJson based on
	 * either manually defined key-value pairs or a set of keys that then will
	 * be read from the workspace packageJson file. Or both, in which case if a
	 * key is defined in both the manual takes precedence.
	 */
	autoMetadata?: AutoMetadataOptions | false;

	/**
	 * Removes duplicated dependency and peerDependency entries leaving only
	 * the peerDependencies behind.
	 *
	 * The point of this is to let peerDependencies install locally too by
	 * defining them twice, once as a peerDependency, and once as a normal
	 * dependency. This step will remove the one that was meant to only be
	 * present locally.
	 *
	 * @defaultValue true
	 */
	autoPeer?: boolean;
}

export const normalizeAutolibOptions = (
	options?: AutolibPluginOptions
): Required<AutolibPluginOptions> => {
	return {
		...normalizeCwdOption(options),
		...normalizeLoggerOption(options),
		...normalizeWriteJsonOptions(options),
		autoPrettier: options?.autoPrettier ?? true,
		autoBin: options?.autoBin ? false : normalizeAutoBinOption(options?.autoBin),
		autoMetadata:
			options?.autoMetadata === false
				? false
				: normalizeAutoMetadataOptions(options?.autoMetadata),
		autoPeer: options?.autoPeer ?? true,
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
