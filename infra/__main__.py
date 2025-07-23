"""An AWS Python Pulumi program"""
import json
from xml.sax import default_parser_list

import pulumi
import pulumi_aws as aws

# IAM Role for lambda
lambda_role = aws.iam.Role(
    "lambdaRole",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    })
)

# Attach basic Lambda execution policy
aws.iam.RolePolicyAttachment(
    "lambdaBasicExecution",
    role=lambda_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
)

# Deploy from the build/ folder directly - no zip!
goldmine_lambda = aws.lambda_.Function(
    "goldmineLambda",
    role=lambda_role.arn,
    runtime="python3.12",
    handler="handler.handler",
    code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("../lambda/build")
    }),
    timeout=30
)

# Set up API Gateway
api = aws.apigateway.RestApi(
    "goldmineApi",
)

resource = aws.apigateway.Resource(
    "goldmineRoot",
    rest_api=api.id,
    parent_id=api.root_resource_id,
    path_part="gold"
)

method = aws.apigateway.Method(
    "goldmineMethod",
    rest_api=api.id,
    resource_id=resource.id,
    http_method="POST",
    authorization="NONE"
)

integration = aws.apigateway.Integration(
    "goldmineIntegration",
    rest_api=api.id,
    resource_id=resource.id,
    http_method=method.http_method,
    integration_http_method="POST",
    type="AWS_PROXY",
    uri=goldmine_lambda.invoke_arn
)

deployment = aws.apigateway.Deployment(
    "goldmineDeploy",
    rest_api=api.id,
    triggers={"redeploy": goldmine_lambda.urn},
    opts=pulumi.ResourceOptions(depends_on=[integration])
)

stage = aws.apigateway.Stage(
    "goldmineStage",
    rest_api=api.id,
    deployment=deployment.id,
    stage_name="dev"
)

# Grant permission for API Gateway to invoke Lambda
permission = aws.lambda_.Permission(
    "apiPermission",
    action="lambda:InvokeFunction",
    function=goldmine_lambda.name,
    principal="apigateway.amazonaws.com",
    source_arn=stage.execution_arn.apply(
        lambda arn: f"{arn}*"
    )
)

# Output the API Endpoint URL
pulumi.export(
    "endpoint",
    pulumi.Output.concat(
        "https://",
        api.id,
        ".execute-api.",
        aws.config.region,
        ".amazonaws.com/",
        stage.stage_name,
        "/gold"
    )
)
