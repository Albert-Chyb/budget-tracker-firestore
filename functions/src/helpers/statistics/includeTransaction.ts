import { firestore } from 'firebase-admin';
import { IRequiredStatisticsParams } from '../../interfaces/requiredStatisticsParams';
import includeExcludeTransaction from './includeExcludeTransaction';

function includeTransaction(
	transactionSnap: firestore.QueryDocumentSnapshot,
	params: IRequiredStatisticsParams
) {
	return includeExcludeTransaction(transactionSnap, 'include', params);
}

export default includeTransaction;
