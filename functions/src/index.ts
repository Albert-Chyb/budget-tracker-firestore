import * as admin from 'firebase-admin';
import { firestore, initializeApp } from 'firebase-admin';
import * as functions from 'firebase-functions';
import insertTransaction from './helpers/wallets/insertTransaction';
import takeOutTransaction from './helpers/wallets/takeOutTransaction';
import { ITransaction } from './interfaces/transaction';
import { isReferenced } from './utils/refrences';

initializeApp();

function deleteFile(path: string) {
	return admin.storage().bucket().file(path).delete();
}

/**
 * After deleting a category, this function removes icon associated with it.
 */
export const deleteCategoryIconOnDelete = functions.firestore
	.document('users/{uid}/categories/{categoryID}')
	.onDelete(snap => {
		const { iconPath } = snap.data();

		return deleteFile(iconPath);
	});

/**
 * It removes old icon from the storage, whenever a category has changed its icon.
 */
export const deleteCategoryIconOnUpdate = functions.firestore
	.document('users/{uid}/categories/{categoryID}')
	.onUpdate(change => {
		const oldIconPath = change.before.data().iconPath;
		const newIconPath = change.after.data().iconPath;

		if (oldIconPath !== newIconPath) {
			return deleteFile(oldIconPath);
		} else {
			return Promise.resolve();
		}
	});

export const onTransactionCreate = functions.firestore
	.document('users/{uid}/transactions/{transactionID}')
	.onCreate(async (snap, context) => {
		// Insert the transaction into the wallet.
		await insertTransaction(<any>snap, <any>context.params);
	});

export const onTransactionDelete = functions.firestore
	.document('users/{uid}/transactions/{transactionID}')
	.onDelete(async (snap, context) => {
		// Take out the transaction from the wallet.
		await takeOutTransaction(<any>snap, <any>context.params);
	});

export const onTransactionUpdate = functions.firestore
	.document('users/{uid}/transactions/{transactionID}')
	.onUpdate(async (change, context) => {
		const before = change.before.data() as ITransaction;
		const after = change.after.data() as ITransaction;

		// TODO: Write a function that takes 2 objects as parameters, and returns array of keys of which values changed.

		const shouldRun =
			before.amount !== after.amount ||
			!before.date.isEqual(after.date) ||
			before.type !== after.type ||
			before.wallet !== after.wallet ||
			before.category !== after.category;

		if (shouldRun) {
			await takeOutTransaction(<any>change.before, <any>context.params);
			await insertTransaction(<any>change.after, <any>context.params);
		} else {
			return Promise.resolve();
		}
	});

export const deleteWallet = functions.https.onCall(async (data, context) => {
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

	if (!isWalletReferenced) {
		await walletRef.delete();

		return {
			result: 'success',
		};
	} else {
		return {
			result: 'error',
			code: 'is-referenced',
			message: 'The wallet is referenced by a transaction.',
		};
	}
});
