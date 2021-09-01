import { Entity } from '@backstage/catalog-model'
import { CloudFormation, SharedIniFileCredentials } from 'aws-sdk'
import { findAndReplaceIf } from 'find-and-replace-anything'

import { awsFetch } from '../../utils/awsFetch'
import { CloudFormationTarget } from './types'

/*
	Regexp will match for example:
		${Region}
		${Outputs.SomeStackOutput}
	
	But it can be escaped:
		\${Region} won't result in a match
*/
const replaceVariables = (
	value: string,
	{
		target,
		outputs,
		stackName
	}: {
		target: CloudFormationTarget
		outputs: Record<string, string>
		stackName: string
	}
): string =>
	Array.from(value.matchAll(/(?<!\\)\${((.(?!\$))*)}/g)).reduce(
		(val, match) => {
			const variableExpression = match[0]
			const variableName = match[1]

			if (variableName.startsWith('Outputs.')) {
				const outputName = variableName.replace('Outputs.', '')
				if (outputName in outputs) {
					return val.replace(variableExpression, outputs[outputName])
				}
			} else if (variableName === 'Region') {
				return val.replace(variableExpression, target.region)
			} else if (variableName === 'StackId') {
				return val.replace(variableExpression, target.arn)
			} else if (variableName === 'StackName') {
				return val.replace(variableExpression, stackName)
			}
			return val
		},
		value
	)

export const loadEntitiesFromCloudFormation = async (
	target: CloudFormationTarget
): Promise<Entity[]> => {
	const cloudFormation = new CloudFormation({
		credentials: new SharedIniFileCredentials({
			profile: target.profile
		}),
		region: target.region
	})

	// Load template - Metadata
	const template = await awsFetch(async () =>
		cloudFormation.getTemplateSummary({ StackName: target.arn }).promise()
	)
	const metadata = JSON.parse(template.Metadata ?? '{}')
	const rawEntities: Entity[] = metadata?.Backstage?.Entities ?? []

	// Load stack info - Outputs
	const stacks = (
		await awsFetch(async () =>
			cloudFormation.describeStacks({ StackName: target.arn }).promise()
		)
	).Stacks

	if (typeof stacks === 'undefined' || stacks.length === 0) {
		throw new Error(`Stack "${target.arn}" not found.`)
	}

	const outputs = (stacks[0].Outputs ?? []).reduce<Record<string, string>>(
		(acc, { OutputKey, OutputValue }) => {
			if (
				typeof OutputKey !== 'undefined' &&
				typeof OutputValue !== 'undefined'
			) {
				acc[OutputKey] = OutputValue
			}
			return acc
		},
		{}
	)

	const processedEntities = findAndReplaceIf(
		rawEntities,
		(value) => {
			if (typeof value !== 'string') {
				return value
			}

			return replaceVariables(value, {
				target,
				outputs,
				stackName: stacks[0].StackName
			})
		},
		{ checkArrayValues: true }
	)

	return processedEntities
}
