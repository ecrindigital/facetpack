<h1 align="center">
FACETPACK
</h1>

<p align="center">
  <b>The Modern React Native Toolkit</b>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@ecrindigital/facetpack"><img src="https://img.shields.io/npm/v/@ecrindigital/facetpack.svg" alt="npm" /></a>
  <a href="https://discord.gg/kX7xzknGmv"><img src="https://img.shields.io/discord/1457120530409980069?color=7289da&logo=discord&logoColor=white" alt="Discord" /></a>
</p>

<br/>

## Install

```bash
npm i @ecrindigital/facetpack
```

```js
// metro.config.js
const { withFacetpack } = require('@ecrindigital/facetpack')
module.exports = withFacetpack(require('expo/metro-config').getDefaultConfig(__dirname))
```

Done.

<br/>

## Why Facetpack?

- **36x faster transforms** — Rust-powered OXC replaces Babel
- **Better errors** — Clear, actionable error messages
- **Smart fallback** — Graceful Babel fallback for Flow packages
- **Doctor CLI** — Diagnose and auto-fix common issues
- **Drop-in** — One line to install, zero config

<br/>

## Benchmark

| | Babel | Facetpack |
|---|---|---|
| Transform | 2.47ms | **64µs** |
| Resolve | 31.6ms | **10.8ms** |

<sub>Apple M3 Max</sub>

<br/>

## Debug

```bash
FACETPACK_DEBUG=1 npx expo start
```

<br/>

## Packages

| Package | Version |
|---------|---------|
| [facetpack](packages/facetpack) | [![npm](https://img.shields.io/npm/v/@ecrindigital/facetpack.svg)](https://www.npmjs.com/package/@ecrindigital/facetpack) |
| [facetpack-native](packages/facetpack-native) | [![npm](https://img.shields.io/npm/v/@ecrindigital/facetpack-native.svg)](https://www.npmjs.com/package/@ecrindigital/facetpack-native) |
| [facet-cli](packages/facet-cli) | [![npm](https://img.shields.io/npm/v/@ecrindigital/facet-cli.svg)](https://www.npmjs.com/package/@ecrindigital/facet-cli) |

<br/>

## Contributing

```bash
bun install
bun run build
bun test
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

<br/>

## Sponsors

<a href="https://github.com/sponsors/Inerska">
  <img src="assets/sponsors.svg" alt="Sponsors" />
</a>

[Become a sponsor](https://github.com/sponsors/Inerska)

<br/>

## License

MIT © [Ecrin Digital](https://ecrin.digital)

<br/>

## Links

[Discord](https://discord.gg/kX7xzknGmv) · [Issues](https://github.com/ecrindigital/facetpack/issues) · [Twitter](https://twitter.com/ecrindigital)
