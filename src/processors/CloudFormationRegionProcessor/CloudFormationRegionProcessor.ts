import { Config } from '@backstage/config'
import { LocationSpec } from '@backstage/plugin-catalog-backend'
import {
	CatalogProcessor,
	CatalogProcessorEmit,
	results
} from '@backstage/plugin-catalog-backend'

import { CloudFormationProcessor } from '../CloudFormationProcessor'
import { LOCATION_TYPE as STACK_LOCATION_TYPE } from '../CloudFormationStackProcessor/CloudFormationStackProcessor'
import { loadLocationsFromCloudFormation } from './loadLocations'
import { parseTarget } from './parseTarget'

export const LOCATION_TYPE = 'aws:cloudformation:region'

export class CloudFormationRegionProcessor
	extends CloudFormationProcessor
	implements CatalogProcessor
{
	constructor(config: Config) {
		super(config)
	}

	getProcessorName(): string {
		return 'CloudFormationRegionProcessor'
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
			const { region, profile = this.profile } = parseTarget(location.target)

			if (typeof region === 'undefined') {
				throw new Error(
					'Location target format is incorrect. Region was not matched. Correct target format is "profile@region"'
				)
			}

			for await (const stackId of loadLocationsFromCloudFormation({
				region,
				profile
			})) {
				emit(
					results.location(
						{
							target: `${profile}@${stackId}`,
							type: STACK_LOCATION_TYPE
						},
						false
					)
				)
			}
		} catch (e) {
			const message = `${location.type} ${location.target} could not be read, ${e}`
			emit(results.generalError(location, message))
		}

		return true
	}
}
