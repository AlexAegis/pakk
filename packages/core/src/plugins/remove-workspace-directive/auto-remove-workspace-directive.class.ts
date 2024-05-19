import {
	PACKAGE_JSON_DEPENDENCY_FIELDS,
	type PackageJson,
	type RegularWorkspacePackage,
} from '@alexaegis/workspace-tools';

import type { NormalizedPakkContext } from '../../index.js';
import { PACKAGE_JSON_KIND, type PackageJsonKindType } from '../../package-json/index.js';
import type { PakkFeature } from '../pakk-feature.type.js';

export const removeWorkspaceVersionDirective = (version: string): string =>
	version.replace(/^workspace:/, '');

/**
 * Removes the workspace: dependency specifier
 */
export class AutoRemoveWorkspaceDirective implements PakkFeature {
	public readonly order = 6;

	private readonly context: NormalizedPakkContext;

	constructor(context: NormalizedPakkContext) {
		this.context = context;
	}

	postprocess(
		workspacePackage: RegularWorkspacePackage,
		packageJsonKind: PackageJsonKindType,
	): PackageJson {
		if (packageJsonKind === PACKAGE_JSON_KIND.DISTRIBUTION) {
			this.context.logger.info('removing the workspace: specifier from dependencies...');

			return PACKAGE_JSON_DEPENDENCY_FIELDS.reduce(
				(packageJson, dependencyField) => {
					const dependencies = packageJson[dependencyField];
					if (dependencies) {
						packageJson[dependencyField] = Object.fromEntries(
							Object.entries(dependencies).map(([key, value]) => [
								key,
								value ? removeWorkspaceVersionDirective(value) : value,
							]),
						);
					}

					return packageJson;
				},
				{ ...workspacePackage.packageJson },
			);
		} else {
			return workspacePackage.packageJson;
		}
	}
}
