/**
 * Gets property value at a given path. The path can be either a string or an array of strings.
 * In case of a string, the dot is used as the separator.
 *
 * @param obj Object to retrieve value from.
 * @param path Path to the value.
 */
export function propByString(obj: any, path: string | string[]) {
	let elements: string[];

	if (path instanceof String) {
		elements = path.split('.');
	} else if (Array.isArray(path)) {
		elements = path;
	}

	return elements.reduce((obj, prop) => obj[prop], obj);
}
