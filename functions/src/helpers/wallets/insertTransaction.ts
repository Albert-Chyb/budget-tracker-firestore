import { firestore } from 'firebase-admin';
import { IRequiredParams } from '../../interfaces/requiredParams';
import { ITransaction } from '../../interfaces/transaction';
import includeTransaction from '../statistics/includeTransaction';
import referenceWallet from './referenceWallet';

async function insertTransaction(
	transactionSnap: firestore.QueryDocumentSnapshot<ITransaction>,
	params: IRequiredParams
) {
	const walletRef = referenceWallet(transactionSnap, params);
	const { type, amount } = transactionSnap.data();
	const modifier = type === 'expense' ? -1 : 1;

	await walletRef.update({
		balance: firestore.FieldValue.increment(amount * modifier),
	});

	return includeTransaction(transactionSnap, params);
}

export default insertTransaction;
