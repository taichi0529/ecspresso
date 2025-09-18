import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';

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
              'frontend/public/*',
              'frontend/public/**/*',
              'frontend/Dockerfile',
              'frontend/buildspec.yml'
            ]
          }]
        }
      }]
    });

    // VPC for ECS (No NAT Gateway - using public subnets)
    const vpc = new ec2.Vpc(this, 'EcsVpc', {
      vpcName: 'ecspresso-vpc',
      maxAzs: 2,
      natGateways: 0, // No NAT Gateway
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24
        }
      ]
    });

    // VPC Endpoint for S3 (for public subnets)
    vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'EcsCluster', {
      clusterName: 'ecspresso-cluster',
      vpc: vpc,
    });

    // CloudWatch Log Group for container logs
    const logGroup = new logs.LogGroup(this, 'FrontendLogGroup', {
      logGroupName: '/ecs/ecspresso-frontend',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Task Definition for Fargate
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'FrontendTaskDef', {
      family: 'ecspresso-frontend',
      memoryLimitMiB: 512,
      cpu: 256
    });

    // Add container to task definition
    taskDefinition.addContainer('frontend-container', {
      containerName: 'frontend',
      image: ecs.ContainerImage.fromEcrRepository(frontendRepository, 'latest'),
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'frontend',
        logGroup: logGroup
      }),
      environment: {
        'NODE_ENV': 'production'
      },
      portMappings: [{
        containerPort: 80,
        protocol: ecs.Protocol.TCP
      }]
    });

    // ALB for Fargate Service
    const alb = new elbv2.ApplicationLoadBalancer(this, 'FrontendALB', {
      loadBalancerName: 'ecspresso-frontend-alb',
      vpc: vpc,
      internetFacing: true,
      securityGroup: new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
        vpc: vpc,
        allowAllOutbound: true
      })
    });

    // ALB Security Group - Allow HTTP from anywhere
    alb.connections.allowFromAnyIpv4(ec2.Port.tcp(80));

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'FrontendTargetGroup', {
      targetGroupName: 'ecspresso-frontend-tg',
      vpc: vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/',
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3
      }
    });

    // ALB Listener
    alb.addListener('FrontendListener', {
      port: 80,
      defaultTargetGroups: [targetGroup]
    });

    // Fargate Service (in public subnet with public IP)
    const service = new ecs.FargateService(this, 'FrontendService', {
      serviceName: 'ecspresso-frontend-service',
      cluster: cluster,
      taskDefinition: taskDefinition,
      desiredCount: 1,
      assignPublicIp: true, // Assign public IP for internet access
      securityGroups: [
        new ec2.SecurityGroup(this, 'ServiceSecurityGroup', {
          vpc: vpc,
          allowAllOutbound: true
        })
      ],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC // Use public subnet
      },
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      deploymentController: {
        type: ecs.DeploymentControllerType.ECS
      }
    });

    // Allow service to connect from ALB
    service.connections.allowFrom(alb, ec2.Port.tcp(80));

    // Attach service to target group
    service.attachToApplicationTargetGroup(targetGroup);

    // Auto Scaling
    const scaling = service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 4
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60)
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

    // Output ALB DNS
    new cdk.CfnOutput(this, 'ALBDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'ALB DNS Name'
    });

    // Output Service Name
    new cdk.CfnOutput(this, 'ServiceName', {
      value: service.serviceName,
      description: 'ECS Service Name'
    });
  }
}
