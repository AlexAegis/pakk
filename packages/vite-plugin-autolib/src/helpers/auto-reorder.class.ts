import { AutoReorderOptions, normalizeAutoReorderOptions } from './auto-reorder.class.options.js';
import type { PackageJson } from './package-json.type.js';
import type { PreparedBuildUpdate } from './prepared-build-update.type.js';
import { sortObject } from './sort-object.function.js';

export class AutoSort implements PreparedBuildUpdate {
	private options: Required<AutoReorderOptions>;

	constructor(options?: AutoReorderOptions) {
		this.options = normalizeAutoReorderOptions(options);
	}

	postprocess(packageJson: PackageJson): PackageJson {
		return sortObject(packageJson, this.options.sortingPreference);
	}
}
