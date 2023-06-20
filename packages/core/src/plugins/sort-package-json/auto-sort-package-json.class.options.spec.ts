import { DEFAULT_PACKAGE_JSON_SORTING_PREFERENCE } from '@alexaegis/workspace-tools';
import { describe, expect, it } from 'vitest';
import {
	normalizeAutoSortPackageJsonOptions,
	type AutoSortPackageJsonOptions,
} from './auto-sort-package-json.class.options.js';

describe('normalizeAutoSortPackageJsonOptions', () => {
	it('returns the default options if no options was set', () => {
		const normalizedOptions = normalizeAutoSortPackageJsonOptions();
		expect(normalizedOptions).toEqual({
			sortingPreference: DEFAULT_PACKAGE_JSON_SORTING_PREFERENCE,
		} as AutoSortPackageJsonOptions);
	});

	it('should autofix exports ordering if its not even present', () => {
		const normalizedOptions = normalizeAutoSortPackageJsonOptions({
			sortingPreference: ['name'],
		});
		expect(normalizedOptions).toEqual({
			sortingPreference: [
				'name',
				{ key: 'exports', order: [{ key: '.*', order: ['types', '.*', 'default'] }] },
			],
		} as AutoSortPackageJsonOptions);
	});

	it('should autofix exports ordering if its present as a string', () => {
		const normalizedOptions = normalizeAutoSortPackageJsonOptions({
			sortingPreference: ['name', 'exports'],
		});
		expect(normalizedOptions).toEqual({
			sortingPreference: [
				'name',
				{ key: 'exports', order: [{ key: '.*', order: ['types', '.*', 'default'] }] },
			],
		} as AutoSortPackageJsonOptions);
	});
});
