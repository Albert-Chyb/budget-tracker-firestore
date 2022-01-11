import dayjs = require('dayjs');
import { firestore } from 'firebase-admin';
import { IRequiredStatisticsParams } from '../../interfaces/requiredStatisticsParams';
import { ITransaction } from '../../interfaces/transaction';
/**
 * Gets the reference to a statistics object, that the given transaction belongs to.
 */

function referenceStatistics(
	transactionSnap: firestore.QueryDocumentSnapshot,
	params: IRequiredStatisticsParams
) {
	const { wallet, date: timestamp } = transactionSnap.data() as ITransaction;
	const date = dayjs.tz(timestamp.toDate());

	return firestore().doc(
		`users/${
			params.uid
		}/wallets-statistics/${date.year()}/year-by-wallets/${wallet}`
	);
}

export function referenceStatisticsYear(
	transactionSnap: firestore.QueryDocumentSnapshot,
	params: IRequiredStatisticsParams
) {
	const { date: timestamp } = transactionSnap.data() as ITransaction;
	const date = dayjs.tz(timestamp.toDate());

	return firestore().doc(
		`users/${params.uid}/wallets-statistics/${date.year()}`
	);
}

export default referenceStatistics;
