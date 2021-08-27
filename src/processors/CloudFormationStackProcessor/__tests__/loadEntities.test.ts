import AWS from 'aws-sdk'
import * as AWSMock from 'aws-sdk-mock'

import { createGetTemplateSummary } from '../../../testing/awsMocks'
import { loadEntitiesFromCloudFormation } from '../loadEntities'

describe('CloudFormationStackProcessor - loadEntities', () => {
	beforeAll(() => {
		AWSMock.setSDKInstance(AWS)
	})

	afterEach(() => {
		jest.restoreAllMocks()
		AWSMock.restore()
	})

	it('should get the entities from metadata', async () => {
		const getTemplateSummaryResponses: AWS.CloudFormation.Types.GetTemplateSummaryOutput[] =
			[
				{
					Metadata: JSON.stringify({
						Backstage: {
							Entities: {
								someField: 'someValue'
							}
						}
					})
				}
			]
		const getTemplateSummarySpy = createGetTemplateSummary(
			getTemplateSummaryResponses
		)

		expect(
			await loadEntitiesFromCloudFormation({
				arn: 'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123',
				profile: 'someProfile',
				region: 'ap-southeast-1'
			})
		).toEqual({ someField: 'someValue' })

		expect(getTemplateSummarySpy).toHaveBeenCalledWith<
			[AWS.CloudFormation.Types.GetTemplateSummaryInput]
		>({
			StackName:
				'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123'
		})
	})

	it('should get no entities because of no metadata', async () => {
		const getTemplateSummaryResponses: AWS.CloudFormation.Types.GetTemplateSummaryOutput[] =
			[{}]
		const getTemplateSummarySpy = createGetTemplateSummary(
			getTemplateSummaryResponses
		)

		expect(
			await loadEntitiesFromCloudFormation({
				arn: 'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123',
				profile: 'someProfile',
				region: 'ap-southeast-1'
			})
		).toEqual([])

		expect(getTemplateSummarySpy).toHaveBeenCalledWith<
			[AWS.CloudFormation.Types.GetTemplateSummaryInput]
		>({
			StackName:
				'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123'
		})
	})

	it('should get no entities because of empty metadata', async () => {
		const getTemplateSummaryResponses: AWS.CloudFormation.Types.GetTemplateSummaryOutput[] =
			[
				{
					Metadata: JSON.stringify(null)
				}
			]
		const getTemplateSummarySpy = createGetTemplateSummary(
			getTemplateSummaryResponses
		)

		expect(
			await loadEntitiesFromCloudFormation({
				arn: 'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123',
				profile: 'someProfile',
				region: 'ap-southeast-1'
			})
		).toEqual([])

		expect(getTemplateSummarySpy).toHaveBeenCalledWith<
			[AWS.CloudFormation.Types.GetTemplateSummaryInput]
		>({
			StackName:
				'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123'
		})
	})

	it('should trow throttling error', async () => {
		const getTemplateSummaryResponses: AWS.AWSError[] = [
			{
				code: 'Throttling',
				retryable: true
			} as AWS.AWSError,
			new Error('different error') as AWS.AWSError
		]
		const getTemplateSummarySpy = createGetTemplateSummary(
			getTemplateSummaryResponses,
			true
		)

		await expect(
			loadEntitiesFromCloudFormation({
				arn: 'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123',
				profile: 'someProfile',
				region: 'ap-southeast-1'
			})
		).rejects.toThrowError('different error')

		expect(getTemplateSummarySpy).toHaveBeenCalledWith<
			[AWS.CloudFormation.Types.GetTemplateSummaryInput]
		>({
			StackName:
				'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123'
		})
	})
})
