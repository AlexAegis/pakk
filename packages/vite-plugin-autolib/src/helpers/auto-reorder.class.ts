import { sortObject } from '@alexaegis/common';
import type { PackageJson, RegularWorkspacePackage } from '@alexaegis/workspace-tools';
import {
	normalizeAutoReorderOptions,
	type AutoReorderOptions,
} from './auto-reorder.class.options.js';
import type { PreparedBuildUpdate } from './prepared-build-update.type.js';

export class AutoSort implements PreparedBuildUpdate {
	private options: Required<AutoReorderOptions>;

	constructor(options?: AutoReorderOptions) {
		this.options = normalizeAutoReorderOptions(options);
	}

	postprocess(workspacePackage: RegularWorkspacePackage): PackageJson {
		return sortObject(workspacePackage.packageJson, this.options.sortingPreference);
	}
}
