// tests/compliance-refs.test.js
// Tests DATA-01: compliance-refs.json shape validation
// These tests CAN be green once Task 3 creates the JSON file.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const raw = readFileSync(resolve(__dirname, '../public/data/compliance-refs.json'), 'utf-8')
const refs = JSON.parse(raw)

describe('compliance-refs.json', () => {
  it('has schemaVersion equal to 1', () => {
    expect(refs.schemaVersion).toBe(1)
  })

  it('has directives.TSA.shortName as a non-empty string', () => {
    expect(typeof refs.directives.TSA.shortName).toBe('string')
    expect(refs.directives.TSA.shortName.length).toBeGreaterThan(0)
  })

  it('has directives.NIST.shortName as a non-empty string', () => {
    expect(typeof refs.directives.NIST.shortName).toBe('string')
    expect(refs.directives.NIST.shortName.length).toBeGreaterThan(0)
  })

  it('parses without error and has directives object', () => {
    expect(refs).toBeDefined()
    expect(typeof refs.directives).toBe('object')
    expect(refs.directives).not.toBeNull()
  })

  // Phase 09 Wave 0 — RED until Wave 1 adds status + expiryDate to compliance-refs.json
  it('has directives.TSA.status equal to "expired"', () => {
    expect(refs.directives.TSA.status).toBe('expired')
  })

  it('has directives.TSA.expiryDate equal to "2026-05-02"', () => {
    expect(refs.directives.TSA.expiryDate).toBe('2026-05-02')
  })
})
