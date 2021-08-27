import { Entity } from '@backstage/catalog-model'
import { AWSError, CloudFormation, SharedIniFileCredentials } from 'aws-sdk'

import { CloudFormationTarget } from './types'

const isAWSError = (error: unknown): error is AWSError =>
	typeof error === 'object' &&
	error !== null &&
	'code' in error &&
	'retryable' in error

export const loadEntitiesFromCloudFormation = async (
	target: CloudFormationTarget
): Promise<Entity[]> => {
	const cloudFormation = new CloudFormation({
		credentials: new SharedIniFileCredentials({
			profile: target.profile
		}),
		region: target.region
	})

	const load = async (): Promise<Entity[]> => {
		try {
			const template = await cloudFormation
				.getTemplateSummary({ StackName: target.arn })
				.promise()

			const metadata = JSON.parse(template.Metadata ?? '{}')
			const entities: Entity[] = metadata?.Backstage?.Entities ?? []

			return entities
		} catch (err) {
			if (
				isAWSError(err) &&
				err.code === 'Throttling' &&
				err.retryable === true
			) {
				return new Promise((resolve) => {
					setTimeout(
						() => resolve(load()),
						Math.random() * 3000 + 2000 // 2 to 5 seconds cooldown
					)
				})
			}
			throw err
		}
	}

	return load()
}
