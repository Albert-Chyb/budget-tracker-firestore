import { firestore } from 'firebase-admin';
import { IRequiredParams } from '../../interfaces/requiredParams';
import { ITransaction } from '../../interfaces/transaction';
import excludeTransaction from '../statistics/excludeTransaction';
import referenceWallet from './referenceWallet';

/**
 * Abstraction for removing a transaction from a wallet.
 * @param transactionSnap
 */

async function takeOutTransaction(
	transactionSnap: firestore.QueryDocumentSnapshot<ITransaction>,
	params: IRequiredParams
) {
	const walletRef = referenceWallet(transactionSnap, params);
	const { type, amount } = transactionSnap.data();
	const modifier = type === 'expense' ? 1 : -1;

	await walletRef.update({
		balance: firestore.FieldValue.increment(amount * modifier),
	});
	return excludeTransaction(transactionSnap, params);
}

export default takeOutTransaction;
