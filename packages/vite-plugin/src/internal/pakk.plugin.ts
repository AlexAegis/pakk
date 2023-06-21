import { asyncFilterMap } from '@alexaegis/common';
import { writeJson } from '@alexaegis/fs';
import {
	DEFAULT_EXPORT_FORMATS,
	PackageJsonKind,
	Pakk,
	PakkOptions,
	normalizePakkOptions,
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
export const pakk = (rawOptions?: PakkOptions): Plugin[] => {
	let pakk: Pakk;
	let logger: ReturnType<Awaited<ReturnType<typeof Pakk.withContext>>['getLogger']>;

	const options = normalizePakkOptions(rawOptions);

	const pakkPlugin: Plugin = {
		name: 'pakk',
		apply: 'build',
		config: async (config) => {
			const startTime = performance.now();

			const formats =
				config.build?.lib && config.build.lib.formats
					? config.build.lib.formats
					: DEFAULT_EXPORT_FORMATS;

			const outDir: string = config.build?.outDir ?? options.outDir;

			pakk = await Pakk.withContext(
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
			logger = pakk.getLogger();

			logger.info(
				'examining workspace package at',
				pakk.context.workspacePackage.packageJsonPath
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

			const examinationResult = await pakk.examinePackage();

			logger.trace('examination result', examinationResult);
			logger.trace('outDir', outDir);
			const viteConfigUpdates: Partial<UserConfig> = {
				build: {
					minify: false,
					sourcemap: true,
					outDir,
					rollupOptions: {
						external: createLazyAutoExternalsFunction(), // I'm always using this, but pakk also adds it with the other defaults if they are not defined
						treeshake: true,
					},
					lib: {
						formats: pakk.context.formats,
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
				pakk.context.workspacePackage.packageJsonPath
			);
			// I have to cheat a little bit by starting the timer here because other plugins can
			// steal the thread during an async copy step
			const startTime = performance.now();

			await asyncFilterMap(Object.values(PackageJsonKind), async (packageJsonTarget) => {
				const { updatedPackageJson, path } = await pakk.createUpdatedPackageJson(
					packageJsonTarget
				);

				logger.info('writing updated package.json to', path);

				return await writeJson(updatedPackageJson, path, {
					autoPrettier: pakk.options.autoPrettier,
					dry: pakk.options.dry,
				});
			});

			logger.info(
				`update phase took ~${Math.floor(performance.now() - startTime)}ms to finish`
			);
		},
	} as Plugin;

	const plugins = [pakkPlugin];
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
