# facetpack

[![npm version](https://img.shields.io/npm/v/facetpack.svg)](https://www.npmjs.com/package/facetpack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> High-performance Metro transformer powered by [OXC](https://oxc.rs) and Rust.

Replace Babel with a blazing-fast native transformer in your React Native project.

Built by [Ecrin Digital](https://ecrin.digital).

## Features

- **10-50x Faster** - Native Rust transformer powered by OXC
- **Drop-in Replacement** - Just wrap your Metro config
- **TypeScript Support** - Full TypeScript parsing and type stripping
- **JSX/TSX Support** - Automatic and classic runtime support
- **Source Maps** - Full source map support for debugging
- **Zero Config** - Works out of the box with sensible defaults

## Installation

```bash
npm install facetpack facetpack-native
# or
yarn add facetpack facetpack-native
# or
pnpm add facetpack facetpack-native
```

## Usage

Wrap your Metro configuration with `withFacetpack`:

```javascript
// metro.config.js
const { getDefaultConfig } = require('@react-native/metro-config');
const { withFacetpack } = require('facetpack');

const config = getDefaultConfig(__dirname);

module.exports = withFacetpack(config);
```

### With Options

```javascript
// metro.config.js
const { getDefaultConfig } = require('@react-native/metro-config');
const { withFacetpack } = require('facetpack');

const config = getDefaultConfig(__dirname);

module.exports = withFacetpack(config, {
  // JSX runtime: 'automatic' (default) or 'classic'
  jsxRuntime: 'automatic',

  // Import source for automatic runtime
  jsxImportSource: 'react',

  // Enable TypeScript transformation (default: true)
  typescript: true,

  // Enable JSX transformation (default: true)
  jsx: true,
});
```

### With Expo

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { withFacetpack } = require('facetpack');

const config = getDefaultConfig(__dirname);

module.exports = withFacetpack(config);
```

## API

### `withFacetpack(config, options?)`

Wraps a Metro configuration with the Facetpack transformer.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | `MetroConfig` | Your Metro configuration object |
| `options` | `FacetpackOptions` | Optional configuration options |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `jsx` | `boolean` | `true` | Enable JSX transformation |
| `jsxRuntime` | `'automatic' \| 'classic'` | `'automatic'` | JSX runtime mode |
| `jsxImportSource` | `string` | `'react'` | Import source for automatic runtime |
| `jsxPragma` | `string` | `'React.createElement'` | Pragma for classic runtime |
| `jsxPragmaFrag` | `string` | `'React.Fragment'` | Fragment pragma for classic runtime |
| `typescript` | `boolean` | `true` | Strip TypeScript types |
| `sourceExts` | `string[]` | `['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs']` | File extensions to transform |

## How It Works

Facetpack replaces Metro's default Babel transformer with a native Rust transformer powered by [OXC](https://oxc.rs). This provides significant performance improvements:

| Operation | vs Babel |
|-----------|----------|
| Parse     | ~50x faster |
| Transform | ~20x faster |

The transformer handles:
- TypeScript → JavaScript (type stripping)
- JSX → JavaScript (createElement or jsx-runtime)
- Source map generation

## Requirements

- React Native 0.73+
- Metro 0.80+
- Node.js 18+

## Compatibility

Facetpack is designed to be a drop-in replacement for Babel in most React Native projects. However, if you rely on specific Babel plugins or transforms, you may need to keep Babel for those files.

## License

MIT - see [LICENSE](./LICENSE) for details.

## Credits

- [OXC](https://oxc.rs) - The high-performance JavaScript toolchain
- [NAPI-RS](https://napi.rs) - Rust bindings for Node.js

---

Made with Rust by [Ecrin Digital](https://ecrin.digital)
