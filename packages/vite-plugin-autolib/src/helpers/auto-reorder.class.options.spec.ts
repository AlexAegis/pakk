import { describe, expect, it } from 'vitest';
import {
	AutoReorderOptions,
	DEFAULT_PACKAGE_JSON_ORDER_PREFERENCE,
	normalizeAutoReorderOptions,
} from './auto-reorder.class.options.js';

describe('normalizeAutoReorderOptions', () => {
	it('returns the default options if no options was set', () => {
		const normalizedOptions = normalizeAutoReorderOptions();
		expect(normalizedOptions).toEqual({
			orderPreference: DEFAULT_PACKAGE_JSON_ORDER_PREFERENCE,
		} as AutoReorderOptions);
	});

	it('should autofix exports ordering if its not even present', () => {
		const normalizedOptions = normalizeAutoReorderOptions({ orderPreference: ['name'] });
		expect(normalizedOptions).toEqual({
			orderPreference: ['name', { key: 'exports', order: [{ key: '.*', order: ['types'] }] }],
		} as AutoReorderOptions);
	});

	it('should autofix exports ordering if its present as a string', () => {
		const normalizedOptions = normalizeAutoReorderOptions({
			orderPreference: ['name', 'exports'],
		});
		expect(normalizedOptions).toEqual({
			orderPreference: ['name', { key: 'exports', order: [{ key: '.*', order: ['types'] }] }],
		} as AutoReorderOptions);
	});

	it('should autofix exports ordering if its present as a object, but types is not specified', () => {
		const normalizedOptions = normalizeAutoReorderOptions({
			orderPreference: ['name', { key: 'exports', order: ['./', './index'] }],
		});
		expect(normalizedOptions).toEqual({
			orderPreference: [
				'name',
				{
					key: 'exports',
					order: [
						{ key: './', order: ['types'] },
						{ key: './index', order: ['types'] },
					],
				},
			],
		} as AutoReorderOptions);
	});

	it('should autofix exports ordering if its present as a object, but types is defined wrong', () => {
		const normalizedOptions = normalizeAutoReorderOptions({
			orderPreference: [
				'name',
				{
					key: 'exports',
					order: ['./', { key: './index', order: ['foo', 'types', 'bar'] }],
				},
			],
		});
		expect(normalizedOptions).toEqual({
			orderPreference: [
				'name',
				{
					key: 'exports',
					order: [
						{ key: './', order: ['types'] },
						{ key: './index', order: ['types', 'foo', 'bar'] },
					],
				},
			],
		} as AutoReorderOptions);
	});
});
