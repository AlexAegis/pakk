import {
	Replace,
	normalizeRegExpLikeToRegExp,
	type Defined,
	type ObjectKeyOrder,
} from '@alexaegis/common';
import {
	normalizeCwdOption,
	normalizeWriteJsonOptions,
	type CwdOption,
	type WriteJsonOptions,
} from '@alexaegis/fs';
import { createLogger, type LoggerOption } from '@alexaegis/logging';
import { DEFAULT_PACKAGE_JSON_SORTING_PREFERENCE, PackageJson } from '@alexaegis/workspace-tools';
import { LibraryFormats, LibraryOptions } from 'vite';
import { AutoBinExternalOptions } from '../plugins/autobin/autobin.class.internal-options.js';
import {
	AutoCopyLicenseOptions,
	normalizeAutoCopyLicenseOptions,
} from '../plugins/autolicense/auto-copy-license.class.options.js';
import {
	AutoMetadataOptions,
	normalizeAutoMetadataOptions,
} from '../plugins/metadata/auto-metadata.class.options.js';
import {
	DEFAULT_OUT_DIR,
	DEFAULT_PACKAGE_EXPORTS,
	DEFAULT_SRC_DIR,
	DEFAULT_STATIC_EXPORT_GLOBS,
} from './defaults.const.js';
import { CurrentWorkspacePackageWithRoot } from './workspace/find-current-and-root-workspace-package.function.js';

/**
 * A function that can be defined on Vite where it expects you to decide the
 * name of a file based on the output format.
 *
 * the fileName parameter here is an extensionless filename.
 *
 * For example if an entry point is at 'src/api/hello.ts' the name it will
 * pass is just 'hello'
 */
export type ViteFileNameFn = Exclude<LibraryOptions['fileName'], string | undefined>;

export interface AutolibContext extends CurrentWorkspacePackageWithRoot {
	formats: LibraryFormats[];
	fileName?: ViteFileNameFn | undefined;
	/**
	 * Will depend on the "type" field in the packageJson file.
	 * 'es' if 'module', 'cjs' otherwise.
	 */
	primaryFormat: LibraryFormats;

	packageType: NonNullable<PackageJson['type']>;
}

export interface AutolibOptions extends WriteJsonOptions, CwdOption, LoggerOption {
	/**
	 * source root, relative to cwd
	 * @defaultValue 'src'
	 */
	srcDir?: string | undefined;

	/**
	 * the expected output directory relative to the package's directory.
	 *
	 * @defaultValue 'dist'
	 */
	outDir?: string | undefined;

	/**
	 * packageJson to modify and put in the artifact, relative to `cwd`
	 * @defaultValue './package.json'
	 */
	sourcePackageJson?: string | undefined;

	/**
	 * If left empty, all features will remain enabled.
	 */
	filterFeatures?: (string | RegExp)[] | undefined;

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
	autoBin?: AutoBinExternalOptions | false | undefined;

	/**
	 * Fills out packageJson fields of the distributed packageJson based on
	 * either manually defined key-value pairs or a set of keys that then will
	 * be read from the workspace packageJson file. Or both, in which case if a
	 * key is defined in both the manual takes precedence.
	 */
	autoMetadata?: AutoMetadataOptions | false;

	/**
	 * Automatically copies the license file to the outDir so it can be part
	 * of the distributed package. It uses the license file you defined in the
	 * root of your project. Or if you wish to override it, place one into
	 * the packages folder.
	 *
	 * @defaultValue true
	 */
	autoCopyLicense?: AutoCopyLicenseOptions | false;

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

export type NormalizedAutolibOptions = Defined<
	Replace<AutolibOptions, { filterFeatures: RegExp[] }>
>;

export const normalizeAutolibOptions = (options?: AutolibOptions): NormalizedAutolibOptions => {
	return {
		...normalizeCwdOption(options),
		...normalizeWriteJsonOptions(options),
		logger: options?.logger ?? createLogger({ name: 'autolib' }),
		filterFeatures: options?.filterFeatures
			? options.filterFeatures.map(normalizeRegExpLikeToRegExp)
			: [],
		autoPrettier: options?.autoPrettier ?? true,
		autoBin: options?.autoBin === false ? false : options?.autoBin ?? {},
		autoMetadata:
			options?.autoMetadata === false
				? false
				: normalizeAutoMetadataOptions(options?.autoMetadata),
		autoCopyLicense:
			options?.autoCopyLicense === false
				? false
				: normalizeAutoCopyLicenseOptions(options?.autoCopyLicense),
		autoPeer: options?.autoPeer ?? true,
		autoEntryDir:
			options?.autoEntryDir === false
				? false
				: options?.autoEntryDir ?? DEFAULT_PACKAGE_EXPORTS,
		autoExportStaticGlobs:
			options?.autoExportStaticGlobs === false
				? false
				: options?.autoExportStaticGlobs ?? DEFAULT_STATIC_EXPORT_GLOBS,
		autoOrderPackageJson:
			options?.autoOrderPackageJson === false
				? false
				: options?.autoOrderPackageJson ?? DEFAULT_PACKAGE_JSON_SORTING_PREFERENCE,
		sourcePackageJson: options?.sourcePackageJson ?? 'package.json',
		srcDir: options?.srcDir ?? DEFAULT_SRC_DIR,
		outDir: options?.outDir ?? DEFAULT_OUT_DIR,
	};
};
