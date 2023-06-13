import { getPrettierFormatter, toAbsolute } from '@alexaegis/fs';
import { WorkspacePackage, getWorkspaceRoot, type PackageJson } from '@alexaegis/workspace-tools';

import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { basename, dirname, join, posix, relative } from 'node:path';
import type { InternalModuleFormat } from 'rollup';
import { getBundledFileExtension } from '../entry/helpers/append-bundle-file-extension.function.js';

import { globby } from 'globby';
import { makeJavascriptFilesExecutable } from '../../../../vite-plugin-autolib/src/helpers/make-javascript-files-executable.function.js';
import { normalizePackageName } from '../../../../vite-plugin-autolib/src/helpers/normalize-package-name.function.js';
import { AutolibContext } from '../../index.js';
import { ALL_ROLLUP_MODULE_FORMATS } from '../../internal/defaults.const.js';
import { NPM_INSTALL_HOOKS, PackageJsonKind } from '../../package-json/index.js';
import type { AutolibPlugin, PackageExaminationResult } from '../autolib-plugin.type.js';
import { PackageExportPathContext } from '../entry/auto-export.class.js';
import { enterPathPosix } from '../entry/helpers/enter-path.function.js';
import { stripFileExtension } from '../entry/helpers/strip-file-extension.function.js';
import {
	AutoBinOptions,
	NormalizedAutoBinOptions,
	normalizeAutoBinOptions,
} from './autobin.class.internal-options.js';

export interface BinPaths {
	srcPath: string;
	shimPaths: Record<InternalModuleFormat, string>;
	outPath: Record<InternalModuleFormat, string>;
	outToOutPath: Record<InternalModuleFormat, string>;
}

/**
 * For a simpler packageJson, directories.bin could also be used in
 * https://docs.npmjs.com/cli/v9/configuring-npm/package-json#directories
 */
export class AutoBin implements AutolibPlugin {
	public name = 'bin';
	private options: NormalizedAutoBinOptions;
	private context: AutolibContext;

	private markComment = ' # autogenerated';
	private outDirAbs: string;
	private shimDirAbs: string;
	private outBinDirAbs: string;

	private pathMap: Record<string, BinPaths> = {};
	private oldBins: Record<string, string> | undefined;

	constructor(options: AutoBinOptions, context: AutolibContext) {
		this.options = normalizeAutoBinOptions(options);
		this.context = context;

		this.outDirAbs = toAbsolute(this.options.outDir, this.options);
		this.shimDirAbs = join(this.options.cwd, this.options.shimDir);
		this.outBinDirAbs = join(this.outDirAbs, this.options.binBaseDir);
	}

	async examinePackage(
		workspacePackage: WorkspacePackage
	): Promise<Partial<PackageExaminationResult>> {
		const packageJson: PackageJson = {};

		this.oldBins = structuredClone(packageJson.bin);

		// Making sure removed bins and scripts will be dropped at the end
		packageJson.bin = undefined;
		for (const script in packageJson.scripts) {
			if (packageJson.scripts[script]?.endsWith(this.markComment)) {
				packageJson.scripts[script] = undefined;
			}
		}

		const absoluteBinBaseDir = toAbsolute(join(this.options.srcDir, this.options.binBaseDir), {
			cwd: workspacePackage.packagePath,
		});

		const binFiles = await globby('*', {
			cwd: absoluteBinBaseDir,
			ignoreFiles: [...this.options.binIgnore, ...this.options.defaultBinIgnore],
			onlyFiles: true,
		});

		for (const binPath of binFiles) {
			const binName = stripFileExtension(basename(binPath));
			const source = join(this.options.srcDir, binPath);
			const out = this.getAllExtensionVariantsOfPath(join(this.options.outDir, binPath));
			this.pathMap[binName] = {
				srcPath: source,
				outPath: out,
				outToOutPath: this.getAllExtensionVariantsOfPath(binPath),

				shimPaths: this.getAllExtensionVariantsOfPath(
					join(this.options.shimDir, enterPathPosix(binPath, 1))
				),
			};
		}

		return { packageJsonUpdates: packageJson };
	}

	private getAllExtensionVariantsOfPath(path: string): Record<InternalModuleFormat, string> {
		const extensionless = stripFileExtension(path);

		return ALL_ROLLUP_MODULE_FORMATS.reduce<Record<string, string>>((acc, format) => {
			acc[format] =
				extensionless +
				getBundledFileExtension({
					format,
					packageType: this.context.packageType,
				});
			return acc;
		}, {});
	}

	/**
	 * for module based packages, bins are modules too and the adjust path
	 * step only acts for the 'es' format
	 */
	async getPackageJsonUpdates(
		packageJson: PackageJson,
		pathContext: PackageExportPathContext
	): Promise<PackageJson | undefined> {
		if (this.context.primaryFormat === pathContext.format) {
			const packageName = normalizePackageName(packageJson.name);

			await this.ensureEsmBinEntriesRenamed(this.context.packageType);

			if (pathContext.packageJsonKind === PackageJsonKind.DEVELOPMENT) {
				await this.createShims(
					Object.values(this.pathMap).map(
						(pathKinds) => pathKinds.shimPaths[this.context.primaryFormat]
					),
					this.context.primaryFormat
				);
			}

			await makeJavascriptFilesExecutable(
				Object.values(this.pathMap).flatMap((pathKinds) => [
					pathKinds.outPath[this.context.primaryFormat],
					pathKinds.shimPaths[this.context.primaryFormat],
				]),
				{
					cwd: this.options.cwd,
					logger: this.options.logger,
					format: this.context.primaryFormat,
					packageJsonType: this.context.packageType,
				}
			);

			await this.preLink(
				Object.fromEntries(
					Object.entries(this.pathMap).map(([binName, pathKinds]) => [
						binName,
						pathKinds.outPath[this.context.primaryFormat],
					])
				),
				packageName
			);

			const manualBins: Record<string, string> = Object.fromEntries(
				Object.entries(this.oldBins ?? {}).filter(
					([, path]) =>
						!path.startsWith('.' + posix.sep + this.options.shimDir) ||
						!path.endsWith('js') ||
						path.includes('manual')
				)
			);

			const update = Object.entries(this.pathMap).reduce<PackageJson>(
				(result, [key, value]) => {
					if (result.scripts && this.options.enabledHooks.includes(key)) {
						if (
							!packageJson.scripts?.[key] ||
							packageJson.scripts[key]?.endsWith(this.markComment)
						) {
							if (pathContext.packageJsonKind === PackageJsonKind.DISTRIBUTION) {
								result.scripts[key] =
									value.outToOutPath[this.context.primaryFormat] +
									this.markComment; // before update
							} else if (NPM_INSTALL_HOOKS.includes(key)) {
								// Disable local postinstall hooks
								result.scripts[key] =
									'# local install hooks are disabled' + this.markComment;
								// Change the script target to source if its an install hook as it wont be compiled by the time it runs
								// result.scripts[key] =
								// 	this.tsNode[this.context.packageType] +
								// 	value.srcPath +
								// 	this.markComment; // before update
							} else {
								// Otherwise just point to the shim
								result.scripts[key] =
									value.shimPaths[this.context.primaryFormat] + this.markComment; // before update
							}
						}
						// Hooks are renamed to avoid conflicts, except for their scripts
						key = packageName + '-' + key;
					}

					if (!result.bin) {
						result.bin = {};
					}

					// the distributed build artifacts bins point to the built bins
					// otherwise, the bins are pointing to their shims
					result.bin[key] =
						'.' +
						posix.sep +
						(pathContext.packageJsonKind === PackageJsonKind.DISTRIBUTION
							? value.outToOutPath[this.context.primaryFormat]
							: value.shimPaths[this.context.primaryFormat]);

					return result;
				},
				{
					bin: manualBins,
					scripts: {},
				}
			);
			if (typeof update.bin === 'object' && Object.keys(update.bin).length === 0) {
				delete update.bin;
			}

			if (typeof update.scripts === 'object' && Object.keys(update.scripts).length === 0) {
				delete update.scripts;
			}
			return update;
		}
		return {};
	}

	/**
	 * Ensures shimDir exists and creates simple javascript files that are
	 * importing their counterpart from `outDir`
	 */
	private async createShims(shimPaths: string[], format: InternalModuleFormat): Promise<void> {
		if (
			(this.context.packageType === 'module' && format === 'es') ||
			(this.context.packageType === 'commonjs' && format !== 'es')
		) {
			this.options.logger.info(
				`Creating shims for bins in ${format}/${this.context.packageType} format`
			);
			// Clean up
			await rm(this.shimDirAbs, { force: true, recursive: true });

			const shimDirToOutBin = relative(this.shimDirAbs, this.outBinDirAbs);
			const formatJs = await getPrettierFormatter();

			// check writable shim files
			const shimPathsToMake = await Promise.all(
				shimPaths.map((path) =>
					readFile(toAbsolute(path, this.options), { encoding: 'utf8' })
						.then((content) =>
							content.includes('// autogenerated') ? path : undefined
						)
						.catch(() => path)
				)
			).then((results) => results.filter((result): result is string => result !== undefined));

			if (shimPathsToMake.length > 0) {
				this.options.logger.info(`create shims for ${shimPathsToMake.join('; ')}`);

				await mkdir(this.shimDirAbs, { recursive: true });

				await Promise.allSettled(
					shimPathsToMake.map((path) => {
						const outBinPath = enterPathPosix(path, path.split(posix.sep).length - 1);
						const builtBinFromShims = shimDirToOutBin + posix.sep + outBinPath;
						const formattedESShimContent = formatJs(
							`// autogenerated
							export * from '${builtBinFromShims}';`
						);
						const formattedCJSShimContent = formatJs(
							`// autogenerated as seen from tsc
							/* eslint-disable unicorn/prefer-module */
							/* eslint-disable @typescript-eslint/no-var-requires */
							/* eslint-disable no-prototype-builtins */
							var __createBinding = function(o, m, k, k2) {
								if (k2 === undefined) k2 = k;
								Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
							};

							var __exportStar = function(m, exports) {
								for (var p in m) if (p !== 'default' && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
							};

							__exportStar(require('${builtBinFromShims}'), exports);`
						);

						return writeFile(
							join(this.shimDirAbs, outBinPath),
							format === 'es' ? formattedESShimContent : formattedCJSShimContent
						).catch(() => undefined);
					})
				);
			}
		}
	}

	private async ensureEsmBinEntriesRenamed(packageType?: PackageJson['type']): Promise<void> {
		if (packageType === 'module') {
			const data = Object.entries(this.pathMap).flatMap(([_binName, binPaths]) => {
				const basename = stripFileExtension(binPaths.outPath.es);
				return [
					{
						binPath: basename + '.js',
						newBinPath: binPaths.outPath.es,
					},
					{
						binPath: basename + '.js.map',
						newBinPath: binPaths.outPath.es + '.map',
					},
				];
			});

			await Promise.all(
				data
					.filter(({ binPath }) => existsSync(binPath))
					.map(({ binPath, newBinPath }) =>
						rename(binPath, newBinPath).catch(() => false)
					)
			);
		}
	}

	// TODO: something is funky, there are extensionless files in the distbin dir and they are not executable.
	/**
	 *
	 */
	private async preLink(binRecord: Record<string, string>, packageName: string): Promise<void> {
		const workspaceRoot = getWorkspaceRoot(this.options.cwd);
		if (!workspaceRoot) {
			this.options.logger.error(
				`Cannot execute prelink, not in a workspace ${this.options.cwd}`
			);
			return;
		}
		const workspaceBinDirectoryPath = join(workspaceRoot, 'node_modules', '.bin');

		const packageBinDirectoryPath = toAbsolute(join('node_modules', '.bin'), this.options);

		const symlinksToMake = Object.entries(binRecord).flatMap(([binName, binPath]) => {
			if (this.options.enabledHooks.includes(binName)) {
				binName = packageName + '-' + binName;
			}

			return [
				join(workspaceBinDirectoryPath, binName),
				join(packageBinDirectoryPath, binName),
			].map((targetFilePath) => {
				const relativeFromTargetBackToFile = relative(dirname(targetFilePath), binPath);
				return { relativeFromTargetBackToFile, targetFilePath };
			});
		});

		await Promise.all(
			symlinksToMake.map(async ({ targetFilePath, relativeFromTargetBackToFile }) => {
				try {
					await symlink(relativeFromTargetBackToFile, targetFilePath);
					this.options.logger.info(
						`symlinked ${targetFilePath} to ${relativeFromTargetBackToFile}`
					);
				} catch {
					this.options.logger.info(`${targetFilePath} is already present`);
				}
			})
		);
	}
}