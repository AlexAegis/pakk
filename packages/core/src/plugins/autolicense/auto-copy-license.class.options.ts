import { normalizeCwdOption, type CwdOption } from '@alexaegis/fs';
import { normalizeLoggerOption, type LoggerOption } from '@alexaegis/logging';
import { DEFAULT_OUT_DIR } from '../../internal/defaults.const.js';

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
