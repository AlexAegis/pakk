import { toAbsolute } from '@alexaegis/fs';
import type { PackageJson } from '@alexaegis/workspace-tools';
import {
	normalizeAutoExportStaticOptions,
	type AutoExportStaticOptions,
} from './auto-export-static.class.options.js';
import { collectFileMap } from './collect-export-map.function.js';
import { copyAllInto } from './copy-all-into.function.js';
import type { PreparedBuildUpdate } from './prepared-build-update.type.js';

export class AutoExportStatic implements PreparedBuildUpdate {
	private options: Required<AutoExportStaticOptions>;
	private staticExports: Record<string, string> = {};

	constructor(options: AutoExportStaticOptions) {
		this.options = normalizeAutoExportStaticOptions(options);
	}

	async preUpdate(packageJson: PackageJson): Promise<PackageJson | undefined> {
		this.staticExports = await collectFileMap(this.options.cwd, this.options.staticExportGlobs);

		packageJson.exports = undefined;

		return packageJson;
	}

	update(packageJson: PackageJson): PackageJson {
		packageJson.exports = {
			...this.staticExports,
			...packageJson.exports,
		};
		return packageJson;
	}

	async writeBundleOnlyOnce(): Promise<void> {
		await copyAllInto(
			Object.values(this.staticExports),
			toAbsolute(this.options.outDir, this.options)
		);
	}
}
