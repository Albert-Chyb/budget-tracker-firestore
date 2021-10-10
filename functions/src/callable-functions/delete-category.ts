import { firestore } from 'firebase-admin';
import * as functions from 'firebase-functions';
import { SilentIsReferencedError, SilentSuccess } from '../models/silent-error';
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

	if (!isCategoryReferenced) {
		await categoryRef.delete();

		return new SilentSuccess();
	} else {
		return new SilentIsReferencedError(
			'The category is referenced by a transaction.'
		);
	}
};

export default deleteCategory;
