import { firestore } from 'firebase-admin';
import { IRequiredStatisticsParams } from '../../interfaces/requiredStatisticsParams';
import includeExcludeTransaction, {
	IOptions,
} from './includeExcludeTransaction';

function includeTransaction(
	transactionSnap: firestore.QueryDocumentSnapshot,
	params: IRequiredStatisticsParams,
	options?: IOptions
) {
	return includeExcludeTransaction(transactionSnap, 'include', params, options);
}

export default includeTransaction;
