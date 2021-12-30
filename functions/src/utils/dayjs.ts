import { Dayjs } from 'dayjs';

export function weekOfMonth(date: Dayjs): number {
	const offset = date.clone().set('date', 1).weekday();

	return Math.ceil((date.date() + offset) / 7) - 1;
}
