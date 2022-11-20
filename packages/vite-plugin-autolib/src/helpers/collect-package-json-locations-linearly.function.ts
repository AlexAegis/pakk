import { existsSync } from 'node:fs';
import { join, normalize } from 'node:path';

export const collectPackageJsonLocationsLinearly = (
	cwd: string = process.cwd(),
	collection: string[] = []
): string[] => {
	const path = normalize(cwd);
	if (existsSync(join(path, 'package.json'))) {
		collection.unshift(path);
	}

	const parentPath = join(path, '..');
	if (parentPath !== path) {
		return collectPackageJsonLocationsLinearly(parentPath, collection);
	}
	return collection;
};
