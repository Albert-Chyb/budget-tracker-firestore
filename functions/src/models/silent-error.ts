export class SilentError {
	constructor(public code: string, public message: string) {}

	result = 'error';
}

export class SilentSuccess {
	result = 'success';
}

export class SilentIsReferencedError extends SilentError {
	constructor(message: string) {
		super('is-referenced', message);
	}
}
