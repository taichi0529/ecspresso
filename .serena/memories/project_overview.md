# ECSpresso CDK Project Overview

## Purpose
This is an AWS CDK (Cloud Development Kit) TypeScript project for infrastructure as code (IaC) deployment. The project appears to be named "ecspresso" which likely relates to Amazon ECS (Elastic Container Service) infrastructure management.

## Tech Stack
- **AWS CDK**: v2.214.0 - Infrastructure as Code framework
- **TypeScript**: v5.6.3 - Primary programming language
- **Node.js**: Platform for running the CDK app
- **Jest**: v29.7.0 - Testing framework with ts-jest for TypeScript support
- **Constructs**: v10.0.0 - CDK construct library

## Project Structure
```
cdk/
├── bin/
│   └── cdk.ts          # CDK app entry point
├── lib/
│   └── cdk-stack.ts    # Main CDK stack definition
├── test/
│   └── cdk.test.ts     # Test files
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── jest.config.js      # Jest test configuration
└── cdk.json           # CDK app configuration
```

## Key Components
- **CdkStack class**: Main infrastructure stack defined in `lib/cdk-stack.ts`
- **CDK App**: Entry point in `bin/cdk.ts`
- **Test Suite**: Located in `test/` directory using Jest framework