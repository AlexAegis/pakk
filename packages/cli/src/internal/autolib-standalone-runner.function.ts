import { asyncFilterMap } from '@alexaegis/common';
import { writeJson } from '@alexaegis/fs';

import { Autolib, AutolibOptions, PackageJsonKind } from '@autolib/core';

/**
 * The standalone runner for autolib to be used on it's own instead of together
 * with a build tool
 */
export const autolibStandaloneRunner = async (rawOptions?: AutolibOptions): Promise<void> => {
	const autolib = await Autolib.withContext({ formats: ['es', 'cjs'] }, rawOptions);

	await autolib.examinePackage();

	await asyncFilterMap(Object.values(PackageJsonKind), async (packageJsonTarget) => {
		const { updatedPackageJson, path } = await autolib.createUpdatedPackageJson(
			packageJsonTarget
		);

		return await writeJson(updatedPackageJson, path, autolib.options);
	});
};
