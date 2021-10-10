import { firestore } from 'firebase-admin';
import * as functions from 'firebase-functions';

export async function isReferenced(
	parent: firestore.DocumentReference<firestore.DocumentData>,
	children: firestore.CollectionReference<firestore.DocumentData>,
	childField: string
) {
	const parentRef = await parent.get();

	if (!parentRef.exists) {
		throw new functions.https.HttpsError(
			'not-found',
			'The parent document was not found.'
		);
	}

	const childrenCollection = await children
		.where(childField, '==', parentRef.id)
		.limit(1)
		.get();

	return !childrenCollection.empty;
}
