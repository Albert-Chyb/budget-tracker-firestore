import { firestore } from 'firebase-admin';
import { IRequiredStatisticsParams } from '../../interfaces/requiredStatisticsParams';
import { ITransaction } from '../../interfaces/transaction';
import referenceStatistics from './referenceStatistics';

export interface IOptions {
	/**
	 * When enabled, the function checks if the statistics object exists.
	 * If not it will create an initial object with given transaction already included.
	 * Note that this check costs additional read operation, and available only in the include operation.
	 */
	checkForExistence: boolean;
}

const DEFAULT_OPTIONS: IOptions = {
	checkForExistence: true,
};

/**
 * A function both for including and excluding a transaction to / from statistics.
 * @param transactionSnap Document snapshot of a transaction.
 * @param operation Either 'include' or 'exclude'
 * @param params Object with required params
 * @param options Configuration object
 * @returns Promise of write result
 */

async function includeExcludeTransaction(
	transactionSnap: firestore.QueryDocumentSnapshot,
	operation: 'include' | 'exclude',
	params: IRequiredStatisticsParams,
	options?: IOptions
) {
	options = Object.assign({ ...DEFAULT_OPTIONS }, options);

	const transaction = transactionSnap.data() as ITransaction;
	const monthIndex = transaction.date.toDate().getMonth();
	const statisticsRef = referenceStatistics(transactionSnap, params);
	const field = transaction.type === 'expense' ? 'expenses' : 'income';
	const negativeField = transaction.type === 'expense' ? 'income' : 'expenses';
	const modifier = operation === 'include' ? 1 : -1;

	if (
		operation === 'include' &&
		options.checkForExistence &&
		!(await statisticsRef.get()).exists
	) {
		return statisticsRef.create({
			[field]: transaction.amount,
			[negativeField]: 0,
			categories: {
				[transaction.category]: {
					[field]: transaction.amount,
					[negativeField]: 0,
				},
			},
			[monthIndex]: {
				[field]: transaction.amount,
				[negativeField]: 0,
				categories: {
					[transaction.category]: {
						[field]: transaction.amount,
						[negativeField]: 0,
					},
				},
			},
		});
	} else {
		return statisticsRef.update({
			[field]: firestore.FieldValue.increment(transaction.amount * modifier),
			[`categories.${transaction.category}.${field}`]:
				firestore.FieldValue.increment(transaction.amount * modifier),
			[`${monthIndex}.${field}`]: firestore.FieldValue.increment(
				transaction.amount * modifier
			),
			[`${monthIndex}.categories.${transaction.category}.${field}`]:
				firestore.FieldValue.increment(transaction.amount * modifier),
		});
	}
}

export default includeExcludeTransaction;
