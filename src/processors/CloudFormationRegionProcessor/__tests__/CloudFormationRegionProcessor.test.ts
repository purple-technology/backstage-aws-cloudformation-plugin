import { ConfigReader } from '@backstage/config'
import { CatalogProcessorResult } from '@backstage/plugin-catalog-backend'

import { CloudFormationRegionProcessor } from '../CloudFormationRegionProcessor'
import { loadLocationsFromCloudFormation } from '../loadLocations'

jest.mock('../loadLocations')

const mockedLoadLocationsFromCloudFormation =
	loadLocationsFromCloudFormation as jest.MockedFunction<
		typeof loadLocationsFromCloudFormation
	>

describe('CloudFormationRegionProcessor - CloudFormationRegionProcessor', () => {
	afterEach(() => {
		jest.resetAllMocks()
	})

	afterAll(() => {
		jest.restoreAllMocks()
	})

	it('should pass properly', async () => {
		const config = new ConfigReader({
			integrations: {
				aws: {
					profile: 'someProfile'
				}
			}
		})
		const processor = new CloudFormationRegionProcessor(config)

		mockedLoadLocationsFromCloudFormation.mockImplementation(async function* ({
			profile
		}) {
			yield `${profile}@some-stack-id-1`
			yield `${profile}@some-stack-id-2`
			yield `${profile}@some-stack-id-3`
		})

		const emitSpy = jest.fn<void, [CatalogProcessorResult]>()

		expect(processor.getProcessorName()).toEqual(
			'CloudFormationRegionProcessor'
		)

		expect(
			await processor.readLocation(
				{
					type: 'aws:cloudformation:region',
					target: 'otherProfile@eu-central-1'
				},
				false,
				emitSpy
			)
		).toBeTruthy()

		expect(mockedLoadLocationsFromCloudFormation).toBeCalledTimes(1)
		expect(mockedLoadLocationsFromCloudFormation).toHaveBeenCalledWith({
			region: 'eu-central-1',
			profile: 'otherProfile'
		})

		expect(emitSpy).toBeCalledTimes(3)
		expect(emitSpy).toHaveBeenNthCalledWith<[CatalogProcessorResult]>(1, {
			location: {
				target: 'otherProfile@otherProfile@some-stack-id-1',
				type: 'aws:cloudformation:stack'
			},
			type: 'location'
		})
		expect(emitSpy).toHaveBeenNthCalledWith<[CatalogProcessorResult]>(2, {
			location: {
				target: 'otherProfile@otherProfile@some-stack-id-2',
				type: 'aws:cloudformation:stack'
			},
			type: 'location'
		})
		expect(emitSpy).toHaveBeenNthCalledWith<[CatalogProcessorResult]>(3, {
			location: {
				target: 'otherProfile@otherProfile@some-stack-id-3',
				type: 'aws:cloudformation:stack'
			},
			type: 'location'
		})
	})

	it('should skip because of different location type', async () => {
		const config = new ConfigReader({})
		const processor = new CloudFormationRegionProcessor(config)

		const emitSpy = jest.fn<void, [CatalogProcessorResult]>()

		expect(
			await processor.readLocation(
				{
					type: 'url',
					target: 'http://google.com'
				},
				false,
				emitSpy
			)
		).toBeFalsy()

		expect(mockedLoadLocationsFromCloudFormation).toBeCalledTimes(0)
		expect(emitSpy).toBeCalledTimes(0)
	})

	it('should throw error because of incorrect target format', async () => {
		const config = new ConfigReader({})
		const processor = new CloudFormationRegionProcessor(config)

		const emitSpy = jest.fn<void, [CatalogProcessorResult]>()

		expect(
			await processor.readLocation(
				{
					type: 'aws:cloudformation:region',
					target: '+ěšřč'
				},
				false,
				emitSpy
			)
		).toBeTruthy()

		expect(mockedLoadLocationsFromCloudFormation).toBeCalledTimes(0)
		expect(emitSpy).toBeCalledTimes(1)
		expect(emitSpy).toHaveBeenCalledWith({
			type: 'error',
			location: { type: 'aws:cloudformation:region', target: '+ěšřč' },
			error: new Error(
				'aws:cloudformation:region +ěšřč could not be read, Error: Location target format is incorrect. Region was not matched. Correct target format is "profile@region"'
			)
		})
	})
})
