# Development Commands for ECSpresso CDK

## Build and Development
```bash
# Navigate to CDK directory (all commands should be run from here)
cd cdk

# Install dependencies (use yarn as lockfile is yarn.lock)
yarn install

# Build TypeScript to JavaScript
yarn build

# Watch mode for automatic recompilation
yarn watch
```

## Testing
```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch
```

## CDK Operations
```bash
# Synthesize CloudFormation template (validate CDK code)
npx cdk synth

# Show diff between deployed stack and local changes
npx cdk diff

# Deploy stack to AWS (requires AWS credentials configured)
npx cdk deploy

# Destroy stack (remove all resources)
npx cdk destroy

# List all stacks
npx cdk list

# Bootstrap CDK environment (first-time setup)
npx cdk bootstrap
```

## TypeScript Development
```bash
# Type checking without building
npx tsc --noEmit

# Run TypeScript files directly
npx ts-node --prefer-ts-exts <file.ts>
```

## System Commands (Darwin/macOS)
- `ls` - List files and directories
- `cd` - Change directory
- `pwd` - Print working directory
- `grep` or preferably `rg` (ripgrep) - Search text in files
- `find` - Find files and directories