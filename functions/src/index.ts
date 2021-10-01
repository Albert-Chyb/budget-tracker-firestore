import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin';
import excludeTransaction from './helpers/statistics/excludeTransaction';
import includeTransaction from './helpers/statistics/includeTransaction';
import { ITransaction } from './interfaces/transaction';

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

export const manageWalletStatisticsOnCreate = functions.firestore
	.document('users/{uid}/transactions/{transactionID}')
	.onCreate(async (snap, context) =>
		includeTransaction(snap, <any>context.params, { checkForExistence: true })
	);

export const manageWalletStatisticsOnDelete = functions.firestore
	.document('users/{uid}/transactions/{transactionID}')
	.onDelete(async (snap, context) =>
		excludeTransaction(snap, <any>context.params)
	);

export const manageWalletStatisticsOnUpdate = functions.firestore
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
			await excludeTransaction(change.before, <any>context.params);
			await includeTransaction(change.after, <any>context.params, {
				checkForExistence: false,
			});
		} else {
			return Promise.resolve();
		}
	});
