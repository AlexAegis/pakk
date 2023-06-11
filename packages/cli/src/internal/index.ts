import { asyncFilterMap } from '@alexaegis/common';
import { writeJson } from '@alexaegis/fs';

import { Autolib, AutolibOptions, PackageJsonKind } from '@autolib/core';

/**
 * The standalone runner for autolib to be used on it's own instead of together
 * with a build tool
 */
export const autolibStandaloneRunner = async (autolibOptions?: AutolibOptions): Promise<void> => {
	const autolib = await Autolib.withContext({ formats: ['es', 'cjs'] }, autolibOptions);

	const packageJson = await autolib.examinePackage();
	await autolib.writeBundleOnlyOnce(packageJson);

	await asyncFilterMap(Object.values(PackageJsonKind), async (packageJsonTarget) => {
		const { updatedPackageJson, path } = await autolib.createUpdatedPackageJson(
			packageJson,
			packageJsonTarget,
			autolib.context.primaryFormat
		);

		return await writeJson(updatedPackageJson, path, {
			autoPrettier: autolib.options.autoPrettier,
			dry: autolib.options.dry,
		});
	});
};
