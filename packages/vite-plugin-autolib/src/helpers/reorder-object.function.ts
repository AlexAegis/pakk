import type { ObjectOrder } from './auto-reorder.class.options.js';
import { closestNumber } from './closest-number.function.js';

/**
 * Creates a copy of an object with it's keys ordered according to a
 * preferred ordering
 */
export const reorderObject = <T extends object | unknown[]>(
	o: T,
	orderingPreferences: (string | ObjectOrder)[] = []
): T => {
	if (
		orderingPreferences.length === 0 ||
		!orderingPreferences.some((pref) =>
			typeof pref === 'object' ? pref.key === '.*' : pref === '.*'
		)
	) {
		orderingPreferences.push('.*');
	}

	// orderingPreferences = orderingPreferences.map()

	const plainLevelOrder = orderingPreferences.map((pref) =>
		typeof pref === 'object' ? pref.key : pref
	);

	const regexpLevelOrder = plainLevelOrder.map((pref) => new RegExp(pref));

	// Turn arrays into objects too, they will be turned back into arrays
	const isArray = Array.isArray(o);
	let obj: T = o;
	if (isArray) {
		obj = o.reduce((acc, next) => {
			acc[next] = next;
			return acc;
		}, {} as T);
	}

	const ordered = Object.entries(obj)
		.map(([key, value]) => {
			// Could fill multiple spots
			let order = -1;
			const regexpIndices = regexpLevelOrder
				.map((orderingRegExp, i) => (orderingRegExp.test(key) ? i : -1))
				.filter((index) => index > -1);
			const plainIndex = plainLevelOrder.indexOf(key);

			if (plainIndex >= 0) {
				order = plainIndex;
			} else {
				if (regexpIndices.length > 1) {
					const shaked = [...regexpLevelOrder, new RegExp(key)]
						.sort((a, b) =>
							a.test(b.source) || b.test(a.source)
								? -1
								: a.source.localeCompare(b.source)
						)
						.map((r) => r.source);
					const shakedKey = shaked.indexOf(key);
					order = closestNumber(regexpIndices, shakedKey);
				} else {
					order = regexpIndices[0];
				}
			}

			if (value !== undefined && value !== null && typeof value === 'object') {
				const subOrdering = orderingPreferences
					.filter((pref): pref is ObjectOrder => typeof pref === 'object')
					.find((preference) => new RegExp(preference.key).test(key));

				return [key, reorderObject(value, subOrdering?.order), order];
			} else {
				return [key, value, order];
			}
		})
		.sort(([ak, _av, aOrder], [bk, _bv, bOrder]) => {
			return aOrder >= 0 && bOrder >= 0 && aOrder !== bOrder
				? aOrder - bOrder
				: ak.localeCompare(bk);
		});

	return isArray ? (ordered.map((item) => item[1]) as T) : (Object.fromEntries(ordered) as T);
};