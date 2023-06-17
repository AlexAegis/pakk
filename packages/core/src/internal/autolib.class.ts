import { asyncFilterMap, deepMerge } from '@alexaegis/common';
import { toAbsolute } from '@alexaegis/fs';
import { Logger } from '@alexaegis/logging';
import { PackageJson, WorkspacePackage } from '@alexaegis/workspace-tools';
import { join } from 'node:path';
import { InternalModuleFormat } from 'rollup';
import { LibraryFormats } from 'vite';

import { PackageJsonKind } from '../package-json/package-json-kind.enum.js';
import { AutolibPlugin, PackageExaminationResult } from '../plugins/autolib-plugin.type.js';
import { AutoBin } from '../plugins/bin/auto-bin.class.js';
import { AutoCopyLicense } from '../plugins/copy-license/auto-copy-license.class.js';
import { AutoExportStatic } from '../plugins/export-static/auto-export-static.class.js';
import { AutoExport } from '../plugins/export/auto-export.class.js';
import { EntryPathVariantMap } from '../plugins/export/export-map.type.js';
import { createDefaultViteFileNameFn } from '../plugins/export/helpers/append-bundle-file-extension.function.js';
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
	(enabledFeatures: AutolibFeature[], disabledFeatures: AutolibFeature[]) =>
	(feature: AutolibFeature): boolean => {
		const isEnabled = enabledFeatures.length === 0 || enabledFeatures.includes(feature);
		const isDisabled = disabledFeatures.includes(feature);
		return isEnabled && !isDisabled;
	};

export const ALL_AUTOLIB_FEATURES = [
	AutoBin.featureName,
	AutoCopyLicense.featureName,
	AutoExport.featureName,
	AutoExportStatic.featureName,
	AutoMetadata.featureName,
	AutoPeer.featureName,
	AutoSort.featureName,
] as const;

export type AutolibFeature = (typeof ALL_AUTOLIB_FEATURES)[number];

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

	private plugins: AutolibPlugin[] = [];

	private constructor(context: NormalizedAutolibContext, options: NormalizedAutolibOptions) {
		this.context = context;
		this.options = options;

		const isFeatureEnabled = createIsFeatureEnabled(
			this.options.enabledFeatures,
			this.options.disabledFeatures
		);

		if (isFeatureEnabled(AutoBin.featureName)) {
			this.plugins.push(
				new AutoBin(
					{
						...this.context,
						logger: options.logger.getSubLogger({ name: AutoBin.featureName }),
					},
					options
				)
			);
		}

		if (isFeatureEnabled(AutoExport.featureName)) {
			this.plugins.push(
				new AutoExport(
					{
						...this.context,
						logger: options.logger.getSubLogger({ name: AutoExport.featureName }),
					},
					options
				)
			);
		}

		if (isFeatureEnabled(AutoExportStatic.featureName)) {
			this.plugins.push(
				new AutoExportStatic(
					{
						...this.context,
						logger: options.logger.getSubLogger({ name: AutoExportStatic.featureName }),
					},
					options
				)
			);
		}

		if (isFeatureEnabled(AutoMetadata.featureName)) {
			this.plugins.push(
				new AutoMetadata(
					{
						...this.context,
						logger: options.logger.getSubLogger({ name: AutoMetadata.featureName }),
					},
					options
				)
			);
		}

		if (isFeatureEnabled(AutoSort.featureName)) {
			this.plugins.push(
				new AutoSort(
					{
						...this.context,
						logger: options.logger.getSubLogger({ name: AutoSort.featureName }),
					},
					options
				)
			);
		}

		if (isFeatureEnabled(AutoCopyLicense.featureName)) {
			this.plugins.push(
				new AutoCopyLicense({
					...this.context,
					logger: options.logger.getSubLogger({ name: AutoCopyLicense.featureName }),
				})
			);
		}

		if (isFeatureEnabled(AutoPeer.featureName)) {
			this.plugins.push(
				new AutoPeer({
					...this.context,
					logger: options.logger.getSubLogger({ name: AutoPeer.featureName }),
				})
			);
		}
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
	 * 1st step
	 */
	async examinePackage(
		workspacePackage: WorkspacePackage = this.context.workspacePackage
	): Promise<PackageExaminationResult> {
		const detectedExports = await asyncFilterMap(
			this.plugins,
			async (plugin) => await plugin.examinePackage?.(workspacePackage)
		);

		// Todo: this can likely be replaced with a single deepMerge once array support is released
		return {
			bundlerEntryFiles: detectedExports.flatMap((e) => e.bundlerEntryFiles ?? []),
			exportMap: deepMerge(
				{} as EntryPathVariantMap,
				detectedExports.map((e) => e.exportMap)
			),
			packageJsonUpdates: deepMerge(
				{} as PackageJson,
				detectedExports.map((e) => e.packageJsonUpdates)
			),
		} satisfies PackageExaminationResult;
	}

	/**
	 * Will return a path adjusted packageJson object based on the content of
	 * the workspace for both the SOURCE and DISTRIBUTION packageJson files.
	 *
	 * And also returns the path where it should be written to.
	 */
	async createUpdatedPackageJson(
		packageJsonForArtifact: PackageJson,
		packageJsonKind: PackageJsonKind,
		format: InternalModuleFormat
	): Promise<{ updatedPackageJson: PackageJson; path: string }> {
		const packageJsonUpdates = await asyncFilterMap(
			this.plugins,
			async (plugin) =>
				await plugin.process?.(structuredClone(packageJsonForArtifact), {
					packageJsonKind,
					format,
				})
		);

		let updatedPackageJson: PackageJson = deepMerge(
			structuredClone(packageJsonForArtifact),
			...packageJsonUpdates
		);

		updatedPackageJson = this.plugins.reduce<PackageJson>(
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
