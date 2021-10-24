import { firestore } from 'firebase-admin';
import { IRequiredStatisticsParams } from '../../interfaces/requiredStatisticsParams';
import { ITransaction } from '../../interfaces/transaction';
import { getDay, weekOfMonth } from '../../utils/date';
import { propByString } from '../../utils/propByString';
import referenceStatistics from './referenceStatistics';

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
	const transactionDate = transaction.date.toDate();
	const statisticsRef = referenceStatistics(transactionSnap, params);
	const modifier = operation === 'include' ? 1 : -1;
	const monthIndex = transactionDate.getMonth();
	const weekIndex = weekOfMonth(transactionDate);
	const weekDayIndex = getDay(transactionDate);

	transaction.amount *= modifier;

	const statisticsObj = statistics(transaction, {
		[monthIndex]: statistics(transaction, {
			[weekIndex]: statistics(transaction, {
				[weekDayIndex]: statistics(transaction),
			}),
		}),
	});

	await statisticsRef.set(statisticsObj, { merge: true });

	if (operation === 'exclude') {
		// Perform a cleanup when a given period does not include any transactions (when expenses and income are equal to zero)

		const statsAfterUpdate = (await statisticsRef.get()).data();
		const paths = [
			[],
			[`${monthIndex}`],
			[`${monthIndex}`, `${weekIndex}`],
			[`${monthIndex}`, `${weekIndex}`, `${weekDayIndex}`],
		];
		let cleanupAction: Promise<firestore.WriteResult> = null;

		for (const elements of paths) {
			const { income, expenses } = propByString(statsAfterUpdate, elements);

			if (income === 0 && expenses === 0) {
				const fieldPath = elements.join('.');

				cleanupAction = fieldPath
					? statisticsRef.update({
							[fieldPath]: firestore.FieldValue.delete(),
					  })
					: statisticsRef.delete();

				break;
			}
		}

		return Promise.resolve(cleanupAction);
	}

	return Promise.resolve();
}

export default includeExcludeTransaction;
