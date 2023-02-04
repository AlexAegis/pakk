import { sortObject } from '@alexaegis/common';
import type { PackageJson } from '@alexaegis/workspace-tools';
import { AutoReorderOptions, normalizeAutoReorderOptions } from './auto-reorder.class.options.js';
import type { PreparedBuildUpdate } from './prepared-build-update.type.js';

export class AutoSort implements PreparedBuildUpdate {
	private options: Required<AutoReorderOptions>;

	constructor(options?: AutoReorderOptions) {
		this.options = normalizeAutoReorderOptions(options);
	}

	postprocess(packageJson: PackageJson): PackageJson {
		return sortObject(packageJson, this.options.sortingPreference);
	}
}
