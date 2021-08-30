import { AWSError } from 'aws-sdk'

const isAWSError = (error: unknown): error is AWSError =>
	typeof error === 'object' &&
	error !== null &&
	'code' in error &&
	'retryable' in error

export async function awsFetch<T>(fetch: () => T): Promise<T> {
	try {
		return await fetch()
	} catch (err) {
		if (
			isAWSError(err) &&
			err.code === 'Throttling' &&
			err.retryable === true
		) {
			return new Promise((resolve) => {
				setTimeout(
					() => resolve(awsFetch(fetch)),
					Math.random() * 3000 + 2000 // 2 to 5 seconds cooldown
				)
			})
		}
		throw err
	}
}
