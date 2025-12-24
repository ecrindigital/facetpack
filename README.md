# Facetpack

High-performance Metro transformer and resolver for React Native, powered by [OXC](https://oxc.rs) (Oxidation Compiler).

Drop-in replacement for Babel that transforms TypeScript/JSX **31-38x faster**.

## Benchmarks

Tested on Apple M3 Max, Bun 1.3.3

### Transformer

| Component Size | Babel | Facetpack/OXC | Speedup |
|----------------|-------|---------------|---------|
| Small (25 lines) | 244.14 µs | 7.87 µs | **31x faster** |
| Large (200 lines) | 2.47 ms | 64.20 µs | **38x faster** |

### Resolver

| Mode | enhanced-resolve | Facetpack/OXC | Speedup |
|------|------------------|---------------|---------|
| Cold Cache (93 specifiers) | 31.62 ms | 10.81 ms | **3x faster** |
| Batch API | 10.80 ms | 4.85 ms | **2.2x faster** |

## Installation

```bash
bun add @ecrindigital/facetpack
# or
npm install @ecrindigital/facetpack
```

## Usage

Wrap your Metro config with `withFacetpack`:

```js
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config')
const { withFacetpack } = require('@ecrindigital/facetpack')

const config = getDefaultConfig(__dirname)

module.exports = withFacetpack(config)
```

That's it. Facetpack automatically:
- Transforms user TypeScript/TSX/JSX code with OXC
- Falls back to Babel for Flow packages (react-native, reanimated, etc.)
- Batch-resolves imports for faster resolution

## How it works

```
┌─────────────────────────────────────────────────────────────┐
│                        Metro Build                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User Code (.ts, .tsx)                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Parse     │ -> │  Transform  │ -> │  Codegen    │     │
│  │   (OXC)     │    │   (OXC)     │    │   (OXC)     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│  Node Modules (Flow packages)                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Parse     │ -> │  Transform  │ -> │  Codegen    │     │
│  │  (Babel)    │    │  (Babel)    │    │  (Babel)    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│  Resolution                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Batch Resolve (OXC Resolver via NAPI)              │   │
│  │  Single FFI call for all imports in a file          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Architecture

```
packages/
├── facetpack/           # Metro integration (TypeScript)
│   ├── withFacetpack    # Config wrapper
│   ├── transformer      # OXC transformer + Babel fallback
│   └── resolver         # Cached batch resolver
│
└── facetpack-native/    # Native bindings (Rust + NAPI)
    ├── oxc_parser       # Parsing
    ├── oxc_transformer  # TS/JSX transformation
    ├── oxc_codegen      # Code generation
    └── oxc_resolver     # Module resolution
```

## Options

```js
module.exports = withFacetpack(config, {
  // JSX runtime: 'automatic' (default) or 'classic'
  jsxRuntime: 'automatic',

  // JSX import source for automatic runtime
  jsxImportSource: 'react',

  // JSX pragma for classic runtime
  jsxPragma: 'React.createElement',
  jsxPragmaFrag: 'React.Fragment',

  // File extensions to transform
  sourceExts: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'],
})
```

## Debug Mode

Enable debug logging:

```bash
FACETPACK_DEBUG=1 npx expo start
```

## Limitations

- Flow packages (react-native core, reanimated, gesture-handler, etc.) use Babel fallback
- OXC doesn't support ES5 class transformation yet (not needed for Hermes)

## Run Benchmarks

```bash
cd examples/benchmark
bun run.ts                    # Full benchmark with Metro build
bun run.ts --transformer-only # Skip Metro build benchmark
```

## Development

```bash
# Install dependencies
bun install

# Build native bindings
cd packages/facetpack-native
bun run build

# Build TypeScript package
cd packages/facetpack
bun run build

# Run tests
bun test
```

## License

MIT - [Ecrin Digital](https://ecrin.digital)
