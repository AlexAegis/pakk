import type { PackageJson, RegularWorkspacePackage } from '@alexaegis/workspace-tools';

import { NormalizedPakkContext } from '../../index.js';
import { PackageJsonKind } from '../../package-json/index.js';
import type { PakkFeature } from '../pakk-feature.type.js';

/**
 * Removes duplicated dependency and peerDependency entries leaving only the
 * peerDependencies behind.
 *
 * The point of this is to let peerDependencies install locally too by defining
 * them twice, once as a peerDependency, and once as a normal dependency. This
 * step will remove the one that was meant to only be present locally.
 */
export class AutoPeer implements PakkFeature {
	private readonly context: NormalizedPakkContext;

	constructor(context: NormalizedPakkContext) {
		this.context = context;
	}

	postprocess(
		workspacePackage: RegularWorkspacePackage,
		packageJsonKind: PackageJsonKind
	): PackageJson {
		if (
			packageJsonKind === PackageJsonKind.DISTRIBUTION &&
			workspacePackage.packageJson.dependencies &&
			workspacePackage.packageJson.peerDependencies
		) {
			this.context.logger.info('removing dependencies that are also peerDependencies...');
			const peerDependencies = Object.keys(workspacePackage.packageJson.peerDependencies);

			const deduplicatedDependencies = Object.fromEntries(
				Object.entries(workspacePackage.packageJson.dependencies).filter(
					([dependency]) => !peerDependencies.includes(dependency)
				)
			);
			return {
				...workspacePackage.packageJson,
				dependencies:
					Object.values(deduplicatedDependencies).length > 0
						? deduplicatedDependencies
						: undefined,
			} as PackageJson;
		} else {
			return workspacePackage.packageJson;
		}
	}
}
