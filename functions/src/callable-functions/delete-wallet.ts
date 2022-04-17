import { firestore } from 'firebase-admin';
import * as functions from 'firebase-functions';
import { isReferenced } from '../utils/references';

const deleteWallet = async (
	data: { id: string },
	context: functions.https.CallableContext
) => {
	if (!context.auth?.uid) {
		throw new functions.https.HttpsError(
			'unauthenticated',
			'It seems that user is not logged in.',
			'Could not find uid property of context.auth object.'
		);
	}

	if (!('id' in data) || data.id === '') {
		throw new functions.https.HttpsError(
			'invalid-argument',
			'The wallet id is not present.'
		);
	}

	if (typeof data.id !== 'string') {
		throw new functions.https.HttpsError(
			'invalid-argument',
			'The wallet `id` property should be a string.'
		);
	}

	const uid = context.auth.uid;
	const walletId: string = data.id;
	const walletRef = firestore().doc(`users/${uid}/wallets/${walletId}`);
	const transactionsRef = firestore().collection(`users/${uid}/transactions`);
	const isWalletReferenced = await isReferenced(
		walletRef,
		transactionsRef,
		'wallet'
	);

	if (isWalletReferenced) {
		throw new functions.https.HttpsError(
			'aborted',
			'The wallet is referenced by a transaction.'
		);
	}

	return walletRef.delete();
};

export default deleteWallet;
