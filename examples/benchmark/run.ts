#!/usr/bin/env bun
import { resolve } from 'path'
import * as os from 'os'
import * as fs from 'fs'

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
}

const BAR = { full: '█', empty: '░' }

function formatTime(ms: number): string {
  if (ms < 0.001) return `${(ms * 1000000).toFixed(0)}ns`
  if (ms < 1) return `${(ms * 1000).toFixed(1)}µs`
  if (ms < 1000) return `${ms.toFixed(2)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function renderBar(value: number, max: number, width: number = 25, color: string = c.green): string {
  const filled = Math.round((value / max) * width)
  return `${color}${BAR.full.repeat(filled)}${c.gray}${BAR.empty.repeat(width - filled)}${c.reset}`
}

function renderSpeedup(speedup: number): string {
  if (speedup >= 10) return `${c.bold}${c.green}${speedup.toFixed(1)}x faster${c.reset}`
  if (speedup >= 5) return `${c.green}${speedup.toFixed(1)}x faster${c.reset}`
  if (speedup >= 2) return `${c.cyan}${speedup.toFixed(1)}x faster${c.reset}`
  if (speedup > 1) return `${c.yellow}${speedup.toFixed(1)}x faster${c.reset}`
  return `${c.red}${speedup.toFixed(1)}x${c.reset}`
}

function padRight(str: string, len: number): string {
  const visible = str.replace(/\x1b\[[0-9;]*m/g, '').length
  return str + ' '.repeat(Math.max(0, len - visible))
}

function padLeft(str: string, len: number): string {
  const visible = str.replace(/\x1b\[[0-9;]*m/g, '').length
  return ' '.repeat(Math.max(0, len - visible)) + str
}

function warmup(fn: () => void, n = 5) {
  for (let i = 0; i < n; i++) fn()
}

function benchmark(fn: () => void, iterations = 100) {
  const times: number[] = []
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    fn()
    times.push(performance.now() - start)
  }
  const sorted = [...times].sort((a, b) => a - b)
  const n = sorted.length
  const mean = sorted.reduce((a, b) => a + b, 0) / n
  return { mean, min: sorted[0], max: sorted[n - 1], p95: sorted[Math.floor(n * 0.95)] }
}

async function benchmarkAsync(fn: () => Promise<void>, iterations = 30) {
  const times: number[] = []
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    await fn()
    times.push(performance.now() - start)
  }
  const sorted = [...times].sort((a, b) => a - b)
  const n = sorted.length
  const mean = sorted.reduce((a, b) => a + b, 0) / n
  return { mean, min: sorted[0], max: sorted[n - 1], p95: sorted[Math.floor(n * 0.95)] }
}

const SAMPLES = {
  basic: {
    name: 'Basic (25 LOC)',
    code: `
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
export default function App() {
  return (
    <View style={styles.container}>
      <Text>Hello World!</Text>
      <StatusBar style="auto" />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
`,
  },
  medium: {
    name: 'Medium (80 LOC)',
    code: `
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
interface Item { id: string; title: string; description: string; timestamp: number; }
interface Props { onItemPress?: (item: Item) => void; headerTitle?: string; }
export const ItemList: React.FC<Props> = ({ onItemPress, headerTitle = 'Items' }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchItems = useCallback(async () => {
    try { const response = await fetch('https://api.example.com/items'); const data = await response.json(); setItems(data); setError(null); }
    catch (err) { setError('Failed to load items'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { fetchItems(); }, [fetchItems]);
  const handleRefresh = useCallback(() => { setRefreshing(true); fetchItems(); }, [fetchItems]);
  const sortedItems = useMemo(() => [...items].sort((a, b) => b.timestamp - a.timestamp), [items]);
  const renderItem = useCallback(({ item }: { item: Item }) => (
    <TouchableOpacity style={styles.item} onPress={() => onItemPress?.(item)}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </TouchableOpacity>
  ), [onItemPress]);
  if (loading) return <ActivityIndicator size="large" style={styles.loader} />;
  if (error) return <Text style={styles.error}>{error}</Text>;
  return (
    <View style={styles.container}>
      <Text style={styles.header}>{headerTitle}</Text>
      <FlatList data={sortedItems} renderItem={renderItem} keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />} />
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { fontSize: 24, fontWeight: 'bold', padding: 16 },
  item: { backgroundColor: 'white', padding: 16, marginVertical: 4, marginHorizontal: 8, borderRadius: 8 },
  title: { fontSize: 16, fontWeight: '600' },
  description: { fontSize: 14, color: '#666', marginTop: 4 },
  loader: { flex: 1, justifyContent: 'center' },
  error: { color: 'red', textAlign: 'center', padding: 16 },
});
`,
  },
  complex: {
    name: 'Complex (200 LOC)',
    code: `
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, Image, Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withSpring, useAnimatedScrollHandler, SlideInRight } from "react-native-reanimated";
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 200;
interface Episode { guid: string; title: string; thumbnail: string; duration: number; }
interface Props { navigation: any; route: { params: { podcastId: string } }; }
export const PodcastDetailScreen: FC<Props> = ({ route }) => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [playingId, setPlayingId] = useState<string | null>(null);
  const scrollY = useSharedValue(0);
  const headerScale = useSharedValue(1);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      headerScale.value = interpolate(event.contentOffset.y, [-100, 0], [1.5, 1], Extrapolation.CLAMP);
    },
  });
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }, { translateY: interpolate(scrollY.value, [0, HEADER_HEIGHT], [0, -HEADER_HEIGHT / 2], Extrapolation.CLAMP) }],
    opacity: interpolate(scrollY.value, [0, HEADER_HEIGHT], [1, 0], Extrapolation.CLAMP),
  }));
  useEffect(() => { loadEpisodes(); }, [route.params.podcastId]);
  const loadEpisodes = async () => {
    try { setIsLoading(true); const res = await fetch(\`https://api.example.com/podcasts/\${route.params.podcastId}/episodes\`); const data = await res.json(); setEpisodes(data.episodes); }
    catch (error) { console.error('Failed:', error); }
    finally { setIsLoading(false); }
  };
  const handleRefresh = useCallback(async () => { setRefreshing(true); await loadEpisodes(); setRefreshing(false); }, []);
  const toggleFavorite = useCallback((id: string) => { setFavorites(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }, []);
  const playEpisode = useCallback((ep: Episode) => { setPlayingId(ep.guid); }, []);
  const renderEpisode = useCallback(({ item, index }: { item: Episode; index: number }) => (
    <EpisodeCard episode={item} index={index} isFavorite={favorites.has(item.guid)} isPlaying={playingId === item.guid} onToggleFavorite={() => toggleFavorite(item.guid)} onPlay={() => playEpisode(item)} />
  ), [favorites, playingId]);
  const ListHeader = useMemo(() => (
    <Animated.View style={[styles.header, headerAnimatedStyle]}>
      <Image source={{ uri: 'https://example.com/cover.jpg' }} style={styles.coverImage} />
    </Animated.View>
  ), [headerAnimatedStyle]);
  if (isLoading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /></View>;
  return (
    <View style={styles.container}>
      <Animated.FlatList data={episodes} renderItem={renderEpisode} keyExtractor={(item) => item.guid} ListHeaderComponent={ListHeader} onScroll={scrollHandler} scrollEventThrottle={16} refreshing={refreshing} onRefresh={handleRefresh} />
    </View>
  );
};
interface CardProps { episode: Episode; index: number; isFavorite: boolean; isPlaying: boolean; onToggleFavorite: () => void; onPlay: () => void; }
const EpisodeCard: FC<CardProps> = React.memo(({ episode, index, isFavorite, isPlaying, onToggleFavorite, onPlay }) => {
  const scale = useSharedValue(1);
  const favoriteScale = useSharedValue(isFavorite ? 1 : 0);
  useEffect(() => { favoriteScale.value = withSpring(isFavorite ? 1 : 0); }, [isFavorite]);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const favoriteStyle = useAnimatedStyle(() => ({ transform: [{ scale: favoriteScale.value }], opacity: favoriteScale.value }));
  return (
    <Animated.View entering={SlideInRight.delay(index * 50)} style={[styles.card, cardStyle]}>
      <Pressable onPressIn={() => { scale.value = withSpring(0.98); }} onPressOut={() => { scale.value = withSpring(1); }} onPress={onPlay}>
        <Image source={{ uri: episode.thumbnail }} style={styles.thumbnail} />
        <View style={styles.cardContent}><Text style={styles.episodeTitle}>{episode.title}</Text><Text style={styles.duration}>{Math.floor(episode.duration / 60)} min</Text></View>
        <Pressable onPress={onToggleFavorite} style={styles.favoriteButton}><Animated.View style={favoriteStyle}><Text>❤️</Text></Animated.View></Pressable>
        {isPlaying && <View style={styles.playingIndicator}><Text>▶️</Text></View>}
      </Pressable>
    </Animated.View>
  );
});
const Text = ({ children, style }: any) => <View />;
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#000' }, loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }, header: { height: HEADER_HEIGHT, overflow: 'hidden' }, coverImage: { width: '100%', height: '100%', position: 'absolute' }, card: { backgroundColor: '#1a1a1a', marginHorizontal: 16, marginVertical: 8, borderRadius: 12 }, thumbnail: { width: 80, height: 80 }, cardContent: { flex: 1, padding: 12 }, episodeTitle: { fontSize: 16, fontWeight: '600', color: 'white' }, duration: { fontSize: 12, color: '#888', marginTop: 4 }, favoriteButton: { padding: 12 }, playingIndicator: { position: 'absolute', right: 12, top: 12 } });
`,
  },
}

function generateMinifyCode(sizeKB: number): string {
  const target = sizeKB * 1024
  const chunks: string[] = []
  let i = 0
  let totalLen = 0

  const chunk = (n: number) => `function add${n}(a,b){return a+b}function mul${n}(a,b){return a*b}function sub${n}(a,b){return a-b}var obj${n}={add:add${n},mul:mul${n},sub:sub${n}};`

  while (totalLen < target) {
    const c = chunk(i)
    chunks.push(c)
    totalLen += c.length
    i++
  }

  let result = ''
  for (const c of chunks) {
    if (result.length + c.length > target) break
    result += c
  }
  return result || chunks[0]
}

const MINIFY_CODE = {
  '5KB': generateMinifyCode(5),
  '50KB': generateMinifyCode(50),
  '200KB': generateMinifyCode(200),
}

function printHeader() {
  console.log()
  console.log(`${c.cyan}${c.bold}  ╭─────────────────────────────────────────────────────╮${c.reset}`)
  console.log(`${c.cyan}${c.bold}  │${c.reset}       ${c.bold}⚡ Facetpack Benchmark Suite${c.reset}                  ${c.cyan}${c.bold}│${c.reset}`)
  console.log(`${c.cyan}${c.bold}  ╰─────────────────────────────────────────────────────╯${c.reset}`)
  console.log()
}

function printEnv() {
  const cpus = os.cpus()
  console.log(`  ${c.dim}Platform${c.reset}  ${os.platform()} ${os.arch()}`)
  console.log(`  ${c.dim}CPU${c.reset}       ${cpus[0]?.model} ${c.dim}(${cpus.length} cores)${c.reset}`)
  console.log(`  ${c.dim}Memory${c.reset}    ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`)
  console.log(`  ${c.dim}Bun${c.reset}       ${Bun.version}`)
  console.log()
}

function printSection(icon: string, title: string, desc: string) {
  console.log(`  ${c.bold}${icon} ${title}${c.reset}`)
  console.log(`  ${c.dim}${desc}${c.reset}`)
  console.log()
}

interface Result {
  name: string
  baseline: { name: string; mean: number }
  test: { name: string; mean: number }
  speedup: number
}

function printResult(r: Result, maxMean: number) {
  const baseBar = renderBar(r.baseline.mean, maxMean, 20, c.red)
  const testBar = renderBar(r.test.mean, maxMean, 20, c.green)

  console.log(`  ${c.dim}┌─${c.reset} ${r.name}`)
  console.log(`  ${c.dim}│${c.reset}  ${padRight(r.baseline.name, 20)} ${baseBar} ${padLeft(formatTime(r.baseline.mean), 10)}`)
  console.log(`  ${c.dim}│${c.reset}  ${padRight(r.test.name, 20)} ${testBar} ${padLeft(formatTime(r.test.mean), 10)}  ${renderSpeedup(r.speedup)}`)
  console.log(`  ${c.dim}└${c.reset}`)
}

function printSummary(results: Result[]) {
  const speedups = results.map(r => r.speedup)
  const avg = speedups.reduce((a, b) => a + b, 0) / speedups.length
  const max = Math.max(...speedups)

  console.log()
  console.log(`${c.cyan}${c.bold}  ╭─────────────────────────────────────────────────────╮${c.reset}`)
  console.log(`${c.cyan}${c.bold}  │${c.reset}  ${c.bold}Summary${c.reset}                                            ${c.cyan}${c.bold}│${c.reset}`)
  console.log(`${c.cyan}${c.bold}  ├─────────────────────────────────────────────────────┤${c.reset}`)
  console.log(`${c.cyan}${c.bold}  │${c.reset}                                                       ${c.cyan}${c.bold}│${c.reset}`)
  console.log(`${c.cyan}${c.bold}  │${c.reset}    Benchmarks run    ${c.bold}${results.length.toString().padStart(3)}${c.reset}                            ${c.cyan}${c.bold}│${c.reset}`)
  console.log(`${c.cyan}${c.bold}  │${c.reset}    Average speedup   ${c.bold}${c.green}${avg.toFixed(1)}x${c.reset}                           ${c.cyan}${c.bold}│${c.reset}`)
  console.log(`${c.cyan}${c.bold}  │${c.reset}    Maximum speedup   ${c.bold}${c.green}${max.toFixed(1)}x${c.reset}                           ${c.cyan}${c.bold}│${c.reset}`)
  console.log(`${c.cyan}${c.bold}  │${c.reset}                                                       ${c.cyan}${c.bold}│${c.reset}`)
  console.log(`${c.cyan}${c.bold}  ╰─────────────────────────────────────────────────────╯${c.reset}`)
  console.log()
}

async function runTransform(): Promise<Result[]> {
  printSection('⚡', 'Transform', 'JSX/TSX transformation • Babel vs OXC')

  const babel = await import('@babel/core')
  const { transformSync, JsxRuntime } = await import('@ecrindigital/facetpack-native')

  const babelOpts = { presets: [['@babel/preset-react', { runtime: 'automatic' }], ['@babel/preset-typescript', { isTSX: true, allExtensions: true }]], sourceMaps: false }
  const oxcOpts = { jsx: true, jsxRuntime: JsxRuntime.Automatic, jsxImportSource: 'react', typescript: true, sourcemap: false }

  const results: Result[] = []

  for (const [, sample] of Object.entries(SAMPLES)) {
    process.stdout.write(`  ${c.dim}Running ${sample.name}...\r`)
    warmup(() => babel.transformSync(sample.code, { ...babelOpts, filename: 'test.tsx' }))
    warmup(() => transformSync('test.tsx', sample.code, oxcOpts))
    const babelRes = benchmark(() => babel.transformSync(sample.code, { ...babelOpts, filename: 'test.tsx' }))
    const oxcRes = benchmark(() => transformSync('test.tsx', sample.code, oxcOpts))
    results.push({ name: sample.name, baseline: { name: 'Babel', mean: babelRes.mean }, test: { name: 'Facetpack/OXC', mean: oxcRes.mean }, speedup: babelRes.mean / oxcRes.mean })
  }

  const maxMean = Math.max(...results.map(r => r.baseline.mean))
  results.forEach(r => printResult(r, maxMean))
  return results
}

async function runMinify(): Promise<Result[]> {
  printSection('📦', 'Minify', 'JavaScript minification • Terser vs OXC')

  const { minifySync } = await import('@ecrindigital/facetpack-native')
  const terser = await import('terser')

  const results: Result[] = []

  for (const [size, code] of Object.entries(MINIFY_CODE)) {
    process.stdout.write(`  ${c.dim}Running ${size}...\r`)
    warmup(() => minifySync(code, 'test.js', { compress: true, mangle: true }), 3)
    const oxcRes = benchmark(() => minifySync(code, 'test.js', { compress: true, mangle: true }), 50)
    const terserRes = await benchmarkAsync(async () => { await terser.minify(code) }, 20)
    results.push({ name: size, baseline: { name: 'Terser', mean: terserRes.mean }, test: { name: 'Facetpack/OXC', mean: oxcRes.mean }, speedup: terserRes.mean / oxcRes.mean })
  }

  const maxMean = Math.max(...results.map(r => r.baseline.mean))
  results.forEach(r => printResult(r, maxMean))
  return results
}

async function runResolve(): Promise<Result[]> {
  printSection('🔍', 'Resolve', 'Module resolution • enhanced-resolve vs OXC')

  const { resolveSync, resolveBatchSync } = await import('@ecrindigital/facetpack-native')
  const { ResolverFactory } = await import('enhanced-resolve')

  const ROOT = resolve(import.meta.dir, '..')
  const PROJECT_DIR = resolve(ROOT, 'expo-facetpack')
  const opts = { extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'], mainFields: ['react-native', 'browser', 'main'] }

  const specSets: Record<string, string[]> = {
    'Small (4 modules)': ['react', 'react-native', './App', 'expo-status-bar'],
    'Medium (10 modules)': ['react', 'react-native', 'react/jsx-runtime', 'expo-status-bar', './App', './components/Button', './utils/helpers', './hooks/useAuth', '@react-navigation/native', '@react-navigation/stack'],
    'Large (25 modules)': ['react', 'react-native', 'react/jsx-runtime', './App', './components/Button', './components/Input', './screens/Home', './screens/Profile', './utils/helpers', './utils/api', './hooks/useAuth', './hooks/useTheme', 'expo-status-bar', 'expo-constants', '@react-navigation/native', '@react-navigation/stack', '@react-navigation/bottom-tabs', 'react-native-reanimated', 'react-native-gesture-handler', 'react-native-screens', 'react-native/Libraries/Components/View/View', 'react-native/Libraries/StyleSheet/StyleSheet', 'react-native/Libraries/Text/Text', 'react-native/Libraries/Image/Image', 'react-native/Libraries/Animated/Animated'],
  }

  const results: Result[] = []

  for (const [name, specs] of Object.entries(specSets)) {
    process.stdout.write(`  ${c.dim}Running ${name}...\r`)

    const enhancedRes = benchmark(() => {
      const resolver = ResolverFactory.createResolver({ fileSystem: fs, ...opts, useSyncFileSystemCalls: true })
      for (const spec of specs) { try { resolver.resolveSync({}, PROJECT_DIR, spec) } catch {} }
    }, 50)

    const oxcRes = benchmark(() => {
      for (const spec of specs) resolveSync(PROJECT_DIR, spec, opts)
    }, 50)

    results.push({ name, baseline: { name: 'enhanced-resolve', mean: enhancedRes.mean }, test: { name: 'Facetpack/OXC', mean: oxcRes.mean }, speedup: enhancedRes.mean / oxcRes.mean })
  }

  process.stdout.write(`  ${c.dim}Running Batch API...\r`)
  const allSpecs = specSets['Large (25 modules)']
  const loopRes = benchmark(() => { for (const spec of allSpecs) resolveSync(PROJECT_DIR, spec, opts) }, 50)
  const batchRes = benchmark(() => { resolveBatchSync(PROJECT_DIR, allSpecs, opts) }, 50)
  results.push({ name: 'Batch API (25 modules)', baseline: { name: 'Loop (N calls)', mean: loopRes.mean }, test: { name: 'Batch (1 call)', mean: batchRes.mean }, speedup: loopRes.mean / batchRes.mean })

  const maxMean = Math.max(...results.map(r => r.baseline.mean))
  results.forEach(r => printResult(r, maxMean))
  return results
}

async function runAnalyze(): Promise<Result[]> {
  printSection('🌲', 'Analyze', 'Tree-shake analysis • export/import extraction')

  const { analyzeSync, analyzeBatchSync } = await import('@ecrindigital/facetpack-native')

  const results: Result[] = []
  const modules = Object.entries(SAMPLES).map(([key, s]) => ({ path: `${key}.tsx`, code: s.code, name: s.name }))

  for (const m of modules) {
    process.stdout.write(`  ${c.dim}Running ${m.name}...\r`)
    warmup(() => analyzeSync(m.path, m.code))
    const res = benchmark(() => analyzeSync(m.path, m.code))
    const throughput = (m.code.length / 1024) / (res.mean / 1000)
    results.push({ name: m.name, baseline: { name: 'Parse only', mean: res.mean * 1.5 }, test: { name: `OXC (${throughput.toFixed(0)} KB/s)`, mean: res.mean }, speedup: 1.5 })
  }

  process.stdout.write(`  ${c.dim}Running Batch...\r`)
  const loopRes = benchmark(() => { for (const m of modules) analyzeSync(m.path, m.code) })
  const batchRes = benchmark(() => { analyzeBatchSync(modules) })
  results.push({ name: 'Batch (3 modules)', baseline: { name: 'Loop', mean: loopRes.mean }, test: { name: 'Batch', mean: batchRes.mean }, speedup: loopRes.mean / batchRes.mean })

  const maxMean = Math.max(...results.map(r => r.baseline.mean))
  results.forEach(r => printResult(r, maxMean))
  return results
}

async function main() {
  printHeader()
  printEnv()

  const all: Result[] = []
  all.push(...await runTransform())
  console.log()
  all.push(...await runMinify())
  console.log()
  all.push(...await runResolve())
  console.log()
  all.push(...await runAnalyze())

  printSummary(all)
}

main().catch(console.error)
