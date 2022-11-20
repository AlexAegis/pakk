export interface ObjectOrder {
	key: string;
	order: (string | ObjectOrder)[];
}

export interface AutoReorderOptions {
	/**
	 * Define an order of keys that will be applied to the target object
	 * The rest of the keys will be ordered in alphabetical order.
	 * You can nest ordering by adding an object, that defines a sub-ordering.
	 *
	 * ! All ordering keys are treated as regular expressions, make sure they
	 * ! are valid!
	 *
	 * By default it orders everything in alphabetical order.
	 *
	 * @example ['name', '.*', { key: 'scripts', order: ['start', 'build.*'] }, '.*']
	 * @default []
	 */
	orderPreference?: (string | ObjectOrder)[];
}

export const normalizeAutoReorderOptions = (
	options?: AutoReorderOptions
): Required<AutoReorderOptions> => {
	return {
		orderPreference: [],
		...options,
	};
};
