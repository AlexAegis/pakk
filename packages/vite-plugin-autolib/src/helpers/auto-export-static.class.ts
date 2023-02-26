import { toAbsolute } from '@alexaegis/fs';
import type { PackageJson, PackageJsonExports } from '@alexaegis/workspace-tools';
import {
	AutoExportStaticOptions,
	normalizeAutoExportStaticOptions,
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

	preUpdate(packageJson: PackageJson): PackageJson {
		packageJson.exports = undefined;
		return packageJson;
	}

	async update(packageJson: PackageJson): Promise<PackageJson> {
		this.staticExports = await collectFileMap(this.options.cwd, this.options.staticExportGlobs);
		await copyAllInto(
			Object.values(this.staticExports),
			toAbsolute(this.options.outDir, this.options)
		);
		packageJson.exports = {
			...this.staticExports,
			...(packageJson.exports as PackageJsonExports),
		};
		return packageJson;
	}
}
