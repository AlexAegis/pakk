import { asyncFilterMap, deepMerge, isNotNullish } from '@alexaegis/common';
import { readJson, toAbsolute, writeJson } from '@alexaegis/fs';
import { createLogger } from '@alexaegis/logging';
import {
	collectWorkspacePackages,
	type PackageJson,
	type RegularWorkspacePackage,
} from '@alexaegis/workspace-tools';
import { join, posix, sep } from 'node:path';
import { mergeConfig, type LibraryFormats, type Plugin, type UserConfig } from 'vite';
import { AutoCopyLicense } from '../helpers/auto-copy-license.class.js';
import { DEFAULT_ENTRY_DIR } from '../helpers/auto-entry.class.options.js';
import { AutoExportStatic } from '../helpers/auto-export-static.class.js';
import { AutoMetadata } from '../helpers/auto-metadata.class.js';
import { AutoPeer } from '../helpers/auto-peer.class.js';
import { AutoSort } from '../helpers/auto-reorder.class.js';
import { cloneJsonSerializable } from '../helpers/clone-json-serializable.function.js';
import { AutoBin, AutoEntry, DEFAULT_EXPORT_FORMATS, DEFAULT_OUT_DIR } from '../helpers/index.js';
import type { PreparedBuildUpdate } from '../helpers/prepared-build-update.type.js';
import {
	PackageJsonKind,
	normalizeAutolibOptions,
	type AutolibPluginOptions,
} from './autolib.plugin.options.js';

export const autolib = (rawOptions?: AutolibPluginOptions): Plugin => {
	const options = normalizeAutolibOptions(rawOptions);
	const pluginName = 'autolib';
	options.logger = createLogger({
		name: `vite:${pluginName}`,
	});

	const packageDirName = options.cwd.slice(Math.max(0, options.cwd.lastIndexOf(sep)));

	options.logger.info(packageDirName, options.cwd, 'starting...');

	let workspacePackage: RegularWorkspacePackage;

	// At the end of these definitions as these will only settle once
	// `configResolved` ran
	let formats: LibraryFormats[];
	let sourceDirectory: string;
	let outDirectory: string;

	// All updates leave all paths relative to the package before finalization
	const buildUpdates: PreparedBuildUpdate[] = [];

	let error: Error | undefined;

	let packageJson: PackageJson;
	let writeBundleCalled = 0;

	return {
		name: pluginName,
		apply: 'build',
		config: async (config) => {
			const startTime = performance.now();
			options.logger.trace('lifecycle: config', config, startTime);

			const workspace = await collectWorkspacePackages(options);
			const w = workspace.find(
				(workspacePackage): workspacePackage is RegularWorkspacePackage =>
					workspacePackage.packageKind === 'regular' &&
					workspacePackage.packagePath.includes(options.cwd) &&
					(workspacePackage.packagePath + sep).includes(packageDirName + sep)
			);

			if (!w) {
				throw new Error('Package could not be determined');
			}
			workspacePackage = w;

			options.logger.info('Building workspace package at', workspacePackage.packageJsonPath);

			formats =
				config.build?.lib && config.build.lib.formats
					? config.build.lib.formats
					: DEFAULT_EXPORT_FORMATS;

			sourceDirectory =
				config.build?.lib && typeof config.build.lib.entry === 'string'
					? posix.dirname(config.build.lib.entry)
					: options.src;

			outDirectory = config.build?.outDir ?? DEFAULT_OUT_DIR;

			if (options.autoBin) {
				buildUpdates.push(
					new AutoBin({
						cwd: options.cwd,
						binDir: options.autoBin.binDir,
						shimDir: options.autoBin.shimDir,
						outDir: outDirectory,
						srcDir: sourceDirectory,
						logger: options.logger.getSubLogger({ name: 'auto-bin' }),
					})
				);
			}

			if (options.autoEntryDir) {
				buildUpdates.push(
					new AutoEntry({
						cwd: options.cwd,
						formats,
						entryDir: options.autoEntryDir,
						outDir: outDirectory,
						sourceDirectory,
						logger: options.logger.getSubLogger({ name: 'auto-entry' }),
					})
				);
			}

			if (options.autoExportStaticGlobs) {
				buildUpdates.push(
					new AutoExportStatic({
						cwd: options.cwd,
						outDir: outDirectory,
						staticExportGlobs: options.autoExportStaticGlobs,
						logger: options.logger.getSubLogger({ name: 'auto-export-static' }),
					})
				);
			}

			if (options.autoMetadata) {
				buildUpdates.push(
					new AutoMetadata({
						...options.autoMetadata,
						logger: options.logger.getSubLogger({ name: 'auto-metadata' }),
					})
				);
			}

			if (options.autoOrderPackageJson) {
				buildUpdates.push(
					new AutoSort({
						sortingPreference: options.autoOrderPackageJson,
						logger: options.logger.getSubLogger({ name: 'auto-sort' }),
					})
				);
			}

			if (options.autoCopyLicense) {
				buildUpdates.push(
					new AutoCopyLicense({
						...options.autoCopyLicense,
						logger: options.logger.getSubLogger({ name: 'auto-copy-license' }),
					})
				);
			}

			if (options.autoPeer) {
				buildUpdates.push(new AutoPeer());
			}

			const rawPackageJson = await readJson<PackageJson>(workspacePackage.packageJsonPath);
			if (rawPackageJson) {
				packageJson = rawPackageJson;
			} else {
				console.warn(
					`${pluginName} didn't find package.json at ${workspacePackage.packageJsonPath}!`
				);
				return;
			}

			const preUpdates = await asyncFilterMap(
				buildUpdates,
				async (buildUpdate) => await buildUpdate.preUpdate?.(packageJson)
			);

			deepMerge(packageJson, ...preUpdates);

			const baseViteConfigUpdates: Partial<UserConfig> = {
				build: {
					sourcemap: true,
					manifest: true,
					ssr: true,
					lib: {
						formats,
						entry: DEFAULT_ENTRY_DIR,
					},
				},
			};

			const viteConfigUpdates = await asyncFilterMap(
				buildUpdates,
				async (buildUpdate) => await buildUpdate.getViteConfigUpdates?.(config)
			);

			const updates = viteConfigUpdates
				.filter(isNotNullish)
				.reduce(
					(accumulator, next) => mergeConfig(accumulator, next),
					baseViteConfigUpdates
				);

			options.logger.info(
				`prepare phase took ${Math.floor(performance.now() - startTime)}ms to finish`
			);

			return updates;
		},
		buildEnd: (buildError) => {
			options.logger.trace('lifecycle: buildEnd', buildError);

			error = buildError;
		},
		writeBundle: async (outputOptions) => {
			options.logger.trace('lifecycle: writeBundle');

			if (writeBundleCalled < 1) {
				await asyncFilterMap(
					buildUpdates,
					async (buildUpdate) => await buildUpdate.writeBundleOnlyOnce?.(packageJson)
				);
			}

			const handlePackageJson =
				(packageJson.type === 'module' && outputOptions.format === 'es') ||
				((packageJson.type === 'commonjs' || packageJson.type === undefined) &&
					outputOptions.format !== 'es');

			if (!handlePackageJson) {
				return;
			}

			if (error) {
				options.logger.error("didn't run, error happened during build!");
				return;
			}

			const updates = await asyncFilterMap(
				buildUpdates,
				async (buildUpdate) => await buildUpdate.update?.(packageJson, outputOptions.format)
			);
			// I have to cheat a little bit because other plugins will steal the
			// thread during an async copy step
			const startTime = performance.now();

			packageJson = deepMerge(packageJson, ...updates);

			await asyncFilterMap(Object.values(PackageJsonKind), async (packageJsonTarget) => {
				let packageJsonForArtifact = cloneJsonSerializable(packageJson);

				const pathOffsets = await asyncFilterMap(
					buildUpdates,
					async (buildUpdate) =>
						await buildUpdate.adjustPaths?.(
							packageJsonForArtifact,
							packageJsonTarget,
							outputOptions.format
						)
				);

				packageJsonForArtifact = deepMerge(packageJsonForArtifact, ...pathOffsets);

				packageJsonForArtifact = buildUpdates.reduce(
					(packageJson, buildUpdate) =>
						buildUpdate.postprocess?.(
							{ ...workspacePackage, packageJson },
							packageJsonTarget
						) ?? packageJson,
					packageJsonForArtifact
				);

				const destination =
					packageJsonTarget === PackageJsonKind.DISTRIBUTION
						? toAbsolute(join(outDirectory, 'package.json'), options)
						: toAbsolute('package.json', options);

				return await writeJson(cloneJsonSerializable(packageJsonForArtifact), destination, {
					autoPrettier: options.autoPrettier,
					dry: options.dry,
				});
			});

			options.logger.info(
				`update phase took ~${Math.floor(performance.now() - startTime)}ms to finish`
			);

			writeBundleCalled += 1;
		},
	} satisfies Plugin;
};
