/* eslint-env node */
const { getDefaultConfig } = require("expo/metro-config")
const { withFacetpack } = require("facetpack")

const config = getDefaultConfig(__dirname)

config.transformer.getTransformOptions = async () => ({
  transform: {
    inlineRequires: true,
  },
})

config.resolver.unstable_conditionNames = ["require", "default", "browser"]
config.resolver.sourceExts.push("cjs")

module.exports = withFacetpack(config)
