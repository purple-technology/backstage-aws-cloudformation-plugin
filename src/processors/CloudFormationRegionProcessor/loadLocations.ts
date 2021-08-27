import AWS from 'aws-sdk'

import { CloudFormationRegionTarget } from './types'

export async function* loadLocationsFromCloudFormation(
	target: CloudFormationRegionTarget
): AsyncGenerator<string, void> {
	const cloudFormation = new AWS.CloudFormation({
		credentials: new AWS.SharedIniFileCredentials({
			profile: target.profile
		}),
		region: target.region
	})

	let nextToken: string | undefined = undefined
	do {
		const params: AWS.CloudFormation.Types.ListStacksInput = {
			StackStatusFilter: [
				'CREATE_IN_PROGRESS',
				'CREATE_COMPLETE',
				'ROLLBACK_IN_PROGRESS',
				'ROLLBACK_COMPLETE',
				'UPDATE_IN_PROGRESS',
				'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
				'UPDATE_COMPLETE',
				'UPDATE_ROLLBACK_IN_PROGRESS',
				'UPDATE_ROLLBACK_FAILED',
				'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS',
				'UPDATE_ROLLBACK_COMPLETE',
				'IMPORT_IN_PROGRESS',
				'IMPORT_COMPLETE',
				'IMPORT_ROLLBACK_IN_PROGRESS',
				'IMPORT_ROLLBACK_FAILED',
				'IMPORT_ROLLBACK_COMPLETE'
			]
		}
		if (nextToken) {
			params.NextToken = nextToken
		}

		const stacks = await cloudFormation.listStacks(params).promise()

		for (const { StackId } of stacks.StackSummaries ?? []) {
			if (typeof StackId !== 'undefined') {
				yield StackId
			}
		}

		nextToken = stacks.NextToken
	} while (typeof nextToken === 'string')
}
