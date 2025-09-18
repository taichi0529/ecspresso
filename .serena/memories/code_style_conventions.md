# Code Style and Conventions

## TypeScript Configuration
Based on `tsconfig.json`, the project enforces:

### Strict Type Checking
- `strict: true` - All strict type-checking options enabled
- `noImplicitAny: true` - No implicit any types allowed
- `strictNullChecks: true` - Null and undefined handled explicitly
- `noImplicitThis: true` - This type must be explicit
- `alwaysStrict: true` - Use strict mode in all files

### Code Quality Rules
- `noImplicitReturns: true` - All code paths must return a value
- `noUnusedLocals: false` - Unused local variables allowed (disabled)
- `noUnusedParameters: false` - Unused parameters allowed (disabled)
- `noFallthroughCasesInSwitch: false` - Fallthrough in switch allowed

### Module System
- Target: ES2022
- Module: NodeNext
- Module Resolution: NodeNext
- Inline source maps enabled for debugging

## CDK Patterns
- Stack classes extend `cdk.Stack`
- Constructor pattern: `constructor(scope: Construct, id: string, props?: cdk.StackProps)`
- Resources created within stack constructor
- Use CDK L2/L3 constructs when available

## File Naming
- TypeScript files: `.ts` extension
- Test files: `.test.ts` suffix
- Stack files: `-stack.ts` suffix
- Entry points in `bin/` directory
- Stack definitions in `lib/` directory

## Testing Conventions
- Jest framework for unit tests
- Test files in `test/` directory
- Test environment: node
- Use ts-jest for TypeScript transformation