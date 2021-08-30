import { Config } from '@backstage/config'

export abstract class CloudFormationProcessor {
	protected profile = 'default'

	constructor(config: Config) {
		this.profile =
			config.getOptionalString('integrations.aws.profile') ?? this.profile
	}
}
