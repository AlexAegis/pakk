import { sortObject } from '@alexaegis/common';
import type { PackageJson, RegularWorkspacePackage } from '@alexaegis/workspace-tools';
import { NormalizedPakkContext } from '../../internal/pakk.class.options.js';
import type { PakkFeature } from '../pakk-feature.type.js';
import {
	NormalizedAutoSortPackageJsonOptions,
	normalizeAutoSortPackageJsonOptions,
	type AutoSortPackageJsonOptions,
} from './auto-sort-package-json.class.options.js';

export class AutoSort implements PakkFeature {
	private readonly context: NormalizedPakkContext;
	private readonly options: NormalizedAutoSortPackageJsonOptions;

	constructor(context: NormalizedPakkContext, options?: AutoSortPackageJsonOptions) {
		this.context = context;
		this.options = normalizeAutoSortPackageJsonOptions(options);
	}

	postprocess(workspacePackage: RegularWorkspacePackage): PackageJson {
		this.context.logger.info('sorting packageJson...');
		return sortObject(workspacePackage.packageJson, this.options.sortingPreference);
	}
}
