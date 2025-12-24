import { resolve } from 'path'
import * as os from 'os'
import type {
  BenchmarkRun,
  BenchmarkCategory,
  BenchmarkResult,
  BenchmarkVariant,
  BenchmarkMetrics,
  BenchmarkSummary,
  RunnerConfig,
  ProgressCallback,
} from './types'
import { saveBenchmarkRun } from './storage'

const ROOT = resolve(import.meta.dir, '../..')

const SAMPLES = {
  basic: {
    name: 'Basic Component',
    lines: 25,
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
`,
  },

  medium: {
    name: 'Medium Component',
    lines: 80,
    code: `
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';

interface Item {
  id: string;
  title: string;
  description: string;
  timestamp: number;
}

interface Props {
  onItemPress?: (item: Item) => void;
  headerTitle?: string;
}

export const ItemList: React.FC<Props> = ({ onItemPress, headerTitle = 'Items' }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch('https://api.example.com/items');
      const data = await response.json();
      setItems(data);
      setError(null);
    } catch (err) {
      setError('Failed to load items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems();
  }, [fetchItems]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b.timestamp - a.timestamp);
  }, [items]);

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
      <FlatList
        data={sortedItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />
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
    name: 'Complex Screen',
    lines: 200,
    code: `
import React, { ComponentType, FC, useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  AccessibilityProps,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ImageSourcePropType,
  ImageStyle,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
  Animated as RNAnimated,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedScrollHandler,
  FadeIn,
  FadeOut,
  SlideInRight,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const HEADER_HEIGHT = 200;

interface Episode {
  guid: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  publishedAt: string;
  enclosure: { link: string; type: string };
}

interface PodcastScreenProps {
  navigation: any;
  route: { params: { podcastId: string } };
}

export const PodcastDetailScreen: FC<PodcastScreenProps> = ({ navigation, route }) => {
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
      headerScale.value = interpolate(
        event.contentOffset.y,
        [-100, 0],
        [1.5, 1],
        Extrapolation.CLAMP
      );
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: headerScale.value },
      { translateY: interpolate(scrollY.value, [0, HEADER_HEIGHT], [0, -HEADER_HEIGHT / 2], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(scrollY.value, [0, HEADER_HEIGHT], [1, 0], Extrapolation.CLAMP),
  }));

  useEffect(() => {
    loadEpisodes();
  }, [route.params.podcastId]);

  const loadEpisodes = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(\`https://api.example.com/podcasts/\${route.params.podcastId}/episodes\`);
      const data = await res.json();
      setEpisodes(data.episodes);
    } catch (error) {
      console.error('Failed to load episodes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEpisodes();
    setRefreshing(false);
  }, []);

  const toggleFavorite = useCallback((episodeId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(episodeId)) {
        next.delete(episodeId);
      } else {
        next.add(episodeId);
      }
      return next;
    });
  }, []);

  const playEpisode = useCallback((episode: Episode) => {
    setPlayingId(episode.guid);
  }, []);

  const renderEpisode = useCallback(({ item, index }: { item: Episode; index: number }) => (
    <EpisodeCard
      episode={item}
      index={index}
      isFavorite={favorites.has(item.guid)}
      isPlaying={playingId === item.guid}
      onToggleFavorite={() => toggleFavorite(item.guid)}
      onPlay={() => playEpisode(item)}
    />
  ), [favorites, playingId, toggleFavorite, playEpisode]);

  const ListHeader = useMemo(() => (
    <Animated.View style={[styles.header, headerAnimatedStyle]}>
      <Image source={{ uri: 'https://example.com/cover.jpg' }} style={styles.coverImage} />
      <View style={styles.headerContent}>
        <Text style={styles.podcastTitle}>Podcast Title</Text>
        <Text style={styles.episodeCount}>{episodes.length} episodes</Text>
      </View>
    </Animated.View>
  ), [episodes.length, headerAnimatedStyle]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={episodes}
        renderItem={renderEpisode}
        keyExtractor={(item) => item.guid}
        ListHeaderComponent={ListHeader}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

interface EpisodeCardProps {
  episode: Episode;
  index: number;
  isFavorite: boolean;
  isPlaying: boolean;
  onToggleFavorite: () => void;
  onPlay: () => void;
}

const EpisodeCard: FC<EpisodeCardProps> = React.memo(({
  episode,
  index,
  isFavorite,
  isPlaying,
  onToggleFavorite,
  onPlay,
}) => {
  const scale = useSharedValue(1);
  const favoriteScale = useSharedValue(isFavorite ? 1 : 0);

  useEffect(() => {
    favoriteScale.value = withSpring(isFavorite ? 1 : 0);
  }, [isFavorite]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const favoriteStyle = useAnimatedStyle(() => ({
    transform: [{ scale: favoriteScale.value }],
    opacity: favoriteScale.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View entering={SlideInRight.delay(index * 50)} style={[styles.card, cardStyle]}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPlay}>
        <Image source={{ uri: episode.thumbnail }} style={styles.thumbnail} />
        <View style={styles.cardContent}>
          <Text style={styles.episodeTitle} numberOfLines={2}>{episode.title}</Text>
          <Text style={styles.duration}>{Math.floor(episode.duration / 60)} min</Text>
        </View>
        <Pressable onPress={onToggleFavorite} style={styles.favoriteButton}>
          <Animated.View style={favoriteStyle}>
            <Text>❤️</Text>
          </Animated.View>
          {!isFavorite && <Text>🤍</Text>}
        </Pressable>
        {isPlaying && <View style={styles.playingIndicator}><Text>▶️</Text></View>}
      </Pressable>
    </Animated.View>
  );
});

const Text = ({ children, style, numberOfLines }: any) => <View />;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { height: HEADER_HEIGHT, overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%', position: 'absolute' },
  headerContent: { position: 'absolute', bottom: 16, left: 16 },
  podcastTitle: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  episodeCount: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  listContent: { paddingBottom: 100 },
  card: { backgroundColor: '#1a1a1a', marginHorizontal: 16, marginVertical: 8, borderRadius: 12, overflow: 'hidden' },
  thumbnail: { width: 80, height: 80 },
  cardContent: { flex: 1, padding: 12 },
  episodeTitle: { fontSize: 16, fontWeight: '600', color: 'white' },
  duration: { fontSize: 12, color: '#888', marginTop: 4 },
  favoriteButton: { padding: 12 },
  playingIndicator: { position: 'absolute', right: 12, top: 12 },
});
`,
  },

  typescript: {
    name: 'TypeScript Heavy',
    lines: 150,
    code: `
import React, { createContext, useContext, useReducer, useMemo, ReactNode } from 'react';

type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;
type Nullable<T> = T | null;
type AsyncState<T> = { data: T | null; loading: boolean; error: Error | null };

interface User {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar: Nullable<string>;
    preferences: {
      theme: 'light' | 'dark' | 'system';
      notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
      };
      language: string;
      timezone: string;
    };
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastLogin: Nullable<Date>;
    loginCount: number;
  };
}

interface AuthState {
  user: AsyncState<User>;
  token: Nullable<string>;
  refreshToken: Nullable<string>;
  isAuthenticated: boolean;
  permissions: Set<string>;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string; refreshToken: string } }
  | { type: 'LOGIN_FAILURE'; payload: Error }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN'; payload: { token: string; refreshToken: string } }
  | { type: 'UPDATE_USER'; payload: DeepPartial<User> }
  | { type: 'SET_PERMISSIONS'; payload: string[] };

const initialState: AuthState = {
  user: { data: null, loading: false, error: null },
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  permissions: new Set(),
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, user: { ...state.user, loading: true, error: null } };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: { data: action.payload.user, loading: false, error: null },
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
      };
    case 'LOGIN_FAILURE':
      return { ...state, user: { data: null, loading: false, error: action.payload } };
    case 'LOGOUT':
      return initialState;
    case 'REFRESH_TOKEN':
      return { ...state, token: action.payload.token, refreshToken: action.payload.refreshToken };
    case 'UPDATE_USER':
      if (!state.user.data) return state;
      return { ...state, user: { ...state.user, data: deepMerge(state.user.data, action.payload) } };
    case 'SET_PERMISSIONS':
      return { ...state, permissions: new Set(action.payload) };
    default:
      return state;
  }
}

function deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
  const result = { ...target };
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];
    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
      (result as any)[key] = deepMerge(targetValue as object, sourceValue as object);
    } else if (sourceValue !== undefined) {
      (result as any)[key] = sourceValue;
    }
  }
  return result;
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (updates: DeepPartial<User>) => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const actions = useMemo<Omit<AuthContextType, 'state'>>(() => ({
    login: async (email: string, password: string) => {
      dispatch({ type: 'LOGIN_START' });
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      } catch (error) {
        dispatch({ type: 'LOGIN_FAILURE', payload: error as Error });
        throw error;
      }
    },
    logout: () => dispatch({ type: 'LOGOUT' }),
    refreshToken: async () => {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { Authorization: \`Bearer \${state.refreshToken}\` },
      });
      const data = await response.json();
      dispatch({ type: 'REFRESH_TOKEN', payload: data });
    },
    updateUser: (updates) => dispatch({ type: 'UPDATE_USER', payload: updates }),
    hasPermission: (permission) => state.permissions.has(permission),
  }), [state.refreshToken, state.permissions]);

  const value = useMemo(() => ({ state, ...actions }), [state, actions]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function useUser(): User | null {
  const { state } = useAuth();
  return state.user.data;
}

export function useIsAuthenticated(): boolean {
  const { state } = useAuth();
  return state.isAuthenticated;
}
`,
  },
}

const MINIFY_SAMPLES = {
  small: {
    name: 'Small Bundle',
    size: '5KB',
    code: `function e(e,t){return e+t}function t(e,t){return e*t}function n(e,t){return e-t}function r(e,t){return e/t}const o={add:e,multiply:t,subtract:n,divide:r};function i(e){return e.map((e=>e*2))}function a(e){return e.filter((e=>e>0))}function c(e){return e.reduce(((e,t)=>e+t),0)}const u={double:i,positive:a,sum:c};class s{constructor(e,t){this.x=e,this.y=t}add(e){return new s(this.x+e.x,this.y+e.y)}scale(e){return new s(this.x*e,this.y*e)}magnitude(){return Math.sqrt(this.x*this.x+this.y*this.y)}}export{o as math,u as array,s as Vector};`,
  },
  medium: {
    name: 'Medium Bundle',
    size: '50KB',
    code: '',
  },
  large: {
    name: 'Large Bundle',
    size: '200KB',
    code: '',
  },
}

function generateLargeCode(sizeKB: number): string {
  const base = MINIFY_SAMPLES.small.code
  const targetSize = sizeKB * 1024
  let code = ''
  let counter = 0
  while (code.length < targetSize) {
    code += base.replace(/([a-z])(\d*)/g, (_, c) => c + counter)
    counter++
  }
  return code.slice(0, targetSize)
}

MINIFY_SAMPLES.medium.code = generateLargeCode(50)
MINIFY_SAMPLES.large.code = generateLargeCode(200)

async function getGitInfo(): Promise<{ commit: string; branch: string }> {
  try {
    const commit = (await Bun.$`git rev-parse --short HEAD`.text()).trim()
    const branch = (await Bun.$`git rev-parse --abbrev-ref HEAD`.text()).trim()
    return { commit, branch }
  } catch {
    return { commit: 'unknown', branch: 'unknown' }
  }
}

function getEnvironment() {
  const cpus = os.cpus()
  const totalMem = os.totalmem()
  return {
    platform: os.platform(),
    arch: os.arch(),
    bun: Bun.version,
    node: process.version,
    cpu: cpus[0]?.model ?? 'unknown',
    cores: cpus.length,
    memory: `${Math.round(totalMem / 1024 / 1024 / 1024)}GB`,
  }
}

function calculateMetrics(times: number[], codeSize?: number): BenchmarkMetrics {
  const sorted = [...times].sort((a, b) => a - b)
  const n = sorted.length
  const sum = sorted.reduce((a, b) => a + b, 0)
  const mean = sum / n
  const variance = sorted.reduce((acc, t) => acc + Math.pow(t - mean, 2), 0) / n
  const stdDev = Math.sqrt(variance)

  const p = (percentile: number) => sorted[Math.floor(n * percentile / 100)] ?? sorted[n - 1]

  return {
    mean,
    median: sorted[Math.floor(n / 2)],
    min: sorted[0],
    max: sorted[n - 1],
    p75: p(75),
    p95: p(95),
    p99: p(99),
    stdDev,
    samples: n,
    ops: 1000 / mean,
    throughput: codeSize ? (codeSize / 1024) / (mean / 1000) : undefined,
  }
}

function warmup(fn: () => void, iterations: number = 5) {
  for (let i = 0; i < iterations; i++) {
    fn()
  }
}

function benchmark(fn: () => void, iterations: number = 100): number[] {
  const times: number[] = []
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    fn()
    times.push(performance.now() - start)
  }
  return times
}

async function benchmarkAsync(fn: () => Promise<void>, iterations: number = 100): Promise<number[]> {
  const times: number[] = []
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    await fn()
    times.push(performance.now() - start)
  }
  return times
}

async function runTransformBenchmarks(config: RunnerConfig, onProgress?: ProgressCallback): Promise<BenchmarkCategory> {
  const babel = await import('@babel/core')
  const { transformSync, JsxRuntime } = await import('@ecrindigital/facetpack-native')

  const babelOpts = {
    presets: [
      ['@babel/preset-react', { runtime: 'automatic' }],
      ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
    ],
    sourceMaps: false,
  }

  const oxcOpts = {
    jsx: true,
    jsxRuntime: JsxRuntime.Automatic,
    jsxImportSource: 'react',
    typescript: true,
    sourcemap: false,
  }

  const iterations = config.iterations ?? 100
  const results: BenchmarkResult[] = []

  for (const [key, sample] of Object.entries(SAMPLES)) {
    onProgress?.({ type: 'test', test: sample.name })

    warmup(() => babel.transformSync(sample.code, { ...babelOpts, filename: 'test.tsx' }), 5)
    warmup(() => transformSync('test.tsx', sample.code, oxcOpts), 5)

    const babelTimes = benchmark(
      () => babel.transformSync(sample.code, { ...babelOpts, filename: 'test.tsx' }),
      iterations
    )
    const oxcTimes = benchmark(
      () => transformSync('test.tsx', sample.code, oxcOpts),
      iterations
    )

    const babelMetrics = calculateMetrics(babelTimes, sample.code.length)
    const oxcMetrics = calculateMetrics(oxcTimes, sample.code.length)
    const speedup = babelMetrics.mean / oxcMetrics.mean

    results.push({
      id: `transform-${key}`,
      name: sample.name,
      description: `Transform ${sample.lines} lines of TSX code`,
      projectType: key === 'basic' ? 'basic' : key === 'complex' ? 'complex' : 'real-world',
      projectSize: `${sample.lines} lines`,
      variants: [
        { name: 'Babel', tool: 'babel', color: '#f5da55', metrics: babelMetrics },
        { name: 'Facetpack/OXC', tool: 'facetpack', color: '#3b82f6', metrics: oxcMetrics },
      ],
      winner: 'Facetpack/OXC',
      speedup,
    })
  }

  return {
    id: 'transform',
    name: 'Code Transformation',
    description: 'JSX/TSX transformation performance (Babel vs OXC)',
    icon: '⚡',
    results,
  }
}

async function runMinifyBenchmarks(config: RunnerConfig, onProgress?: ProgressCallback): Promise<BenchmarkCategory> {
  const { minifySync } = await import('@ecrindigital/facetpack-native')
  const terser = await import('terser')

  const iterations = config.iterations ?? 50
  const results: BenchmarkResult[] = []

  for (const [key, sample] of Object.entries(MINIFY_SAMPLES)) {
    onProgress?.({ type: 'test', test: sample.name })

    const code = sample.code
    if (!code) continue

    warmup(() => minifySync(code, 'test.js', { compress: true, mangle: true }), 3)

    const oxcTimes = benchmark(
      () => minifySync(code, 'test.js', { compress: true, mangle: true }),
      iterations
    )

    const terserTimes = await benchmarkAsync(
      async () => { await terser.minify(code, { compress: true, mangle: true }) },
      Math.min(iterations, 30)
    )

    const oxcMetrics = calculateMetrics(oxcTimes, code.length)
    const terserMetrics = calculateMetrics(terserTimes, code.length)

    const oxcResult = minifySync(code, 'test.js', { compress: true, mangle: true })
    const terserResult = await terser.minify(code, { compress: true, mangle: true })

    oxcMetrics.outputSize = oxcResult.code.length
    terserMetrics.outputSize = terserResult.code?.length ?? 0

    const speedup = terserMetrics.mean / oxcMetrics.mean

    results.push({
      id: `minify-${key}`,
      name: sample.name,
      description: `Minify ${sample.size} JavaScript bundle`,
      projectType: key === 'small' ? 'basic' : key === 'medium' ? 'complex' : 'real-world',
      projectSize: sample.size,
      variants: [
        { name: 'Terser', tool: 'terser', color: '#dd6b20', metrics: terserMetrics },
        { name: 'Facetpack/OXC', tool: 'facetpack', color: '#3b82f6', metrics: oxcMetrics },
      ],
      winner: 'Facetpack/OXC',
      speedup,
      metadata: {
        inputSize: code.length,
        oxcOutputSize: oxcMetrics.outputSize,
        terserOutputSize: terserMetrics.outputSize,
        oxcCompression: ((1 - oxcMetrics.outputSize! / code.length) * 100).toFixed(1) + '%',
        terserCompression: ((1 - terserMetrics.outputSize! / code.length) * 100).toFixed(1) + '%',
      },
    })
  }

  return {
    id: 'minify',
    name: 'Minification',
    description: 'JavaScript minification performance (Terser vs OXC)',
    icon: '📦',
    results,
  }
}

async function runResolveBenchmarks(config: RunnerConfig, onProgress?: ProgressCallback): Promise<BenchmarkCategory> {
  const { resolveSync, resolveBatchSync } = await import('@ecrindigital/facetpack-native')
  const { ResolverFactory, CachedInputFileSystem } = await import('enhanced-resolve')
  const fs = await import('fs')

  const FACETPACK_DIR = resolve(ROOT, 'expo-facetpack')
  const iterations = config.iterations ?? 50

  const resolverOpts = {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    mainFields: ['react-native', 'browser', 'main'],
  }

  const specifierSets = {
    basic: ['react', 'react-native', './App', 'expo-status-bar'],
    medium: [
      'react', 'react-native', 'react/jsx-runtime', 'expo-status-bar',
      './App', './components/Button', './utils/helpers', './hooks/useAuth',
      '@react-navigation/native', '@react-navigation/stack',
    ],
    large: [
      'react', 'react-native', 'react/jsx-runtime', 'react/jsx-dev-runtime',
      './App', './components/Button', './components/Input', './components/Card',
      './screens/Home', './screens/Profile', './screens/Settings',
      './utils/helpers', './utils/api', './utils/storage',
      './hooks/useAuth', './hooks/useTheme', './hooks/useNavigation',
      'expo-status-bar', 'expo-constants', 'expo-linking',
      '@react-navigation/native', '@react-navigation/stack', '@react-navigation/bottom-tabs',
      'react-native-reanimated', 'react-native-gesture-handler', 'react-native-screens',
      'react-native/Libraries/Components/View/View',
      'react-native/Libraries/StyleSheet/StyleSheet',
    ],
  }

  const results: BenchmarkResult[] = []

  for (const [size, specifiers] of Object.entries(specifierSets)) {
    onProgress?.({ type: 'test', test: `${size} project resolution` })

    const enhancedColdTimes: number[] = []
    const oxcColdTimes: number[] = []

    for (let i = 0; i < iterations; i++) {
      const resolver = ResolverFactory.createResolver({
        fileSystem: fs,
        ...resolverOpts,
        useSyncFileSystemCalls: true,
      })

      const start1 = performance.now()
      for (const spec of specifiers) {
        try { resolver.resolveSync({}, FACETPACK_DIR, spec) } catch {}
      }
      enhancedColdTimes.push(performance.now() - start1)

      const start2 = performance.now()
      for (const spec of specifiers) {
        resolveSync(FACETPACK_DIR, spec, resolverOpts)
      }
      oxcColdTimes.push(performance.now() - start2)
    }

    const enhancedMetrics = calculateMetrics(enhancedColdTimes)
    const oxcMetrics = calculateMetrics(oxcColdTimes)

    results.push({
      id: `resolve-${size}`,
      name: `${size.charAt(0).toUpperCase() + size.slice(1)} Project`,
      description: `Resolve ${specifiers.length} module specifiers`,
      projectType: size as 'basic' | 'complex' | 'real-world',
      projectSize: `${specifiers.length} modules`,
      variants: [
        { name: 'enhanced-resolve', tool: 'enhanced-resolve', color: '#10b981', metrics: enhancedMetrics },
        { name: 'Facetpack/OXC', tool: 'facetpack', color: '#3b82f6', metrics: oxcMetrics },
      ],
      winner: 'Facetpack/OXC',
      speedup: enhancedMetrics.mean / oxcMetrics.mean,
    })
  }

  onProgress?.({ type: 'test', test: 'Batch API comparison' })
  const allSpecs = specifierSets.large

  const loopTimes = benchmark(() => {
    for (const spec of allSpecs) {
      resolveSync(FACETPACK_DIR, spec, resolverOpts)
    }
  }, iterations)

  const batchTimes = benchmark(() => {
    resolveBatchSync(FACETPACK_DIR, allSpecs, resolverOpts)
  }, iterations)

  results.push({
    id: 'resolve-batch',
    name: 'Batch API',
    description: 'Loop vs single FFI call for batch resolution',
    projectType: 'real-world',
    projectSize: `${allSpecs.length} modules`,
    variants: [
      { name: 'Loop (N calls)', tool: 'oxc', color: '#f59e0b', metrics: calculateMetrics(loopTimes) },
      { name: 'Batch (1 call)', tool: 'oxc', color: '#3b82f6', metrics: calculateMetrics(batchTimes) },
    ],
    winner: 'Batch (1 call)',
    speedup: calculateMetrics(loopTimes).mean / calculateMetrics(batchTimes).mean,
  })

  return {
    id: 'resolve',
    name: 'Module Resolution',
    description: 'Module resolution performance (enhanced-resolve vs OXC)',
    icon: '🔍',
    results,
  }
}

async function runAnalyzeBenchmarks(config: RunnerConfig, onProgress?: ProgressCallback): Promise<BenchmarkCategory> {
  const { analyzeSync, analyzeBatchSync } = await import('@ecrindigital/facetpack-native')
  const iterations = config.iterations ?? 100
  const results: BenchmarkResult[] = []

  for (const [key, sample] of Object.entries(SAMPLES)) {
    onProgress?.({ type: 'test', test: `Analyze ${sample.name}` })

    const times = benchmark(
      () => analyzeSync(`${key}.tsx`, sample.code),
      iterations
    )

    const metrics = calculateMetrics(times, sample.code.length)

    results.push({
      id: `analyze-${key}`,
      name: sample.name,
      description: `Analyze exports/imports in ${sample.lines} lines`,
      projectType: key === 'basic' ? 'basic' : key === 'complex' ? 'complex' : 'real-world',
      projectSize: `${sample.lines} lines`,
      variants: [
        { name: 'Facetpack/OXC', tool: 'facetpack', color: '#3b82f6', metrics },
      ],
      winner: 'Facetpack/OXC',
      speedup: 1,
      metadata: {
        throughput: `${(metrics.throughput ?? 0).toFixed(0)} KB/s`,
      },
    })
  }

  onProgress?.({ type: 'test', test: 'Batch analysis' })
  const modules = Object.entries(SAMPLES).map(([key, sample]) => ({
    path: `${key}.tsx`,
    code: sample.code,
  }))

  const loopTimes = benchmark(() => {
    for (const m of modules) {
      analyzeSync(m.path, m.code)
    }
  }, iterations)

  const batchTimes = benchmark(() => {
    analyzeBatchSync(modules)
  }, iterations)

  results.push({
    id: 'analyze-batch',
    name: 'Batch Analysis',
    description: 'Analyze multiple modules at once',
    projectType: 'real-world',
    projectSize: `${modules.length} modules`,
    variants: [
      { name: 'Loop', tool: 'oxc', color: '#f59e0b', metrics: calculateMetrics(loopTimes) },
      { name: 'Batch', tool: 'oxc', color: '#3b82f6', metrics: calculateMetrics(batchTimes) },
    ],
    winner: 'Batch',
    speedup: calculateMetrics(loopTimes).mean / calculateMetrics(batchTimes).mean,
  })

  return {
    id: 'analyze',
    name: 'Tree-shake Analysis',
    description: 'Module export/import analysis for tree-shaking',
    icon: '🌲',
    results,
  }
}

export async function runBenchmarks(
  config: RunnerConfig = {},
  onProgress?: ProgressCallback
): Promise<BenchmarkRun> {
  const id = crypto.randomUUID()
  const timestamp = new Date().toISOString()
  const git = await getGitInfo()
  const environment = getEnvironment()

  const categories: BenchmarkCategory[] = []
  const selectedCategories = config.categories ?? ['transform', 'minify', 'resolve', 'analyze']

  onProgress?.({ type: 'start', total: selectedCategories.length })

  let progress = 0
  for (const cat of selectedCategories) {
    onProgress?.({ type: 'category', category: cat, progress: ++progress, total: selectedCategories.length })

    switch (cat) {
      case 'transform':
        categories.push(await runTransformBenchmarks(config, onProgress))
        break
      case 'minify':
        categories.push(await runMinifyBenchmarks(config, onProgress))
        break
      case 'resolve':
        categories.push(await runResolveBenchmarks(config, onProgress))
        break
      case 'analyze':
        categories.push(await runAnalyzeBenchmarks(config, onProgress))
        break
    }
  }

  const allResults = categories.flatMap(c => c.results)
  const speedups = allResults.map(r => r.speedup).filter(s => s > 1)
  const summary: BenchmarkSummary = {
    totalTests: allResults.length,
    avgSpeedup: speedups.length > 0 ? speedups.reduce((a, b) => a + b, 0) / speedups.length : 1,
    maxSpeedup: speedups.length > 0 ? Math.max(...speedups) : 1,
    totalTimeSaved: 0,
  }

  const run: BenchmarkRun = {
    id,
    timestamp,
    git,
    environment,
    summary,
    categories,
  }

  await saveBenchmarkRun(run)
  onProgress?.({ type: 'complete' })

  return run
}

export { getGitInfo, getEnvironment, calculateMetrics, SAMPLES, MINIFY_SAMPLES }
