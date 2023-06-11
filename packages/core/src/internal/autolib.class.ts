import { asyncFilterMap, deepMerge, isNotNullish } from '@alexaegis/common';
import { toAbsolute } from '@alexaegis/fs';
import { Logger } from '@alexaegis/logging';
import { PackageJson } from '@alexaegis/workspace-tools';
import { join } from 'node:path';
import { InternalModuleFormat } from 'rollup';
import { LibraryFormats, UserConfig } from 'vite';
import {
	AutoBin,
	AutoCopyLicense,
	AutoEntry,
	AutoExportStatic,
	AutolibPlugin,
} from '../../../vite-plugin-autolib/src/index.js';
import { PackageJsonKind } from '../package-json/package-json-kind.enum.js';
import { AutoMetadata } from '../plugins/metadata/auto-metadata.class.js';
import { AutoPeer } from '../plugins/peer/auto-peer.class.js';
import { AutoSort } from '../plugins/reorder/auto-reorder.class.js';
import {
	AutolibContext,
	AutolibOptions,
	NormalizedAutolibOptions,
	normalizeAutolibOptions,
} from './autolib-options.js';
import { DEFAULT_ENTRY_DIR } from './defaults.const.js';
import { findCurrentAndRootWorkspacePackage } from './workspace/find-current-and-root-workspace-package.function.js';

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

	// TODO: rename this to AutolibPlugin
	private plugins: AutolibPlugin[] = [];

	private constructor(options: NormalizedAutolibOptions, context: AutolibContext) {
		this.options = options;
		this.context = context;

		if (options.autoBin) {
			this.plugins.push(
				new AutoBin(
					{
						cwd: options.cwd,
						binDir: options.autoBin.binDir,
						shimDir: options.autoBin.shimDir,
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
				new AutoEntry(
					{
						cwd: options.cwd,
						formats: context.formats,
						entryDir: options.autoEntryDir,
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
		manualContext: Pick<AutolibContext, 'formats'>,
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
	 * A vite specific function to return what needs to be overriden in it's
	 * configuration.
	 */
	async collectVitePluginUpdates(config: UserConfig): Promise<Partial<UserConfig>> {
		const baseViteConfigUpdates: Partial<UserConfig> = {
			build: {
				sourcemap: true,
				manifest: true,
				ssr: true,
				lib: {
					formats: this.context.formats,
					entry: DEFAULT_ENTRY_DIR,
				},
			},
		};

		const viteConfigUpdates = await asyncFilterMap(
			this.plugins,
			async (plugin) => await plugin.getViteConfigUpdates?.(config)
		);

		const updates = viteConfigUpdates
			.filter(isNotNullish)
			.reduce((accumulator, next) => deepMerge(accumulator, next), baseViteConfigUpdates);

		return updates;
	}

	/**
	 * 1st step
	 *
	 * Collects all the preliminary updates to the packageJson, these alone
	 * won't be written out, just prepares it for further steps
	 */
	async getInitialPreparedPackageJson(
		packageJson: PackageJson = this.context.workspacePackage
	): Promise<PackageJson> {
		const preUpdates = await asyncFilterMap(
			this.plugins,
			async (plugin) => await plugin.preUpdate?.(packageJson)
		);

		return deepMerge(structuredClone(packageJson), ...preUpdates);
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
		packageJsonTarget: PackageJsonKind,
		format: InternalModuleFormat
	): Promise<{ updatedPackageJson: PackageJson; path: string }> {
		const pathOffsets = await asyncFilterMap(
			this.plugins,
			async (plugin) =>
				await plugin.adjustPaths?.(packageJsonForArtifact, packageJsonTarget, format)
		);

		let updatedPackageJson: PackageJson = deepMerge(
			structuredClone(packageJsonForArtifact),
			...pathOffsets
		);

		updatedPackageJson = this.plugins.reduce<PackageJson>(
			(packageJson, plugin) =>
				plugin.postprocess?.(
					{ ...this.context.workspacePackage, packageJson },
					packageJsonTarget
				) ?? packageJson,
			updatedPackageJson
		);

		const path =
			packageJsonTarget === PackageJsonKind.DISTRIBUTION
				? toAbsolute(join(this.options.outDir, 'package.json'), this.options)
				: toAbsolute('package.json', this.options);

		return { updatedPackageJson, path };
	}
}
