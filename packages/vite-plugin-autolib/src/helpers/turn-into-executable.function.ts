import { extname } from 'node:path';

import { CwdOption, normalizeCwdOption, NormalizedCwdOption } from '@alexaegis/fs';
import { LoggerOption, NormalizedLoggerOption, normalizeLoggerOption } from '@alexaegis/logging';
import { chmod, lstat, readFile, writeFile } from 'node:fs/promises';
import { toAbsolute } from './to-absolute.function.js';

export const SHEBANG_SEQUENCE = '#!';
export const SHELL_SHEBANG = '#!/usr/bin/env sh';
export const NODE_SHEBANG = '#!/usr/bin/env node';
export const TSNODE_SHEBANG = '#!/usr/bin/env node --require ts-node/register';

export const shebangs: Record<string, string> = {
	['.js']: NODE_SHEBANG,
	['.cjs']: NODE_SHEBANG,
	['.mjs']: NODE_SHEBANG,
	['.ts']: TSNODE_SHEBANG,
	['.mts']: TSNODE_SHEBANG,
	['.cts']: TSNODE_SHEBANG,
	['.sh']: SHELL_SHEBANG,
};

export type TurnIntoExecutableOptions = CwdOption & LoggerOption;
export type NormalizedTurnIntoExecutableOptions = NormalizedCwdOption & NormalizedLoggerOption;

export const normalizeTurnIntoExecutableOptions = (
	options?: TurnIntoExecutableOptions
): NormalizedTurnIntoExecutableOptions => {
	return {
		...normalizeCwdOption(options),
		...normalizeLoggerOption(options),
	};
};

/**
 * Marks a file as executable for its user, and only readable for everyone else
 * If an appropriate shebang is found, it's also prefixed to the top of the
 * file, unless it's already starting with a shebang
 */
export const turnIntoExecutable = async (
	file: string,
	rawOptions?: TurnIntoExecutableOptions
): Promise<void> => {
	const options = normalizeTurnIntoExecutableOptions(rawOptions);
	const filePath = toAbsolute(file, options.cwd);
	const fileStats = await lstat(filePath).catch(() => undefined);

	if (!fileStats) {
		options.logger.error(`can't turn ${file} into executable, doesn't exist in ${options.cwd}`);
		return;
	} else if (!fileStats.isFile()) {
		options.logger.error(`can't turn ${file} into executable, not a file`);
		return;
	}

	const extension = extname(filePath);

	if (Object.keys(shebangs).includes(extension)) {
		const shebang = shebangs[extension];
		const rawFile = await readFile(filePath, {
			encoding: 'utf8',
		}).catch(() => undefined);

		if (rawFile !== undefined && !rawFile.startsWith(SHEBANG_SEQUENCE)) {
			const rawFileWithShebang = `${shebang}\n\n${rawFile}`;
			await writeFile(filePath, rawFileWithShebang)
				.then(() => {
					options.logger.info(`prefixed ${file} with shebang: ${shebang}`);
				})
				.catch(() => undefined);
		}
	}

	if (!(fileStats.mode & 0o111)) {
		await chmod(filePath, 0o744)
			.then(() => {
				options.logger.info(`marked ${file} as executable`);
			})
			.catch(() => undefined);
	}
};
