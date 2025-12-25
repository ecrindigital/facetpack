# Contributing to Facetpack

Thanks for your interest in contributing to Facetpack! This guide will help you get started.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Rust](https://rustup.rs) >= 1.70 (for facetpack-native)
- Node.js >= 18

### Getting Started

```bash
# Clone the repository
git clone https://github.com/ecrindigital/facetpack.git
cd facetpack

# Install dependencies
bun install

# Build all packages
bun run build:all

# Run tests
bun run test:all
```

## Project Structure

```
facetpack/
├── packages/
│   ├── facetpack/          # Main package (TypeScript)
│   └── facetpack-native/   # Native bindings (Rust + NAPI-RS)
└── examples/
    ├── benchmark/          # Performance benchmarks
    ├── expo-babel/         # Expo with Babel (baseline)
    └── expo-facetpack/     # Expo with Facetpack
```

## Development Workflow

### Working on `facetpack` (TypeScript)

```bash
cd packages/facetpack

# Build
bun run build

# Run tests
bun test

# Type check
bun run typecheck
```

### Working on `facetpack-native` (Rust)

```bash
cd packages/facetpack-native

# Build native bindings
bun run build

# Run Rust tests
bun run test:rust

# Run Node tests
bun run test
```

### Running Benchmarks

```bash
cd examples/benchmark
bun run bench
```

## Pull Request Process

1. **Fork** the repository
2. **Create a branch** for your feature (`git checkout -b feature/amazing-feature`)
3. **Make your changes** and add tests if applicable
4. **Run tests** to ensure nothing is broken (`bun run test:all`)
5. **Commit** your changes with a clear message
6. **Push** to your fork and open a Pull Request

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add support for custom JSX pragma
fix: resolve path resolution on Windows
docs: update installation instructions
perf: optimize transform cache lookup
```

### Code Style

- TypeScript: Follow existing patterns, use strict types
- Rust: Run `cargo fmt` before committing
- Use meaningful variable names
- Add comments for complex logic

## Testing

### Adding Tests

- Place tests in `__tests__/` directories or `*.test.ts` files
- Cover edge cases and error conditions
- Run the full test suite before submitting

### Test Commands

```bash
# All tests
bun run test:all

# Specific package
cd packages/facetpack && bun test

# With coverage (facetpack-native)
cd packages/facetpack-native && bun run test:coverage
```

## Reporting Issues

When reporting bugs, please include:

- Facetpack version
- Node.js/Bun version
- Operating system
- Minimal reproduction steps
- Expected vs actual behavior

## Questions?

Feel free to open a [GitHub Discussion](https://github.com/ecrindigital/facetpack/discussions) for questions or ideas.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
