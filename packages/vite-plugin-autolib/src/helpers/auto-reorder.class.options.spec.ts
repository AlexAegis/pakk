import { noopLogger } from '@alexaegis/logging';
import { DEFAULT_PACKAGE_JSON_SORTING_PREFERENCE } from '@alexaegis/workspace-tools';
import { describe, expect, it } from 'vitest';
import {
	normalizeAutoReorderOptions,
	type AutoReorderOptions,
} from './auto-reorder.class.options.js';

describe('normalizeAutoReorderOptions', () => {
	it('returns the default options if no options was set', () => {
		const normalizedOptions = normalizeAutoReorderOptions();
		expect(normalizedOptions).toEqual({
			logger: noopLogger,
			sortingPreference: DEFAULT_PACKAGE_JSON_SORTING_PREFERENCE,
		} as AutoReorderOptions);
	});

	it('should autofix exports ordering if its not even present', () => {
		const normalizedOptions = normalizeAutoReorderOptions({ sortingPreference: ['name'] });
		expect(normalizedOptions).toEqual({
			logger: noopLogger,
			sortingPreference: [
				'name',
				{ key: 'exports', order: [{ key: '.*', order: ['types'] }] },
			],
		} as AutoReorderOptions);
	});

	it('should autofix exports ordering if its present as a string', () => {
		const normalizedOptions = normalizeAutoReorderOptions({
			sortingPreference: ['name', 'exports'],
		});
		expect(normalizedOptions).toEqual({
			logger: noopLogger,
			sortingPreference: [
				'name',
				{ key: 'exports', order: [{ key: '.*', order: ['types'] }] },
			],
		} as AutoReorderOptions);
	});
});
