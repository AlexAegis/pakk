import { normalizeCwdOption, type CwdOption } from '@alexaegis/fs';
import { normalizeLoggerOption, type LoggerOption } from '@alexaegis/logging';
import type { InternalModuleFormat } from 'rollup';

export interface MakeJavascriptFilesExecutableOptions extends CwdOption, LoggerOption {
	format: InternalModuleFormat;
	packageJsonType: 'module' | 'commonjs';
}

export type NormalizedMakeJavascriptFilesExecutableOptions =
	Required<MakeJavascriptFilesExecutableOptions>;

export const normalizeMakeJavascriptFilesExecutableOptions = (
	options: MakeJavascriptFilesExecutableOptions
): NormalizedMakeJavascriptFilesExecutableOptions => {
	return {
		...normalizeCwdOption(options),
		...normalizeLoggerOption(options),
		format: options.format,
		packageJsonType: options.packageJsonType,
	};
};
