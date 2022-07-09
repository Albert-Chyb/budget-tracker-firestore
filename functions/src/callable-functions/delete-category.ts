import * as admin from 'firebase-admin';
import { firestore } from 'firebase-admin';
import * as functions from 'firebase-functions';
import { isReferenced } from '../utils/references';

const deleteCategory = async (
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

	const categoryRef = firestore().doc(
		`users/${context.auth.uid}/categories/${data.id}`
	);
	const transactionsRef = firestore().collection(
		`users/${context.auth.uid}/transactions`
	);
	const isCategoryReferenced = await isReferenced(
		categoryRef,
		transactionsRef,
		'category'
	);
	const category = await categoryRef.get();

	if (isCategoryReferenced) {
		throw new functions.https.HttpsError(
			'aborted',
			'The category is referenced by at least one transaction.'
		);
	}

	const iconPath = `${context.auth.uid}/categories-icons/${categoryRef.id}`;
	const iconRef = admin.storage().bucket().file(iconPath);

	await categoryRef.delete();

	try {
		await iconRef.delete();
	} catch (error) {
		await categoryRef.create(category.data());

		throw error;
	}
};

export default deleteCategory;
