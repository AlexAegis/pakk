import { Awaitable } from '@alexaegis/common';
import { type PackageJson, type WorkspacePackage } from '@alexaegis/workspace-tools';
import { NormalizedAutolibContext } from '../../internal/autolib.class.options.js';
import { PackageJsonKind } from '../../package-json/index.js';
import type { AutolibFeature, PackageExaminationResult } from '../autolib-feature.type.js';
import {
	normalizeAutoMetadataOptions,
	type AutoMetadataOptions,
	type NormalizedAutoMetadataOptions,
} from './auto-metadata.class.options.js';

/**
 * Fills out packageJson fields of the distributed packageJson based on
 * either manually defined key-value pairs or a set of keys that then will
 * be read from the workspace packageJson file. Or both, in which case if a key
 * is defined in both the manual takes precedence.
 */
export class AutoMetadata implements AutolibFeature {
	public static readonly featureName = 'metadata';

	private readonly options: NormalizedAutoMetadataOptions;
	private readonly context: NormalizedAutolibContext;
	private metadataFromWorkspacePackageJson: PackageJson | undefined;

	constructor(context: NormalizedAutolibContext, rawOptions?: AutoMetadataOptions) {
		this.context = context;
		this.options = normalizeAutoMetadataOptions(rawOptions);
	}

	examinePackage(
		workspacePackage: WorkspacePackage
	): Awaitable<Partial<PackageExaminationResult>> {
		this.metadataFromWorkspacePackageJson = Object.fromEntries(
			Object.entries(workspacePackage.packageJson).filter(([key]) =>
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

			console.log('filledPackageJson', filledPackageJson);
			if (typeof filledPackageJson.repository === 'object') {
				filledPackageJson.repository.directory =
					workspacePackage.packagePathFromRootPackage;
			}

			const missingKeys = this.options.mandatoryKeys.filter(
				(mandatoryKey) => !Object.hasOwn(filledPackageJson, mandatoryKey)
			);

			if (missingKeys.length > 0) {
				const errorMessage =
					'Some keys are missing! Please define the following keys ' +
					`in your packageJson file: ${missingKeys.join(', ')}`;

				this.context.logger.error(errorMessage);
				throw new Error(errorMessage);
			}

			return filledPackageJson;
		} else {
			return workspacePackage.packageJson;
		}
	}
}
