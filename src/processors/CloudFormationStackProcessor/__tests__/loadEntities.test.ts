import AWS from 'aws-sdk'
import * as AWSMock from 'aws-sdk-mock'

import {
	createDescribeStacks,
	createGetTemplateSummary
} from '../../../testing/awsMocks'
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
								someField:
									'https://${Region}.console.aws.amazon.com/lambda/home?region=${Region}#/functions/${Outputs.MyLambdaFunctionName}?tab=code',
								noReplacementHere:
									'hello\\${Region}hello${Outputs.NotFound}hi${someRandomString}',
								stackId: 'stack-id-here:${StackId}----',
								stackName: 'stack-name-here:${StackName}----'
							}
						}
					})
				}
			]
		const getTemplateSummarySpy = createGetTemplateSummary(
			getTemplateSummaryResponses
		)

		const describeStacksResponses: AWS.CloudFormation.Types.DescribeStacksOutput[] =
			[
				{
					Stacks: [
						{
							StackName: 'some-stack',
							CreationTime: new Date(),
							StackStatus: 'CREATE_COMPLETE',
							Outputs: [
								{
									OutputKey: 'MyLambdaFunctionName',
									OutputValue: 'my-super-function-name-here'
								},
								{}
							]
						}
					]
				}
			]
		const describeStacksSpy = createDescribeStacks(describeStacksResponses)

		expect(
			await loadEntitiesFromCloudFormation({
				arn: 'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123',
				profile: 'someProfile',
				region: 'ap-southeast-1'
			})
		).toEqual({
			someField:
				'https://ap-southeast-1.console.aws.amazon.com/lambda/home?region=ap-southeast-1#/functions/my-super-function-name-here?tab=code',
			noReplacementHere:
				'hello\\${Region}hello${Outputs.NotFound}hi${someRandomString}',
			stackId:
				'stack-id-here:arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123----',
			stackName: 'stack-name-here:some-stack----'
		})

		expect(getTemplateSummarySpy).toHaveBeenCalledWith<
			[AWS.CloudFormation.Types.GetTemplateSummaryInput]
		>({
			StackName:
				'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123'
		})

		expect(describeStacksSpy).toHaveBeenCalledWith<
			[AWS.CloudFormation.Types.DescribeStacksInput]
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

		const describeStacksResponses: AWS.CloudFormation.Types.DescribeStacksOutput[] =
			[
				{
					Stacks: [
						{
							StackName: 'some-stack',
							CreationTime: new Date(),
							StackStatus: 'CREATE_COMPLETE'
						}
					]
				}
			]
		const describeStacksSpy = createDescribeStacks(describeStacksResponses)

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

		expect(describeStacksSpy).toHaveBeenCalledWith<
			[AWS.CloudFormation.Types.DescribeStacksInput]
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

		const describeStacksResponses: AWS.CloudFormation.Types.DescribeStacksOutput[] =
			[
				{
					Stacks: [
						{
							StackName: 'some-stack',
							CreationTime: new Date(),
							StackStatus: 'CREATE_COMPLETE'
						}
					]
				}
			]
		const describeStacksSpy = createDescribeStacks(describeStacksResponses)

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

		expect(describeStacksSpy).toHaveBeenCalledWith<
			[AWS.CloudFormation.Types.DescribeStacksInput]
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

	it('should trow error because of empty stacks result', async () => {
		const getTemplateSummaryResponses: AWS.CloudFormation.Types.GetTemplateSummaryOutput[] =
			[{}]
		const getTemplateSummarySpy = createGetTemplateSummary(
			getTemplateSummaryResponses
		)

		const describeStacksResponses: AWS.CloudFormation.Types.DescribeStacksOutput[] =
			[
				{
					Stacks: []
				}
			]
		const describeStacksSpy = createDescribeStacks(describeStacksResponses)

		await expect(
			loadEntitiesFromCloudFormation({
				arn: 'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123',
				profile: 'someProfile',
				region: 'ap-southeast-1'
			})
		).rejects.toThrowError(
			'Stack "arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123" not found.'
		)

		expect(getTemplateSummarySpy).toHaveBeenCalledWith<
			[AWS.CloudFormation.Types.GetTemplateSummaryInput]
		>({
			StackName:
				'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123'
		})

		expect(describeStacksSpy).toHaveBeenCalledWith<
			[AWS.CloudFormation.Types.DescribeStacksInput]
		>({
			StackName:
				'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123'
		})
	})
})
