import { CloudFormationTarget } from './types'

export const parseTarget = (target: string): CloudFormationTarget => {
	const parsedTarget =
		target.match(
			/^((.+)@)?(arn:aws:cloudformation:([a-z1-9-]*):[0-9]{12}:stack\/.+)$/
		) ?? []
	const profile = parsedTarget[2]
	const arn = parsedTarget[3]
	const region = parsedTarget[4]
	return { profile, arn, region }
}
