import { isObject, SimpleObjectKey } from '@alexaegis/common';

/**
 *
 * @deprecated use JSON clone if the object is serializable
 */
export const deleteEmptyKeys = (target: Record<SimpleObjectKey, unknown>): void => {
	if (isObject(target)) {
		for (const key in target) {
			const value = target[key];
			if (isObject(value)) {
				deleteEmptyKeys(value);
			} else if (value === undefined || value === null) {
				delete target[key];
			}
		}
	}
};
