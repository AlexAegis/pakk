import { AutoReorderOptions, normalizeAutoReorderOptions } from './auto-reorder.class.options.js';
import type { PackageJson } from './package-json.type.js';
import type { PreparedBuildUpdate } from './prepared-build-update.type.js';

export class AutoOrder implements PreparedBuildUpdate {
	private options: Required<AutoReorderOptions>;
	private staticExports: Record<string, string> = {};

	constructor(options?: AutoReorderOptions) {
		this.options = normalizeAutoReorderOptions(options);
	}

	preUpdate(packageJson: PackageJson): PackageJson {
		return packageJson;
	}

	async update(packageJson: PackageJson): Promise<PackageJson> {
		return packageJson;
	}
}
