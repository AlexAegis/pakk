import { readFile } from 'node:fs/promises';

export const readJson = async <T = Record<string, unknown>>(
	path: string
): Promise<T | undefined> => {
	const rawJson = await readFile(path, {
		encoding: 'utf8',
	}).catch(() => undefined);
	return rawJson ? JSON.parse(rawJson) : undefined;
};
