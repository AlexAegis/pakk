import { toAbsolute } from '@alexaegis/fs';
import { PackageJson, WorkspacePackage } from '@alexaegis/workspace-tools';
import { existsSync } from 'node:fs';
import { cp } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { AutolibContext } from '../../index.js';
import type { AutolibPlugin, PackageExaminationResult } from '../autolib-plugin.type.js';
import { PackageExportPathContext } from '../entry/auto-export.class.js';
import {
	AutoExportStaticInternalOptions,
	NormalizedAutoExportStaticInternalOptions,
	normalizeAutoExportStaticInternalOptions,
} from '../export-static/auto-export-static.class.options.js';

/**
 * This plugin will copy a license file from either the root of the workspace
 * or if it exists, the one directly in the package
 */
export class AutoCopyLicense implements AutolibPlugin {
	public name = 'copy-license';

	private options: NormalizedAutoExportStaticInternalOptions;
	private context: AutolibContext;

	private licensePath: string | undefined;

	constructor(options: AutoExportStaticInternalOptions, context: AutolibContext) {
		this.options = normalizeAutoExportStaticInternalOptions(options);
		this.context = context;
	}

	examinePackage(workspacePackage: WorkspacePackage): Partial<PackageExaminationResult> {
		this.licensePath = [
			join(workspacePackage.packagePath, 'license'),
			join(workspacePackage.packagePath, 'LICENSE'),
			join(this.context.rootWorkspacePackage.packagePath, 'license'),
			join(this.context.rootWorkspacePackage.packagePath, 'LICENSE'),
		].find((path) => existsSync(path));

		return {};
	}

	async process(
		_packageJson: PackageJson,
		_pathContext: PackageExportPathContext
	): Promise<void> {
		if (this.licensePath) {
			await cp(
				this.licensePath,
				join(toAbsolute(this.options.outDir, this.options), basename(this.licensePath))
			);
		}
	}
}
