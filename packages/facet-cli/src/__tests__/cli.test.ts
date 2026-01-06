import { describe, test, expect } from 'bun:test'
import { main } from '../cli'

describe('CLI', () => {
  test('should have correct meta', () => {
    expect(main.meta?.name).toBe('facet')
    expect(main.meta?.version).toBe('0.1.0')
    expect(main.meta?.description).toBeDefined()
  })

  test('should have subcommands', () => {
    expect(main.subCommands).toBeDefined()
    expect(main.subCommands?.dev).toBeDefined()
    expect(main.subCommands?.build).toBeDefined()
    expect(main.subCommands?.doctor).toBeDefined()
  })
})

describe('Commands', () => {
  test('dev command should have correct meta', () => {
    const dev = main.subCommands?.dev
    expect(dev?.meta?.name).toBe('dev')
    expect(dev?.meta?.description).toBeDefined()
  })

  test('build command should have correct meta', () => {
    const build = main.subCommands?.build
    expect(build?.meta?.name).toBe('build')
    expect(build?.meta?.description).toBeDefined()
  })

  test('doctor command should have correct meta', () => {
    const doctor = main.subCommands?.doctor
    expect(doctor?.meta?.name).toBe('doctor')
    expect(doctor?.meta?.description).toBeDefined()
  })
})
