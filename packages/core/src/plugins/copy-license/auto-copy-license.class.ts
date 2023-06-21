import { toAbsolute } from '@alexaegis/fs';
import { PackageJson, WorkspacePackage } from '@alexaegis/workspace-tools';
import { existsSync } from 'node:fs';
import { cp } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { NormalizedPakkContext, PackageJsonKind } from '../../index.js';
import { PackageExportPathContext } from '../export/auto-export.class.js';
import type { PackageExaminationResult, PakkFeature } from '../pakk-feature.type.js';

/**
 * Automatically copies the license file to the outDir so it can be part
 * of the distributed package. It uses the license file you defined in the
 * root of your project. Or if you wish to override it, place one into
 * the packages folder.
 */
export class AutoCopyLicense implements PakkFeature {
	private readonly context: NormalizedPakkContext;

	private licensePath: string | undefined;

	constructor(context: NormalizedPakkContext, _options: unknown) {
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
		if (pathContext.packageJsonKind === PackageJsonKind.DISTRIBUTION) {
			if (!this.licensePath) {
				this.context.logger.warn('No license file found!');
				return;
			}

			const licenseFileDestination = join(
				toAbsolute(this.context.outDir, this.context),
				basename(this.licensePath)
			);

			try {
				await cp(this.licensePath, licenseFileDestination);
				this.context.logger.info('Copied license file from', this.licensePath);
			} catch (error) {
				this.context.logger.error(
					"Couldn't copy license file from",
					this.licensePath,
					'to',
					this.context.outDir,
					'error happened',
					error
				);
			}
		}
	}
}
