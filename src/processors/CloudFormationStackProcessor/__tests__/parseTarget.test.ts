import { parseTarget } from '../parseTarget'

describe('CloudFormationStackProcessor - parseTarget', () => {
	afterEach(() => {
		jest.restoreAllMocks()
	})

	it('should match with profile', () => {
		expect(
			parseTarget(
				'someAwsProfile@arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123'
			)
		).toEqual<ReturnType<typeof parseTarget>>({
			arn: 'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123',
			profile: 'someAwsProfile',
			region: 'ap-southeast-1'
		})
	})

	it('should match without profile', () => {
		expect(
			parseTarget(
				'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123'
			)
		).toEqual<ReturnType<typeof parseTarget>>({
			arn: 'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123',
			profile: undefined,
			region: 'ap-southeast-1'
		})
	})

	it('should not match', () => {
		expect(parseTarget('#*$(')).toEqual({
			arn: undefined,
			profile: undefined,
			region: undefined
		})
	})
})
