import test from 'ava'

import {
  FacetPack,
  parseSync,
  transformSync,
  SourceType,
  JsxRuntime,
} from '../index'

test('FacetPack class instantiation', (t) => {
  const facetpack = new FacetPack()
  t.truthy(facetpack)
})

test('parseSync - basic JavaScript', (t) => {
  const result = parseSync('test.js', 'const x = 1;')

  t.false(result.panicked)
  t.is(result.errors.length, 0)
  t.true(result.program.includes('const'))
})

test('parseSync - TypeScript', (t) => {
  const result = parseSync('test.ts', 'const x: number = 1;')

  t.false(result.panicked)
  t.is(result.errors.length, 0)
})

test('parseSync - TSX/JSX', (t) => {
  const result = parseSync('test.tsx', 'const App = () => <div>Hello</div>;')

  t.false(result.panicked)
  t.is(result.errors.length, 0)
})

test('parseSync - with explicit source type', (t) => {
  const result = parseSync('test.txt', 'const x = 1;', {
    sourceType: SourceType.Module,
  })

  t.false(result.panicked)
  t.is(result.errors.length, 0)
})

test('parseSync - syntax error handling', (t) => {
  const result = parseSync('test.js', 'const x = ;')

  t.true(result.errors.length > 0)
})

test('FacetPack.parse - instance method', (t) => {
  const facetpack = new FacetPack()
  const result = facetpack.parse('test.js', 'const x = 1;')

  t.false(result.panicked)
  t.is(result.errors.length, 0)
})

test('transformSync - TypeScript stripping', (t) => {
  const result = transformSync('test.ts', 'const x: number = 1;')

  t.is(result.errors.length, 0)
  t.false(result.code.includes(':'))
  t.true(result.code.includes('const x = 1'))
})

test('transformSync - JSX to JS (automatic runtime)', (t) => {
  const result = transformSync('test.tsx', 'const App = () => <div>Hello</div>;')

  t.is(result.errors.length, 0)
  t.false(result.code.includes('<div>'))
  t.true(result.code.includes('jsx'))
})

test('transformSync - JSX to JS (classic runtime)', (t) => {
  const result = transformSync('test.tsx', 'const App = () => <div>Hello</div>;', {
    jsxRuntime: JsxRuntime.Classic,
  })

  t.is(result.errors.length, 0)
  t.false(result.code.includes('<div>'))
  t.true(result.code.includes('createElement'))
})

test('transformSync - with source map', (t) => {
  const result = transformSync('test.ts', 'const x: number = 1;', {
    sourcemap: true,
  })

  t.is(result.errors.length, 0)
  t.truthy(result.map)
  t.true(result.map!.includes('mappings'))
})

test('transformSync - complex TypeScript + JSX', (t) => {
  const code = `
    interface Props {
      name: string;
    }

    const Greeting: React.FC<Props> = ({ name }) => {
      return <div>Hello, {name}!</div>;
    };

    export default Greeting;
  `
  const result = transformSync('Greeting.tsx', code)

  t.is(result.errors.length, 0)
  t.false(result.code.includes('interface'))
  t.false(result.code.includes(': React.FC'))
  t.false(result.code.includes('<div>'))
})

test('FacetPack.transform - instance method', (t) => {
  const facetpack = new FacetPack()
  const result = facetpack.transform('test.ts', 'const x: number = 1;')

  t.is(result.errors.length, 0)
  t.false(result.code.includes(':'))
})

test('empty source code', (t) => {
  const parseResult = parseSync('test.js', '')
  t.false(parseResult.panicked)

  const transformResult = transformSync('test.js', '')
  t.is(transformResult.errors.length, 0)
})

test('unicode in source code', (t) => {
  const code = 'const emoji = "🚀";'
  const result = transformSync('test.js', code)

  t.is(result.errors.length, 0)
  t.true(result.code.includes('🚀'))
})

test('ES modules syntax', (t) => {
  const code = `
    import { useState } from 'react';
    export const useCounter = () => useState(0);
  `
  const result = transformSync('hook.ts', code)

  t.is(result.errors.length, 0)
  t.true(result.code.includes('import'))
  t.true(result.code.includes('export'))
})
