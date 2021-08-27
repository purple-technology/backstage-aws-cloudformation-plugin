import AWS from 'aws-sdk'
import * as AWSMock from 'aws-sdk-mock'

const createMockCreator =
	<Input extends object, Output extends object>(method: string) =>
	(
		responses: Output[] | AWS.AWSError[],
		isError: boolean = false
	): jest.Mock => {
		const spy = jest.fn()
		let counter = 0
		AWSMock.mock(
			'CloudFormation',
			method,
			(
				params: Input,
				callback: (
					err: AWS.AWSError | undefined,
					data: Output | undefined
				) => void
			) => {
				if (counter >= responses.length) {
					throw new Error('This call was not mocked properly.')
				}
				spy(params)
				callback(
					isError ? (responses[counter] as AWS.AWSError) : undefined,
					isError ? undefined : (responses[counter] as Output)
				)
				counter++
			}
		)
		return spy
	}

export const createListStacksSpy = createMockCreator<
	AWS.CloudFormation.Types.ListStacksInput,
	AWS.CloudFormation.Types.ListStacksOutput
>('listStacks')

export const createGetTemplateSummary = createMockCreator<
	AWS.CloudFormation.Types.GetTemplateSummaryInput,
	AWS.CloudFormation.Types.GetTemplateSummaryOutput
>('getTemplateSummary')
