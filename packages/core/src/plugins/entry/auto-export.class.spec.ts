import { describe, it, vi } from 'vitest';
import { AutolibContext } from '../../index.js';
import { AutoExport } from './auto-export.class.js';

// TODO: Make a reusable fixture out of this
export const mockAutolibContext: AutolibContext = {
	formats: ['es', 'cjs'],
	packageType: 'module',
	primaryFormat: 'es',
	rootWorkspacePackage: {
		packageKind: 'root',
		packageJson: {},
		packagePath: '/foo',
		packageJsonPath: '/foo/package.json',
		packagePathFromRootPackage: '.',
		workspacePackagePatterns: ['packages/*'],
	},
	workspacePackage: {
		packageKind: 'regular',
		packageJson: {},
		packagePath: '/foo/projects/a',
		packageJsonPath: '/foo/projects/a/package.json',
		packagePathFromRootPackage: 'packages/a',
	},
};

vi.spyOn(process, 'cwd').mockReturnValue('/foo');

describe('autoExport', () => {
	describe('detecting exports', () => {
		it('should be able to examine the package and collect exportable files', async () => {
			const autoExport = new AutoExport({}, mockAutolibContext);

			const collectedExports = await autoExport.examinePackage(
				mockAutolibContext.workspacePackage.packageJson
			);
		});
	});
});
