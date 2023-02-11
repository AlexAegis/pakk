import type { PackageJson } from '@alexaegis/workspace-tools';
import { PackageJsonKind } from '../plugins/autolib.plugin.options.js';

import type { PreparedBuildUpdate } from './prepared-build-update.type.js';

/**
 * Removes duplicated dependency and peerDependency entries leaving only the
 * peerDependencies behind.
 *
 * The point of this is to let peerDependencies install locally too by defining
 * them twice, once as a peerDependency, and once as a normal dependency. This
 * step will remove the one that was meant to only be present locally.
 */
export class AutoPeer implements PreparedBuildUpdate {
	postprocess(packageJson: PackageJson, packageJsonKind: PackageJsonKind): PackageJson {
		if (
			packageJsonKind === PackageJsonKind.DISTRIBUTION &&
			packageJson.dependencies &&
			packageJson.peerDependencies
		) {
			const peerDependencies = Object.keys(packageJson.peerDependencies);
			return {
				...packageJson,
				dependencies: Object.fromEntries(
					Object.entries(packageJson.dependencies).filter(
						([dependency]) => !peerDependencies.includes(dependency)
					)
				),
			};
		} else {
			return packageJson;
		}
	}
}
