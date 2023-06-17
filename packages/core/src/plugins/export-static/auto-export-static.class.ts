import { toAbsolute } from '@alexaegis/fs';
import type { PackageJson, WorkspacePackage } from '@alexaegis/workspace-tools';
import { globby } from 'globby';
import { existsSync } from 'node:fs';
import { cp } from 'node:fs/promises';
import posix, { basename, join } from 'node:path/posix';
import { NormalizedAutolibContext } from '../../internal/autolib.class.options.js';
import type { AutolibPlugin, PackageExaminationResult } from '../autolib-plugin.type.js';
import { PackageExportPathContext } from '../entry/auto-export.class.js';
import { stripFileExtension } from '../entry/helpers/strip-file-extension.function.js';
import {
	NormalizedAutoExportStaticInternalOptions,
	normalizeAutoExportStaticInternalOptions,
	type AutoExportStaticInternalOptions,
} from './auto-export-static.class.options.js';

export class AutoExportStatic implements AutolibPlugin {
	public name = 'export-static';

	private options: NormalizedAutoExportStaticInternalOptions;
	private staticExports: Record<string, string> = {};
	private context: NormalizedAutolibContext;

	constructor(options: AutoExportStaticInternalOptions, context: NormalizedAutolibContext) {
		this.options = normalizeAutoExportStaticInternalOptions(options);
		this.context = context;
	}

	private static collectFileMap = async (
		cwd: string,
		globs: string[]
	): Promise<Record<string, string>> => {
		const globbyResult = await globby(globs, { cwd, dot: true });
		return globbyResult.reduce<Record<string, string>>((accumulator, next) => {
			const key = `.${posix.sep}${stripFileExtension(basename(next))}`;
			accumulator[key] = `.${posix.sep}${next}`;
			return accumulator;
		}, {});
	};

	private static copyAll = async (
		cwd: string,
		relativeSourceFiles: string[],
		outDirectory: string
	): Promise<void> => {
		await Promise.allSettled(
			relativeSourceFiles
				.map((sourceFile) => ({
					sourceFile: join(cwd, sourceFile),
					targetFile: join(cwd, outDirectory, sourceFile),
				}))
				.filter(
					({ sourceFile, targetFile }) =>
						existsSync(sourceFile) && !existsSync(targetFile)
				)
				.map(({ sourceFile, targetFile }) =>
					cp(sourceFile, targetFile, {
						preserveTimestamps: true,
						recursive: true,
					})
				)
		);
	};

	async examinePackage(
		_workspacePackage: WorkspacePackage
	): Promise<Partial<PackageExaminationResult>> {
		this.staticExports = await AutoExportStatic.collectFileMap(
			this.context.workspacePackage.packagePath,
			this.options.staticExports
		);

		return {};
	}

	async process(
		packageJson: PackageJson,
		_pathContext: PackageExportPathContext
	): Promise<PackageJson> {
		await AutoExportStatic.copyAll(
			this.context.workspacePackage.packagePath,
			Object.values(this.staticExports),
			toAbsolute(this.options.outDir, this.options)
		);

		return {
			exports: {
				...this.staticExports,
				...packageJson.exports,
			},
		};
	}
}
