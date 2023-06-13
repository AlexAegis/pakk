import { toAbsolute } from '@alexaegis/fs';
import type { PackageJson } from '@alexaegis/workspace-tools';
import { collectFileMap } from '../../../../vite-plugin-autolib/src/helpers/collect-export-map.function.js';
import { copyAllInto } from '../../../../vite-plugin-autolib/src/helpers/copy-all-into.function.js';
import { AutolibContext } from '../../internal/autolib-options.js';
import type { AutolibPlugin, PackageExaminationResult } from '../autolib-plugin.type.js';
import { ExportMap } from '../entry/export-map.type.js';
import {
	NormalizedAutoExportStaticOptions,
	normalizeAutoExportStaticOptions,
	type AutoExportStaticOptions,
} from './auto-export-static.class.options.js';

export class AutoExportStatic implements AutolibPlugin {
	public name = 'export-static';

	private options: NormalizedAutoExportStaticOptions;
	private staticExports: Record<string, string> = {};

	constructor(options: AutoExportStaticOptions, context: AutolibContext) {
		this.options = normalizeAutoExportStaticOptions(options);
	}

	async examinePackage(packageJson: PackageJson): Promise<Partial<PackageExaminationResult>> {
		// TODO: check if this collectFileMap is applicable elsewhere, or even better, just use globby here directly
		this.staticExports = await collectFileMap(this.options.cwd, this.options.staticExportGlobs);
		// TODO: do
		const exportMap: ExportMap = {};
		return { exportMap };
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