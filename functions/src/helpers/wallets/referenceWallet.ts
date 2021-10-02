import { firestore } from 'firebase-admin';
import { IRequiredParams } from '../../interfaces/requiredParams';
import { ITransaction } from '../../interfaces/transaction';
import { IWallet } from '../../interfaces/wallet';

function referenceWallet(
	transactionSnap: firestore.QueryDocumentSnapshot<ITransaction>,
	params: IRequiredParams
): firestore.DocumentReference<IWallet> {
	return firestore().doc(
		`users/${params.uid}/wallets/${transactionSnap.data().wallet}`
	) as any;
}

export default referenceWallet;
