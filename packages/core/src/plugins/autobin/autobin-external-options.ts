import { DEFAULT_BINSHIM_DIR, DEFAULT_BIN_DIR } from '../../internal/defaults.const.js';

export interface AutoBinExternalOptions {
	binDir?: string;
	shimDir?: string;
}

export const normalizeAutoBinExternalOption = (
	autoBin?: AutoBinExternalOptions | false
): Required<AutoBinExternalOptions> | false => {
	return autoBin === false
		? false
		: {
				binDir: autoBin?.binDir ?? DEFAULT_BIN_DIR,
				shimDir: autoBin?.shimDir ?? DEFAULT_BINSHIM_DIR,
		  };
};
