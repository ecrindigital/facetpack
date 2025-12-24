# facetpack-native

Native Rust bindings for [Facetpack](https://github.com/ecrindigital/facetpack) - High-performance Metro transformer and resolver powered by [OXC](https://oxc.rs).

## Installation

```bash
npm install @ecrindigital/facetpack-native
```

This package is typically used as a dependency of `@ecrindigital/facetpack`. You don't need to install it directly.

## API

### Transform

```ts
import { transformSync, JsxRuntime } from '@ecrindigital/facetpack-native'

const result = transformSync('App.tsx', code, {
  jsx: true,
  jsxRuntime: JsxRuntime.Automatic,
  jsxImportSource: 'react',
  typescript: true,
  sourcemap: true,
})

console.log(result.code)
console.log(result.map)
console.log(result.errors)
```

### Parse

```ts
import { parseSync, SourceType } from '@ecrindigital/facetpack-native'

const result = parseSync('App.tsx', code, {
  sourceType: SourceType.Tsx,
})

console.log(result.program)
console.log(result.errors)
```

### Resolve

```ts
import { resolveSync, resolveBatchSync } from '@ecrindigital/facetpack-native'

const result = resolveSync('/project/src', 'react', {
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  mainFields: ['react-native', 'browser', 'main'],
  conditionNames: ['react-native', 'import', 'require'],
})

console.log(result.path)

const results = resolveBatchSync('/project/src', ['react', 'react-native'], {
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
})
```

## Supported Platforms

| Platform | Architecture | Binary |
|----------|--------------|--------|
| macOS | arm64 | `facetpack-native.darwin-arm64.node` |
| macOS | x64 | `facetpack-native.darwin-x64.node` |
| macOS | universal | `facetpack-native.darwin-universal.node` |
| Linux | x64 (glibc) | `facetpack-native.linux-x64-gnu.node` |
| Linux | arm64 (glibc) | `facetpack-native.linux-arm64-gnu.node` |
| Windows | x64 | `facetpack-native.win32-x64-msvc.node` |

## Benchmarks

Tested on Apple M3 Max

| Operation | Babel/enhanced-resolve | facetpack-native | Speedup |
|-----------|------------------------|------------------|---------|
| Transform (small) | 244 µs | 7.9 µs | **31x** |
| Transform (large) | 2.47 ms | 64 µs | **38x** |
| Resolve (batch) | 10.8 ms | 4.85 ms | **2.2x** |

## License

MIT - [Ecrin Digital](https://ecrin.digital)
