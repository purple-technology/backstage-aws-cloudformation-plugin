import { CloudFormationRegionTarget } from './types'

export const parseTarget = (
	target: string
): Partial<CloudFormationRegionTarget> => {
	const parsedTarget = target.match(/^((.+)@)?([a-z0-9-]*)$/) ?? []
	const profile = parsedTarget[2]
	const region = parsedTarget[3]
	return { profile, region }
}
