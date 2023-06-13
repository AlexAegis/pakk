import type { PackageJson, RegularWorkspacePackage } from '@alexaegis/workspace-tools';

import { PackageJsonKind } from '../../package-json/index.js';
import type { AutolibPlugin } from '../autolib-plugin.type.js';

/**
 * Removes duplicated dependency and peerDependency entries leaving only the
 * peerDependencies behind.
 *
 * The point of this is to let peerDependencies install locally too by defining
 * them twice, once as a peerDependency, and once as a normal dependency. This
 * step will remove the one that was meant to only be present locally.
 */
export class AutoPeer implements AutolibPlugin {
	public name = 'peer';

	postprocess(
		workspacePackage: RegularWorkspacePackage,
		packageJsonKind: PackageJsonKind
	): PackageJson {
		if (
			packageJsonKind === PackageJsonKind.DISTRIBUTION &&
			workspacePackage.packageJson.dependencies &&
			workspacePackage.packageJson.peerDependencies
		) {
			const peerDependencies = Object.keys(workspacePackage.packageJson.peerDependencies);
			return {
				...workspacePackage.packageJson,
				dependencies: Object.fromEntries(
					Object.entries(workspacePackage.packageJson.dependencies).filter(
						([dependency]) => !peerDependencies.includes(dependency)
					)
				),
			};
		} else {
			return workspacePackage.packageJson;
		}
	}
}