// Learn more https://docs.expo.io/guides/customizing-metro
// EXPÉRIMENTAL: Utilise Facetpack/OXC au lieu de Babel
const { getDefaultConfig } = require('expo/metro-config')
const { withFacetpack } = require('facetpack')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [monorepoRoot]

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

module.exports = withFacetpack(config)
