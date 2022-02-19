import { firestore } from 'firebase-admin';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';

export function addToDistinct(
	params: {
		uid: string;
		collectionName: string;
		[key: string]: any;
	},
	snap: DocumentSnapshot
) {
	if (params.collectionName === 'info') return Promise.resolve();

	return firestore()
		.doc(`users/${params.uid}/info/${params.collectionName}`)
		.set(
			{
				distinct: firestore.FieldValue.arrayUnion(snap.id),
			},
			{ merge: true }
		);
}

export function removeFromDistinct(
	params: {
		uid: string;
		collectionName: string;
		[key: string]: any;
	},
	snap: DocumentSnapshot
) {
	if (params.collectionName === 'info') return Promise.resolve();

	return firestore()
		.doc(`users/${params.uid}/info/${params.collectionName}`)
		.set(
			{
				distinct: firestore.FieldValue.arrayRemove(snap.id),
			},
			{ merge: true }
		);
}
