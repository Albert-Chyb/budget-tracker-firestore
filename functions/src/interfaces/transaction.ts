import { firestore } from 'firebase-admin';

export interface ITransaction {
	amount: number;
	type: 'expense' | 'income';
	date: firestore.Timestamp;
	wallet: string;
	category: string;
	description?: string;
}
