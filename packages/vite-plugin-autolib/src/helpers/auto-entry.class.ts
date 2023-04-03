import { isNotNullish } from '@alexaegis/common';
import type {
	PackageJson,
	PackageJsonExportConditions,
	PackageJsonExports,
} from '@alexaegis/workspace-tools';
import { join, posix } from 'node:path';
import type { UserConfig } from 'vite';
import { PackageJsonExportTarget, PackageJsonKind } from '../plugins/autolib.plugin.options.js';
import { getBundledFileExtension } from './append-bundle-file-extension.function.js';
import { normalizeAutoEntryOptions, type AutoEntryOptions } from './auto-entry.class.options.js';
import { collectImmediate, offsetPathRecordValues } from './collect-export-entries.function.js';
import { createPathRecordFromPaths } from './create-path-record-from-paths.function.js';

import type { PreparedBuildUpdate } from './prepared-build-update.type.js';
import { retargetPackageJsonPath } from './retarget-package-json-path.function.js';
import { stripFileExtension } from './strip-file-extension.function.js';

export class AutoEntry implements PreparedBuildUpdate {
	private options: Required<AutoEntryOptions>;

	private entryFiles: string[] = [];
	private entryMap: Record<string, string> = {};
	private entryExports: Record<string, PackageJsonExportConditions> = {};

	constructor(options: AutoEntryOptions) {
		this.options = normalizeAutoEntryOptions(options);
	}

	getViteConfigUpdates(): UserConfig {
		return { build: { lib: { entry: this.entryMap } } };
	}

	async preUpdate(packageJson: PackageJson): Promise<void> {
		packageJson.exports = undefined;
		packageJson.main = undefined;
		packageJson.module = undefined;

		const fullEntryPath = join(this.options.sourceDirectory, this.options.entryDir);
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

		this.entryExports = Object.entries(this.entryMap).reduce(
			(accumulator, [key, entryFile]) => {
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
			},
			{} as Record<string, PackageJsonExportConditions>
		);

		return { exports: this.entryExports };
	}

	adjustPaths(packageJson: PackageJson, packageJsonKind: PackageJsonKind): PackageJson {
		const entryExportsOffset = Object.entries(
			(packageJson.exports as Record<string, string | PackageJsonExportConditions>) ?? {}
		).reduce((accumulator, [conditionKey, exportCondition]) => {
			if (conditionKey in this.entryExports && typeof exportCondition === 'object') {
				accumulator[conditionKey] = Object.entries(exportCondition).reduce(
					(conditions, [condition, path]) => {
						const isTypesFieldOfDevPackageJson =
							packageJsonKind === PackageJsonKind.DEVELOPMENT &&
							condition === 'types';

						if (isNotNullish(path)) {
							const adjustedExtension = isTypesFieldOfDevPackageJson
								? path.replace('.d.ts', '.ts')
								: path;
							conditions[condition] = retargetPackageJsonPath(adjustedExtension, {
								packageJsonKind,
								packageJsonExportTarget: isTypesFieldOfDevPackageJson
									? PackageJsonExportTarget.SOURCE
									: PackageJsonExportTarget.DIST,
								outDir: this.options.outDir,
							});
						}
						return conditions;
					},
					{} as PackageJsonExportConditions
				);
			} else {
				accumulator[conditionKey] = exportCondition;
			}

			return accumulator;
		}, {} as PackageJsonExports);

		return { exports: entryExportsOffset };
	}
}
