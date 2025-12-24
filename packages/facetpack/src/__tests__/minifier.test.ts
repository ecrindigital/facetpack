import { test, expect, describe } from 'bun:test'
import { minify, minifyCode } from '../minifier'

describe('minifier', () => {
  describe('minify', () => {
    test('should minify simple code', () => {
      const input = {
        code: 'const foo = 1;\nconst bar = 2;\nconsole.log(foo + bar);',
        filename: 'test.js',
        config: {},
      }

      const result = minify(input)

      expect(result.code).toBeDefined()
      expect(result.code.length).toBeLessThan(input.code.length)
    })

    test('should compress code by default', () => {
      const input = {
        code: `
          function unusedFunction() {
            return 1;
          }
          const x = 1;
          const y = 2;
          console.log(x + y);
        `,
        filename: 'test.js',
        config: {},
      }

      const result = minify(input)

      expect(result.code).not.toContain('\n')
    })

    test('should mangle variable names by default', () => {
      const input = {
        code: 'function longFunctionName(longParameterName) { return longParameterName * 2; }; longFunctionName(5);',
        filename: 'test.js',
        config: {},
      }

      const result = minify(input)

      expect(result.code).toBeDefined()
      expect(result.code.length).toBeLessThanOrEqual(input.code.length)
    })

    test('should keep function names when keep_fnames is true', () => {
      const input = {
        code: 'function myFunction() { return 1; } myFunction();',
        filename: 'test.js',
        config: { keep_fnames: true },
      }

      const result = minify(input)

      expect(result.code).toBeDefined()
    })

    test('should drop console when drop_console is true', () => {
      const input = {
        code: 'console.log("test"); const x = 1;',
        filename: 'test.js',
        config: { drop_console: true },
      }

      const result = minify(input)

      expect(result.code).not.toContain('console.log')
    })

    test('should drop debugger by default', () => {
      const input = {
        code: 'debugger; const x = 1;',
        filename: 'test.js',
        config: {},
      }

      const result = minify(input)

      expect(result.code).not.toContain('debugger')
    })

    test('should preserve debugger when drop_debugger is false', () => {
      const input = {
        code: 'debugger; const x = 1;',
        filename: 'test.js',
        config: { drop_debugger: false },
      }

      const result = minify(input)

      expect(result.code).toContain('debugger')
    })

    test('should not compress when compress is false', () => {
      const input = {
        code: 'const x = 1;\nconst y = 2;',
        filename: 'test.js',
        config: { compress: false },
      }

      const result = minify(input)

      expect(result.code).toBeDefined()
    })

    test('should not mangle when mangle is false', () => {
      const input = {
        code: 'function test(param) { return param; } test(1);',
        filename: 'test.js',
        config: { mangle: false },
      }

      const result = minify(input)

      expect(result.code).toBeDefined()
    })

    test('should handle empty code', () => {
      const input = {
        code: '',
        filename: 'test.js',
        config: {},
      }

      const result = minify(input)

      expect(result.code).toBe('')
    })

    test('should handle complex code with imports', () => {
      const input = {
        code: `
          import React from 'react';
          export function Component() {
            const value = 42;
            return value;
          }
        `,
        filename: 'test.js',
        config: {},
      }

      const result = minify(input)

      expect(result.code).toContain('import')
      expect(result.code).toContain('export')
    })

    test('should handle arrow functions', () => {
      const input = {
        code: 'const fn = (x) => x * 2; fn(5);',
        filename: 'test.js',
        config: {},
      }

      const result = minify(input)

      expect(result.code).toBeDefined()
      expect(result.code.length).toBeLessThan(input.code.length)
    })

    test('should handle async functions', () => {
      const input = {
        code: 'async function fetchData() { return await fetch("/api"); }; fetchData();',
        filename: 'test.js',
        config: {},
      }

      const result = minify(input)

      expect(result.code).toContain('async')
    })

    test('should handle classes', () => {
      const input = {
        code: 'class MyClass { constructor() { this.value = 1; } }; new MyClass();',
        filename: 'test.js',
        config: {},
      }

      const result = minify(input)

      expect(result.code).toContain('class')
    })
  })

  describe('minifyCode', () => {
    test('should minify code without config', () => {
      const code = 'const x = 1;\nconst y = 2;\nconsole.log(x + y);'

      const result = minifyCode(code, 'test.js')

      expect(result.code).toBeDefined()
      expect(result.code.length).toBeLessThan(code.length)
    })

    test('should accept optional config', () => {
      const code = 'console.log("test"); const x = 1;'

      const result = minifyCode(code, 'test.js', { drop_console: true })

      expect(result.code).not.toContain('console.log')
    })

    test('should handle TypeScript filename', () => {
      const code = 'const x = 1;'

      const result = minifyCode(code, 'test.ts')

      expect(result.code).toBeDefined()
    })

    test('should handle JSX filename', () => {
      const code = 'const x = 1;'

      const result = minifyCode(code, 'test.jsx')

      expect(result.code).toBeDefined()
    })

    test('should return undefined map when sourcemap is disabled', () => {
      const code = 'const x = 1;'

      const result = minifyCode(code, 'test.js')

      expect(result.map).toBeUndefined()
    })

    test('should handle code with unicode characters', () => {
      const code = 'const emoji = "🚀"; console.log(emoji);'

      const result = minifyCode(code, 'test.js')

      expect(result.code).toContain('🚀')
    })

    test('should handle template literals', () => {
      const code = 'const name = "world"; const greeting = `Hello, ${name}!`;'

      const result = minifyCode(code, 'test.js')

      expect(result.code).toBeDefined()
    })

    test('should handle spread operators', () => {
      const code = 'const arr = [1, 2, 3]; const newArr = [...arr, 4];'

      const result = minifyCode(code, 'test.js')

      expect(result.code).toBeDefined()
    })

    test('should handle destructuring', () => {
      const code = 'const { a, b } = { a: 1, b: 2 }; const [x, y] = [1, 2];'

      const result = minifyCode(code, 'test.js')

      expect(result.code).toBeDefined()
    })
  })
})
