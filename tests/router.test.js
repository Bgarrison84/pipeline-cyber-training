// tests/router.test.js
// Wave 0 stub — matchRoute imported from src/router.js (not yet created until Plan 02)
// These tests will be RED until src/router.js is created and matchRoute is exported.
import { describe, it, expect } from 'vitest'
import { matchRoute } from '../src/router.js'

describe('matchRoute', () => {
  it('matches root hash to home view', () => {
    expect(matchRoute('#/')).toEqual({ view: 'home', params: {} })
  })
  it('extracts moduleId from module route', () => {
    expect(matchRoute('#/module/logging-auditing')).toEqual({
      view: 'module',
      params: { moduleId: 'logging-auditing' }
    })
  })
  it('returns not-found for unknown hash', () => {
    expect(matchRoute('#/unknown').view).toBe('not-found')
  })
  it('handles empty hash as home', () => {
    expect(matchRoute('').view).toBe('home')
  })
  it('matches lesson route and extracts moduleId and lessonId', () => {
    expect(matchRoute('#/lesson/logging-auditing/intro')).toEqual({
      view: 'lesson',
      params: { moduleId: 'logging-auditing', lessonId: 'intro' }
    })
  })
})
