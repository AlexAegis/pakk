import type { PackageJson, PackageJsonExportConditions } from '@alexaegis/workspace-tools';
import { basename, join, posix } from 'node:path';
import type { AutolibFeature, PackageExaminationResult } from '../autolib-feature.type.js';
import { stripFileExtension } from './helpers/strip-file-extension.function.js';

import { toAbsolute } from '@alexaegis/fs';
import { globby } from 'globby';
import { dirname } from 'node:path/posix';
import { InternalModuleFormat } from 'rollup';
import { LibraryFormats } from 'vite';
import { NormalizedAutolibContext } from '../../internal/autolib.class.options.js';
import { PackageJsonExportTarget, PackageJsonKind, PathMap } from '../../package-json/index.js';

import {
	AutoExportOptions,
	NormalizedAutoExportOptions,
	normalizeAutoExportOptions,
} from './auto-export.class.options.js';
import { EntryPathVariantMap } from './export-map.type.js';
import { createExportMapFromPaths } from './helpers/create-export-map-from-paths.function.js';

export const allExportPathCombinations = [
	`${PackageJsonKind.DEVELOPMENT}-to-${PackageJsonExportTarget.SOURCE}`,
	`${PackageJsonKind.DEVELOPMENT}-to-${PackageJsonExportTarget.DIST}`,
	`${PackageJsonKind.DISTRIBUTION}-to-${PackageJsonExportTarget.DIST}`,
] as const;
export type AllExportPathCombinations = (typeof allExportPathCombinations)[number];
export type ExportPathMap = PathMap<AllExportPathCombinations>;

export type ExportTargetFileFormats = LibraryFormats;

/*
export interface PackageExportPathContextDevelopment {
	type: PackageJsonKind.DEVELOPMENT;
}

export interface PackageExportPathContextDistribution {
	type: PackageJsonKind.DISTRIBUTION;
	format: InternalModuleFormat;
	fileName?: ViteFileNameFn;
}
*/

export interface PackageExportPathContext {
	/**
	 * When 'packageJsonKind' is set to DEVELOPMENT and this context is used
	 * to calculate the paths towards the source files, 'formats' and
	 * 'fileNameFn' are not used.
	 */
	packageJsonKind: PackageJsonKind;
	/**
	 * The kind of files an export can point to. It's used to guess/calculate how
	 * the fileName will change once it ends up in the outDir after building.
	 * If it's undefined it will not do any renaming and will use the source name.
	 * Useful when targeting the source or for files that are not being renamed
	 * during processing like .svelte files.
	 *
	 * ? Out of InternalModuleFormat it really is only LibaryFormats that we care about
	 */
	format: InternalModuleFormat;
}

/**
 * Generates exports entries automatically
 */
export class AutoExport implements AutolibFeature {
	public static readonly featureName = 'export';

	private readonly options: NormalizedAutoExportOptions;
	private readonly context: NormalizedAutolibContext;

	private exportMap: EntryPathVariantMap<AllExportPathCombinations> = {};

	constructor(context: NormalizedAutolibContext, options?: AutoExportOptions) {
		this.context = context;
		this.options = normalizeAutoExportOptions(options);
	}

	async examinePackage(_packageJson: PackageJson): Promise<Partial<PackageExaminationResult>> {
		const absoluteExportBaseDir = toAbsolute(
			join(this.context.srcDir, this.options.exportBaseDir),
			{
				cwd: this.context.workspacePackage.packagePath,
			}
		);

		const entryFiles = await globby(this.options.exports, {
			cwd: absoluteExportBaseDir,
			ignoreFiles: [...this.options.exportsIgnore, ...this.options.defaultExportsIgnore],
			onlyFiles: true,
			dot: true,
		});

		const exportMap = createExportMapFromPaths(entryFiles, {
			outDir: this.context.outDir,
			srcDir: this.context.srcDir,
			basePath: this.options.exportBaseDir,
			keyKind: 'extensionless-relative-path-from-base',
		});

		this.exportMap = exportMap;

		return { exportMap };
	}

	/**
	 * This plugin compiles the exports object for a packageJson file
	 *
	 * For the distributed packageJson it should always contain paths that are
	 * targeting the dist folder from the dist folder.
	 *
	 * For development packageJson the types always target the source for
	 * immediate feedback by the LSP by local consumers of the package.
	 * The actual code that's being imported by node has two options,
	 * by default they target the outDir and expect libraries to be built
	 * before actually running them in a local setting.
	 * There's an alternative mode however that will target the source files.
	 */
	process(_packageJson: PackageJson, pathContext: PackageExportPathContext): PackageJson {
		const entryExports: Record<string, PackageJsonExportConditions> = {};

		for (const [key, pathVariants] of Object.entries(this.exportMap)) {
			let path: string;
			let typesPath: string = pathVariants['development-to-source'];

			if (pathContext.packageJsonKind === PackageJsonKind.DISTRIBUTION) {
				path = pathVariants['distribution-to-dist'];
				typesPath = posix.join(
					stripFileExtension(pathVariants['distribution-to-dist']),
					'.d.ts'
				);
			} else if (
				this.options.developmentPackageJsonExportsTarget === PackageJsonExportTarget.SOURCE
			) {
				path = pathVariants['development-to-source'];
			} else {
				path = pathVariants['development-to-dist'];
			}

			const fileName = basename(path);
			const dir = dirname(path);
			const extensionlessFileName = stripFileExtension(fileName);

			const exportConditions: PackageJsonExportConditions = {
				types: typesPath,
			};

			if (this.context.formats.includes('cjs')) {
				exportConditions.require =
					'./' + posix.join(dir, this.context.fileName('cjs', extensionlessFileName));
			} else {
				if (this.context.formats.includes('umd')) {
					exportConditions.require =
						'./' + posix.join(dir, this.context.fileName('umd', extensionlessFileName));
				} else if (this.context.formats.includes('iife')) {
					exportConditions.require =
						'./' +
						posix.join(dir, this.context.fileName('iife', extensionlessFileName));
				}
			}

			if (this.context.formats.includes('es')) {
				exportConditions.import =
					'./' + posix.join(dir, this.context.fileName('es', extensionlessFileName));
			}

			if (this.context.formats.includes(this.context.primaryFormat)) {
				exportConditions.default =
					'./' +
					posix.join(
						dir,
						this.context.fileName(this.context.primaryFormat, extensionlessFileName)
					);
			}

			if (path.endsWith('.svelte')) {
				exportConditions['svelte'] = './' + path;
			}

			entryExports['./' + key] = exportConditions;
		}

		return { exports: entryExports } satisfies PackageJson;
	}
}
