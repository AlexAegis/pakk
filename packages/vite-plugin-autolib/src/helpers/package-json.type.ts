import type { JSONSchemaForNPMPackageJsonFiles } from '@schemastore/package';
import type { PackageJsonExportConditions } from './package-json-export-conditions.type.js';

/**
 * @deprecated use @alexaegis/workspace-tools
 */
export type PackageJsonExports = Record<string, PackageJsonExportConditions | string>;

/**
 * @deprecated use @alexaegis/workspace-tools
 */
export type PackageJson = Omit<JSONSchemaForNPMPackageJsonFiles, 'bin' | 'exports'> & {
	exports?: PackageJsonExports;
	bin?: Record<string, string>;
	type?: 'commonjs' | 'module';
	scripts?: Record<string, string | undefined>;
};
