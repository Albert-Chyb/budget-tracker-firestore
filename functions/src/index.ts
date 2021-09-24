import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin';

initializeApp();

function deleteFile(path: string) {
	return admin.storage().bucket().file(path).delete();
}

/**
 * After deleting a category, this function removes icon associated with it.
 */
export const deleteCategoryIconOnDelete = functions.firestore
	.document('users/{uid}/{categories}/{categoryID}')
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
