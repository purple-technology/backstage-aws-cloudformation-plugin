# 🧋 Backstage AWS CloudFormation Plugin 🧋

[![CircleCI](https://circleci.com/gh/purple-technology/backstage-aws-cloudformation-plugin/tree/master.svg?style=svg)](https://circleci.com/gh/purple-technology/backstage-aws-cloudformation-plugin/tree/master)

Backstage plugin which pulls entities from AWS CloudFormation stacks metadata.

## Setup

1. Setup AWS profile credentials on your machine

```ini
# ~/.aws/credentials
[myProfile]
aws_access_key_id=AKIAIOSFODNN7EXAMPLE
aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

Learn more in AWS documentation [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html).

2. Add Backstage notation to your CloudFormation template's Metadata section

*Make sure to put the notation to correct path: `Metadata.Backstage.Entities`.*
<details>
<summary>Click to show content of the template example</summary>

```yaml
AWSTemplateFormatVersion: 2010-09-09
Resources:
  MyLambdaFunction:
    Type: 'AWS::Lambda::Function'
    Properties:
      FunctionName: my-lambda
Metadata:
  Backstage:
    Entities:
      - apiVersion: backstage.io/v1alpha1
        kind: Component
        metadata:
          name: petstore
          namespace: external-systems
          description: Petstore
        spec:
          type: service
          lifecycle: experimental
          owner: 'group:pet-managers'
          providesApis:
            - petstore
            - internal/streetlights
            - hello-world
      - apiVersion: backstage.io/v1alpha1
        kind: API
        metadata:
          name: petstore
          description: The Petstore API
        spec:
          type: openapi
          lifecycle: production
          owner: petstore@example.com
          definition:
            $text: 'https://petstore.swagger.io/v2/swagger.json'
```
</details>


3. If you have a standalone app (you didn't clone this repo), then do

```bash
# From your Backstage root directory
cd packages/backend
yarn add backstage-aws-cloudformation-plugin
```

3. Add the `CloudFormationRegionProcessor` and `CloudFormationStackProcessor` processors your catalog builder:

```ts
// In packages/backend/src/plugins/catalog.ts
import {
	CloudFormationRegionProcessor,
	CloudFormationStackProcessor,
} from 'backstage-aws-cloudformation-plugin';

export default async function createPlugin(
	env: PluginEnvironment,
): Promise<Router> {
	const builder = await CatalogBuilder.create(env);

    // Here add the catalog processors
	builder.addProcessor(new CloudFormationStackProcessor(env.config));
	builder.addProcessor(new CloudFormationRegionProcessor(env.config));

	const {
		entitiesCatalog,
		locationsCatalog,
		locationService,
		processingEngine,
		locationAnalyzer,
	} = await builder.build();
```

4. Optionaly add default profile configuration 

```yaml
# In app-config.yaml
integrations:
  aws:
    profile: purple-technology
```

5. Add Locations

```yaml
# In app-config.yaml
catalog:
  locations:
    # Pull single stack from the profile "myProfile"
    - type: aws:cloudformation:stack
      target: myProfile@arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123
    # Pull single stack from the default profile
    - type: aws:cloudformation:stack
      target: arn:aws:cloudformation:eu-central-1:123456789000:stack/other-stack/532-123-59-593-19481
    # Pull whole region from the "myProfile" profile
    - type: aws:cloudformation:region
      target: myProfile@ap-southeast-1
    # Pull whole region from the default profile
    - type: aws:cloudformation:region
      target: eu-central-1
```

## Location types

### `aws:cloudformation:stack`

Accepts as a `target` ARN of the CloudFormation stack and optionally also name of the profile separated by `@`.

```
[profileName@]STACK_ARN
```

### `aws:cloudformation:region`

Accepts as a `target` ID of the AWS region and optionally also name of the profile separated by `@`.

```
[profileName@]region-name-1
```

## Features

- Pull arbitrary number of Backstage entities from CloudFormation stack's Metadata
- Scan whole CloudFormation region
- Use multiple AWS profiles/accounts

## Limitations

- The plugin has built-in mechanism for dealing with throttling, but in case of indexing a whole region be careful with the number of stacks in the region 
