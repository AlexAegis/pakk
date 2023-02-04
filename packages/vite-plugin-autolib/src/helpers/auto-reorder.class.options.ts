import type { ObjectKeyOrder } from '@alexaegis/common';
import { DEFAULT_PACKAGE_JSON_SORTING_PREFERENCE } from '@alexaegis/workspace-tools';
import { normalizeSortingPreferenceForPackageJson } from './normalize-package-json-sorting-preference.function.js';

export interface AutoReorderOptions {
	/**
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
	 * @default []
	 */
	sortingPreference?: ObjectKeyOrder;
}

export const normalizeAutoReorderOptions = (
	options?: AutoReorderOptions
): Required<AutoReorderOptions> => {
	return {
		sortingPreference: options?.sortingPreference
			? normalizeSortingPreferenceForPackageJson(options.sortingPreference)
			: DEFAULT_PACKAGE_JSON_SORTING_PREFERENCE,
	};
};
