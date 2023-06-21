import { PackageJson } from '@alexaegis/workspace-tools';
import type { ModuleFormat } from 'rollup';
import { ViteFileNameFn } from '../../../internal/pakk.class.options.js';
import { stripFileExtension } from './strip-file-extension.function.js';

export type JsExtensionStubs = 'js' | 'cjs' | 'mjs' | `${string}.js`;
export type JsExtensions = `.${JsExtensionStubs}`;

export const createDefaultViteFileNameFn: (packageType: PackageJson['type']) => ViteFileNameFn =
	(packageType) => (format, fileName) => {
		const extension = getDefaultViteBundleFileExtension(format, packageType);

		return stripFileExtension(fileName) + extension;
	};

/**
 * Default vite behavior: if no fileName fn is defined, then a commonjs package
 * when built as cjs, will have files with .js extensions, and when built as esm
 * they will have .mjs extension.
 *
 * If it's an esm package, it's the inverse, esm builds will have `.js`
 * extensions and cjs builds will have `.cjs` extension.
 *
 * This aligns with node's behavior where `.js` files are treated based on what
 * their respective packageJson files declare and files with `.mjs` or `.cjs`
 * are always read as esm or cjs modules respectively.
 */
export const getDefaultViteBundleFileExtension = (
	format: ModuleFormat,
	packageType: PackageJson['type'] = 'commonjs'
): JsExtensions => {
	switch (format) {
		case 'es':
		case 'esm': {
			return packageType === 'module' ? '.js' : '.mjs';
		}
		case 'cjs': {
			return packageType === 'commonjs' ? '.js' : '.cjs';
		}
		default: {
			throw new Error(
				`Cannot determine default fileName for format: ${format} only esm and cjs can be auto determined.`
			);
		}
	}
};
