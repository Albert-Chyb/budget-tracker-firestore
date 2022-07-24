import { firestore } from 'firebase-admin';
import * as functions from 'firebase-functions';

export interface TransferMoneyData {
	sourceWallet: string;
	targetWallet: string;
	amount: number;
}

const MAX_MONEY_AMOUNT = 1_000_000;

const transferMoney = async (
	params: TransferMoneyData,
	context: functions.https.CallableContext
) => {
	if (params.sourceWallet === params.targetWallet) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			'Source wallet cannot be the same as the target wallet.'
		);
	}

	return firestore().runTransaction(async transaction => {
		if ('auth' in context === false) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User is not logged in'
			);
		}

		const collectionRef = firestore().collection(
			`users/${context.auth.uid}/wallets`
		);
		const sourceWalletDoc = await transaction.get(
			collectionRef.doc(params.sourceWallet)
		);
		const targetWalletDoc = await transaction.get(
			collectionRef.doc(params.targetWallet)
		);

		if (!sourceWalletDoc.exists) {
			throw new functions.https.HttpsError(
				'not-found',
				'Source wallet does not exist.'
			);
		}

		if (!targetWalletDoc.exists) {
			throw new functions.https.HttpsError(
				'not-found',
				'Target wallet does not exist.'
			);
		}

		if (sourceWalletDoc.data().balance < params.amount) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Source wallet has insufficient balance'
			);
		}

		if (
			targetWalletDoc.data().balance + params.amount >
			MAX_MONEY_AMOUNT * 100
		) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				`Wallets can only hold up to ${MAX_MONEY_AMOUNT} money units. This transfer would exceed this value.`
			);
		}

		transaction
			.update(sourceWalletDoc.ref, {
				balance: firestore.FieldValue.increment(-params.amount),
			})
			.update(targetWalletDoc.ref, {
				balance: firestore.FieldValue.increment(params.amount),
			});
	});
};

export default transferMoney;
