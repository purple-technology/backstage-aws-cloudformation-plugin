import { parseTarget } from '../parseTarget'

describe('CloudFormationRegionProcessor - parseTarget', () => {
	afterEach(() => {
		jest.restoreAllMocks()
	})

	it('should match with profile', () => {
		expect(parseTarget('someAwsProfile@ap-southeast-1')).toEqual<
			ReturnType<typeof parseTarget>
		>({
			profile: 'someAwsProfile',
			region: 'ap-southeast-1'
		})
	})

	it('should match without profile', () => {
		expect(parseTarget('ap-southeast-1')).toEqual<
			ReturnType<typeof parseTarget>
		>({
			profile: undefined,
			region: 'ap-southeast-1'
		})
	})

	it('should not match', () => {
		expect(parseTarget('#*$(')).toEqual({
			profile: undefined,
			region: undefined
		})
	})
})
