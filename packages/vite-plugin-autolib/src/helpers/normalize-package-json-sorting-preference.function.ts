import type { ObjectKeyOrder } from '@alexaegis/common';

/**
 * @deprecated use core
 */
export const normalizeSortingPreferenceForPackageJson = (
	sortingPreferences: ObjectKeyOrder
): ObjectKeyOrder => {
	return sortingPreferences.some(
		(sortingPrefrence) =>
			(typeof sortingPrefrence === 'string' && sortingPrefrence === 'exports') ||
			(typeof sortingPrefrence === 'object' && sortingPrefrence.key === 'exports')
	)
		? sortingPreferences.map((sortingPrefrence) => {
				if (typeof sortingPrefrence === 'string' && sortingPrefrence === 'exports') {
					return { key: 'exports', order: [{ key: '.*', order: ['types'] }] };
				} else if (
					typeof sortingPrefrence === 'object' &&
					sortingPrefrence.key === 'exports'
				) {
					return {
						key: 'exports',
						order: sortingPrefrence.order.map((ordering) => {
							if (typeof ordering === 'string') {
								return { key: ordering, order: ['types'] };
							} else {
								const existingTypesEntry = ordering.order.find((o) =>
									typeof o === 'string' ? o === 'types' : o.key === 'types'
								);
								const nonTypesEntries = ordering.order.filter((o) =>
									typeof o === 'string' ? o !== 'types' : o.key !== 'types'
								);
								return {
									key: ordering.key,
									order: [existingTypesEntry ?? 'types', ...nonTypesEntries],
								};
							}
						}),
					};
				}
				return sortingPrefrence;
		  })
		: [
				...sortingPreferences,
				{
					key: 'exports',
					order: [{ key: '.*', order: ['types'] }],
				},
		  ];
};
