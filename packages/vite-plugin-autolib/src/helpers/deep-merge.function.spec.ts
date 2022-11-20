import { describe, expect, it } from 'vitest';
import { deepMerge } from './deep-merge.function.js';

describe('deepMerge', () => {
	it('should merge two objects together', () => {
		const foo = { foo: { bar: { a: 1, b: 2 } } };
		const bar = { foo: { bar: { a: 6, c: 7 } }, zed: 4 };
		const merged = deepMerge(foo, bar);
		const manuallyMerged = { foo: { bar: { a: 6, b: 2, c: 7 } }, zed: 4 };

		expect(JSON.stringify(merged)).toBe(JSON.stringify(manuallyMerged));
	});

	it('should make an object identical to the original if the base object is empty', () => {
		const empty = {};
		const foo = { foo: { bar: { a: 6, c: 7 } }, zed: 4 };

		const merged = deepMerge(empty, foo);

		expect(JSON.stringify(merged)).toBe(JSON.stringify(foo));
	});

	it('should not change the object if you merge an empty object into it', () => {
		const foo = { foo: { bar: { a: 6, c: 7 } }, zed: 4 };
		const empty = {};

		const merged = deepMerge(foo, empty);

		expect(JSON.stringify(merged)).toBe(JSON.stringify(foo));
	});
});
