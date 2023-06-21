import { asyncFilterMap } from '@alexaegis/common';
import { writeJson } from '@alexaegis/fs';
import {
	Autolib,
	AutolibOptions,
	DEFAULT_EXPORT_FORMATS,
	PackageJsonKind,
	normalizeAutolibOptions,
} from '@pakk/core';
import { join } from 'node:path';
import { UserConfig, type Plugin } from 'vite';
import dts from 'vite-plugin-dts';
import { createLazyAutoExternalsFunction } from './rollup-externals.function.js';

/**
 * # Pakk
 *
 * Autofills your vite config, packageJson and distribution packageJson
 * based on conventional file and directory layouts.
 *
 * Packaging a publishable library is as easy as defining a vite config with
 * just this single plugin (also wraps [vite-plugin-dts](https://github.com/qmhc/vite-plugin-dts)):
 *
 * ```ts
 * import { defineConfig } from 'vite';
 * import { pakk } from 'vite-plugin-pakk';
 *
 * export default defineConfig({
 * 	plugins: [
 * 		pakk(),
 * 	],
 * });
 * ```
 *
 */
export const pakk = (rawOptions?: AutolibOptions): Plugin[] => {
	let autolib: Autolib;
	let logger: ReturnType<Awaited<ReturnType<typeof Autolib.withContext>>['getLogger']>;

	const options = normalizeAutolibOptions(rawOptions);

	const autolibPlugin: Plugin = {
		name: 'autolib',
		apply: 'build',
		config: async (config) => {
			const startTime = performance.now();

			const formats =
				config.build?.lib && config.build.lib.formats
					? config.build.lib.formats
					: DEFAULT_EXPORT_FORMATS;

			const outDir: string = config.build?.outDir ?? options.outDir;

			autolib = await Autolib.withContext(
				{
					formats,
					fileName:
						config.build?.lib && typeof config.build.lib.fileName === 'function'
							? config.build.lib.fileName
							: undefined,
				},
				{
					...options,
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

			if (config.build?.outDir && rawOptions?.outDir) {
				logger.info(
					`vite plugin defines build.outDir as "${config.build.outDir}". ` +
						`Using that over "${rawOptions.outDir}"`
				);
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
					packageJsonTarget
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
	} as Plugin;

	const plugins = [autolibPlugin];
	if (options.dts) {
		plugins.push(
			dts({
				copyDtsFiles: true,
				cleanVueFileName: true,
				entryRoot: join(options.srcDir, options.exportBaseDir),
			})
		);
	}
	return plugins;
};
