import { HttpApi } from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { Stack, StackProps } from "aws-cdk-lib";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export class SerrviceStack extends Stack {
    public readonly serviceCode: Code

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.serviceCode = Code.fromCfnParameters();

        const lambda = new Function(this, 'ServiceLambda', {
            runtime: Runtime.NODEJS_16_X,
            handler: 'src/lambda.handler',
            code: this.serviceCode,
            functionName: 'ServiceLambda',
        })

        new HttpApi(this, 'ServiceAPI', {
            defaultIntegration: new HttpLambdaIntegration('ApigwLambdaIntegration', lambda),
            apiName: 'UdemyTestService',
        });
    }
}