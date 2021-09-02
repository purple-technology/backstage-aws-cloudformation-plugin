# 🧋 Backstage AWS CloudFormation Plugin 🧋

[![CircleCI](https://circleci.com/gh/purple-technology/backstage-aws-cloudformation-plugin/tree/master.svg?style=svg)](https://circleci.com/gh/purple-technology/backstage-aws-cloudformation-plugin/tree/master)
[![codecov](https://codecov.io/gh/purple-technology/backstage-aws-cloudformation-plugin/branch/master/graph/badge.svg?token=KKK1OH1MPI)](https://codecov.io/gh/purple-technology/backstage-aws-cloudformation-plugin)

Backstage plugin which pulls entities from AWS CloudFormation stacks metadata.

## Features

- Pull arbitrary number of Backstage entities from CloudFormation stack's Metadata
- Scan whole CloudFormation region
- Use multiple AWS profiles/accounts
- Use variables inside the entities - reference CloudFormation Stack Outputs or Region

## Setup

1. **Setup AWS profile credentials on your machine**

```ini
# ~/.aws/credentials
[myProfile]
aws_access_key_id=AKIAIOSFODNN7EXAMPLE
aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

Learn more in AWS documentation [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html).

2. **Add Backstage notation to your CloudFormation template's Metadata section**

*Make sure to put the notation to correct path: `Metadata.Backstage.Entities`.*

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

3. **If you have a standalone app (you didn't clone this repo), then do**

```bash
# From your Backstage root directory
$ cd packages/backend
$ yarn add backstage-aws-cloudformation-plugin
```

4. **Add the `CloudFormationRegionProcessor` and `CloudFormationStackProcessor` processors your catalog builder**

```diff
// In packages/backend/src/plugins/catalog.ts
+import {
+	CloudFormationRegionProcessor,
+	CloudFormationStackProcessor,
+} from 'backstage-aws-cloudformation-plugin';

export default async function createPlugin(
	env: PluginEnvironment,
): Promise<Router> {
	const builder = await CatalogBuilder.create(env);

+	builder.addProcessor(new CloudFormationStackProcessor(env.config));
+	builder.addProcessor(new CloudFormationRegionProcessor(env.config));

	const {
		entitiesCatalog,
		locationsCatalog,
		locationService,
		processingEngine,
		locationAnalyzer,
	} = await builder.build();
```

5. **Optionaly add default profile configuration**

```yaml
# In app-config.yaml
integrations:
  aws:
    profile: purple-technology
```

6. **Add Locations**

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
[profileName@]stack_arn
```

### `aws:cloudformation:region`

Accepts as a `target` ID of the AWS region and optionally also name of the profile separated by `@`.

```
[profileName@]region-name-1
```

## Variables

Since it's not possible to use [intrinsic functions](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference.html) (`Ref`, `Fn::GetAtt`, etc.) inside `Metadata`, we've solved it via custom variables syntax.

When the entities are loaded from the `Metadata`, any variables inside are processed and replaced with appropriate values - if found.

### Escaping
You can escape the variable expression via `\`.

For example this variable won't get replaced:
```
\${Outputs.SomeVariable}
```

### Overview

| Type      | Example Input                                    | Example Output                                  | Description                           |
|-----------|--------------------------------------------------|-------------------------------------------------|---------------------------------------|
| Region    | `description: "Service in ${Region} region"`     | `description: "Service in eu-central-1 region"` | Provides region of the stack.         |
| AccountId | `title: AWS Account ID is ${AccountId}`          | `title: AWS Account ID is 123456789000`         | Provides ID of the AWS account.       |
| StackId   | `title: Stack ARN is ${StackId}`                 | `title: Stack ARN is arn:aws:cloudformation:ap-southeast-1:123456789000:stack/some-stack/123-345-12-1235-123123` | Provides stack ID (ARN). |
| StackName | `title: Stack Name is ${StackName}`              | `title: Stack Name is some-stack`               | Provides stack name.                  |
| Outputs   | `name: "lambda-${Outputs.GetClientsLambdaName}"` | `name: "lambda-get-clients-prod"`               | Provides [`Output`](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/outputs-section-structure.html) value from the stack. |

## Limitations

- The plugin has built-in mechanism for dealing with throttling, but in case of indexing a whole region be careful with the number of stacks in the region 
