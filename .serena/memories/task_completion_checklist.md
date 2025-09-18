# Task Completion Checklist

When completing any development task in this CDK project, ensure:

## 1. Code Quality
- [ ] TypeScript compiles without errors: `yarn build`
- [ ] No TypeScript type errors: `npx tsc --noEmit`
- [ ] Code follows established patterns in existing files

## 2. Testing
- [ ] Run existing tests: `yarn test`
- [ ] Add tests for new functionality if applicable
- [ ] Ensure all tests pass

## 3. CDK Validation
- [ ] Synthesize stack successfully: `npx cdk synth`
- [ ] Check diff if modifying existing infrastructure: `npx cdk diff`
- [ ] Validate no security issues in synthesized template

## 4. Documentation
- [ ] Update inline comments for complex logic
- [ ] Update README if adding new commands or changing setup

## 5. Pre-deployment
- [ ] Ensure AWS credentials are configured if deploying
- [ ] Review resource costs implications
- [ ] Consider multi-environment impacts

## Important Notes
- Always work from the `cdk/` directory
- Use yarn (not npm) for package management due to yarn.lock
- Never commit AWS credentials or sensitive data
- Test infrastructure changes in non-production environment first