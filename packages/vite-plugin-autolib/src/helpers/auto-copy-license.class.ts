import { toAbsolute } from '@alexaegis/fs';
import { getWorkspaceRoot, type PackageJson } from '@alexaegis/workspace-tools';
import { existsSync } from 'node:fs';
import { cp } from 'node:fs/promises';
import { basename, join } from 'node:path';
import {
	normalizeAutoExportStaticOptions,
	type AutoExportStaticOptions,
} from './auto-export-static.class.options.js';
import type { PreparedBuildUpdate } from './prepared-build-update.type.js';

export class AutoCopyLicense implements PreparedBuildUpdate {
	private options: Required<AutoExportStaticOptions>;
	private workspaceRoot: string | undefined;

	constructor(options: AutoExportStaticOptions) {
		this.options = normalizeAutoExportStaticOptions(options);
		this.workspaceRoot = getWorkspaceRoot(options.cwd);
	}

	async writeBundleOnlyOnce(_packageJson: PackageJson): Promise<void> {
		if (this.workspaceRoot) {
			const licensePath = [
				join(this.options.cwd, 'license'),
				join(this.options.cwd, 'LICENSE'),
				join(this.workspaceRoot, 'license'),
				join(this.workspaceRoot, 'LICENSE'),
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
