import { Awaitable, deepMerge } from '@alexaegis/common';
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
		this.context.logger.trace(
			'collecting keys from workspace:',
			this.options.keysFromWorkspace
		);

		this.metadataFromWorkspacePackageJson = Object.fromEntries(
			Object.entries(this.context.rootWorkspacePackage.packageJson).filter(
				([key]) =>
					this.options.keysFromWorkspace.includes(key) &&
					!Object.hasOwn(workspacePackage.packageJson, key)
			)
		);

		return {};
	}

	postprocess(workspacePackage: WorkspacePackage, packageJsonKind: PackageJsonKind): PackageJson {
		if (packageJsonKind === PackageJsonKind.DISTRIBUTION) {
			this.context.logger.info('filling metadata for distributed packageJson');
			this.context.logger.trace('fallbackEntries', this.options.fallbackEntries);
			this.context.logger.trace(
				'metadataFromWorkspacePackageJson',
				this.metadataFromWorkspacePackageJson
			);
			this.context.logger.trace('overrideEntries', this.options.overrideEntries);

			const filledPackageJson: PackageJson = deepMerge(
				structuredClone(this.options.fallbackEntries),
				workspacePackage.packageJson,
				this.metadataFromWorkspacePackageJson,
				this.options.overrideEntries
			);

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
