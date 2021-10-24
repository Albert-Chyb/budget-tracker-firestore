/**
 * Returns day of the week. Assumes monday as first day of the week.
 */
export function getDay(date: Date) {
	const dayIndex = date.getDay() - 1;

	return dayIndex < 0 ? 6 : dayIndex;
}

/**
 * Returns the first day index of the first week in a month.
 */
export function getFirstDayInFirstWeek(date: Date) {
	return getDay(new Date(date.getFullYear(), date.getMonth(), 1));
}

/**
 * Returns the index of the week that contains given date in a monthly scope.
 */
export function weekOfMonth(date: Date) {
	const offset = getFirstDayInFirstWeek(date);

	return Math.ceil((date.getDate() + offset) / 7) - 1;
}
