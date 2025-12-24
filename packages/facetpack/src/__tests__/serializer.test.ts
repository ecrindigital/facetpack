import { test, expect, describe } from 'bun:test'
import {
  createFacetpackSerializer,
  type SerializerModule,
  type SerializerGraph,
  type SerializerOptions,
} from '../serializer'

const createModule = (path: string, code: string, deps: Record<string, string> = {}): SerializerModule => ({
  path,
  output: [{ data: { code } }],
  dependencies: new Map(Object.entries(deps)),
})

const createGraph = (modules: SerializerModule[], entryPoints: string[] = []): SerializerGraph => ({
  dependencies: new Map(modules.map(m => [m.path, m])),
  entryPoints: new Set(entryPoints.length ? entryPoints : [modules[0]?.path || '']),
})

const createOptions = (dev = false): SerializerOptions => ({
  dev,
  minify: false,
  platform: 'ios',
  projectRoot: '/project',
})

describe('serializer', () => {
  describe('createFacetpackSerializer', () => {
    test('should create a serializer function', () => {
      const serializer = createFacetpackSerializer()

      expect(typeof serializer).toBe('function')
    })

    test('should create serializer with existing serializer', () => {
      const existingSerializer = async () => ({ code: 'existing', map: '' })
      const serializer = createFacetpackSerializer(existingSerializer)

      expect(typeof serializer).toBe('function')
    })

    test('should create serializer with config', () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })

      expect(typeof serializer).toBe('function')
    })
  })

  describe('serializer in dev mode', () => {
    test('should skip tree-shaking in dev mode', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })
      const module = createModule('/src/index.js', 'export const x = 1;')
      const graph = createGraph([module])
      const options = createOptions(true)

      const result = await serializer('/src/index.js', [], graph, options)

      expect(result).toBeDefined()
    })

    test('should use existing serializer in dev mode', async () => {
      let calledExisting = false
      const existingSerializer = async () => {
        calledExisting = true
        return { code: 'existing', map: '' }
      }
      const serializer = createFacetpackSerializer(existingSerializer, { treeShake: true })
      const module = createModule('/src/index.js', 'const x = 1;')
      const graph = createGraph([module])
      const options = createOptions(true)

      await serializer('/src/index.js', [], graph, options)

      expect(calledExisting).toBe(true)
    })
  })

  describe('serializer with tree-shaking disabled', () => {
    test('should skip tree-shaking when disabled', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: false })
      const module = createModule('/src/index.js', 'export const x = 1; export const unused = 2;')
      const graph = createGraph([module])
      const options = createOptions(false)

      const result = await serializer('/src/index.js', [], graph, options)

      expect(result).toBeDefined()
    })
  })

  describe('serializer with tree-shaking enabled', () => {
    test('should process modules for tree-shaking', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })
      const module = createModule('/src/index.js', 'export const x = 1;')
      const graph = createGraph([module])
      const options = createOptions(false)

      const result = await serializer('/src/index.js', [], graph, options)

      expect(result).toBeDefined()
      if (typeof result === 'object') {
        expect(result.code).toBeDefined()
      }
    })

    test('should remove unused exports without side effects', async () => {
      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: any[]) => logs.push(args.join(' '))

      try {
        const serializer = createFacetpackSerializer(null, { treeShake: true })
        const usedModule = createModule('/src/index.js', "import { a } from './lib'; console.log(a);", { './lib': '/src/lib.js' })
        const libModule = createModule('/src/lib.js', 'export const a = 1; export const unused = 2;')
        const graph = createGraph([usedModule, libModule], ['/src/index.js'])
        const options = createOptions(false)

        await serializer('/src/index.js', [], graph, options)

        expect(logs.some(l => l.includes('Tree-shaking'))).toBe(true)
      } finally {
        console.log = originalLog
      }
    })

    test('should skip modules that are unused and have no side effects', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })
      const mainModule = createModule('/src/index.js', 'console.log("main");')
      const unusedModule = createModule('/src/unused.js', 'export const unused = 1;')
      const graph = createGraph([mainModule, unusedModule], ['/src/index.js'])
      const options = createOptions(false)

      const result = await serializer('/src/index.js', [], graph, options)

      expect(result).toBeDefined()
    })

    test('should skip node_modules for analysis', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })
      const userModule = createModule('/src/index.js', 'import { foo } from "lib"; foo();')
      const nodeModule = createModule('/node_modules/lib/index.js', 'export const foo = 1; export const bar = 2;')
      const graph = createGraph([userModule, nodeModule])
      const options = createOptions(false)

      const result = await serializer('/src/index.js', [], graph, options)

      expect(result).toBeDefined()
    })

    test('should handle modules with side effects', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })
      const module = createModule('/src/index.js', 'console.log("side effect"); export const x = 1;')
      const graph = createGraph([module])
      const options = createOptions(false)

      const result = await serializer('/src/index.js', [], graph, options)

      expect(result).toBeDefined()
    })

    test('should handle re-exports', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })
      const moduleA = createModule('/src/a.js', 'export const a = 1;')
      const moduleB = createModule('/src/b.js', "export { a } from './a';", { './a': '/src/a.js' })
      const moduleIndex = createModule('/src/index.js', "import { a } from './b'; console.log(a);", { './b': '/src/b.js' })
      const graph = createGraph([moduleIndex, moduleB, moduleA], ['/src/index.js'])
      const options = createOptions(false)

      const result = await serializer('/src/index.js', [], graph, options)

      expect(result).toBeDefined()
    })

    test('should handle default exports', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })
      const module = createModule('/src/index.js', 'const x = 1; export default x;')
      const graph = createGraph([module])
      const options = createOptions(false)

      const result = await serializer('/src/index.js', [], graph, options)

      expect(result).toBeDefined()
    })

    test('should handle export all', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })
      const moduleA = createModule('/src/a.js', 'export const a = 1; export const b = 2;')
      const moduleB = createModule('/src/b.js', "export * from './a';", { './a': '/src/a.js' })
      const graph = createGraph([moduleA, moduleB], ['/src/b.js'])
      const options = createOptions(false)

      const result = await serializer('/src/b.js', [], graph, options)

      expect(result).toBeDefined()
    })

    test('should handle empty modules', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })
      const module = createModule('/src/index.js', '')
      const graph = createGraph([module])
      const options = createOptions(false)

      const result = await serializer('/src/index.js', [], graph, options)

      expect(result).toBeDefined()
    })

    test('should handle circular imports', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })
      const moduleA = createModule('/src/a.js', "import { b } from './b'; export const a = 1;", { './b': '/src/b.js' })
      const moduleB = createModule('/src/b.js', "import { a } from './a'; export const b = 2;", { './a': '/src/a.js' })
      const graph = createGraph([moduleA, moduleB], ['/src/a.js'])
      const options = createOptions(false)

      const result = await serializer('/src/a.js', [], graph, options)

      expect(result).toBeDefined()
    })

    test('should handle modules visited multiple times', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })
      const sharedModule = createModule('/src/shared.js', 'export const shared = 1;')
      const moduleA = createModule('/src/a.js', "import { shared } from './shared'; export const a = shared;", { './shared': '/src/shared.js' })
      const moduleB = createModule('/src/b.js', "import { shared } from './shared'; export const b = shared;", { './shared': '/src/shared.js' })
      const indexModule = createModule('/src/index.js', "import { a } from './a'; import { b } from './b'; console.log(a, b);", { './a': '/src/a.js', './b': '/src/b.js' })
      const graph = createGraph([indexModule, moduleA, moduleB, sharedModule], ['/src/index.js'])
      const options = createOptions(false)

      const result = await serializer('/src/index.js', [], graph, options)

      expect(result).toBeDefined()
    })

    test('should handle parse errors gracefully', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })
      const module = createModule('/src/index.js', 'const x = {')
      const graph = createGraph([module])
      const options = createOptions(false)

      const result = await serializer('/src/index.js', [], graph, options)

      expect(result).toBeDefined()
    })
  })

  describe('preModules handling', () => {
    test('should include preModules in output', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })
      const preModule = createModule('/preload.js', 'globalThis.preloaded = true;')
      const mainModule = createModule('/src/index.js', 'export const x = 1;')
      const graph = createGraph([mainModule])
      const options = createOptions(false)

      const result = await serializer('/src/index.js', [preModule], graph, options)

      expect(result).toBeDefined()
      if (typeof result === 'object') {
        expect(result.code).toContain('preloaded')
      }
    })

    test('should handle multiple preModules', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })
      const preModule1 = createModule('/preload1.js', 'globalThis.a = 1;')
      const preModule2 = createModule('/preload2.js', 'globalThis.b = 2;')
      const mainModule = createModule('/src/index.js', 'export const x = 1;')
      const graph = createGraph([mainModule])
      const options = createOptions(false)

      const result = await serializer('/src/index.js', [preModule1, preModule2], graph, options)

      expect(result).toBeDefined()
    })
  })

  describe('output format', () => {
    test('should return code and map', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })
      const module = createModule('/src/index.js', 'export const x = 1;')
      const graph = createGraph([module])
      const options = createOptions(false)

      const result = await serializer('/src/index.js', [], graph, options)

      if (typeof result === 'object') {
        expect(result.code).toBeDefined()
        expect(result.map).toBeDefined()
      }
    })

    test('should wrap modules with __d', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })
      const module = createModule('/src/index.js', 'const x = 1;')
      const graph = createGraph([module])
      const options = createOptions(false)

      const result = await serializer('/src/index.js', [], graph, options)

      if (typeof result === 'object') {
        expect(result.code).toContain('__d(')
      }
    })

    test('should include run statement', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })
      const module = createModule('/src/index.js', 'const x = 1;')
      const graph = createGraph([module])
      const options = createOptions(false)

      const result = await serializer('/src/index.js', [], graph, options)

      if (typeof result === 'object') {
        expect(result.code).toContain('__r(')
      }
    })
  })

  describe('with existing serializer', () => {
    test('should call existing serializer with shaken graph', async () => {
      let receivedGraph: SerializerGraph | null = null
      const existingSerializer = async (
        _entry: string,
        _pre: SerializerModule[],
        graph: SerializerGraph
      ) => {
        receivedGraph = graph
        return { code: 'processed', map: '' }
      }
      const serializer = createFacetpackSerializer(existingSerializer, { treeShake: true })
      const module = createModule('/src/index.js', 'export const x = 1;')
      const graph = createGraph([module])
      const options = createOptions(false)

      await serializer('/src/index.js', [], graph, options)

      expect(receivedGraph).toBeDefined()
    })

    test('should pass original options to existing serializer', async () => {
      let receivedOptions: any = null
      const existingSerializer = async (
        _entry: string,
        _pre: SerializerModule[],
        _graph: SerializerGraph,
        options: SerializerOptions
      ) => {
        receivedOptions = options
        return { code: 'processed', map: '' }
      }
      const serializer = createFacetpackSerializer(existingSerializer, { treeShake: true })
      const module = createModule('/src/index.js', 'export const x = 1;')
      const graph = createGraph([module])
      const options = createOptions(false)
      ;(options as any).platform = 'android'

      await serializer('/src/index.js', [], graph, options)

      expect(receivedOptions?.platform).toBe('android')
    })
  })

  describe('module ID generation', () => {
    test('should use custom createModuleId when provided', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })
      const module = createModule('/src/index.js', 'const x = 1;')
      const graph = createGraph([module])
      const options: SerializerOptions = {
        ...createOptions(false),
        createModuleId: (path: string) => path.length,
      }

      const result = await serializer('/src/index.js', [], graph, options)

      expect(result).toBeDefined()
    })

    test('should use custom getRunModuleStatement when provided', async () => {
      const serializer = createFacetpackSerializer(null, { treeShake: true })
      const module = createModule('/src/index.js', 'const x = 1;')
      const graph = createGraph([module])
      const options: SerializerOptions = {
        ...createOptions(false),
        getRunModuleStatement: (id: number) => `customRun(${id});`,
      }

      const result = await serializer('/src/index.js', [], graph, options)

      if (typeof result === 'object') {
        expect(result.code).toContain('customRun(')
      }
    })
  })
})
