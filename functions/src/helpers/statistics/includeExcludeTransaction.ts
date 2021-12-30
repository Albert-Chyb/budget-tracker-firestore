import { firestore } from 'firebase-admin';
import { IRequiredStatisticsParams } from '../../interfaces/requiredStatisticsParams';
import { ITransaction } from '../../interfaces/transaction';
import { weekOfMonth } from '../../utils/dayjs';
import { propByString } from '../../utils/propByString';
import referenceStatistics, {
	referenceStatisticsYear,
} from './referenceStatistics';

import dayjs = require('dayjs');

function statistics(transaction: ITransaction, child?: object) {
	const field = transaction.type === 'expense' ? 'expenses' : 'income';
	const negativeField = transaction.type === 'expense' ? 'income' : 'expenses';
	const statObj = {
		[field]: firestore.FieldValue.increment(transaction.amount),
		[negativeField]: firestore.FieldValue.increment(0),
		categories: {
			[transaction.category]: {
				[field]: firestore.FieldValue.increment(transaction.amount),
				[negativeField]: firestore.FieldValue.increment(0),
			},
		},
	};

	return Object.assign(statObj, child);
}

/**
 * A function both for including and excluding a transaction to / from statistics.
 * @param transactionSnap Document snapshot of a transaction.
 * @param operation Either 'include' or 'exclude'
 * @param params Object with required params
 * @returns Promise of write result
 */
async function includeExcludeTransaction(
	transactionSnap: firestore.QueryDocumentSnapshot,
	operation: 'include' | 'exclude',
	params: IRequiredStatisticsParams
) {
	const transaction = transactionSnap.data() as ITransaction;
	const transactionDate = dayjs.tz(transaction.date.toDate());
	const statisticsRef = referenceStatistics(transactionSnap, params);
	const statisticsYearRef = referenceStatisticsYear(transactionSnap, params);
	const modifier = operation === 'include' ? 1 : -1;
	const monthIndex = transactionDate.month();
	const weekIndex = weekOfMonth(transactionDate);
	const weekDayIndex = transactionDate.weekday();

	transaction.amount *= modifier;

	const statisticsObj = statistics(transaction, {
		[monthIndex]: statistics(transaction, {
			[weekIndex]: statistics(transaction, {
				[weekDayIndex]: statistics(transaction),
			}),
		}),
	});

	await Promise.all([
		statisticsRef.set(statisticsObj, { merge: true }),
		statisticsYearRef.set(statisticsObj, {
			merge: true,
		}),
	]);

	if (operation === 'exclude') {
		// Perform a cleanup when a given period does not include any transactions (when expenses and income are equal to zero)
		const paths = [
			[],
			[`${monthIndex}`],
			[`${monthIndex}`, `${weekIndex}`],
			[`${monthIndex}`, `${weekIndex}`, `${weekDayIndex}`],
		];

		await Promise.all([
			cleanupStatistics(statisticsRef, paths),
			cleanupStatistics(statisticsYearRef, paths),
		]);
	}
}

async function cleanupStatistics(
	ref: firestore.DocumentReference<firestore.DocumentData>,
	paths: string[][]
) {
	const data = (await ref.get()).data();
	let cleanupAction: Promise<firestore.WriteResult> = null;

	for (const elements of paths) {
		const { income, expenses } = propByString(data, elements);

		if (income === 0 && expenses === 0) {
			const fieldPath = elements.join('.');

			cleanupAction = fieldPath
				? ref.update({
						[fieldPath]: firestore.FieldValue.delete(),
				  })
				: ref.delete();

			break;
		}
	}

	return cleanupAction;
}

export default includeExcludeTransaction;
