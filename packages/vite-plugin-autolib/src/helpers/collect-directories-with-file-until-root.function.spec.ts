import type { PathLike } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { collectDirectoriesWithFileUntilRoot } from './collect-directories-with-file-until-root.function.js';

describe('collectDirectoriesWithFileUntilRoot', () => {
	beforeEach(() => {
		vi.mock('node:fs', () => {
			// Don't use it in the case of fs, don't do actual fs calls even by accident
			// ...(await vi.importActual<typeof import('node:fs')>('node:fs')),
			return {
				existsSync: vi.fn(
					(path: PathLike) =>
						path === '/foo/bar/yon/package.json' ||
						path === '/foo/bar/zed/package.json' ||
						path === '/foo/bar/package.json'
				),
			};
		});
	});

	it('should be able to walk to zed', () => {
		const testPath = '/foo/bar/zed';
		const foundPackageJsons = collectDirectoriesWithFileUntilRoot(testPath, 'package.json');
		expect(foundPackageJsons).toEqual(['/foo/bar', testPath]);
	});

	it('should be able to walk to yon', () => {
		const testPath = '/foo/bar/yon';
		const foundPackageJsons = collectDirectoriesWithFileUntilRoot(testPath, 'package.json');
		expect(foundPackageJsons).toEqual(['/foo/bar', testPath]);
	});
});
