import { Entity } from '@backstage/catalog-model'
import { ConfigReader } from '@backstage/config'
import { CatalogProcessorResult } from '@backstage/plugin-catalog-backend'

import { CloudFormationStackProcessor } from '../CloudFormationStackProcessor'
import { loadEntitiesFromCloudFormation } from '../loadEntities'

jest.mock('../loadEntities')

const mockedLoadEntitiesFromCloudFormation =
	loadEntitiesFromCloudFormation as jest.MockedFunction<
		typeof loadEntitiesFromCloudFormation
	>

describe('CloudFormationStackProcessor - CloudFormationRegionProcessor', () => {
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
		const processor = new CloudFormationStackProcessor(config)

		mockedLoadEntitiesFromCloudFormation.mockImplementation(
			async (): Promise<Entity[]> => {
				return [
					{
						apiVersion: '123',
						kind: 'Component',
						metadata: {
							name: 'hello'
						}
					}
				]
			}
		)

		const emitSpy = jest.fn<void, [CatalogProcessorResult]>()

		expect(processor.getProcessorName()).toEqual('CloudFormationStackProcessor')

		expect(
			await processor.readLocation(
				{
					type: 'aws:cloudformation:stack',
					target:
						'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123'
				},
				false,
				emitSpy
			)
		).toBeTruthy()

		expect(mockedLoadEntitiesFromCloudFormation).toBeCalledTimes(1)
		expect(mockedLoadEntitiesFromCloudFormation).toHaveBeenCalledWith({
			arn: 'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123',
			region: 'ap-southeast-1',
			profile: 'someProfile'
		})

		expect(emitSpy).toBeCalledTimes(1)
		expect(emitSpy).toHaveBeenNthCalledWith<[CatalogProcessorResult]>(1, {
			entity: {
				apiVersion: '123',
				kind: 'Component',
				metadata: {
					name: 'hello'
				}
			},
			location: {
				target:
					'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123',
				type: 'aws:cloudformation:stack'
			},
			type: 'entity'
		})
	})

	it('should skip because of different location type', async () => {
		const config = new ConfigReader({})
		const processor = new CloudFormationStackProcessor(config)

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

		expect(mockedLoadEntitiesFromCloudFormation).toBeCalledTimes(0)
		expect(emitSpy).toBeCalledTimes(0)
	})

	it('should throw error', async () => {
		const config = new ConfigReader({})
		const processor = new CloudFormationStackProcessor(config)

		mockedLoadEntitiesFromCloudFormation.mockImplementation(async () => {
			throw new Error('some error')
		})

		const emitSpy = jest.fn<void, [CatalogProcessorResult]>()

		expect(
			await processor.readLocation(
				{
					type: 'aws:cloudformation:stack',
					target:
						'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123'
				},
				false,
				emitSpy
			)
		).toBeTruthy()

		expect(mockedLoadEntitiesFromCloudFormation).toBeCalledTimes(1)
		expect(mockedLoadEntitiesFromCloudFormation).toHaveBeenCalledWith({
			arn: 'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123',
			region: 'ap-southeast-1',
			profile: 'default'
		})

		expect(emitSpy).toBeCalledTimes(1)
		expect(emitSpy).toHaveBeenNthCalledWith<[CatalogProcessorResult]>(1, {
			error: new Error(
				'aws:cloudformation:stack arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123 could not be read, Error: some error'
			),
			location: {
				target:
					'arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123',
				type: 'aws:cloudformation:stack'
			},
			type: 'error'
		})
	})
})
