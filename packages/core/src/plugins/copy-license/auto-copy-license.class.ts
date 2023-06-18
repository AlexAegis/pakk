import { toAbsolute } from '@alexaegis/fs';
import { PackageJson, WorkspacePackage } from '@alexaegis/workspace-tools';
import { existsSync } from 'node:fs';
import { cp } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { NormalizedAutolibContext, PackageJsonKind } from '../../index.js';
import type { AutolibFeature, PackageExaminationResult } from '../autolib-feature.type.js';
import { PackageExportPathContext } from '../export/auto-export.class.js';

/**
 * Automatically copies the license file to the outDir so it can be part
 * of the distributed package. It uses the license file you defined in the
 * root of your project. Or if you wish to override it, place one into
 * the packages folder.
 */
export class AutoCopyLicense implements AutolibFeature {
	public static readonly featureName = 'copy-license';

	private readonly context: NormalizedAutolibContext;

	private licensePath: string | undefined;

	constructor(context: NormalizedAutolibContext, _options: unknown) {
		this.context = context;
	}

	examinePackage(workspacePackage: WorkspacePackage): Partial<PackageExaminationResult> {
		const pathsOfInterest = [
			workspacePackage.packagePath,
			this.context.rootWorkspacePackage.packagePath,
		];

		const possibleLiceseFileNames = ['license', 'LICENSE'];

		const possibleLicenseFileLocations = pathsOfInterest.flatMap((path) =>
			possibleLiceseFileNames.map((fileName) => join(path, fileName))
		);

		this.licensePath = possibleLicenseFileLocations.find((path) => existsSync(path));

		if (this.licensePath) {
			this.context.logger.trace('found license file at', this.licensePath);
		} else {
			this.context.logger.warn(
				'no license file found in the following locations',
				possibleLicenseFileLocations
			);
		}

		return {};
	}

	async process(_packageJson: PackageJson, pathContext: PackageExportPathContext): Promise<void> {
		if (pathContext.packageJsonKind === PackageJsonKind.DISTRIBUTION && this.licensePath) {
			try {
				const licenseFileDestination = join(
					toAbsolute(this.context.outDir, this.context),
					basename(this.licensePath)
				);
				await cp(this.licensePath, licenseFileDestination);

				this.context.logger.trace('Copied license file', licenseFileDestination);
			} catch (error) {
				this.context.logger.error(
					'Couldnt copy license file to ',
					this.context.outDir,
					'error happened',
					error
				);
			}
		}
	}
}
