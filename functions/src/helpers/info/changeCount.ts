import { firestore } from 'firebase-admin';

export function changeCount(
	params: {
		uid: string;
		collectionName: string;
		[key: string]: any;
	},
	action: 'inc' | 'dec'
) {
	if (params.collectionName === 'info') return Promise.resolve();

	return firestore()
		.doc(`users/${params.uid}/info/${params.collectionName}`)
		.set(
			{
				docCount: firestore.FieldValue.increment(action === 'inc' ? 1 : -1),
			},
			{ merge: true }
		);
}
