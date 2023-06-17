import { isNotNullish } from '@alexaegis/common';
import type {
	PackageJson,
	PackageJsonExportConditions,
	PackageJsonExports,
} from '@alexaegis/workspace-tools';
import { basename, join, posix } from 'node:path';
import type { AutolibPlugin, PackageExaminationResult } from '../autolib-plugin.type.js';
import { retargetPackageJsonPath } from './helpers/retarget-package-json-path.function.js';
import { stripFileExtension } from './helpers/strip-file-extension.function.js';

import { toAbsolute } from '@alexaegis/fs';
import { globby } from 'globby';
import { dirname } from 'node:path/posix';
import { InternalModuleFormat } from 'rollup';
import { LibraryFormats } from 'vite';
import { NormalizedAutolibContext } from '../../internal/autolib.class.options.js';
import { PackageJsonExportTarget, PackageJsonKind, PathMap } from '../../package-json/index.js';
import {
	NormalizedAutoEntryInternalOptions,
	normalizeAutoEntryInternalOptions,
	type AutoEntryInternalOptions,
} from './auto-export.class.internal-options.js';
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
 *
 */
export class AutoExport implements AutolibPlugin {
	public name = 'export';

	private options: NormalizedAutoEntryInternalOptions;
	private context: NormalizedAutolibContext;

	private exportMap: EntryPathVariantMap<AllExportPathCombinations> = {};

	constructor(options: AutoEntryInternalOptions, context: NormalizedAutolibContext) {
		this.options = normalizeAutoEntryInternalOptions(options);
		this.context = context;
	}

	async examinePackage(_packageJson: PackageJson): Promise<Partial<PackageExaminationResult>> {
		const absoluteExportBaseDir = toAbsolute(
			join(this.options.srcDir, this.options.exportBaseDir),
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
			outDir: this.options.outDir,
			srcDir: this.options.srcDir,
			basePath: this.options.exportBaseDir,
			keyKind: 'extensionless-relative-path-from-base',
		});

		this.exportMap = exportMap;

		return { exportMap };
	}

	/**
	 * TODO: should create simpler entries if there's only one format
	 * @returns or Record<string, PackageJsonExportConditions>
	 */
	private static createPackageJsonExports(
		exportMap: EntryPathVariantMap,
		packageType: PackageJson['type'],
		exportPathKind: AllExportPathCombinations,
		pathContext: PackageExportPathContext
	): PackageJson['exports'] {
		// TODO: add 'types' too // TODO: this just resets some fields, add it somewhere else
		// return { main: undefined, module: undefined, exports: this.entryExports };

		return Object.entries(exportMap).reduce<Record<string, PackageJsonExportConditions>>(
			(accumulator, [key, entryPathVariations]) => {
				const entryPath = entryPathVariations[exportPathKind];

				// TODO(svelte): verify if svelte file should keep their file extensions or not.
				const extensionlessPath = stripFileExtension(entryPath);
				const extensionlessFileName = basename(entryPath);
				const dir = dirname(entryPath);
				// Assume there will be a `.d.ts` generated
				const typesPath = `.${posix.sep}${posix.normalize(`${extensionlessPath}.d.ts`)}`;

				const exportConditions: PackageJsonExportConditions = {
					types: typesPath,
				};

				accumulator[key] = exportConditions;

				return accumulator;
			},
			{}
		);
	}

	process(packageJson: PackageJson, pathContext: PackageExportPathContext): PackageJson {
		// Todo fill this out (it's PackageJson['exports'])
		const entryExports: Record<string, PackageJsonExportConditions> = {};

		const entryExportsOffset = Object.entries(
			packageJson.exports ?? {}
		).reduce<PackageJsonExports>((accumulator, [conditionKey, exportCondition]) => {
			accumulator[conditionKey] =
				conditionKey in entryExports && typeof exportCondition === 'object'
					? Object.entries(exportCondition).reduce<PackageJsonExportConditions>(
							(conditions, [condition, path]) => {
								const isTypesFieldOfDevPackageJson =
									pathContext.packageJsonKind === PackageJsonKind.DEVELOPMENT &&
									condition === 'types';

								if (isNotNullish(path)) {
									const adjustedExtension = isTypesFieldOfDevPackageJson
										? path.replace('.d.ts', '.ts')
										: path;
									conditions[condition] = retargetPackageJsonPath(
										adjustedExtension,
										{
											packageJsonKind: pathContext.packageJsonKind,
											packageJsonExportTarget: isTypesFieldOfDevPackageJson
												? PackageJsonExportTarget.SOURCE
												: PackageJsonExportTarget.DIST,
											outDir: this.options.outDir,
										}
									);
								}
								return conditions;
							},
							{}
					  )
					: (exportCondition as PackageJsonExportConditions);

			return accumulator;
		}, {});

		return { exports: entryExportsOffset } satisfies PackageJson;
	}
}
