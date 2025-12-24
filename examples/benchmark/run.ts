import { bench, run, summary, group } from 'mitata'
import { $ } from 'bun'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dir, '..')
const BABEL_DIR = resolve(ROOT, 'expo-babel')
const FACETPACK_DIR = resolve(ROOT, 'expo-facetpack')
const IGNITE_DIR = resolve(ROOT, 'ignite-babel')

console.log('🚀 Facetpack Benchmark')
console.log('='.repeat(50))
console.log('')

console.log('📦 Loading transformers and resolvers...')

import * as babel from '@babel/core'
import { transformSync, JsxRuntime, resolveSync, resolveBatchSync } from '@ecrindigital/facetpack-native'
import { ResolverFactory, CachedInputFileSystem } from 'enhanced-resolve'
import * as fs from 'fs'

const SMALL_CODE = `
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
`

const LARGE_CODE = `
import { ComponentType, FC, useCallback, useEffect, useMemo, useState } from "react"
import {
  AccessibilityProps,
  ActivityIndicator,
  FlatList,
  Image,
  ImageSourcePropType,
  ImageStyle,
  Platform,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"

interface EpisodeItem {
  guid: string
  title: string
  enclosure: { link: string }
}

interface ButtonAccessoryProps {
  style?: ViewStyle
}

interface ThemedStyle<T> {
  (theme: { spacing: any; colors: any }): T
}

const ICON_SIZE = 14

export const DemoPodcastListScreen: FC<{ navigation: any }> = (_props) => {
  const [refreshing, setRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([])
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  useEffect(() => {
    ;(async function load() {
      setIsLoading(true)
      await fetchEpisodes()
      setIsLoading(false)
    })()
  }, [])

  const fetchEpisodes = useCallback(async () => {
    const response = await fetch('https://api.example.com/episodes')
    const data = await response.json()
    setEpisodes(data)
  }, [])

  async function manualRefresh() {
    setRefreshing(true)
    await Promise.allSettled([fetchEpisodes(), delay(750)])
    setRefreshing(false)
  }

  const toggleFavoritesOnly = useCallback(() => {
    setFavoritesOnly(prev => !prev)
  }, [])

  return (
    <View style={styles.screen}>
      <FlatList<EpisodeItem>
        contentContainerStyle={styles.listContent}
        data={episodes}
        extraData={episodes.length}
        refreshing={refreshing}
        onRefresh={manualRefresh}
        keyExtractor={(item) => item.guid}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator />
          ) : (
            <View style={styles.emptyState}>
              <Text>No episodes found</Text>
            </View>
          )
        }
        ListHeaderComponent={
          <View style={styles.heading}>
            <Text style={styles.title}>Podcast Episodes</Text>
            {(favoritesOnly || episodes.length > 0) && (
              <View style={styles.toggle}>
                <Switch
                  value={favoritesOnly}
                  onValueChange={toggleFavoritesOnly}
                />
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <EpisodeCard episode={item} onPressFavorite={() => {}} />
        )}
      />
    </View>
  )
}

const EpisodeCard = ({
  episode,
  onPressFavorite,
}: {
  episode: EpisodeItem
  onPressFavorite: () => void
}) => {
  const [isFavorite, setIsFavorite] = useState(false)
  const liked = useSharedValue(isFavorite ? 1 : 0)

  const animatedLikeButtonStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(liked.value, [0, 1], [1, 0], Extrapolation.EXTEND),
        },
      ],
      opacity: interpolate(liked.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    }
  })

  const animatedUnlikeButtonStyles = useAnimatedStyle(() => {
    return {
      transform: [{ scale: liked.value }],
      opacity: liked.value,
    }
  })

  const handlePressFavorite = useCallback(() => {
    onPressFavorite()
    liked.value = withSpring(liked.value ? 0 : 1)
    setIsFavorite(prev => !prev)
  }, [liked, onPressFavorite])

  const accessibilityHintProps = useMemo(
    () =>
      Platform.select<AccessibilityProps>({
        ios: {
          accessibilityLabel: episode.title,
          accessibilityHint: \`Double tap to \${isFavorite ? "unfavorite" : "favorite"}\`,
        },
        android: {
          accessibilityLabel: episode.title,
          accessibilityActions: [
            { name: "longpress", label: "Toggle favorite" },
          ],
          onAccessibilityAction: ({ nativeEvent }) => {
            if (nativeEvent.actionName === "longpress") {
              handlePressFavorite()
            }
          },
        },
      }),
    [episode.title, handlePressFavorite, isFavorite],
  )

  const ButtonLeftAccessory: ComponentType<ButtonAccessoryProps> = useMemo(
    () =>
      function ButtonLeftAccessory() {
        return (
          <View>
            <Animated.View style={[styles.iconContainer, animatedLikeButtonStyles]}>
              <Icon icon="heart" size={ICON_SIZE} color="#666" />
            </Animated.View>
            <Animated.View style={[styles.iconContainer, animatedUnlikeButtonStyles]}>
              <Icon icon="heart" size={ICON_SIZE} color="#ff6b6b" />
            </Animated.View>
          </View>
        )
      },
    [animatedLikeButtonStyles, animatedUnlikeButtonStyles],
  )

  return (
    <View
      style={styles.card}
      onTouchEnd={() => openLinkInBrowser(episode.enclosure.link)}
      {...accessibilityHintProps}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{episode.title}</Text>
        <Button
          onPress={handlePressFavorite}
          style={[styles.favoriteButton, isFavorite && styles.unFavoriteButton]}
          LeftAccessory={ButtonLeftAccessory}
        >
          <Text style={styles.buttonText}>
            {isFavorite ? "Unfavorite" : "Favorite"}
          </Text>
        </Button>
      </View>
    </View>
  )
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const openLinkInBrowser = (url: string) => console.log('Opening:', url)
const Icon = ({ icon, size, color }: any) => <View />
const Text = ({ children, style }: any) => <View />
const Switch = ({ value, onValueChange }: any) => <View />
const Button = ({ children, onPress, style, LeftAccessory }: any) => <View />

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 },
  heading: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  toggle: { marginTop: 16 },
  emptyState: { marginTop: 48 },
  card: { padding: 16, marginTop: 16, minHeight: 120, backgroundColor: '#f5f5f5', borderRadius: 8 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  iconContainer: { height: ICON_SIZE, width: ICON_SIZE, marginEnd: 8 },
  favoriteButton: { borderRadius: 17, marginTop: 16, backgroundColor: '#e0e0e0', paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start' },
  unFavoriteButton: { backgroundColor: '#ffe0e0' },
  buttonText: { fontSize: 12 },
})
`

const babelOptions = {
  filename: 'App.tsx',
  presets: [
    ['@babel/preset-react', { runtime: 'automatic' }],
    ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
  ],
  sourceMaps: false,
}

const oxcOptions = {
  jsx: true,
  jsxRuntime: JsxRuntime.Automatic,
  jsxImportSource: 'react',
  typescript: true,
  sourcemap: false,
}

console.log('✅ Transformers and resolvers loaded\n')

group('Transformer - Small Component (25 lines)', () => {
  bench('Babel', () => {
    babel.transformSync(SMALL_CODE, babelOptions)
  })

  bench('Facetpack/OXC', () => {
    transformSync('App.tsx', SMALL_CODE, oxcOptions)
  })
})

group('Transformer - Large Component (200 lines)', () => {
  bench('Babel', () => {
    babel.transformSync(LARGE_CODE, babelOptions)
  })

  bench('Facetpack/OXC', () => {
    transformSync('DemoPodcastListScreen.tsx', LARGE_CODE, oxcOptions)
  })
})

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json']
const MAIN_FIELDS = ['react-native', 'browser', 'main']
const OXC_OPTIONS = { extensions: EXTENSIONS, mainFields: MAIN_FIELDS }

async function collectSpecifiers(projectDir: string): Promise<string[]> {
  const nodeModulesPath = resolve(projectDir, 'node_modules')
  const specifiers: string[] = []

  specifiers.push('./App', './App.tsx', './index', './index.ts', './index.tsx')

  try {
    const entries = await fs.promises.readdir(nodeModulesPath)
    for (const entry of entries) {
      if (entry.startsWith('.') || entry === '.bin') continue

      if (entry.startsWith('@')) {
        try {
          const scopedPath = resolve(nodeModulesPath, entry)
          const scopedPkgs = await fs.promises.readdir(scopedPath)
          for (const pkg of scopedPkgs) {
            if (!pkg.startsWith('.')) {
              specifiers.push(`${entry}/${pkg}`)
            }
          }
        } catch {}
      } else {
        specifiers.push(entry)
      }
    }
  } catch {}

  specifiers.push(
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'react-native/index',
    'react-native/Libraries/Components/View/View',
    'react-native/Libraries/StyleSheet/StyleSheet',
    'react-native/Libraries/Components/Text/Text',
    'react-native/Libraries/Components/TextInput/TextInput',
    'react-native/Libraries/Components/ScrollView/ScrollView',
    'react-native/Libraries/Components/Touchable/TouchableOpacity',
    'react-native/Libraries/Components/Pressable/Pressable',
    'react-native/Libraries/Image/Image',
    'react-native/Libraries/Modal/Modal',
    'react-native/Libraries/Alert/Alert',
    'react-native/Libraries/Animated/Animated',
    'react-native/Libraries/Utilities/Dimensions',
    'react-native/Libraries/Utilities/Platform',
    'react-native/Libraries/Utilities/PixelRatio',
    'react-native/Libraries/AppState/AppState',
    'react-native/Libraries/Linking/Linking',
    'react-native/Libraries/Vibration/Vibration',
    'react-native/Libraries/Core/Timers/JSTimers',
    'react-native/Libraries/Core/ReactNativeVersion',
    'react-native/Libraries/EventEmitter/NativeEventEmitter',
    'react-native/Libraries/BatchedBridge/BatchedBridge',
    'react-native/Libraries/BatchedBridge/NativeModules',
    'react-native/Libraries/Renderer/shims/ReactNative',
    'react-native/Libraries/LogBox/LogBox',
    'react-native/Libraries/Network/fetch',
    'react-native/Libraries/WebSocket/WebSocket',
  )

  return specifiers
}

const RESOLVER_DIR = fs.existsSync(resolve(IGNITE_DIR, 'node_modules')) ? IGNITE_DIR : FACETPACK_DIR
const allSpecifiers = await collectSpecifiers(RESOLVER_DIR)
console.log(`📋 Using ${RESOLVER_DIR.split('/').pop()} for resolver benchmark`)
console.log(`📋 Collected ${allSpecifiers.length} specifiers\n`)

group('Resolver - Cold Cache', () => {
  bench('enhanced-resolve', () => {
    const resolver = ResolverFactory.createResolver({
      fileSystem: fs,
      extensions: EXTENSIONS,
      mainFields: MAIN_FIELDS,
      useSyncFileSystemCalls: true,
    })
    for (const spec of allSpecifiers) {
      try { resolver.resolveSync({}, RESOLVER_DIR, spec) } catch {}
    }
  })

  bench('Facetpack/OXC', () => {
    for (const spec of allSpecifiers) {
      resolveSync(RESOLVER_DIR, spec, OXC_OPTIONS)
    }
  })
})

const warmCachedFs = new CachedInputFileSystem(fs, 60000)
const warmResolver = ResolverFactory.createResolver({
  fileSystem: warmCachedFs,
  extensions: EXTENSIONS,
  mainFields: MAIN_FIELDS,
  useSyncFileSystemCalls: true,
})

for (const spec of allSpecifiers) {
  try { warmResolver.resolveSync({}, RESOLVER_DIR, spec) } catch {}
}

group('Resolver - Warm Cache', () => {
  bench('enhanced-resolve (cached)', () => {
    for (const spec of allSpecifiers) {
      try { warmResolver.resolveSync({}, RESOLVER_DIR, spec) } catch {}
    }
  })

  bench('Facetpack/OXC', () => {
    for (const spec of allSpecifiers) {
      resolveSync(RESOLVER_DIR, spec, OXC_OPTIONS)
    }
  })
})

group('Resolver - Batch API (single FFI call)', () => {
  bench('enhanced-resolve (loop)', () => {
    for (const spec of allSpecifiers) {
      try { warmResolver.resolveSync({}, RESOLVER_DIR, spec) } catch {}
    }
  })

  bench('Facetpack/OXC (loop)', () => {
    for (const spec of allSpecifiers) {
      resolveSync(RESOLVER_DIR, spec, OXC_OPTIONS)
    }
  })

  bench('Facetpack/OXC (batch)', () => {
    resolveBatchSync(RESOLVER_DIR, allSpecifiers, OXC_OPTIONS)
  })
})

console.log('⏱️  Running benchmarks...\n')
await run({ colors: true })

const args = process.argv.slice(2)
const skipFullBuild = args.includes('--transformer-only') || args.includes('-t')

if (!skipFullBuild) {
  console.log('\n' + '='.repeat(50))
  console.log('⏱️  Running full Metro build benchmark...')
  console.log('   (use --transformer-only to skip)\n')

  console.log('🧹 Cleaning projects...')
  await $`rm -rf ${BABEL_DIR}/.expo ${BABEL_DIR}/dist`.quiet()
  await $`rm -rf ${FACETPACK_DIR}/.expo ${FACETPACK_DIR}/dist`.quiet()

  summary(() => {
    bench('Metro + Babel (full build)', async () => {
      await $`cd ${BABEL_DIR} && rm -rf .expo dist && npx expo export --platform ios --output-dir ./dist`.quiet()
    })

    bench('Metro + Facetpack/OXC (full build)', async () => {
      await $`cd ${FACETPACK_DIR} && rm -rf .expo dist && npx expo export --platform ios --output-dir ./dist`.quiet()
    })
  })

  await run({ colors: true })

  console.log('\n📦 Bundle Sizes')
  console.log('='.repeat(50))

  const getBundleSize = async (dir: string) => {
    try {
      const files = await $`find ${dir} -name "*.hbc"`.text()
      const hbcFiles = files.trim().split('\n').filter(f => f.length > 0)
      let totalSize = 0
      for (const file of hbcFiles) {
        const size = await $`stat -f %z ${file}`.text()
        totalSize += parseInt(size.trim()) || 0
      }
      return totalSize
    } catch {
      return 0
    }
  }

  const babelSize = await getBundleSize(`${BABEL_DIR}/dist`)
  const facetpackSize = await getBundleSize(`${FACETPACK_DIR}/dist`)

  console.log(`Babel:     ${(babelSize / 1024 / 1024).toFixed(2)} MB`)
  console.log(`Facetpack: ${(facetpackSize / 1024 / 1024).toFixed(2)} MB`)
} else {
  console.log('\n📝 Skipped full build benchmark (--transformer-only)')
}
