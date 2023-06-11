import { type PackageJson, type WorkspacePackage } from '@alexaegis/workspace-tools';
import {
	normalizeAutoMetadataOptions,
	type AutoMetadataOptions,
	type NormalizedAutoMetadataOptions,
} from './auto-metadata.class.options.js';

import { Awaitable } from '@alexaegis/common';
import { AutolibContext } from '../../internal/autolib-options.js';
import { PackageJsonKind } from '../../package-json/index.js';
import type { AutolibPlugin } from '../autolib-plugin.type.js';

/**
 * Fills out packageJson fields of the distributed packageJson based on
 * either manually defined key-value pairs or a set of keys that then will
 * be read from the workspace packageJson file. Or both, in which case if a key
 * is defined in both the manual takes precedence.
 */
export class AutoMetadata implements AutolibPlugin {
	options: NormalizedAutoMetadataOptions;
	workspacePackageJson: PackageJson | undefined;
	metadataFromWorkspacePackageJson: PackageJson | undefined;
	private readonly context: AutolibContext;

	constructor(context: AutolibContext, rawOptions?: AutoMetadataOptions) {
		this.context = context;
		this.options = normalizeAutoMetadataOptions(rawOptions);
	}

	preUpdate(): Awaitable<PackageJson> {
		this.metadataFromWorkspacePackageJson = Object.fromEntries(
			Object.entries(this.context.rootWorkspacePackage.packageJson).filter(([key]) =>
				this.options.keysFromWorkspace.includes(key)
			)
		);

		return {};
	}

	postprocess(workspacePackage: WorkspacePackage, packageJsonKind: PackageJsonKind): PackageJson {
		if (packageJsonKind === PackageJsonKind.DISTRIBUTION) {
			const filledPackageJson = {
				...this.options.fallbackEntries,
				...workspacePackage.packageJson,
				...this.metadataFromWorkspacePackageJson,
				...this.options.overrideEntries,
			};
			if (typeof filledPackageJson.repository === 'object') {
				filledPackageJson.repository.directory =
					workspacePackage.packagePathFromRootPackage;
			}

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
			return workspacePackage.packageJson;
		}
	}
}
