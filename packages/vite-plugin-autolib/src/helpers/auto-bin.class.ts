import { getPrettierFormatter, toAbsolute } from '@alexaegis/fs';
import { getWorkspaceRoot, PackageJson } from '@alexaegis/workspace-tools';

import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { dirname, join, posix, relative } from 'node:path';
import type { InternalModuleFormat } from 'rollup';
import type { UserConfig } from 'vite';
import { PackageJsonKind } from '../plugins/autolib.plugin.options.js';
import { getBundledFileExtension } from './append-bundle-file-extension.function.js';

import { AutoBinOptions, normalizeAutoBinOptions } from './auto-bin.class.options.js';
import { collectFileNamePathEntries } from './collect-export-entries.function.js';
import { enterPathPosix } from './enter-path.function.js';
import { makeJavascriptFilesExecutable } from './make-javascript-files-executable.function.js';
import { normalizePackageName } from './normalize-package-name.function.js';
import type { PreparedBuildUpdate } from './prepared-build-update.type.js';
import { stripFileExtension } from './strip-file-extension.function.js';

export const NPM_INSTALL_HOOKS = [
	'preinstall',
	'install',
	'postinstall',
	'prepublish',
	'preprepare',
	'prepare',
	'postprepare',
];

/**
 * From https://docs.npmjs.com/cli/v8/using-npm/scripts
 * And anything that start pre- and post- that also matches a user defined
 * script (prebuild and postbuild works if 'build' exists)
 */
export const ALL_NPM_HOOKS = [
	...NPM_INSTALL_HOOKS,
	'prepare',
	'prepack',
	'postpack',
	'prepublishOnly',
	'publish',
	'postpublish',
	'prerestart',
	'restart',
	'postrestart',
];

export const ALL_ROLLUP_MODULE_FORMATS: readonly InternalModuleFormat[] = [
	'es',
	'cjs',
	'amd',
	'umd',
	'iife',
	'system',
] as const;

interface BinPaths {
	srcPath: string;
	shimPaths: Record<InternalModuleFormat, string>;
	outPath: Record<InternalModuleFormat, string>;
	outToOutPath: Record<InternalModuleFormat, string>;
}

export class AutoBin implements PreparedBuildUpdate {
	private options: Required<AutoBinOptions>;

	private entryMap: Record<string, string> = {};

	private markComment = ' # autogenerated';
	private tsNode: Record<NonNullable<PackageJson['type']>, string> = {
		module: 'ts-node-esm',
		commonjs: 'ts-node',
	}; // 'node --loader ts-node/esm ';
	private outDirAbs: string;
	private shimDirAbs: string;
	private outBinDirAbs: string;
	private packageType: NonNullable<PackageJson['type']> = 'commonjs';

	private pathMap: Record<string, BinPaths> = {};
	private oldBins: Record<string, string> | undefined;

	constructor(options: AutoBinOptions) {
		this.options = normalizeAutoBinOptions(options);

		this.outDirAbs = toAbsolute(this.options.outDir, this.options);
		this.shimDirAbs = join(this.options.cwd, this.options.shimDir);
		this.outBinDirAbs = join(this.outDirAbs, this.options.binDir);
	}

	/**
	 * The keys in this entry has to be keyed with the entire extensionless path
	 * of each bin. example: "bin/foo": "bin/foo.ts"
	 */
	getViteConfigUpdates(): UserConfig {
		return { build: { lib: { entry: this.entryMap } } };
	}

	async preUpdate(packageJson: PackageJson): Promise<void> {
		this.oldBins = packageJson.bin;
		this.packageType = packageJson.type ?? 'commonjs';

		// Making sure removed bins and scripts will be dropped at the end
		packageJson.bin = undefined;
		for (const script in packageJson.scripts) {
			if (packageJson.scripts && packageJson.scripts[script]?.endsWith(this.markComment)) {
				packageJson.scripts[script] = undefined;
			}
		}

		// paths here are from cwd poointing to the source
		const directBinPaths = await collectFileNamePathEntries(
			this.options.srcDir,
			this.options.binDir
		);

		for (const [bin, binPath] of Object.entries(directBinPaths)) {
			const source = join(this.options.srcDir, binPath);
			const out = this.getAllExtensionVariantsOfPath(join(this.options.outDir, binPath));
			this.pathMap[bin] = {
				srcPath: source,
				outPath: out,
				outToOutPath: this.getAllExtensionVariantsOfPath(binPath),

				shimPaths: this.getAllExtensionVariantsOfPath(
					join(this.options.shimDir, enterPathPosix(binPath, 1))
				),
			};

			this.entryMap[stripFileExtension(binPath)] = source;
		}
	}

	private getAllExtensionVariantsOfPath(path: string): Record<InternalModuleFormat, string> {
		const extensionless = stripFileExtension(path);
		return ALL_ROLLUP_MODULE_FORMATS.reduce((acc, format) => {
			acc[format] =
				extensionless +
				getBundledFileExtension({
					format,
					packageType: this.packageType,
				});
			return acc;
		}, {} as Record<InternalModuleFormat, string>);
	}

	/**
	 * for module based packages, bins are modules too and the adjust path
	 * step only acts for the 'es' format
	 */
	async adjustPaths(
		packageJson: PackageJson,
		packageJsonKind: PackageJsonKind,
		format: InternalModuleFormat
	): Promise<PackageJson | void> {
		if (
			(this.packageType === 'module' && format === 'es') ||
			(this.packageType === 'commonjs' && format !== 'es')
		) {
			const packageName = normalizePackageName(packageJson.name);

			await this.ensureEsmBinEntriesRenamed(this.packageType);

			if (packageJsonKind === PackageJsonKind.DEVELOPMENT) {
				await this.createShims(
					Object.values(this.pathMap).map((pathKinds) => pathKinds.shimPaths[format]),
					format
				);
			}

			await makeJavascriptFilesExecutable(
				Object.values(this.pathMap).flatMap((pathKinds) => [
					pathKinds.outPath[format],
					pathKinds.shimPaths[format],
				]),
				{
					cwd: this.options.cwd,
					logger: this.options.logger,
					format,
					packageJsonType: this.packageType,
				}
			);

			await this.preLink(
				Object.fromEntries(
					Object.entries(this.pathMap).map(([binName, pathKinds]) => [
						binName,
						pathKinds.outPath[format],
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

			const update = Object.entries(this.pathMap).reduce(
				(result, [key, value]) => {
					if (result.scripts && this.options.enabledHooks.includes(key)) {
						if (
							!packageJson.scripts?.[key] ||
							packageJson.scripts?.[key]?.endsWith(this.markComment)
						) {
							if (packageJsonKind === PackageJsonKind.DISTRIBUTION) {
								result.scripts[key] = value.outToOutPath[format] + this.markComment; // before update
							} else if (NPM_INSTALL_HOOKS.includes(key)) {
								// Disable local postinstall hooks
								result.scripts[key] =
									'# local install hooks are disabled' + this.markComment;
								// Change the script target to source if its an install hook as it wont be compiled by the time it runs
								// result.scripts[key] =
								// 	this.tsNode[this.packageType] +
								// 	value.srcPath +
								// 	this.markComment; // before update
							} else {
								// Otherwise just point to the shim
								result.scripts[key] = value.shimPaths[format] + this.markComment; // before update
							}
						}
						// Hooks are renamed to avoid conflicts, except for their scripts
						key = packageName + '-' + key;
					}

					if (!result.bin) {
						result.bin = {};
					}

					if (packageJsonKind === PackageJsonKind.DISTRIBUTION) {
						// the build artifacts bins point to the built bins
						result.bin[key] = '.' + posix.sep + value.outToOutPath[format];
					} else {
						// The bins are pointing to their shims otherwise
						result.bin[key] = '.' + posix.sep + value.shimPaths[format];
					}
					return result;
				},
				{
					bin: manualBins,
					scripts: {},
				} as PackageJson
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
			(this.packageType === 'module' && format === 'es') ||
			(this.packageType === 'commonjs' && format !== 'es')
		) {
			this.options.logger.info(
				`Creating shims for bins in ${format}/${this.packageType} format`
			);
			// Clean up
			await rm(this.shimDirAbs, { force: true, recursive: true });

			const shimDirToOutBin = relative(this.shimDirAbs, this.outBinDirAbs);
			const formatJs = await getPrettierFormatter();

			// check writable shim files
			const shimPathsToMake = await Promise.all(
				shimPaths.map((path) =>
					readFile(toAbsolute(path, this.options), { encoding: 'utf8' })
						.then((content) => (/\/\/ autogenerated/.test(content) ? path : undefined))
						.catch(() => path)
				)
			).then((results) => results.filter((result): result is string => result !== undefined));

			if (shimPathsToMake.length > 0) {
				this.options.logger.info(`create shims for ${shimPathsToMake}`);

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
				const basename = stripFileExtension(binPaths.outPath['es']);
				return [
					{
						binPath: basename + '.js',
						newBinPath: binPaths.outPath['es'],
					},
					{
						binPath: basename + '.js.map',
						newBinPath: binPaths.outPath['es'] + '.map',
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
