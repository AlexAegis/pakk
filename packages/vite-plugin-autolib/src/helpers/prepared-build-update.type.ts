import type { Awaitable } from '@alexaegis/common';
import type { PackageJson } from '@alexaegis/workspace-tools';
import type { InternalModuleFormat } from 'rollup';
import type { UserConfig } from 'vite';
import type { PackageJsonKind } from '../plugins/autolib.plugin.options.js';

export interface PreparedBuildUpdate {
	/**
	 * Modifies the provided packageJson object.
	 *
	 * A preparation step meant for pre-cleaning the packageJson file.
	 *
	 * Ran parallel together with the same step of other buildUpdates.
	 */
	preUpdate?: (packageJson: PackageJson) => Awaitable<PackageJson>;
	/**
	 * Modifies the provided packageJson object. Meant for heavier tasks.
	 *
	 * Ran parallel together with the same step of other buildUpdates.
	 *
	 * After the `update` step, you can create
	 *
	 * Runs after `preUpdate`
	 */
	update?: (packageJson: PackageJson, format: InternalModuleFormat) => Awaitable<PackageJson>;
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
	adjustPaths?: (
		packageJson: PackageJson,
		sourcePackageJsonTarget: PackageJsonKind,
		format: InternalModuleFormat
	) => Awaitable<PackageJson>;

	/**
	 * A final, synchronous step to modify the packageJson file.
	 * The returned object will replace the original one completely, no
	 * merging is happening.
	 * `postprocess` steps are happening sequentially, in order the
	 * subplugins are defined.
	 */
	postprocess?: (packageJson: PackageJson) => PackageJson;

	/**
	 * Changes applied to the vite build configuration
	 */
	getViteConfigUpdates?: (viteConfig: UserConfig) => Awaitable<Partial<UserConfig>>;
}
