import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ECR Repository for frontend images
    const frontendRepository = new ecr.Repository(this, 'FrontendRepository', {
      repositoryName: 'ecspresso-frontend',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [{
        maxImageCount: 10,
        description: 'Keep only 10 images'
      }]
    });

    // CodeBuild project for building Docker image
    const buildProject = new codebuild.PipelineProject(this, 'FrontendBuildProject', {
      projectName: 'ecspresso-frontend-build',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true, // Required for Docker builds
        computeType: codebuild.ComputeType.SMALL
      },
      environmentVariables: {
        'AWS_ACCOUNT_ID': {
          value: this.account
        },
        'AWS_DEFAULT_REGION': {
          value: this.region
        },
        'ECR_REPOSITORY_URI': {
          value: frontendRepository.repositoryUri
        }
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('frontend/buildspec.yml')
    });

    // Grant CodeBuild permissions to push to ECR
    frontendRepository.grantPullPush(buildProject.grantPrincipal);

    // Artifact stores
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Source action
    const sourceAction = new codepipeline_actions.CodeStarConnectionsSourceAction({
      actionName: 'GitHub_Source',
      owner: 'taichi0529',
      repo: 'ecspresso',
      branch: 'main',
      output: sourceOutput,
      connectionArn: 'arn:aws:codeconnections:ap-northeast-1:773310969811:connection/47848b79-2080-4c6d-a601-55277dcc25f2',
      triggerOnPush: true
    });

    // Build action
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build_Docker_Image',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput]
    });

    // CodePipeline V2 with file path filtering
    // Note: File path filtering requires branches to be specified together
    const pipeline = new codepipeline.Pipeline(this, 'FrontendPipeline', {
      pipelineName: 'ecspresso-frontend-pipeline',
      pipelineType: codepipeline.PipelineType.V2,
      restartExecutionOnUpdate: true,
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction]
        },
        {
          stageName: 'Build',
          actions: [buildAction]
        }
      ],
      triggers: [{
        providerType: codepipeline.ProviderType.CODE_STAR_SOURCE_CONNECTION,
        gitConfiguration: {
          sourceAction,
          pushFilter: [{
            branchesIncludes: ['main'],
            filePathsIncludes: [
              'frontend/public/**/*',
              'frontend/Dockerfile',
              'frontend/buildspec.yml'
            ]
          }]
        }
      }]
    });

    // Output ECR repository URI
    new cdk.CfnOutput(this, 'ECRRepositoryURI', {
      value: frontendRepository.repositoryUri,
      description: 'ECR Repository URI for frontend images'
    });

    // Output Pipeline ARN
    new cdk.CfnOutput(this, 'PipelineArn', {
      value: pipeline.pipelineArn,
      description: 'Pipeline ARN'
    });
  }
}
