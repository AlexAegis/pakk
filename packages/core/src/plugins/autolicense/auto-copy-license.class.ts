import { toAbsolute } from '@alexaegis/fs';
import { existsSync } from 'node:fs';
import { cp } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { AutolibContext } from '../../index.js';
import type { AutolibPlugin } from '../autolib-plugin.type.js';
import {
	AutoExportStaticOptions,
	NormalizedAutoExportStaticOptions,
	normalizeAutoExportStaticOptions,
} from '../export-static/auto-export-static.class.options.js';

/**
 * This plugin will copy a license file from either the root of the workspace
 * or if it exists, the one directly in the package
 */
export class AutoCopyLicense implements AutolibPlugin {
	public name = 'copy-license';

	private options: NormalizedAutoExportStaticOptions;
	private context: AutolibContext;

	constructor(options: AutoExportStaticOptions, context: AutolibContext) {
		this.options = normalizeAutoExportStaticOptions(options);
		this.context = context;
	}

	async writeBundleOnlyOnce(): Promise<void> {
		if (this.context.rootWorkspacePackage.packagePath) {
			const licensePath = [
				join(this.context.workspacePackage.packagePath, 'license'),
				join(this.context.workspacePackage.packagePath, 'LICENSE'),
				join(this.context.rootWorkspacePackage.packagePath, 'license'),
				join(this.context.rootWorkspacePackage.packagePath, 'LICENSE'),
			].find((path) => existsSync(path));

			if (licensePath) {
				await cp(
					licensePath,
					join(toAbsolute(this.options.outDir, this.options), basename(licensePath))
				);
			}
		}
	}
}
