import { CwdOption, normalizeCwdOption } from '@alexaegis/fs';
import {
	RegularWorkspacePackage,
	RootWorkspacePackage,
	collectWorkspacePackages,
} from '@alexaegis/workspace-tools';
import { sep } from 'node:path';

export interface CurrentWorkspacePackageWithRoot {
	workspacePackage: RegularWorkspacePackage;
	rootWorkspacePackage: RootWorkspacePackage;
}

export const findCurrentAndRootWorkspacePackage = async (
	rawOptions?: CwdOption,
): Promise<CurrentWorkspacePackageWithRoot> => {
	const options = normalizeCwdOption(rawOptions);
	const packageDirName = options.cwd.slice(Math.max(0, options.cwd.lastIndexOf(sep)));
	const workspace = await collectWorkspacePackages(options);

	const rootWorkspacePackage = workspace.find(
		(workspacePackage): workspacePackage is RootWorkspacePackage =>
			workspacePackage.packageKind === 'root',
	);

	const workspacePackage = workspace.find(
		(workspacePackage): workspacePackage is RegularWorkspacePackage =>
			workspacePackage.packageKind === 'regular' &&
			workspacePackage.packagePath.includes(options.cwd) &&
			(workspacePackage.packagePath + sep).includes(packageDirName + sep),
	);

	if (!rootWorkspacePackage || !workspacePackage) {
		throw new Error('Package could not be determined');
	}

	return { workspacePackage, rootWorkspacePackage };
};
