# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AWS CDK (Cloud Development Kit) TypeScript project for infrastructure as code deployment. The project uses CDK v2 to define and deploy AWS infrastructure.

## Essential Commands

All commands should be run from the `cdk/` directory:

```bash
cd cdk

# Development
yarn install          # Install dependencies (use yarn, not npm)
yarn build           # Compile TypeScript to JavaScript
yarn watch           # Watch mode for auto-compilation

# Testing
yarn test            # Run Jest unit tests

# CDK Operations
npx cdk synth        # Synthesize CloudFormation template (validate code)
npx cdk diff         # Compare deployed stack with local changes
npx cdk deploy       # Deploy stack to AWS
npx cdk destroy      # Remove all deployed resources
```

## Code Architecture

```
cdk/
├── bin/cdk.ts           # Entry point - initializes CDK app
├── lib/cdk-stack.ts     # Stack definitions - infrastructure resources
└── test/cdk.test.ts     # Unit tests for stack validation
```

### Key Patterns

1. **Stack Definition**: All infrastructure is defined in classes extending `cdk.Stack` in the `lib/` directory
2. **Entry Point**: The CDK app is bootstrapped in `bin/cdk.ts` which instantiates the stack(s)
3. **Constructor Pattern**: Stacks use constructor injection: `constructor(scope: Construct, id: string, props?: cdk.StackProps)`

## Development Workflow

1. Make infrastructure changes in `lib/cdk-stack.ts`
2. Run `yarn build` to compile TypeScript
3. Run `npx cdk synth` to validate changes
4. Run `yarn test` to ensure tests pass
5. Run `npx cdk diff` to review changes before deployment

## TypeScript Configuration

The project enforces strict TypeScript settings:
- Strict type checking enabled
- No implicit any types
- ES2022 target with NodeNext modules
- Source maps enabled for debugging