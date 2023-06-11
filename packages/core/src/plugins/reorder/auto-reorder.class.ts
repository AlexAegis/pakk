import { sortObject } from '@alexaegis/common';
import type { PackageJson, RegularWorkspacePackage } from '@alexaegis/workspace-tools';
import type { AutolibPlugin } from '../autolib-plugin.type.js';
import {
	normalizeAutoReorderOptions,
	type AutoReorderOptions,
} from './auto-reorder.class.options.js';

export class AutoSort implements AutolibPlugin {
	public name = 'sort';

	private options: Required<AutoReorderOptions>;

	constructor(options?: AutoReorderOptions) {
		this.options = normalizeAutoReorderOptions(options);
	}

	postprocess(workspacePackage: RegularWorkspacePackage): PackageJson {
		return sortObject(workspacePackage.packageJson, this.options.sortingPreference);
	}
}
