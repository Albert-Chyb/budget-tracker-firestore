import * as admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin';
import * as functions from 'firebase-functions';
import deleteCategoryCallable from './callable-functions/delete-category';
import deleteWalletCallable from './callable-functions/delete-wallet';
import { changeCount } from './helpers/info/changeCount';
import { addToDistinct, removeFromDistinct } from './helpers/info/distinct';
import insertTransaction from './helpers/wallets/insertTransaction';
import takeOutTransaction from './helpers/wallets/takeOutTransaction';
import { ITransaction } from './interfaces/transaction';

import utc = require('dayjs/plugin/utc');
import timezone = require('dayjs/plugin/timezone');
import weekday = require('dayjs/plugin/weekday');
import dayjs = require('dayjs');
require('dayjs/locale/pl');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekday);
dayjs.locale('pl');
dayjs.tz.setDefault('Europe/Warsaw');

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

export const onDocumentCreate = functions.firestore
	.document('users/{uid}/{collectionName}/{documentID}')
	.onCreate((snap, context) => {
		const { collectionName, uid } = context.params;

		return changeCount({ uid, collectionName }, 'inc');
	});

export const onDocumentDelete = functions.firestore
	.document('users/{uid}/{collectionName}/{documentID}')
	.onDelete((snap, context) => {
		const { collectionName, uid } = context.params;

		return changeCount({ uid, collectionName }, 'dec');
	});

export const onStatisticsCreate = functions.firestore
	.document('users/{uid}/wallets-statistics/{year}')
	.onCreate((snap, context) =>
		addToDistinct(
			{ uid: context.params.uid, collectionName: 'wallets-statistics' },
			snap
		)
	);

export const onStatisticsDelete = functions.firestore
	.document('users/{uid}/wallets-statistics/{year}')
	.onDelete((snap, context) =>
		removeFromDistinct(
			{ uid: context.params.uid, collectionName: 'wallets-statistics' },
			snap
		)
	);

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

export const deleteWallet = functions.https.onCall(deleteWalletCallable);

export const deleteCategory = functions.https.onCall(deleteCategoryCallable);
