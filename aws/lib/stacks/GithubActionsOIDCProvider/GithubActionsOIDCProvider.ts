import * as cdk from 'aws-cdk-lib'
import {Construct} from 'constructs'
import {aws_iam as iam} from 'aws-cdk-lib'

export interface GithubActionsAwsAuthCdkStackProps extends cdk.StackProps {
    readonly repositoryConfig: { owner: string; repo: string; filter?: string }[]
}

export class GithubActionsOIDCProvider extends cdk.Stack {
    constructor(scope: Construct, id: string, props: GithubActionsAwsAuthCdkStackProps) {
        super(scope, id, props)

        const githubDomain = 'https://token.actions.githubusercontent.com'

        const githubProvider = new iam.OpenIdConnectProvider(this, 'GithubActionsProvider', {
            url: githubDomain,
            clientIds: ['sts.amazonaws.com'],
        })

        props.repositoryConfig.map(r => {
            const repoARN = `repo:${r.owner}/${r.repo}:${r.filter ?? '*'}`;

            const context = new Construct(this, `GithubActionsContext${r.owner}${r.repo}`);

            const conditions: iam.Conditions = {
                StringEquals: {
                    'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
                },
                StringLike: {
                    "token.actions.githubusercontent.com:sub": repoARN
                }
            }

            const role = new iam.Role(context, 'Role', {
                assumedBy: new iam.WebIdentityPrincipal(githubProvider.openIdConnectProviderArn, conditions),
                managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess')],
                roleName: `GitHubRoleFor-${r.owner}-${r.repo}`,
                description: 'This role is used via GitHub Actions to deploy with AWS CDK or Terraform on the target AWS account',
                maxSessionDuration: cdk.Duration.hours(12),
            })

            new cdk.CfnOutput(context, 'GithubActionOidcIamRoleArn', {
                value: role.roleArn,
                description: `Arn for AWS IAM role with Github oidc auth for ${repoARN}`,
                exportName: 'GithubActionOidcIamRoleArn',
            })
        })


        cdk.Tags.of(this).add('component', 'CdkGithubActionsOidcIamRole')
    }
}
