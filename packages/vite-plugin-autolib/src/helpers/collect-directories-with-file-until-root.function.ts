import { existsSync } from 'node:fs';
import { join, normalize } from 'node:path';

/**
 * TODO: make it generic
 */
export const collectDirectoriesWithFileUntilRoot = (
	cwd: string = process.cwd(),
	file: string,
	collection: string[] = []
): string[] => {
	const path = normalize(cwd);
	if (existsSync(join(path, file))) {
		collection.unshift(path);
	}

	const parentPath = join(path, '..');
	if (parentPath !== path) {
		return collectDirectoriesWithFileUntilRoot(parentPath, file, collection);
	}
	return collection;
};
