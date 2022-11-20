export interface ObjectOrder {
	key: string;
	order: ObjectKeyOrder;
}

export const DEFAULT_PACKAGE_JSON_ORDER_PREFERENCE: ObjectKeyOrder = [
	'name',
	'description',
	'version',
	'license',
	'private',
	'author',
	'homepage',
	'repository',
	'bugs',
	'keywords',
	'type',
	'sideEffects',
	'config',
	'publishConfig',
	{ key: 'scripts', order: ['build.*', 'lint.*'] },
	{ key: 'exports', order: [{ key: '.*', order: ['types', '.*'] }] },
	'dependencies',
	'peerDependencies',
	'optonalDependencies',
	'devDependencies',
];

export type ObjectKeyOrder = (string | ObjectOrder)[];

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
	orderPreference?: ObjectKeyOrder;
}

export const normalizeAutoReorderOptions = (
	options?: AutoReorderOptions
): Required<AutoReorderOptions> => {
	// patch exports
	let orderPreference: ObjectKeyOrder = [];

	if (options?.orderPreference) {
		orderPreference = options.orderPreference.some(
			(orderPreference) =>
				(typeof orderPreference === 'string' && orderPreference === 'exports') ||
				(typeof orderPreference === 'object' && orderPreference.key === 'exports')
		)
			? options.orderPreference.map((orderPreference) => {
					if (typeof orderPreference === 'string' && orderPreference === 'exports') {
						return { key: 'exports', order: [{ key: '.*', order: ['types'] }] };
					} else if (
						typeof orderPreference === 'object' &&
						orderPreference.key === 'exports'
					) {
						return {
							key: 'exports',
							order: orderPreference.order.map((order) => {
								if (typeof order === 'string') {
									return { key: order, order: ['types'] };
								} else {
									const existingTypesEntry = order.order.find((o) =>
										typeof o === 'string' ? o === 'types' : o.key === 'types'
									);
									const nonTypesEntries = order.order.filter((o) =>
										typeof o === 'string' ? o !== 'types' : o.key !== 'types'
									);
									return {
										key: order.key,
										order: [existingTypesEntry ?? 'types', ...nonTypesEntries],
									};
								}
							}),
						};
					}
					return orderPreference;
			  })
			: [
					...options.orderPreference,
					{
						key: 'exports',
						order: [{ key: '.*', order: ['types'] }],
					},
			  ];
	} else {
		orderPreference = DEFAULT_PACKAGE_JSON_ORDER_PREFERENCE;
	}

	return {
		orderPreference,
	};
};
