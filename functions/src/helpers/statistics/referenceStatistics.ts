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
	const date = timestamp.toDate();

	return firestore().doc(
		`users/${params.uid}/wallets/${wallet}/statistics/${date.getFullYear()}`
	);
}

export default referenceStatistics;
