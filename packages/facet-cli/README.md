# @ecrindigital/facet-cli

Modern CLI for React Native development.

## Installation

```bash
npm install -g @ecrindigital/facet-cli
```

Or with your package manager:

```bash
pnpm add -g @ecrindigital/facet-cli
bun add -g @ecrindigital/facet-cli
```

## Commands

### `facet dev`

Start the development server.

```bash
facet dev                    # Start dev server
facet dev -p ios             # Start for iOS
facet dev -p android         # Start for Android
facet dev --port 3000        # Custom port
facet dev --clear            # Clear Metro cache
```

### `facet build`

Build the application for production.

```bash
facet build -p ios           # Build for iOS
facet build -p android       # Build for Android
facet build -p ios --no-minify   # Without minification
```

### `facet doctor`

Diagnose and fix common issues.

```bash
facet doctor                 # Run diagnostics
facet doctor --fix           # Auto-fix issues
```

## Part of the Facet Ecosystem

This CLI is part of [Facet](https://github.com/ecrindigital/facetpack), the modern toolchain for React Native.

## License

MIT - [Ecrin Digital](https://ecrin.digital)
