import { initializeApp } from 'firebase-admin';
import * as functions from 'firebase-functions';
import deleteCategoryCallable from './callable-functions/delete-category';
import deleteWalletCallable from './callable-functions/delete-wallet';
import { changeCount } from './helpers/info/changeCount';
import { addToDistinct, removeFromDistinct } from './helpers/info/distinct';
import insertTransaction from './helpers/wallets/insertTransaction';
import takeOutTransaction from './helpers/wallets/takeOutTransaction';

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

export const onDocumentCreate = functions.firestore
	.document('users/{uid}/{collectionName}/{documentID}')
	.onCreate((snap, context) => {
		const { collectionName, uid } = context.params;

		if (collectionName === 'info') {
			return Promise.resolve();
		} else {
			return changeCount({ uid, collectionName }, 'inc');
		}
	});

export const onDocumentDelete = functions.firestore
	.document('users/{uid}/{collectionName}/{documentID}')
	.onDelete((snap, context) => {
		const { collectionName, uid } = context.params;

		if (collectionName === 'info') {
			return Promise.resolve();
		} else {
			return changeCount({ uid, collectionName }, 'dec');
		}
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
		await takeOutTransaction(<any>change.before, <any>context.params);
		await insertTransaction(<any>change.after, <any>context.params);
	});

export const deleteWallet = functions.https.onCall(deleteWalletCallable);

export const deleteCategory = functions.https.onCall(deleteCategoryCallable);
