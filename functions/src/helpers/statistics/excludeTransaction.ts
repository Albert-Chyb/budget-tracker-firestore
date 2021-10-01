import { firestore } from 'firebase-admin';
import { IRequiredStatisticsParams } from '../../interfaces/requiredStatisticsParams';
import includeExcludeTransaction from './includeExcludeTransaction';

function excludeTransaction(
	transactionSnap: firestore.QueryDocumentSnapshot,
	params: IRequiredStatisticsParams
) {
	return includeExcludeTransaction(transactionSnap, 'exclude', params);
}

export default excludeTransaction;
