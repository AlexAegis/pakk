import { Replace, type Defined } from '@alexaegis/common';
import {
	normalizeCwdOption,
	normalizeWriteJsonOptions,
	type CwdOption,
	type WriteJsonOptions,
} from '@alexaegis/fs';
import {
	LogLevelOption,
	createLogger,
	normalizeLogLevelOption,
	type LoggerOption,
} from '@alexaegis/logging';
import { PackageJson } from '@alexaegis/workspace-tools';
import { LibraryFormats, LibraryOptions } from 'vite';
import { AutoBinOptions, normalizeAutoBinOptions } from '../plugins/bin/auto-bin.class.options.js';

import {
	AutoExportOptions,
	AutoExportStaticOptions,
	AutoSortPackageJsonOptions,
	PakkFeatureName,
	normalizeAutoExportOptions,
	normalizeAutoExportStaticOptions,
	normalizeAutoSortPackageJsonOptions,
} from '../index.js';
import {
	AutoMetadataOptions,
	normalizeAutoMetadataOptions,
} from '../plugins/metadata/auto-metadata.class.options.js';
import { DEFAULT_OUT_DIR, DEFAULT_SRC_DIR } from './defaults.const.js';
import { CurrentWorkspacePackageWithRoot } from './find-current-and-root-workspace-package.function.js';

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

export interface PakkContext extends CurrentWorkspacePackageWithRoot, CwdOption, LoggerOption {
	formats: LibraryFormats[];
	fileName?: ViteFileNameFn | undefined;
	/**
	 * Will depend on the "type" field in the packageJson file.
	 * 'es' if 'module', 'cjs' otherwise.
	 */
	primaryFormat: LibraryFormats;

	packageType: NonNullable<PackageJson['type']>;

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
}

export type NormalizedPakkContext = Defined<PakkContext>;

export interface PakkOptions
	extends WriteJsonOptions,
		CwdOption,
		LoggerOption,
		LogLevelOption,
		AutoBinOptions,
		AutoExportOptions,
		AutoExportStaticOptions,
		AutoMetadataOptions,
		AutoSortPackageJsonOptions {
	/**
	 * Source root, relative to the package directory
	 *
	 * @defaultValue 'src'
	 */
	srcDir?: string | undefined;

	/**
	 * The expected output directory relative to the package's directory.
	 *
	 * @defaultValue 'dist'
	 */
	outDir?: string | undefined;

	/**
	 * packageJson to modify and put in the artifact, relative to the package's
	 * directory.
	 *
	 * @defaultValue 'package.json'
	 */
	sourcePackageJson?: string | undefined;

	/**
	 * If left empty, all features will remain enabled. Except the disabled ones
	 */
	enabledFeatures?: PakkFeatureName[] | undefined;

	/**
	 * If left empty, all features will remain enabled. Takes precedence over
	 * 'enabledFeatures'
	 */
	disabledFeatures?: PakkFeatureName[] | undefined;

	/**
	 * Generate dts definitions using https://github.com/qmhc/vite-plugin-dts
	 */
	dts?: boolean | undefined;
}

export type NormalizedPakkOptions = Defined<Replace<PakkOptions, { filterFeatures: RegExp[] }>>;

export const normalizePakkOptions = (options?: PakkOptions): NormalizedPakkOptions => {
	const logLevelOptions = normalizeLogLevelOption(options);
	return {
		...normalizeCwdOption(options),
		...logLevelOptions,
		...normalizeWriteJsonOptions(options),
		...normalizeAutoBinOptions(options),
		...normalizeAutoExportOptions(options),
		...normalizeAutoExportStaticOptions(options),
		...normalizeAutoMetadataOptions(options),
		...normalizeAutoSortPackageJsonOptions(options),
		logger:
			options?.logger ?? createLogger({ name: 'pakk', minLevel: logLevelOptions.logLevel }),
		sourcePackageJson: options?.sourcePackageJson ?? 'package.json',
		srcDir: options?.srcDir ?? DEFAULT_SRC_DIR,
		outDir: options?.outDir ?? DEFAULT_OUT_DIR,
		enabledFeatures: options?.enabledFeatures ?? [],
		disabledFeatures: options?.disabledFeatures ?? [],
		autoPrettier: options?.autoPrettier ?? true,
		dts: options?.dts ?? true,
	};
};