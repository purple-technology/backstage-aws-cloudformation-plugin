import { Config } from '@backstage/config'
import { LocationSpec } from '@backstage/plugin-catalog-backend'
import {
	CatalogProcessor,
	CatalogProcessorEmit,
	processingResult
} from '@backstage/plugin-catalog-backend'

import { CloudFormationProcessor } from '../CloudFormationProcessor'
import { loadEntitiesFromCloudFormation } from './loadEntities'
import { parseTarget } from './parseTarget'

export const LOCATION_TYPE = 'aws:cloudformation:stack'

export class CloudFormationStackProcessor
	extends CloudFormationProcessor
	implements CatalogProcessor
{
	constructor(config: Config) {
		super(config)
	}

	getProcessorName(): string {
		return 'CloudFormationStackProcessor'
	}

	async readLocation(
		location: LocationSpec,
		_optional: boolean,
		emit: CatalogProcessorEmit
	): Promise<boolean> {
		if (location.type !== LOCATION_TYPE) {
			return false
		}

		try {
			const {
				arn,
				region,
				profile = this.profile
			} = parseTarget(location.target)

			const entities = await loadEntitiesFromCloudFormation({
				arn,
				region,
				profile
			})
			entities.forEach((entity) =>
				emit(processingResult.entity(location, entity))
			)
		} catch (e) {
			const message = `${location.type} ${location.target} could not be read, ${e}`
			emit(processingResult.generalError(location, message))
		}

		return true
	}
}
