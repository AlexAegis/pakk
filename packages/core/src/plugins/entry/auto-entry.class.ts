import { isNotNullish } from '@alexaegis/common';
import type {
	PackageJson,
	PackageJsonExportConditions,
	PackageJsonExports,
} from '@alexaegis/workspace-tools';
import { join, posix } from 'node:path';
import type { UserConfig } from 'vite';
import { getBundledFileExtension } from '../../../../vite-plugin-autolib/src/helpers/append-bundle-file-extension.function.js';
import {
	collectImmediate,
	offsetPathRecordValues,
} from '../../../../vite-plugin-autolib/src/helpers/collect-export-entries.function.js';
import { createPathRecordFromPaths } from '../../../../vite-plugin-autolib/src/helpers/create-path-record-from-paths.function.js';
import { retargetPackageJsonPath } from '../../../../vite-plugin-autolib/src/helpers/retarget-package-json-path.function.js';
import { stripFileExtension } from '../../../../vite-plugin-autolib/src/helpers/strip-file-extension.function.js';
import type { AutolibPlugin } from '../autolib-plugin.type.js';

import { AutolibContext } from '../../internal/autolib-options.js';
import { PackageJsonExportTarget, PackageJsonKind } from '../../package-json/index.js';
import {
	NormalizedAutoEntryOptions,
	normalizeAutoEntryOptions,
	type AutoEntryOptions,
} from './auto-entry.class.options.js';

export class AutoEntry implements AutolibPlugin {
	private options: NormalizedAutoEntryOptions;

	private entryFiles: string[] = [];
	private entryMap: Record<string, string> = {};
	private entryExports: Record<string, PackageJsonExportConditions> = {};

	constructor(options: AutoEntryOptions, context: AutolibContext) {
		this.options = normalizeAutoEntryOptions(options);
	}

	getViteConfigUpdates(): UserConfig {
		return { build: { lib: { entry: this.entryMap } } };
	}

	async preUpdate(packageJson: PackageJson): Promise<void> {
		packageJson.exports = undefined;
		packageJson.main = undefined;
		packageJson.module = undefined;

		const fullEntryPath = join(this.options.srcDir, this.options.entryDir);
		this.entryFiles = await collectImmediate(fullEntryPath, 'file');

		this.entryMap = createPathRecordFromPaths(this.entryFiles, { keyOnlyFilename: true });

		this.entryMap = offsetPathRecordValues(this.entryMap, fullEntryPath);
	}

	update(packageJson: PackageJson) {
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

		return { exports: this.entryExports };
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
