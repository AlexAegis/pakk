import type { InternalModuleFormat } from 'rollup';
import type { LibraryFormats } from 'vite';

/**
 * Where a bundler will place the built artifact, it is assumed that the
 * distributed packageJson file will be directly in this directory.
 */
export const DEFAULT_OUT_DIR = './dist';

/**
 * Where the source files are located in within a package
 */
export const DEFAULT_SRC_DIR = 'src';
/**
 * Where bin entry points are located within the SRC directory
 */
export const DEFAULT_BIN_DIR = 'bin';
/**
 * Where to place automatic shims for bins, this is relative to the package
 * directory and should be outside of SRC as these files are excluded from
 * lints/typechecks etc.
 *
 * Their only purpose is to help package managers while developing a package.
 */
export const DEFAULT_BINSHIM_DIR = 'shims';

/**
 * Which directory relative to SRC should be treated where all files are
 * treated as the interface for your package. In this folder the index.ts/js
 * files are treated specially as your main entry points.
 */
export const DEFAULT_ENTRY_DIR = './';

/**
 * What files should be just copied over to the DIST directory as is and also
 * export them.
 */
export const DEFAULT_STATIC_EXPORT_GLOBS = ['readme.md', 'static/**/*', 'export/**/*'];

/**
 * What formats to expect to be built by default
 *
 * TODO: Revisit if this is needed at all and could instead be figured out
 */
export const DEFAULT_EXPORT_FORMATS: LibraryFormats[] = ['es', 'cjs'];

export const ALL_ROLLUP_MODULE_FORMATS: readonly InternalModuleFormat[] = [
	'es',
	'cjs',
	'amd',
	'umd',
	'iife',
	'system',
] as const;
