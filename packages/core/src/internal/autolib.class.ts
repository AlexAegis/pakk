import { asyncFilterMap, deepMerge } from '@alexaegis/common';
import { toAbsolute } from '@alexaegis/fs';
import { Logger } from '@alexaegis/logging';
import { PackageJson, WorkspacePackage } from '@alexaegis/workspace-tools';
import { join } from 'node:path';
import { InternalModuleFormat } from 'rollup';
import { LibraryFormats } from 'vite';

import { PackageJsonKind } from '../package-json/package-json-kind.enum.js';
import { AutoBin } from '../plugins/autobin/autobin.class.js';
import { AutolibPlugin, PackageExaminationResult } from '../plugins/autolib-plugin.type.js';
import { AutoCopyLicense } from '../plugins/autolicense/auto-copy-license.class.js';
import { AutoExport } from '../plugins/entry/auto-export.class.js';
import { ExportMap } from '../plugins/entry/export-map.type.js';
import { AutoExportStatic } from '../plugins/export-static/auto-export-static.class.js';
import { AutoMetadata } from '../plugins/metadata/auto-metadata.class.js';
import { AutoPeer } from '../plugins/peer/auto-peer.class.js';
import { AutoSort } from '../plugins/reorder/auto-reorder.class.js';
import {
	AutolibContext,
	AutolibOptions,
	NormalizedAutolibOptions,
	normalizeAutolibOptions,
} from './autolib-options.js';
import { findCurrentAndRootWorkspacePackage } from './workspace/find-current-and-root-workspace-package.function.js';

export const isFeatureEnabled = (enabledFeatures: RegExp[], feature: string): boolean => {
	return (
		enabledFeatures.length === 0 ||
		enabledFeatures.some((enabledFeature) => enabledFeature.test(feature))
	);
};

/**
 * This class does not execute anything on it's own, just provides itself as a
 * tool that then needs to be orchestrated by antoher tool. This could be
 * the standalone runner or the vite plugin. It also does not hold state,
 * the packageJson object that is being worked on has to be stored elsewhere
 * to avoid inner mutation.
 */
export class Autolib {
	public readonly options: NormalizedAutolibOptions;
	public readonly context: AutolibContext;

	private plugins: AutolibPlugin[] = [];

	private constructor(options: NormalizedAutolibOptions, context: AutolibContext) {
		this.options = options;
		this.context = context;

		if (options.autoBin) {
			this.plugins.push(
				new AutoBin(
					{
						...options.autoBin,
						cwd: options.cwd,
						outDir: options.outDir,
						srcDir: options.srcDir,
						logger: options.logger.getSubLogger({ name: 'auto-bin' }),
					},
					this.context
				)
			);
		}

		if (options.autoEntryDir) {
			this.plugins.push(
				new AutoExport(
					{
						cwd: options.cwd,
						formats: context.formats,
						exports: options.autoEntryDir,
						outDir: options.outDir,
						srcDir: options.srcDir,
						logger: options.logger.getSubLogger({ name: 'auto-entry' }),
					},
					this.context
				)
			);
		}

		if (options.autoExportStaticGlobs) {
			this.plugins.push(
				new AutoExportStatic(
					{
						cwd: options.cwd,
						outDir: options.outDir,
						staticExportGlobs: options.autoExportStaticGlobs,
						logger: options.logger.getSubLogger({ name: 'auto-export-static' }),
					},
					this.context
				)
			);
		}

		if (options.autoMetadata) {
			this.plugins.push(
				new AutoMetadata(this.context, {
					...options.autoMetadata,
					logger: options.logger.getSubLogger({ name: 'auto-metadata' }),
				})
			);
		}

		if (options.autoOrderPackageJson) {
			this.plugins.push(
				new AutoSort({
					sortingPreference: options.autoOrderPackageJson,
					logger: options.logger.getSubLogger({ name: 'auto-sort' }),
				})
			);
		}

		if (options.autoCopyLicense) {
			this.plugins.push(
				new AutoCopyLicense(
					{
						...options.autoCopyLicense,
						logger: options.logger.getSubLogger({ name: 'auto-copy-license' }),
					},
					this.context
				)
			);
		}

		if (options.autoPeer) {
			this.plugins.push(new AutoPeer());
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

		const autolib = new Autolib(options, {
			...workspaceContext,
			...manualContext,
			primaryFormat,
			packageType:
				workspaceContext.workspacePackage.packageJson.type === 'module'
					? 'module'
					: 'commonjs',
		});
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
				{} as ExportMap,
				detectedExports.map((e) => e.exportMap)
			),
			packageJsonUpdates: deepMerge(
				{} as PackageJson,
				detectedExports.map((e) => e.packageJsonUpdates)
			),
		} satisfies PackageExaminationResult;
	}

	/**
	 * 2nd step
	 *
	 * must only call once
	 *
	 */
	async writeBundleOnlyOnce(packageJson: PackageJson): Promise<void> {
		await asyncFilterMap(
			this.plugins,
			async (plugin) => await plugin.writeBundleOnlyOnce?.(packageJson)
		);
	}

	/**
	 * @deprecated, maybe there's no need for this to exist, investigate
	 */
	async autoPackageJson(
		packageJson: PackageJson,
		format: InternalModuleFormat
	): Promise<PackageJson> {
		const updates = await asyncFilterMap(
			this.plugins,
			async (plugin) => await plugin.update?.(packageJson, format)
		);

		return deepMerge(structuredClone(packageJson), ...updates);
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
		const pathOffsets = await asyncFilterMap(
			this.plugins,
			async (plugin) =>
				await plugin.getPackageJsonUpdates?.(packageJsonForArtifact, {
					packageJsonKind,
					format,
					fileName: undefined,
				})
		);

		let updatedPackageJson: PackageJson = deepMerge(
			structuredClone(packageJsonForArtifact),
			...pathOffsets
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
				? toAbsolute(join(this.options.outDir, 'package.json'), this.options)
				: toAbsolute('package.json', this.options);

		return { updatedPackageJson, path };
	}
}
