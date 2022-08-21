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

    const sourceOutput = new Artifact('SourceOutput');

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new GitHubSourceAction({
          actionName: 'Pipeline_Source',
          owner: 'laazyj',
          repo: 'learning-aws-pipeline',
          branch: 'master',
          oauthToken: SecretValue.secretsManager('github-token'),
          output: sourceOutput,
        })
      ],
    });

    const cdkBuildOutput = new Artifact('CdkBuildOutput');

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
          input: sourceOutput,
          outputs: [cdkBuildOutput],
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
