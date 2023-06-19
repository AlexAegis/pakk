import { asyncFilterMap } from '@alexaegis/common';
import { writeJson } from '@alexaegis/fs';
import { DEFAULT_EXPORT_FORMATS, createLazyAutoExternalsFunction } from '@alexaegis/vite';
import { Autolib, AutolibOptions, DEFAULT_OUT_DIR, PackageJsonKind } from '@autolib/core';
import { UserConfig, type Plugin } from 'vite';

import dts from 'vite-plugin-dts';

export const autolib = (rawOptions?: AutolibOptions): Plugin[] => {
	let autolib: Autolib;
	let logger: ReturnType<Awaited<ReturnType<typeof Autolib.withContext>>['getLogger']>;

	const autolibPlugin: Plugin = {
		name: 'autolib',
		apply: 'build',
		config: async (config) => {
			const startTime = performance.now();

			const formats =
				config.build?.lib && config.build.lib.formats
					? config.build.lib.formats
					: DEFAULT_EXPORT_FORMATS;

			const outDir: string = config.build?.outDir ?? rawOptions?.outDir ?? DEFAULT_OUT_DIR;

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
					outDir,
				}
			);
			logger = autolib.getLogger();

			logger.info(
				'examining workspace package at',
				autolib.context.workspacePackage.packageJsonPath
			);

			logger.trace('initial vite config', config);

			if (config.build?.lib && !!config.build.lib.entry) {
				logger.warn('build.lib.entry is defined in vite config, will be ignored!');
			}

			const examinationResult = await autolib.examinePackage();

			logger.trace('examination result', examinationResult);
			logger.trace('outDir', outDir);
			const viteConfigUpdates: Partial<UserConfig> = {
				build: {
					minify: false,
					sourcemap: true,
					outDir,
					rollupOptions: {
						external: createLazyAutoExternalsFunction(), // I'm always using this, but autolib also adds it with the other defaults if they are not defined
						treeshake: true,
					},
					lib: {
						formats: autolib.context.formats,
						entry: examinationResult.bundlerEntryFiles, // The entry has to be an array to keep the file's names in the output directory too.
					},
				},
			};

			logger.info(
				`preparation phase took ${Math.floor(performance.now() - startTime)}ms to finish`
			);

			return viteConfigUpdates;
		},
		closeBundle: async () => {
			logger.info(
				'processing workspace package at',
				autolib.context.workspacePackage.packageJsonPath
			);
			// I have to cheat a little bit by starting the timer here because other plugins can
			// steal the thread during an async copy step
			const startTime = performance.now();

			await asyncFilterMap(Object.values(PackageJsonKind), async (packageJsonTarget) => {
				const { updatedPackageJson, path } = await autolib.createUpdatedPackageJson(
					packageJsonTarget,
					autolib.context.primaryFormat
				);

				logger.info('writing updated package.json to', path);

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

	const plugins = [autolibPlugin];
	if (rawOptions?.dts !== false) {
		plugins.push(
			dts({
				copyDtsFiles: true,
			})
		);
	}
	return plugins;
};
