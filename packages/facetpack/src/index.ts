/**
 * Facetpack - High-performance Metro transformer powered by OXC
 *
 * @example
 * ```js
 * // metro.config.js
 * const { getDefaultConfig } = require('@react-native/metro-config');
 * const { withFacetpack } = require('facetpack');
 *
 * const config = getDefaultConfig(__dirname);
 * module.exports = withFacetpack(config);
 * ```
 *
 * @packageDocumentation
 */

export { withFacetpack, getStoredOptions } from './withFacetpack'
export { transform, createTransformer, setTransformerOptions } from './transformer'
export type {
  FacetpackOptions,
  MetroConfig,
  TransformParams,
  TransformOptions,
  TransformResult,
} from './types'
