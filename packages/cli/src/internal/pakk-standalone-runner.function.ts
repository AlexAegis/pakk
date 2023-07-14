import { asyncFilterMap } from '@alexaegis/common';
import { writeJson } from '@alexaegis/fs';

import { Pakk, PakkOptions } from '@pakk/core';

/**
 * The standalone runner for pakk to be used on it's own instead of together
 * with a build tool
 */
export const pakkStandaloneRunner = async (rawOptions?: PakkOptions): Promise<void> => {
	const pakk = await Pakk.withContext({ formats: ['es', 'cjs'] }, rawOptions);

	await pakk.examinePackage();

	await asyncFilterMap(pakk.getTargetPackageJsonKinds(), async (packageJsonTarget) => {
		const { updatedPackageJson, path } = await pakk.createUpdatedPackageJson(packageJsonTarget);

		return await writeJson(updatedPackageJson, path, pakk.options);
	});
};
