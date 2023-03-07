import { CwdOption, normalizeCwdOption } from '@alexaegis/fs';
import { LoggerOption, normalizeLoggerOption } from '@alexaegis/logging';
import { DEFAULT_OUT_DIR } from '../index.js';

export interface AutoCopyLicenseOptions extends LoggerOption, CwdOption {
	/**
	 * relative to cwd, this is where copied files will end up
	 * @defaultValue 'dist'
	 */
	outDir?: string;
}

export const normalizeAutoCopyLicenseOptions = (
	options?: AutoCopyLicenseOptions
): Required<AutoCopyLicenseOptions> => {
	return {
		...normalizeCwdOption(options),
		...normalizeLoggerOption(options),
		outDir: options?.outDir ?? DEFAULT_OUT_DIR,
	};
};
