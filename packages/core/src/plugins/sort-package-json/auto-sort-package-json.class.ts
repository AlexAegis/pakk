import { sortObject } from '@alexaegis/common';
import type { PackageJson, RegularWorkspacePackage } from '@alexaegis/workspace-tools';
import { NormalizedAutolibContext } from '../../internal/autolib.class.options.js';
import type { AutolibFeature } from '../autolib-feature.type.js';
import {
	NormalizedAutoSortPackageJsonOptions,
	normalizeAutoSortPackageJsonOptions,
	type AutoSortPackageJsonOptions,
} from './auto-sort-package-json.class.options.js';

export class AutoSort implements AutolibFeature {
	public static readonly featureName = 'sort-package-json';

	private readonly context: NormalizedAutolibContext;
	private readonly options: NormalizedAutoSortPackageJsonOptions;

	constructor(context: NormalizedAutolibContext, options?: AutoSortPackageJsonOptions) {
		this.context = context;
		this.options = normalizeAutoSortPackageJsonOptions(options);
	}

	postprocess(workspacePackage: RegularWorkspacePackage): PackageJson {
		this.context.logger.trace('sorting packageJson...');
		return sortObject(workspacePackage.packageJson, this.options.sortingPreference);
	}
}
