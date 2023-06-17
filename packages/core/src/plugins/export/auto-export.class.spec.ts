import { Logger } from '@alexaegis/logging';
import { MockLogger } from '@alexaegis/logging/mocks';
import { describe, it, vi } from 'vitest';
import { NormalizedAutolibContext } from '../../index.js';
import { AutoExport } from './auto-export.class.js';
import { createDefaultViteFileNameFn } from './helpers/append-bundle-file-extension.function.js';

// TODO: Make a reusable fixture out of this

export const mockLogger = new MockLogger();
export const mockAutolibContext: NormalizedAutolibContext = {
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
	fileName: createDefaultViteFileNameFn('module'),
	outDir: 'dist',
	srcDir: 'src',
	cwd: '/foo',
	logger: mockLogger as unknown as Logger<unknown>,
};

vi.spyOn(process, 'cwd').mockReturnValue('/foo');

describe('autoExport', () => {
	describe('detecting exports', () => {
		it('should be able to examine the package and collect exportable files', async () => {
			const autoExport = new AutoExport(mockAutolibContext);

			const collectedExports = await autoExport.examinePackage(
				mockAutolibContext.workspacePackage.packageJson
			);
		});
	});
});
