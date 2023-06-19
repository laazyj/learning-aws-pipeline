import * as cdk from 'aws-cdk-lib';
import { SecretValue } from 'aws-cdk-lib';
import { BuildSpec, LinuxBuildImage, PipelineProject } from 'aws-cdk-lib/aws-codebuild';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { CloudFormationCreateUpdateStackAction, CodeBuildAction, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new Pipeline(this, 'Pipeline', {
      pipelineName: 'Pipeline',
      crossAccountKeys: false,
    });

    const cdkSource = new Artifact('CdkSourceOutput');
    const serviceSource = new Artifact('ServiceSourceOuput');

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new GitHubSourceAction({
          actionName: 'Pipeline_Source',
          owner: 'laazyj',
          repo: 'learning-aws-pipeline',
          branch: 'master',
          oauthToken: SecretValue.secretsManager('github-token'),
          output: cdkSource,
        }),
        new GitHubSourceAction({
          actionName: 'Service_Source',
          owner: 'laazyj',
          repo: 'express-lambda',
          branch: 'master',
          oauthToken: SecretValue.secretsManager('github-token'),
          output: serviceSource,
        })
      ],
    });

    const cdkBuildOutput = new Artifact('CdkBuildOutput');
    const serviceBuildOutput = new Artifact('ServiceBuildOutput');

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new CodeBuildAction({
          actionName: 'CdkBuild',
          project: new PipelineProject(this, 'CdkBuildProject', {
            environment: {
              buildImage: LinuxBuildImage.STANDARD_6_0
            },
            buildSpec: BuildSpec.fromSourceFilename('build-specs/cdk-build-spec.yml'),
          }),
          input: cdkSource,
          outputs: [cdkBuildOutput],
        }),
        new CodeBuildAction({
          actionName: 'ServiceBuild',
          input: serviceSource,
          outputs: [serviceBuildOutput],
          project: new PipelineProject(this, 'ServiceBuildProject', {
            environment: {
              buildImage: LinuxBuildImage.STANDARD_6_0
            },
            buildSpec: BuildSpec.fromSourceFilename('build-spec/service-build-spec.yml'),
          }),
        })
      ]
    });

    pipeline.addStage({
      stageName: "Pipeline_Update",
      actions: [
        new CloudFormationCreateUpdateStackAction({
          actionName: "Pipeline_Update",
          stackName: "PipelineStack",
          templatePath: cdkBuildOutput.atPath('PipelineStack.template.json'),
          adminPermissions: true,
        }),
      ]
    });
  }
}
