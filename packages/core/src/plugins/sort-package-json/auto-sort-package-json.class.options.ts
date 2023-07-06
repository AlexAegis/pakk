import type { Defined, ObjectKeyOrder } from '@alexaegis/common';
import {
	DEFAULT_PACKAGE_JSON_SORTING_PREFERENCE,
	normalizeSortingPreferenceForPackageJson,
} from '@alexaegis/workspace-tools';

export interface AutoSortPackageJsonOptions {
	/**
	 * ### AutoSortPackageJson
	 *
	 * Define an order of keys that will be applied to the target object
	 * The rest of the keys will be ordered in alphabetical order.
	 * You can nest ordering by adding an object, that defines a sub-ordering.
	 *
	 * ! All ordering keys are treated as regular expressions, make sure they
	 * ! are valid!
	 *
	 * To keep your package.json valid some order rules may be overwritten,
	 * like making sure 'types' is always the first entry in 'exports' objects
	 *
	 * By default it orders everything in alphabetical order.
	 *
	 * @example ['name', '.*', { key: 'scripts', order: ['start', 'build.*'] }, '.*']
	 * @defaultValue []
	 */
	sortingPreference?: ObjectKeyOrder;
}

export type NormalizedAutoSortPackageJsonOptions = Defined<AutoSortPackageJsonOptions>;

export const normalizeAutoSortPackageJsonOptions = (
	options?: AutoSortPackageJsonOptions,
): NormalizedAutoSortPackageJsonOptions => {
	return {
		sortingPreference: options?.sortingPreference
			? normalizeSortingPreferenceForPackageJson(options.sortingPreference)
			: DEFAULT_PACKAGE_JSON_SORTING_PREFERENCE,
	};
};
