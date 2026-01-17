import { test, expect, describe, beforeEach, afterEach } from 'bun:test'
import { transform, createTransformer, setTransformerOptions } from '../transformer'
import type { TransformParams } from '../types'

const originalEnv = { ...process.env }

const createParams = (filename: string, src: string, dev = true): TransformParams => ({
  filename,
  src,
  options: {
    dev,
    hot: false,
    minify: false,
    projectRoot: '/project',
    publicPath: '/assets',
  },
})

describe('transformer', () => {
  beforeEach(() => {
    setTransformerOptions({})
    delete process.env.FACETPACK_DEBUG
    delete process.env.FACETPACK_OPTIONS
    delete process.env.FACETPACK_FALLBACK_TRANSFORMER
  })

  afterEach(() => {
    delete process.env.FACETPACK_DEBUG
    delete process.env.FACETPACK_OPTIONS
    delete process.env.FACETPACK_FALLBACK_TRANSFORMER
  })

  describe('setTransformerOptions', () => {
    test('should set global options', () => {
      setTransformerOptions({ jsx: false })

      expect(() => transform(createParams('test.ts', 'const x = 1;'))).not.toThrow()
    })

    test('should override default options', () => {
      setTransformerOptions({ jsxRuntime: 'classic' })

      const result = transform(createParams('test.tsx', 'const App = () => <div>Hello</div>;'))

      expect(result.code).toContain('createElement')
    })
  })

  describe('transform', () => {
    test('should transform TypeScript code', () => {
      const result = transform(createParams('test.ts', 'const x: number = 1;'))

      expect(result.code).not.toContain(':')
      expect(result.code).toContain('const x = 1')
    })

    test('should transform TSX code', () => {
      const result = transform(createParams('test.tsx', 'const App = () => <div>Hello</div>;'))

      expect(result.code).not.toContain('<div>')
      expect(result.code).toContain('jsx')
    })

    test('should transform JSX code', () => {
      const result = transform(createParams('test.jsx', 'const App = () => <div>Hello</div>;'))

      expect(result.code).not.toContain('<div>')
    })

    test('should transform JavaScript code', () => {
      const result = transform(createParams('test.js', 'const x = 1;'))

      expect(result.code).toContain('const x = 1')
    })

    test('should handle ES modules', () => {
      const code = `
        import React from 'react';
        export const Component = () => <div />;
      `
      const result = transform(createParams('test.tsx', code))

      expect(result.code).toContain('import')
      expect(result.code).toContain('export')
    })

    test('should generate source map in dev mode', () => {
      const result = transform(createParams('test.ts', 'const x = 1;', true))

      expect(result.map).toBeDefined()
    })

    test('should handle complex TypeScript interfaces', () => {
      const code = `
        interface User {
          id: number;
          name: string;
          email?: string;
        }

        const user: User = { id: 1, name: 'Test' };
      `
      const result = transform(createParams('test.ts', code))

      expect(result.code).not.toContain('interface')
      expect(result.code).not.toContain(': User')
    })

    test('should handle type assertions', () => {
      const code = 'const x = (value as string).toUpperCase();'
      const result = transform(createParams('test.ts', code))

      expect(result.code).not.toContain(' as ')
    })

    test('should handle generics', () => {
      const code = 'function identity<T>(arg: T): T { return arg; }'
      const result = transform(createParams('test.ts', code))

      expect(result.code).not.toContain('<T>')
    })

    test('should handle decorators syntax', () => {
      const code = `
        function log(target: any) { return target; }
        class Service {}
      `
      const result = transform(createParams('test.ts', code))

      expect(result.code).toBeDefined()
    })

    test('should handle async/await', () => {
      const code = `
        async function fetchData(): Promise<string> {
          return await fetch('/api').then(r => r.text());
        }
      `
      const result = transform(createParams('test.ts', code))

      expect(result.code).toContain('async')
      expect(result.code).toContain('await')
    })

    test('should handle empty code', () => {
      const result = transform(createParams('test.ts', ''))

      expect(result.code).toBeDefined()
    })

    test('should handle unicode characters', () => {
      const code = 'const emoji = "🚀";'
      const result = transform(createParams('test.ts', code))

      expect(result.code).toContain('🚀')
    })

    test('should handle node_modules files with fallback', () => {
      const result = transform(createParams('/project/node_modules/lib/index.js', 'const x = 1;'))

      expect(result).toBeDefined()
      expect(result.code).toBeDefined()
    })

    test('should use fallback for unsupported extensions', () => {
      const result = transform(createParams('test.unknown', 'const x = 1;'))

      expect(result).toBeDefined()
    })

    test('should handle files without extension', () => {
      const result = transform(createParams('/project/Makefile', 'const x = 1;'))

      expect(result).toBeDefined()
    })

    test('should handle JSX classic runtime', () => {
      setTransformerOptions({ jsxRuntime: 'classic' })
      const result = transform(createParams('test.tsx', '<div>Hello</div>'))

      expect(result.code).toContain('createElement')
    })

    test('should handle JSX automatic runtime', () => {
      setTransformerOptions({ jsxRuntime: 'automatic' })
      const result = transform(createParams('test.tsx', '<div>Hello</div>'))

      expect(result.code).toContain('jsx')
    })

    test('should handle custom jsxImportSource', () => {
      setTransformerOptions({ jsxImportSource: 'preact' })
      const result = transform(createParams('test.tsx', '<div>Hello</div>'))

      expect(result.code).toContain('preact')
    })

    test('should handle spread props in JSX', () => {
      const code = 'const props = { a: 1 }; const App = () => <div {...props} />;'
      const result = transform(createParams('test.tsx', code))

      expect(result.code).toBeDefined()
    })

    test('should handle fragments', () => {
      const code = 'const App = () => <><div /><span /></>;'
      const result = transform(createParams('test.tsx', code))

      expect(result.code).not.toContain('<>')
    })

    test('should handle conditional rendering', () => {
      const code = 'const App = ({ show }) => show ? <div>Yes</div> : <div>No</div>;'
      const result = transform(createParams('test.tsx', code))

      expect(result.code).toBeDefined()
    })

    test('should handle map rendering', () => {
      const code = `
        const items = [1, 2, 3];
        const App = () => <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>;
      `
      const result = transform(createParams('test.tsx', code))

      expect(result.code).toBeDefined()
    })

    test('should log in debug mode', () => {
      process.env.FACETPACK_DEBUG = 'true'
      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: any[]) => logs.push(args.join(' '))

      try {
        transform(createParams('test.ts', 'const x = 1;'))
        expect(logs.some(l => l.includes('[Facetpack]'))).toBe(true)
      } finally {
        console.log = originalLog
      }
    })

    test('should log fallback in debug mode', () => {
      process.env.FACETPACK_DEBUG = 'true'
      const logs: string[] = []
      const originalLog = console.log
      console.log = (...args: any[]) => logs.push(args.join(' '))

      try {
        transform(createParams('/node_modules/lib/index.js', 'const x = 1;'))
        expect(logs.some(l => l.includes('BABEL'))).toBe(true)
      } finally {
        console.log = originalLog
      }
    })

    test('should throw on transform errors', () => {
      expect(() => {
        transform(createParams('test.ts', 'const x: = 1;'))
      }).toThrow()
    })

    test('should throw with detailed error message on syntax errors', () => {
      try {
        transform(createParams('test.tsx', '<div><span></div>'))
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('ERROR')
      }
    })

    test('should handle require syntax', () => {
      const code = `
        const fs = require('fs');
        const path = require('path');
        module.exports = { fs, path };
      `
      const result = transform(createParams('test.js', code))
      expect(result.code).toContain('require')
    })
  })

  describe('createTransformer', () => {
    test('should create a transformer instance', () => {
      const transformer = createTransformer()

      expect(transformer).toBeDefined()
      expect(typeof transformer.transform).toBe('function')
    })

    test('should create transformer with custom options', () => {
      const transformer = createTransformer({
        jsx: true,
        typescript: true,
        jsxRuntime: 'automatic',
      })

      expect(transformer).toBeDefined()
    })

    test('transformer.transform should transform code', () => {
      const transformer = createTransformer()
      const result = transformer.transform(createParams('test.ts', 'const x: number = 1;'))

      expect(result.code).not.toContain(':')
    })

    test('transformer should use provided options', () => {
      const transformer = createTransformer({ jsxRuntime: 'classic' })
      const result = transformer.transform(createParams('test.tsx', '<div>Hello</div>'))

      expect(result.code).toContain('createElement')
    })

    test('transformer should handle node_modules with fallback', () => {
      const transformer = createTransformer()
      const result = transformer.transform(
        createParams('/project/node_modules/lib/index.js', 'const x = 1;')
      )

      expect(result).toBeDefined()
    })

    test('transformer should generate source map in dev mode', () => {
      const transformer = createTransformer()
      const result = transformer.transform(createParams('test.ts', 'const x = 1;', true))

      expect(result.map).toBeDefined()
    })

    test('transformer should not generate source map in prod mode', () => {
      const transformer = createTransformer()
      const result = transformer.transform(createParams('test.ts', 'const x = 1;', false))

      expect(result.map).toBeNull()
    })
  })

  describe('class patterns - edge cases', () => {
    test('should handle class with private field exported as default instance', () => {
      const code = `
        class StripeService {
          private initialized = false;
        }
        export default new StripeService();
      `
      const result = transform(createParams('stripeService.ts', code))

      expect(result.code).toContain('StripeService')
      expect(result.code).toContain('new')
    })

    test('should handle class with private field using # syntax', () => {
      const code = `
        class Service {
          #initialized = false;

          isInitialized() {
            return this.#initialized;
          }
        }
        export default new Service();
      `
      const result = transform(createParams('service.ts', code))

      expect(result.code).toBeDefined()
      expect(result.code).toContain('class')
    })

    test('should handle class with TypeScript private keyword', () => {
      const code = `
        class StripeService {
          private initialized: boolean = false;

          async initialize(): Promise<void> {
            if (this.initialized) return;
            this.initialized = true;
          }
        }
        export default new StripeService();
      `
      const result = transform(createParams('stripeService.ts', code))

      expect(result.code).toContain('StripeService')
      expect(result.code).toContain('async')
      expect(result.code).toContain('new')
      expect(result.code).not.toContain('private')
    })

    test('should handle class with constructor and private fields', () => {
      const code = `
        class ApiService {
          private baseUrl: string;
          private apiKey: string;

          constructor(baseUrl: string, apiKey: string) {
            this.baseUrl = baseUrl;
            this.apiKey = apiKey;
          }
        }
        export default new ApiService('https://api.example.com', 'key123');
      `
      const result = transform(createParams('api.ts', code))

      expect(result.code).toContain('ApiService')
      expect(result.code).toContain('constructor')
    })

    test('should handle class with static methods', () => {
      const code = `
        class Utils {
          private static instance: Utils;

          static getInstance(): Utils {
            if (!Utils.instance) {
              Utils.instance = new Utils();
            }
            return Utils.instance;
          }
        }
        export default Utils.getInstance();
      `
      const result = transform(createParams('utils.ts', code))

      expect(result.code).toContain('Utils')
      expect(result.code).toContain('static')
    })

    test('should handle singleton pattern with named and default export', () => {
      const code = `
        class FirebaseService {
          private app: any;

          initialize() {
            console.log('init');
          }
        }

        const firebaseService = new FirebaseService();
        export { FirebaseService };
        export default firebaseService;
      `
      const result = transform(createParams('firebase.ts', code))

      expect(result.code).toContain('FirebaseService')
      expect(result.code).toContain('export')
    })

    test('should handle class extending another class', () => {
      const code = `
        class BaseService {
          protected initialized = false;
        }

        class StripeService extends BaseService {
          async initialize() {
            this.initialized = true;
          }
        }
        export default new StripeService();
      `
      const result = transform(createParams('stripe.ts', code))

      expect(result.code).toContain('BaseService')
      expect(result.code).toContain('StripeService')
      expect(result.code).toContain('extends')
    })

    test('should handle class implementing interface', () => {
      const code = `
        interface IService {
          initialize(): Promise<void>;
        }

        class StripeService implements IService {
          async initialize(): Promise<void> {
            console.log('initialized');
          }
        }
        export default new StripeService();
      `
      const result = transform(createParams('stripe.ts', code))

      expect(result.code).not.toContain('interface')
      expect(result.code).not.toContain('implements')
      expect(result.code).toContain('StripeService')
    })

    test('should handle class with getter and setter', () => {
      const code = `
        class ConfigService {
          private _config: any = {};

          get config() {
            return this._config;
          }

          set config(value: any) {
            this._config = value;
          }
        }
        export default new ConfigService();
      `
      const result = transform(createParams('config.ts', code))

      expect(result.code).toContain('get')
      expect(result.code).toContain('set')
      expect(result.code).toContain('ConfigService')
    })

    test('should handle class with async methods and error handling', () => {
      const code = `
        class StripeService {
          private initialized = false;

          async initialize() {
            if (this.initialized) return;

            try {
              await this.setup();
              this.initialized = true;
            } catch (error) {
              console.error("Failed to initialize:", error);
              throw error;
            }
          }

          private async setup() {
            await Promise.resolve();
          }
        }
        export default new StripeService();
      `
      const result = transform(createParams('stripe.ts', code))

      expect(result.code).toContain('StripeService')
      expect(result.code).toContain('async')
      expect(result.code).toContain('try')
      expect(result.code).toContain('catch')
    })

    test('should handle class with arrow function properties', () => {
      const code = `
        class EventService {
          private handlers: Map<string, Function> = new Map();

          handleEvent = async (event: any) => {
            const handler = this.handlers.get(event.type);
            if (handler) await handler(event);
          };
        }
        export default new EventService();
      `
      const result = transform(createParams('event.ts', code))

      expect(result.code).toContain('EventService')
      expect(result.code).toContain('handleEvent')
    })

    test('should handle class with decorators-like patterns', () => {
      const code = `
        function injectable(target: any) {
          return target;
        }

        class UserService {
          private users: any[] = [];

          getUsers() {
            return this.users;
          }
        }
        export default new UserService();
      `
      const result = transform(createParams('user.ts', code))

      expect(result.code).toContain('UserService')
    })

    test('should preserve class name when instantiated inline in export', () => {
      const code = `
        export default new class StripeService {
          private initialized = false;

          async initialize() {
            this.initialized = true;
          }
        }();
      `
      const result = transform(createParams('stripe.ts', code))

      expect(result.code).toContain('class')
      expect(result.code).toContain('new')
    })

    test('should handle anonymous class exported as default', () => {
      const code = `
        export default new class {
          private value = 42;

          getValue() {
            return this.value;
          }
        }();
      `
      const result = transform(createParams('anon.ts', code))

      expect(result.code).toContain('class')
      expect(result.code).toContain('getValue')
    })

    test('should handle the exact StripeService pattern from user code', () => {
      const code = `
        import { initStripe } from "@stripe/stripe-react-native";

        const STRIPE_PUBLISHABLE_KEY = "pk_test_123";

        export interface StripeAccountStatus {
          hasAccount: boolean;
          accountId?: string;
        }

        class StripeService {
          private initialized = false;

          async initialize() {
            if (this.initialized) return;

            try {
              await initStripe({
                publishableKey: STRIPE_PUBLISHABLE_KEY,
              });
              this.initialized = true;
            } catch (error) {
              console.error("Failed to initialize Stripe:", error);
              throw error;
            }
          }

          async createConnectAccount(userId: string): Promise<{ accountId: string }> {
            return { accountId: "acct_123" };
          }
        }

        export default new StripeService();
      `
      const result = transform(createParams('stripeService.ts', code))

      expect(result.code).toContain('StripeService')
      expect(result.code).toContain('new')
      expect(result.code).toContain('initialize')
      expect(result.code).toContain('createConnectAccount')

      expect(result.code).not.toContain('interface')

      expect(result.code).not.toContain('private')

      expect(result.code).not.toContain(': string')
      expect(result.code).not.toContain(': Promise')

      expect(result.code).toMatch(/class\s+StripeService/)
    })

    test('should handle re-export patterns', () => {
      const code = `
        class StripeService {
          initialize() {}
        }

        const stripeService = new StripeService();

        export { StripeService };
        export default stripeService;
      `
      const result = transform(createParams('stripe.ts', code))

      expect(result.code).toContain('StripeService')
      expect(result.code).toContain('stripeService')
      expect(result.code).toContain('export')
    })

    test('should handle multiple classes in same file', () => {
      const code = `
        class ServiceA {
          private a = 1;
        }

        class ServiceB {
          private b = 2;
        }

        export const serviceA = new ServiceA();
        export const serviceB = new ServiceB();
        export default serviceA;
      `
      const result = transform(createParams('services.ts', code))

      expect(result.code).toContain('ServiceA')
      expect(result.code).toContain('ServiceB')
    })

    test('should handle class with readonly properties', () => {
      const code = `
        class Config {
          readonly apiUrl: string = 'https://api.example.com';
          private readonly secretKey: string = 'secret';
        }
        export default new Config();
      `
      const result = transform(createParams('config.ts', code))

      expect(result.code).toContain('Config')
      expect(result.code).not.toContain('readonly')
    })

    test('should handle class with parameter properties', () => {
      const code = `
        class Service {
          constructor(
            private readonly name: string,
            public value: number
          ) {}
        }
        export default new Service('test', 42);
      `
      const result = transform(createParams('service.ts', code))

      expect(result.code).toContain('Service')
      expect(result.code).toContain('constructor')
    })
  })
})
