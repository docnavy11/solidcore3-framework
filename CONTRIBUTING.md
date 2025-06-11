# Contributing to Solidcore3

Thank you for your interest in contributing to Solidcore3! This document provides guidelines and information for contributors.

## 🎯 Vision

Solidcore3 is an AI-first full-stack framework designed to make web development declarative and AI-friendly. Every contribution should align with this vision:

- **Declarative over imperative** - Focus on "what" not "how"
- **AI-friendly design** - Simple, consistent patterns that AI can understand
- **Developer experience** - Make complex things simple
- **Edge-ready** - Built for modern deployment

## 🚀 Getting Started

### Prerequisites

- [Deno](https://deno.land/) 2.x or later
- Basic understanding of TypeScript
- Familiarity with web development concepts

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/solidcore3.git
   cd solidcore3
   ```

2. **Start the development server**
   ```bash
   deno task dev
   ```

3. **Run tests**
   ```bash
   deno task test
   ```

4. **Format and lint**
   ```bash
   deno task fmt
   deno task lint
   ```

## 📋 How to Contribute

### Reporting Issues

Before creating an issue, please check if it already exists:

1. **Search existing issues** - Check if someone has already reported it
2. **Use the issue template** - Provide clear reproduction steps
3. **Include environment details** - Deno version, OS, browser, etc.
4. **Add labels** - Help categorize the issue (bug, feature, docs, etc.)

**Good Issue Title Examples:**
- ❌ "It doesn't work"
- ✅ "Custom templates fail to load when app name contains spaces"
- ✅ "Add support for nested entity relationships in truth file"

### Suggesting Features

We love feature suggestions! Please:

1. **Check the roadmap** - See if it's already planned
2. **Describe the use case** - Why is this needed?
3. **Provide examples** - Show how it would work
4. **Consider AI impact** - How does this help AI development?

### Code Contributions

#### Types of Contributions Welcome

**🔧 Core Framework**
- Truth file validation improvements
- Generator enhancements
- Performance optimizations
- Error handling improvements

**🎨 UI System**
- New constrained components
- Design token improvements
- Template system enhancements
- Accessibility improvements

**📚 Documentation**
- API documentation
- Tutorial improvements
- Example applications
- Code comments

**🧪 Testing**
- Unit test coverage
- Integration tests
- Performance benchmarks
- Edge case testing

#### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding standards
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**
   ```bash
   deno task test
   deno task fmt
   deno task lint
   deno task type-check
   ```

4. **Commit with clear messages**
   ```bash
   git commit -m "feat: add support for custom validation rules"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

#### Commit Message Format

We use conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat: add support for nested entity relationships
fix: resolve template loading issue with special characters
docs: update truth file guide with new examples
refactor: simplify generator base class
test: add integration tests for custom templates
```

## 📏 Coding Standards

### TypeScript Guidelines

- **Strict mode enabled** - Use strict TypeScript settings
- **Explicit types** - Prefer explicit types over `any`
- **Interface over type** - Use interfaces for object shapes
- **Descriptive names** - Use clear, descriptive variable and function names

### File Organization

```
solidcore3/
├── core/              # Framework core (stable APIs)
├── runtime/           # Runtime execution (internal)
├── app/               # Example application
├── tests/             # Test files
└── docs/              # Documentation
```

### Code Style

- **Use Deno's formatter** - Run `deno task fmt` before committing
- **2 space indentation** - Consistent with Deno standards
- **Single quotes** - For string literals
- **Semicolons** - Always use semicolons
- **Trailing commas** - In multi-line objects and arrays

### Error Handling

- **Descriptive error messages** - Help developers understand what went wrong
- **Error codes** - Use consistent error codes for different types of errors
- **Graceful degradation** - Provide fallbacks when possible
- **Logging** - Include relevant context for debugging

### Documentation

- **JSDoc comments** - For public APIs
- **README updates** - Update relevant documentation
- **Code examples** - Include examples in documentation
- **Type definitions** - Keep types well-documented

## 🧪 Testing Guidelines

### Test Structure

```typescript
// Good test structure
Deno.test('TruthValidator - should validate entity fields correctly', async () => {
  // Arrange
  const validator = new TruthValidator();
  const truthFile = { /* test data */ };
  
  // Act
  const result = await validator.validate(truthFile);
  
  // Assert
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});
```

### Test Categories

- **Unit tests** - Test individual functions and classes
- **Integration tests** - Test component interactions
- **End-to-end tests** - Test complete user workflows
- **Performance tests** - Ensure acceptable performance

### Running Tests

```bash
# Run all tests
deno task test

# Run specific test file
deno test core/validators/truth-validator.test.ts

# Run tests with coverage
deno test --coverage=coverage

# Watch mode for development
deno test --watch
```

## 🏗️ Architecture Guidelines

### Core Principles

1. **Separation of concerns** - Each module has a single responsibility
2. **Dependency injection** - Avoid tight coupling between components
3. **Interface-based design** - Define clear contracts between modules
4. **Immutable data** - Prefer immutable data structures
5. **Error boundaries** - Handle errors gracefully at appropriate levels

### Adding New Generators

When adding new generators:

1. **Extend the base Generator interface**
2. **Follow the pipeline pattern** - Input → Process → Output
3. **Add comprehensive validation** - Validate inputs and outputs
4. **Include error handling** - Provide meaningful error messages
5. **Add tests** - Unit and integration tests

### Adding New Components

When adding UI components:

1. **Follow the constrained component pattern**
2. **Use design tokens** - Consistent spacing, colors, typography
3. **Support base props** - Spacing, layout, responsive properties
4. **Include accessibility** - ARIA labels, keyboard navigation
5. **Add documentation** - Usage examples and props

## 📝 Pull Request Guidelines

### Before Submitting

- [ ] Tests pass (`deno task test`)
- [ ] Code is formatted (`deno task fmt`)
- [ ] No linting errors (`deno task lint`)
- [ ] Types check (`deno task type-check`)
- [ ] Documentation updated if needed
- [ ] Commit messages follow convention

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass
```

### Review Process

1. **Automated checks** - CI will run tests and checks
2. **Code review** - Maintainers will review the code
3. **Feedback address** - Make requested changes
4. **Approval** - Once approved, PR will be merged

## 🌟 Recognition

Contributors are recognized in:

- **GitHub contributors list** - Automatic recognition
- **Release notes** - Major contributions highlighted
- **README acknowledgments** - Significant contributors
- **Community showcase** - Featured contributions

## 📞 Getting Help

Need help? Here are the best ways to get assistance:

1. **GitHub Discussions** - For questions and general discussion
2. **GitHub Issues** - For bug reports and feature requests
3. **Documentation** - Check existing docs first
4. **Code Comments** - Many examples in the codebase

## 🚀 What's Next?

After your first contribution:

1. **Join the community** - Engage in discussions
2. **Review others' PRs** - Help review and provide feedback
3. **Propose improvements** - Share ideas for enhancements
4. **Become a maintainer** - Help guide the project's direction

---

Thank you for contributing to Solidcore3! Together we're building the future of AI-first web development. 🎉