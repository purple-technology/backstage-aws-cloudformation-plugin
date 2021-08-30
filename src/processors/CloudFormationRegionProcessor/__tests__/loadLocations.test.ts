import AWS from 'aws-sdk'
import * as AWSMock from 'aws-sdk-mock'

import { createListStacksSpy } from '../../../testing/awsMocks'
import { loadLocationsFromCloudFormation } from '../loadLocations'

const statusFilter = [
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

describe('CloudFormationRegionProcessor - loadLocations', () => {
	beforeAll(() => {
		AWSMock.setSDKInstance(AWS)
	})

	afterEach(() => {
		jest.restoreAllMocks()
		AWSMock.restore()
	})

	it('should list the stacks', async () => {
		const listStacksResponses: AWS.CloudFormation.Types.ListStacksOutput[] = [
			{
				StackSummaries: [
					{
						StackId:
							'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123',
						StackName: 'some-stack',
						CreationTime: new Date(0),
						StackStatus: 'CREATE_COMPLETE'
					},
					{
						StackName: 'some-stack-withoutid',
						CreationTime: new Date(0),
						StackStatus: 'CREATE_COMPLETE'
					}
				],
				NextToken: 'karel'
			},
			{
				StackSummaries: [
					{
						StackId:
							'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack-2nd/545-345-12-24123-asda',
						StackName: 'some-stack-2nd',
						CreationTime: new Date(0),
						StackStatus: 'CREATE_COMPLETE'
					}
				],
				NextToken: 'pepa'
			},
			{
				StackSummaries: undefined
			}
		]
		const listStacksSpy = createListStacksSpy(listStacksResponses)

		// Check the responses from the generator
		let responseCounter = 0
		for await (const stackId of loadLocationsFromCloudFormation({
			profile: 'karel',
			region: 'eu-central-1'
		})) {
			switch (responseCounter) {
				case 0:
					expect(stackId).toEqual(
						'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123'
					)
					break
				case 1:
					expect(stackId).toEqual(
						'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack-2nd/545-345-12-24123-asda'
					)
					break
			}

			responseCounter++
		}

		// Check the API calls
		expect(listStacksSpy).toHaveBeenNthCalledWith<
			[AWS.CloudFormation.Types.ListStacksInput]
		>(1, {
			StackStatusFilter: statusFilter
		})
		expect(listStacksSpy).toHaveBeenNthCalledWith<
			[AWS.CloudFormation.Types.ListStacksInput]
		>(2, {
			StackStatusFilter: statusFilter,
			NextToken: 'karel'
		})
		expect(listStacksSpy).toHaveBeenNthCalledWith<
			[AWS.CloudFormation.Types.ListStacksInput]
		>(3, {
			StackStatusFilter: statusFilter,
			NextToken: 'pepa'
		})
	})
})
