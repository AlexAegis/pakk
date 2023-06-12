import type { Awaitable } from '@alexaegis/common';
import type { PackageJson, RegularWorkspacePackage } from '@alexaegis/workspace-tools';
import { PackageJsonKind } from '@autolib/core';
import type { InternalModuleFormat } from 'rollup';
import { PackageExportPathContext } from './entry/auto-export.class.js';
import type { ExportMap } from './entry/export-map.type.js';

export interface PackageExaminationResult {
	exportMap: ExportMap;
}

export interface AutolibPlugin {
	/**
	 * The name of the plugin, used to selectively apply only certain plugins
	 */
	name: string;

	/**
	 *
	 */
	examinePackage?: (packageJson: PackageJson) => Awaitable<PackageExaminationResult>;
	/**
	 * Modifies the provided packageJson object. Meant for heavier tasks.
	 *
	 * Ran parallel together with the same step of other buildUpdates.
	 *
	 * After the `update` step, you can create
	 *
	 * Runs after `preUpdate`
	 */
	update?: (
		packageJson: PackageJson,
		format: InternalModuleFormat
	) => Awaitable<PackageJson | undefined>;
	/**
	 * Offsets each path this manages
	 *
	 * Meant to be applied onto multiple copies of the PackageJson file if
	 * more than one is needed.
	 *
	 * Ran parallel together with the same step of other buildUpdates.
	 *
	 * Runs after `update`
	 */
	getPackageJsonUpdates?: (
		packageJson: PackageJson,
		pathContext: PackageExportPathContext
	) => Awaitable<PackageJson | undefined>;

	/**
	 * Called at the start of the first writeBundle hook call, only once.
	 * Copy files to the output directory here.
	 */
	writeBundleOnlyOnce?: (packageJson: PackageJson) => Awaitable<void>;

	/**
	 * A final, synchronous step to modify the packageJson file.
	 * The returned object will replace the original one completely, no
	 * merging is happening.
	 * `postprocess` steps are happening sequentially, in order the
	 * subplugins are defined.
	 */
	postprocess?: (
		workspacePackage: RegularWorkspacePackage,
		sourcePackageJsonTarget: PackageJsonKind
	) => PackageJson;
}
