import { asyncFilterMap, deepMerge } from '@alexaegis/common';
import { toAbsolute } from '@alexaegis/fs';
import { Logger } from '@alexaegis/logging';
import { PackageJson, WorkspacePackage } from '@alexaegis/workspace-tools';
import { join } from 'node:path';
import { LibraryFormats } from 'vite';

import { PackageJsonKind } from '../package-json/package-json-kind.enum.js';
import { AutolibFeature, PackageExaminationResult } from '../plugins/autolib-feature.type.js';
import { AutoBin } from '../plugins/bin/auto-bin.class.js';
import { AutoCopyLicense } from '../plugins/copy-license/auto-copy-license.class.js';
import { AutoExportStatic } from '../plugins/export-static/auto-export-static.class.js';
import { AutoExport } from '../plugins/export/auto-export.class.js';
import { createDefaultViteFileNameFn } from '../plugins/export/helpers/bundle-file-name.function.js';
import { AutoMetadata } from '../plugins/metadata/auto-metadata.class.js';
import { AutoPeer } from '../plugins/peer/auto-peer.class.js';
import { AutoSort } from '../plugins/sort-package-json/auto-sort-package-json.class.js';
import {
	AutolibContext,
	AutolibOptions,
	NormalizedAutolibContext,
	NormalizedAutolibOptions,
	normalizeAutolibOptions,
} from './autolib.class.options.js';
import { findCurrentAndRootWorkspacePackage } from './find-current-and-root-workspace-package.function.js';

export const createIsFeatureEnabled =
	(enabledFeatures: AutolibFeatureName[], disabledFeatures: AutolibFeatureName[]) =>
	(feature: AutolibFeatureName): boolean => {
		const isEnabled = enabledFeatures.length === 0 || enabledFeatures.includes(feature);
		const isDisabled = disabledFeatures.includes(feature);
		return isEnabled && !isDisabled;
	};

export const autolibFeatureMap = {
	bin: AutoBin,
	'copy-license': AutoCopyLicense,
	export: AutoExport,
	'export-static': AutoExportStatic,
	metadata: AutoMetadata,
	peer: AutoPeer,
	sort: AutoSort,
} as const;

export const autolibFeatures = Object.keys(autolibFeatureMap) as AutolibFeatureName[];

export type AutolibFeatureName = keyof typeof autolibFeatureMap;

/**
 * This class does not execute anything on it's own, just provides itself as a
 * tool that then needs to be orchestrated by antoher tool. This could be
 * the standalone runner or the vite plugin. It also does not hold state,
 * the packageJson object that is being worked on has to be stored elsewhere
 * to avoid inner mutation.
 */
export class Autolib {
	public readonly options: NormalizedAutolibOptions;
	public readonly context: NormalizedAutolibContext;

	private features: AutolibFeature[] = [];

	private constructor(context: NormalizedAutolibContext, options: NormalizedAutolibOptions) {
		this.context = context;
		this.options = options;

		const isFeatureEnabled = createIsFeatureEnabled(
			this.options.enabledFeatures,
			this.options.disabledFeatures
		);

		this.features = Object.entries(autolibFeatureMap)
			.filter(([featureName]) => isFeatureEnabled(featureName as AutolibFeatureName))
			.map(([featureName, feature]) => {
				return new feature(
					{
						...this.context,
						logger: options.logger.getSubLogger({
							name: featureName,
						}),
					},
					options
				);
			});

		this.options.logger.trace('features enabled:', this.features.length);
		this.options.logger.trace('context', {
			...this.context,
			logger: 'SKIPPED FROM LOG',
			rootWorkspacePackage: {
				...this.context.rootWorkspacePackage,
				packageJson: 'SKIPPED FROM LOG',
			},
			workspacePackage: {
				...this.context.workspacePackage,
				packageJson: 'SKIPPED FROM LOG',
			},
		});
	}

	getLogger(): Logger<unknown> {
		return this.options.logger;
	}

	static async withContext(
		manualContext: Pick<AutolibContext, 'formats' | 'fileName'>,
		rawOptions?: AutolibOptions | undefined
	): Promise<Autolib> {
		const options = normalizeAutolibOptions(rawOptions);
		const workspaceContext = await findCurrentAndRootWorkspacePackage(options);
		const primaryFormat = Autolib.primaryLibraryFormat(
			workspaceContext.workspacePackage.packageJson
		);
		const packageType =
			workspaceContext.workspacePackage.packageJson.type === 'module' ? 'module' : 'commonjs';

		const autolib = new Autolib(
			{
				...workspaceContext,
				...manualContext,
				primaryFormat,
				packageType,
				fileName: manualContext.fileName ?? createDefaultViteFileNameFn(packageType),
				outDir: options.outDir,
				srcDir: options.srcDir,
				cwd: options.cwd,
				logger: options.logger,
			},
			options
		);
		return autolib;
	}

	static primaryLibraryFormat(packageJson: PackageJson): LibraryFormats {
		return packageJson.type === 'module' ? 'es' : 'cjs';
	}

	/**
	 * 1st step, examining the package. This step does not write anything.
	 * It can be done before the build takes place as it's only supposed to
	 * take a look at your source code.
	 */
	async examinePackage(
		workspacePackage: WorkspacePackage = this.context.workspacePackage
	): Promise<PackageExaminationResult> {
		const detectedExports = await asyncFilterMap(
			this.features,
			async (plugin) => await plugin.examinePackage?.(workspacePackage)
		);

		return deepMerge({} as PackageExaminationResult, ...detectedExports);
	}

	/**
	 * Will return a path adjusted packageJson object based on the content of
	 * the workspace for both the SOURCE and DISTRIBUTION packageJson files.
	 *
	 * And also returns the path where it should be written to.
	 */
	async createUpdatedPackageJson(
		packageJsonKind: PackageJsonKind
	): Promise<{ updatedPackageJson: PackageJson; path: string }> {
		const packageJsonUpdates = await asyncFilterMap(
			this.features,
			async (plugin) =>
				await plugin.process?.(structuredClone(this.context.workspacePackage.packageJson), {
					packageJsonKind,
					format: this.context.primaryFormat,
				})
		);

		let updatedPackageJson: PackageJson = deepMerge(
			structuredClone(this.context.workspacePackage.packageJson),
			...packageJsonUpdates.flat(1)
		);

		updatedPackageJson = this.features.reduce<PackageJson>(
			(packageJson, plugin) =>
				plugin.postprocess?.(
					{ ...this.context.workspacePackage, packageJson },
					packageJsonKind
				) ?? packageJson,
			updatedPackageJson
		);

		const path =
			packageJsonKind === PackageJsonKind.DISTRIBUTION
				? toAbsolute(
						join(
							this.context.workspacePackage.packagePath,
							this.options.outDir,
							'package.json'
						),
						this.options
				  )
				: toAbsolute(
						join(this.context.workspacePackage.packagePath, 'package.json'),
						this.options
				  );

		return { updatedPackageJson, path };
	}
}
