import { asyncFilterMap } from '@alexaegis/common';
import { writeJson } from '@alexaegis/fs';
import { Logger } from '@alexaegis/logging';
import { DEFAULT_EXPORT_FORMATS } from '@alexaegis/vite';
import { type PackageJson } from '@alexaegis/workspace-tools';
import { Autolib, AutolibOptions, PackageJsonKind } from '@autolib/core';
import { posix } from 'node:path';
import { UserConfig, type Plugin } from 'vite';

export const autolib = (rawOptions?: AutolibOptions): Plugin => {
	let autolib: Autolib;
	let logger: Logger<unknown>;

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
			logger.trace('lifecycle: config', config, startTime);
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
			logger.info('starting...');

			logger.info(
				'Building workspace package at',
				autolib.context.workspacePackage.packageJsonPath
			);

			const examinationResult = await autolib.examinePackage();

			const viteConfigUpdates: Partial<UserConfig> = {
				build: {
					sourcemap: true,
					manifest: true,
					ssr: true,
					lib: {
						formats: autolib.context.formats,
						entry: examinationResult.bundlerEntryFiles,
					},
				},
			};

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
