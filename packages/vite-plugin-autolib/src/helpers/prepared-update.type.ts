import { deepMerge, type Awaitable, type SimpleObjectKey } from '@alexaegis/common';

export type PreparedCreateUpdates<T extends Record<SimpleObjectKey, unknown>> = (
	t: T
) => Awaitable<Partial<T>>;

export type PreparedUpdate<T extends Record<SimpleObjectKey, unknown>> = (t: T) => Awaitable<T>;

export const createPreparedUpdate = <T extends Record<SimpleObjectKey, unknown>>(
	createUpdates: PreparedCreateUpdates<T>
): PreparedUpdate<T> => {
	return async (t) => {
		const updates = await createUpdates(t);
		return deepMerge(t, updates);
	};
};
