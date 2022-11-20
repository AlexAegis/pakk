import { describe, expect, it } from 'vitest';
import { reorderObject } from './reorder-object.function.js';

describe('reorderObject', () => {
	it('should be able to order simple objects in alphabetical order', () => {
		const from = {
			c: 'c',
			a: 'a',
			b: 'b',
		};

		const to = {
			a: 'a',
			b: 'b',
			c: 'c',
		};

		expect(JSON.stringify(reorderObject(from), undefined, 2)).toEqual(
			JSON.stringify(to, undefined, 2)
		);
	});

	it('should be able to order simple nested objects in alphabetical order', () => {
		const from = {
			c: 'c',
			a: 'a',
			b: {
				c: 'c',
				a: 'a',
				b: 'b',
			},
		};

		const to = {
			a: 'a',
			b: {
				a: 'a',
				b: 'b',
				c: 'c',
			},
			c: 'c',
		};

		expect(JSON.stringify(reorderObject(from, []), undefined, 2)).toEqual(
			JSON.stringify(to, undefined, 2)
		);
	});

	it('should order flat objects based on an ordering preference', () => {
		const from = {
			c: 'c',
			a: 'a',
			b: 'b',
		};

		const to = {
			c: 'c',
			b: 'b',
			a: 'a',
		};

		expect(JSON.stringify(reorderObject(from, ['c', 'b', 'a']), undefined, 2)).toEqual(
			JSON.stringify(to, undefined, 2)
		);
	});

	it('should order flat objects based on an ordering preference, filling gaps in alphabetical order', () => {
		const from = {
			d: 'd',
			g: 'g',
			a: 'a',
			b: 'b',
			f: 'f',
			c: 'c',
			e: 'e',
		};

		const to = {
			d: 'd',
			a: 'a',
			b: 'b',
			c: 'c',
			e: 'e',
			g: 'g',
			f: 'f',
		};

		expect(JSON.stringify(reorderObject(from, ['d', '.*', 'f']), undefined, 2)).toEqual(
			JSON.stringify(to, undefined, 2)
		);
	});

	it('should order flat objects based on an ordering preference, not filling gaps if not allowed', () => {
		const from = {
			d: 'd',
			g: 'g',
			a: 'a',
			b: 'b',
			f: 'f',
			c: 'c',
			e: 'e',
		};

		const to = {
			d: 'd',
			f: 'f',
			a: 'a',
			b: 'b',
			c: 'c',
			e: 'e',
			g: 'g',
		};

		const result = JSON.stringify(reorderObject(from, ['d', 'f']), undefined, 2);
		// console.log(result);
		expect(result).toEqual(JSON.stringify(to, undefined, 2));
	});

	it('should order based on an ordering preference', () => {
		const from = {
			zed: 'zed',
			mode: 'mode',
			name: 'name',
			stuff: {
				c: 'c',
				b: 'b',
				a: 'a',
				['prefixed:c']: 'prefixed:c',
				['prefixed:b']: 'prefixed:b',
				['prefixed:a']: 'prefixed:a',
			},
		};

		const to = {
			name: 'name',
			mode: 'mode',
			stuff: {
				['prefixed:a']: 'prefixed:a',
				['prefixed:b']: 'prefixed:b',
				['prefixed:c']: 'prefixed:c',
				a: 'a',
				b: 'b',
				c: 'c',
			},
			zed: 'zed',
		};

		expect(
			JSON.stringify(
				reorderObject(from, [
					'name',
					'mode',
					{ key: 'stuff', order: ['prefixed:.*', '.*'] },
					'.*',
				]),
				undefined,
				2
			)
		).toEqual(JSON.stringify(to, undefined, 2));
	});

	it('should select a filling spot around hard values based on alphabetical order', () => {
		const from = {
			d: 'd',
			g: 'g',
			a: 'a',
			b: 'b',
			f: 'f',
			c: 'c',
			e: 'e',
		};

		const to = {
			a: 'a',
			b: 'b',
			c: 'c',
			d: 'd',
			f: 'f',
			e: 'e',
			g: 'g',
		};

		const result = JSON.stringify(reorderObject(from, ['.*', 'd', 'f']), undefined, 2);
		expect(result).toEqual(JSON.stringify(to, undefined, 2));
	});
});
