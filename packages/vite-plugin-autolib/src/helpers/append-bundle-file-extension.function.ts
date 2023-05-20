import type { ModuleFormat } from 'rollup';

export interface GetBundledFileExtensionOptions {
	format: ModuleFormat;
	/**
	 * @defaultValue 'commonjs'
	 */
	packageType?: 'module' | 'commonjs' | undefined;
}

export type JsExtensionStubs = 'js' | 'cjs' | 'mjs' | `${string}.js`;
export type JsExtensions = `.${JsExtensionStubs}`;
/**
 * Default rollup behavior.
 *
 */
export const getBundledFileExtension = (options: GetBundledFileExtensionOptions): JsExtensions => {
	const packageType = options.packageType ?? 'commonjs';
	switch (options.format) {
		case 'es':
		case 'esm': {
			return packageType === 'module' ? '.js' : '.mjs';
		}
		case 'cjs': {
			return packageType === 'commonjs' ? '.js' : '.cjs';
		}
		default: {
			return `.${options.format}.js`;
		}
	}
};
