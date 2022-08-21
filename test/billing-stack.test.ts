import { App } from "aws-cdk-lib"
import { Template } from "aws-cdk-lib/assertions";
import { BillingStack } from "../lib/billing-stack";

test('Billing Stack', () => {
    const app = new App();
    const stack = new BillingStack(app, 'BillingStack', {
        budgetAmount: 2,
        emailAddress: "test@email.address",
    });

    const template = Template.fromStack(stack);
    expect(template).toMatchSnapshot();
});