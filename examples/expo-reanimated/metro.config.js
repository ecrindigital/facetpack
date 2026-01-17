const { getDefaultConfig } = require("expo/metro-config");
const { withFacetpack } = require("@ecrindigital/facetpack");

const config = getDefaultConfig(__dirname);

module.exports = withFacetpack(config);
