import { collectWorkspacePackages, type PackageJson } from '@alexaegis/workspace-tools';
import { PackageJsonKind } from '../plugins/autolib.plugin.options.js';
import {
	normalizeAutoMetadataOptions,
	type AutoMetadataOptions,
	type NormalizedAutoMetadataOptions,
} from './auto-metadata.class.options.js';

import type { PreparedBuildUpdate } from './prepared-build-update.type.js';

/**
 * Fills out packageJson fields of the distributed packageJson based on
 * either manually defined key-value pairs or a set of keys that then will
 * be read from the workspace packageJson file. Or both, in which case if a key
 * is defined in both the manual takes precedence.
 */
export class AutoMetadata implements PreparedBuildUpdate {
	options: NormalizedAutoMetadataOptions;
	workspacePackageJson: PackageJson | undefined;
	metadataFromWorkspacePackageJson: PackageJson | undefined;

	constructor(rawOptions?: AutoMetadataOptions) {
		this.options = normalizeAutoMetadataOptions(rawOptions);
	}

	async preUpdate(): Promise<PackageJson> {
		const packages = await collectWorkspacePackages({ onlyWorkspaceRoot: true });

		this.workspacePackageJson = packages[0].packageJson;

		if (!this.workspacePackageJson) {
			this.options.logger.error('cant read root metadata, not in a workspace');
			return {};
		}

		this.metadataFromWorkspacePackageJson = Object.fromEntries(
			Object.entries(this.workspacePackageJson).filter(([key]) =>
				this.options.keysFromWorkspace.includes(key)
			)
		);

		return {};
	}

	postprocess(packageJson: PackageJson, packageJsonKind: PackageJsonKind): PackageJson {
		if (packageJsonKind === PackageJsonKind.DISTRIBUTION) {
			const filledPackageJson = {
				...this.options.fallbackEntries,
				...packageJson,
				...this.metadataFromWorkspacePackageJson,
				...this.options.overrideEntries,
			};

			const missingKeys = this.options.mandatoryKeys.filter(
				(mandatoryKey) => !Object.hasOwn(filledPackageJson, mandatoryKey)
			);

			if (missingKeys.length > 0) {
				throw new Error(
					'Some keys are missing! Please define the following keys ' +
						`in your packageJson file: ${missingKeys.join(', ')}`
				);
			}

			return filledPackageJson;
		} else {
			return packageJson;
		}
	}
}
