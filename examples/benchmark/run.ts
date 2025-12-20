/**
 * Facetpack Benchmark
 * Compare: Babel vs Facetpack/OXC
 * - Transformer only (micro benchmark)
 * - Full Metro build (macro benchmark)
 */
import { bench, run, summary, group } from 'mitata'
import { $ } from 'bun'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dir, '..')
const BABEL_DIR = resolve(ROOT, 'expo-babel')
const FACETPACK_DIR = resolve(ROOT, 'expo-facetpack')

console.log('🚀 Facetpack Benchmark')
console.log('='.repeat(50))
console.log('')

console.log('📦 Loading transformers...')

import * as babel from '@babel/core'

import { transformSync, JsxRuntime } from 'facetpack-native'

const TEST_CODE = `
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';

interface Props {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
}

export default function App({ title, onPress, disabled = false }: Props) {
  const [count, setCount] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://api.example.com/users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handlePress = useCallback(() => {
    setCount(prev => prev + 1);
    onPress?.();
  }, [onPress]);

  const doubleCount = useMemo(() => count * 2, [count]);

  const renderUser = (user: User) => (
    <View key={user.id} style={styles.userCard}>
      <Text style={styles.userName}>{user.name}</Text>
      <Text style={styles.userEmail}>{user.email}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.count}>Count: {count} (Double: {doubleCount})</Text>

      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={handlePress}
        disabled={disabled}
      >
        <Text style={styles.buttonText}>Increment</Text>
      </TouchableOpacity>

      {loading ? (
        <Text>Loading users...</Text>
      ) : (
        <View style={styles.userList}>
          {users.map(renderUser)}
        </View>
      )}

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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  count: {
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userList: {
    marginTop: 20,
    width: '100%',
  },
  userCard: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
});
`

// Babel options
const babelOptions = {
  filename: 'App.tsx',
  presets: [
    ['@babel/preset-react', { runtime: 'automatic' }],
    ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
  ],
  sourceMaps: false,
}

// OXC options
const oxcOptions = {
  jsx: true,
  jsxRuntime: JsxRuntime.Automatic,
  jsxImportSource: 'react',
  typescript: true,
  sourcemap: false,
}

console.log('✅ Transformers loaded\n')

group('Transformer (single file)', () => {
  bench('Babel', () => {
    babel.transformSync(TEST_CODE, babelOptions)
  })

  bench('Facetpack/OXC', () => {
    transformSync('App.tsx', TEST_CODE, oxcOptions)
  })
})

// Run transformer benchmark
console.log('⏱️  Running transformer benchmark...\n')
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
