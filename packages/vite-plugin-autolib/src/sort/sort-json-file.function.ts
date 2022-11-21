import { basename } from 'node:path';
import type { Logger } from '../helpers/create-logger.function.js';
import { normalizeSortingPreferenceForPackageJson } from '../helpers/normalize-package-json-sorting-preference.function.js';
import type { ObjectKeyOrder } from '../helpers/object-key-order.type.js';
import { readJson } from '../helpers/read-package-json.function.js';
import { sortObject } from '../helpers/sort-object.function.js';
import { writeJson } from '../helpers/write-json.function.js';

/**
 * Reads a json file, sorts it based on a sorting config then writes it back,
 * if available also formats it with prettier. If the file is named
 * `package.json` it may override some rules to always produce a functional
 * result.
 *
 * @param path
 *
 * @return was sorted or not
 */
export const sortJsonFile = async (
	path: string,
	options: SortJsonFileOptions
): Promise<boolean> => {
	const content = await readJson(path);
	if (content) {
		let sortPreferences = options.sortingPreference;

		if (basename(path) === 'package.json') {
			sortPreferences = normalizeSortingPreferenceForPackageJson(sortPreferences);
		}

		const sortedContent = sortObject(content, sortPreferences);

		const alreadySorted = JSON.stringify(content) === JSON.stringify(sortedContent);

		if (!options.dry && !options.check) {
			await writeJson(sortedContent, path, {
				autoPrettier: options.autoPrettier,
				dry: options.dry,
			});
		} else if (options.dry && !options.check) {
			options.logger?.log(`sorting ${path}`);
		} else if (options.check && !alreadySorted) {
			options.logger?.log(`not sorted: ${path}`);
		}

		return alreadySorted;
	} else {
		return false;
	}
};

export interface SortJsonFileOptions {
	sortingPreference: ObjectKeyOrder;
	/**
	 * @default true
	 */
	autoPrettier?: boolean;
	/**
	 * @default false
	 */
	dry?: boolean;
	/**
	 * If using check mode, it won't write, but won't log either
	 * @default false
	 */
	check?: boolean;

	logger?: Logger;
}
