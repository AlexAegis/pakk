import { isNotNullish } from '@alexaegis/common';
import type {
	PackageJson,
	PackageJsonExportConditions,
	PackageJsonExports,
} from '@alexaegis/workspace-tools';
import { join, posix } from 'node:path';
import type { AutolibPlugin, ExportMap, PackageExaminationResult } from '../autolib-plugin.type.js';
import { getBundledFileExtension } from './helpers/append-bundle-file-extension.function.js';
import { offsetPathRecordValues } from './helpers/collect-export-entries.function.js';
import { createExportMapFromPaths } from './helpers/create-export-map-from-paths.function.js';
import { retargetPackageJsonPath } from './helpers/retarget-package-json-path.function.js';
import { stripFileExtension } from './helpers/strip-file-extension.function.js';

import { toAbsolute } from '@alexaegis/fs';
import { globby } from 'globby';
import { Awaitable } from 'vitest';
import { AutolibContext } from '../../internal/autolib-options.js';
import { PackageJsonExportTarget, PackageJsonKind } from '../../package-json/index.js';
import {
	NormalizedAutoEntryInternalOptions,
	normalizeAutoEntryInternalOptions,
	type AutoEntryInternalOptions,
} from './auto-export.class.internal-options.js';

/**
 *
 */
export class AutoExport implements AutolibPlugin {
	public name = 'export';

	private options: NormalizedAutoEntryInternalOptions;
	private context: AutolibContext;

	private entryFiles: string[] = [];
	private entryMap: ExportMap = {};
	private entryExports: Record<string, PackageJsonExportConditions> = {};

	constructor(options: AutoEntryInternalOptions, context: AutolibContext) {
		this.options = normalizeAutoEntryInternalOptions(options);
		this.context = context;
	}

	async examinePackage(packageJson: PackageJson): Promise<PackageExaminationResult> {
		const exportsRootCwd = join(this.options.srcDir, this.options.exportBaseDir);

		const entryFiles = await globby(this.options.exports, {
			cwd: toAbsolute(exportsRootCwd, { cwd: this.context.workspacePackage.packagePath }), // Passing an absolute path to globby while keeping paths relative here
			onlyFiles: true,
		});

		this.entryMap = createExportMapFromPaths(entryFiles, { keyOnlyFilename: true });

		this.entryMap = offsetPathRecordValues(this.entryMap, exportsRootCwd);

		return { filesToExport: this.entryMap };
	}

	update(packageJson: PackageJson): Awaitable<Partial<PackageJson>> {
		const hasUmd = this.options.formats.includes('umd');
		const hasEsm = this.options.formats.includes('es');
		const hasCjs = this.options.formats.includes('cjs');

		const umdExtension = getBundledFileExtension({
			format: 'umd',
			packageType: packageJson.type,
		});
		const esmExtension = getBundledFileExtension({
			format: 'es',
			packageType: packageJson.type,
		});
		const cjsExtension = getBundledFileExtension({
			format: 'cjs',
			packageType: packageJson.type,
		});

		this.entryExports = Object.entries(this.entryMap).reduce<
			Record<string, PackageJsonExportConditions>
		>((accumulator, [key, entryFile]) => {
			const extensionlessPath = stripFileExtension(entryFile);
			// Assume there will be a `.d.ts` generated
			const typesPath = `.${posix.sep}${posix.normalize(`${extensionlessPath}.d.ts`)}`;
			const exportConditions: PackageJsonExportConditions = {
				types: typesPath,
			};

			if (hasUmd) {
				exportConditions.require = `.${posix.sep}${posix.normalize(
					`${extensionlessPath}${umdExtension}`
				)}`;
			}

			if (hasCjs) {
				exportConditions.require = `.${posix.sep}${posix.normalize(
					`${extensionlessPath}${cjsExtension}`
				)}`;
			}

			if (hasEsm) {
				exportConditions.import = `.${posix.sep}${posix.normalize(
					`${extensionlessPath}${esmExtension}`
				)}`;
			}
			if (key === 'index') {
				accumulator['.'] = exportConditions;
			} else {
				accumulator['./' + key] = exportConditions;
			}
			return accumulator;
		}, {});

		// TODO: add 'types' too
		return { main: undefined, module: undefined, exports: this.entryExports };
	}

	adjustPaths(packageJson: PackageJson, packageJsonKind: PackageJsonKind): PackageJson {
		const entryExportsOffset = Object.entries(
			packageJson.exports ?? {}
		).reduce<PackageJsonExports>((accumulator, [conditionKey, exportCondition]) => {
			accumulator[conditionKey] =
				conditionKey in this.entryExports && typeof exportCondition === 'object'
					? Object.entries(exportCondition).reduce<PackageJsonExportConditions>(
							(conditions, [condition, path]) => {
								const isTypesFieldOfDevPackageJson =
									packageJsonKind === PackageJsonKind.DEVELOPMENT &&
									condition === 'types';

								if (isNotNullish(path)) {
									const adjustedExtension = isTypesFieldOfDevPackageJson
										? path.replace('.d.ts', '.ts')
										: path;
									conditions[condition] = retargetPackageJsonPath(
										adjustedExtension,
										{
											packageJsonKind,
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

		return { exports: entryExportsOffset };
	}
}
