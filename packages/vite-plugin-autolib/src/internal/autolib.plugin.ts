import { asyncFilterMap } from '@alexaegis/common';
import { writeJson } from '@alexaegis/fs';
import { DEFAULT_EXPORT_FORMATS, DEFAULT_VITE_LIB_CONFIG } from '@alexaegis/vite';
import { type PackageJson } from '@alexaegis/workspace-tools';
import { Autolib, AutolibOptions, PackageJsonKind } from '@autolib/core';
import { posix } from 'node:path';
import { UserConfig, mergeConfig, type Plugin } from 'vite';

export const autolib = (rawOptions?: AutolibOptions): Plugin => {
	let autolib: Autolib;
	let logger: ReturnType<Awaited<ReturnType<typeof Autolib.withContext>>['getLogger']>;

	let error: Error | undefined;

	let packageJson: PackageJson;

	return {
		name: 'autolib',
		apply: 'build',
		config: async (config) => {
			const formats =
				config.build?.lib && config.build.lib.formats
					? config.build.lib.formats
					: DEFAULT_EXPORT_FORMATS;

			const startTime = performance.now();

			autolib = await Autolib.withContext(
				{
					formats,
					fileName:
						config.build?.lib && typeof config.build.lib.fileName === 'function'
							? config.build.lib.fileName
							: undefined,
				},
				{
					...rawOptions,
					// If the user defines src or outDir on the plugins options, respect that over
					// autolibs. If not set, autolib will set it.
					srcDir:
						config.build?.lib && typeof config.build.lib.entry === 'string'
							? posix.dirname(config.build.lib.entry)
							: rawOptions?.srcDir,
					outDir: config.build?.outDir,
				}
			);
			logger = autolib.getLogger();
			logger.trace('lifecycle: config', config, startTime);
			logger.info('starting...');

			logger.info(
				'Building workspace package at',
				autolib.context.workspacePackage.packageJsonPath
			);

			const examinationResult = await autolib.examinePackage();

			const viteConfigUpdates: Partial<UserConfig> = mergeConfig(DEFAULT_VITE_LIB_CONFIG, {
				build: {
					lib: {
						formats: autolib.context.formats,
						entry: examinationResult.bundlerEntryFiles, // The entry has to be an array to keep the file's names in the output directory too.
					},
				},
			});

			logger.info(
				`preparation phase took ${Math.floor(performance.now() - startTime)}ms to finish`
			);

			return viteConfigUpdates;
		},
		buildEnd: (buildError) => {
			logger.trace('lifecycle: buildEnd', buildError);
			error = buildError;
		},
		writeBundle: async (outputOptions) => {
			if (autolib.context.primaryFormat !== outputOptions.format) {
				logger.trace(
					'skipping writeBundle for non-primary format. Primary format:',
					autolib.context.primaryFormat,
					'current output format:',
					outputOptions.format
				);
				return;
			}

			if (error) {
				logger.error('skipping! error happened during build!', error);
				return;
			}

			logger.trace('lifecycle: writeBundle', outputOptions.format);

			// I have to cheat a little bit vby starting the timer here because other plugins will
			// steal the thread during an async copy step
			const startTime = performance.now();

			await asyncFilterMap(Object.values(PackageJsonKind), async (packageJsonTarget) => {
				const { updatedPackageJson, path } = await autolib.createUpdatedPackageJson(
					packageJson,
					packageJsonTarget,
					outputOptions.format
				);

				return await writeJson(updatedPackageJson, path, {
					autoPrettier: autolib.options.autoPrettier,
					dry: autolib.options.dry,
				});
			});

			logger.info(
				`update phase took ~${Math.floor(performance.now() - startTime)}ms to finish`
			);
		},
	} satisfies Plugin;
};
