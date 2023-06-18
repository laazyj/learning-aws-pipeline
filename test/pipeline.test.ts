import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as Pipeline from '../lib/pipeline-stack';

describe("PipelineStack", () => {
  test("to match snapshot", () => {
    const app = new cdk.App();
      // WHEN
    const stack = new Pipeline.PipelineStack(app, 'MyTestStack');
      // THEN
    const template = Template.fromStack(stack);
    console.info(template);
    expect(template).toMatchSnapshot();
  });
}); 
