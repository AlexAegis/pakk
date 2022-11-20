import { AutoReorderOptions, normalizeAutoReorderOptions } from './auto-reorder.class.options.js';
import type { PackageJson } from './package-json.type.js';
import type { PreparedBuildUpdate } from './prepared-build-update.type.js';
import { reorderObject } from './reorder-object.function.js';

export class AutoOrder implements PreparedBuildUpdate {
	private options: Required<AutoReorderOptions>;

	constructor(options?: AutoReorderOptions) {
		this.options = normalizeAutoReorderOptions(options);
	}

	postprocess(packageJson: PackageJson): PackageJson {
		return reorderObject(packageJson, this.options.orderPreference);
	}
}
