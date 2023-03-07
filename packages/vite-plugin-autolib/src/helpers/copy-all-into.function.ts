import { existsSync } from 'node:fs';
import { cp } from 'node:fs/promises';
import { join } from 'node:path';

export const copyAllInto = async (sourceFiles: string[], outDirectory: string): Promise<void> => {
	await Promise.allSettled(
		sourceFiles
			.map((sourceFile) => ({ sourceFile, targetFile: join(outDirectory, sourceFile) }))
			.filter(
				({ sourceFile, targetFile }) => existsSync(sourceFile) && !existsSync(targetFile)
			)
			.map(({ sourceFile, targetFile }) =>
				cp(sourceFile, targetFile, {
					preserveTimestamps: true,
					recursive: true,
				})
			)
	);
};
