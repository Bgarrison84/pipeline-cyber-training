// tests/progress-store.test.js
// Wave 1 — covers ASSESS-03, DATA-04, DATA-05
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { progressStore, _migrateForTesting } from '../src/progress-store.js'

// ──────────────────────────────────────────────────────────────────────────────
// init — normal storage
// ──────────────────────────────────────────────────────────────────────────────
describe('init — normal storage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    progressStore.resetProgress()
    localStorage.clear()
  })

  it('isStorageAvailable() returns true after init() in normal environment', async () => {
    await progressStore.init()
    expect(progressStore.isStorageAvailable()).toBe(true)
  })

  it('localStorage key contains JSON with schemaVersion === 1 after init()', async () => {
    await progressStore.init()
    const raw = localStorage.getItem('pipeline-cyber-training:progress')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw)
    expect(parsed.schemaVersion).toBe(1)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// init — blank schema written on first load
// ──────────────────────────────────────────────────────────────────────────────
describe('init — blank schema written on first load', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    progressStore.resetProgress()
    localStorage.clear()
  })

  it('getLessonProgress returns defaults when localStorage is empty', async () => {
    localStorage.clear()
    await progressStore.init()
    const progress = progressStore.getLessonProgress('logging-auditing', 'intro')
    expect(progress).toEqual({ visited: false, completed: false })
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// storage fallback
// ──────────────────────────────────────────────────────────────────────────────
describe('storage fallback', () => {
  // Use a mock localStorage that throws on setItem to simulate QuotaExceededError.
  // vi.stubGlobal is more reliable than vi.spyOn in happy-dom across multiple tests.
  let originalLocalStorage

  beforeEach(() => {
    // Save real localStorage and replace with a version that throws on setItem
    originalLocalStorage = globalThis.localStorage
    const store = {}
    const failingStorage = {
      setItem(_key, _value) {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError')
      },
      getItem(key) { return store[key] ?? null },
      removeItem(key) { delete store[key] },
      clear() { for (const k of Object.keys(store)) delete store[k] },
      get length() { return Object.keys(store).length },
      key(i) { return Object.keys(store)[i] ?? null },
    }
    vi.stubGlobal('localStorage', failingStorage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    progressStore.resetProgress()
    // After restoring localStorage, also clear the real localStorage
    originalLocalStorage.clear()
  })

  it('init() resolves without throwing when setItem throws QuotaExceededError', async () => {
    await expect(progressStore.init()).resolves.not.toThrow()
  })

  it('isStorageAvailable() returns false when setItem throws', async () => {
    await progressStore.init()
    expect(progressStore.isStorageAvailable()).toBe(false)
  })

  it('markVisited() does not throw in fallback mode', async () => {
    await progressStore.init()
    expect(() => progressStore.markVisited('logging-auditing', 'intro')).not.toThrow()
  })

  it('getLessonProgress().visited is true after markVisited() in fallback mode', async () => {
    await progressStore.init()
    progressStore.markVisited('logging-auditing', 'intro')
    expect(progressStore.getLessonProgress('logging-auditing', 'intro').visited).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// markVisited
// ──────────────────────────────────────────────────────────────────────────────
describe('markVisited', () => {
  beforeEach(async () => {
    await progressStore.init()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    progressStore.resetProgress()
    localStorage.clear()
  })

  it('sets lessons key visited:true in localStorage', () => {
    progressStore.markVisited('logging-auditing', 'intro')
    const raw = localStorage.getItem('pipeline-cyber-training:progress')
    const parsed = JSON.parse(raw)
    expect(parsed.lessons['logging-auditing/intro'].visited).toBe(true)
  })

  it('sets lastVisited on the store', () => {
    progressStore.markVisited('logging-auditing', 'intro')
    const last = progressStore.getLastVisited()
    expect(last).toEqual({ moduleId: 'logging-auditing', lessonId: 'intro' })
  })

  it('setLastVisited + getLastVisited roundtrip returns same value', () => {
    progressStore.setLastVisited('logging-auditing', 'ps-logging')
    const last = progressStore.getLastVisited()
    expect(last).toEqual({ moduleId: 'logging-auditing', lessonId: 'ps-logging' })
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// markLessonCompleted
// ──────────────────────────────────────────────────────────────────────────────
describe('markLessonCompleted', () => {
  beforeEach(async () => {
    await progressStore.init()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    progressStore.resetProgress()
    localStorage.clear()
  })

  it('sets lessons key completed:true', () => {
    progressStore.markLessonCompleted('logging-auditing', 'intro')
    const raw = localStorage.getItem('pipeline-cyber-training:progress')
    const parsed = JSON.parse(raw)
    expect(parsed.lessons['logging-auditing/intro'].completed).toBe(true)
  })

  it('getLessonProgress returns completed:true', () => {
    progressStore.markLessonCompleted('logging-auditing', 'intro')
    const progress = progressStore.getLessonProgress('logging-auditing', 'intro')
    expect(progress.completed).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// saveQuiz
// ──────────────────────────────────────────────────────────────────────────────
describe('saveQuiz', () => {
  beforeEach(async () => {
    await progressStore.init()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    progressStore.resetProgress()
    localStorage.clear()
  })

  it('writes quiz score to quizzes key in localStorage', () => {
    progressStore.saveQuiz('logging-auditing', '01', { score: 3, total: 4 })
    const raw = localStorage.getItem('pipeline-cyber-training:progress')
    const parsed = JSON.parse(raw)
    expect(parsed.quizzes['logging-auditing/01'].score).toBe(3)
    expect(parsed.quizzes['logging-auditing/01'].total).toBe(4)
  })

  it('written quiz record includes attemptedAt ISO string', () => {
    progressStore.saveQuiz('logging-auditing', '01', { score: 3, total: 4 })
    const result = progressStore.getQuizScore('logging-auditing', '01')
    expect(typeof result.attemptedAt).toBe('string')
    expect(result.attemptedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('getQuizScore returns same object as saved', () => {
    progressStore.saveQuiz('logging-auditing', '01', { score: 3, total: 4 })
    const result = progressStore.getQuizScore('logging-auditing', '01')
    expect(result.score).toBe(3)
    expect(result.total).toBe(4)
  })

  it('getQuizScore returns null for unknown quiz', () => {
    expect(progressStore.getQuizScore('logging-auditing', 'not-a-quiz')).toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// saveExercise
// ──────────────────────────────────────────────────────────────────────────────
describe('saveExercise', () => {
  beforeEach(async () => {
    await progressStore.init()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    progressStore.resetProgress()
    localStorage.clear()
  })

  it('writes completed:true to exercises key', () => {
    progressStore.saveExercise('logging-auditing', '01')
    const raw = localStorage.getItem('pipeline-cyber-training:progress')
    const parsed = JSON.parse(raw)
    expect(parsed.exercises['logging-auditing/01'].completed).toBe(true)
  })

  it('getExerciseCompletion returns same object', () => {
    progressStore.saveExercise('logging-auditing', '01')
    const result = progressStore.getExerciseCompletion('logging-auditing', '01')
    expect(result.completed).toBe(true)
    expect(typeof result.completedAt).toBe('string')
  })

  it('getExerciseCompletion returns null for unknown exercise', () => {
    expect(progressStore.getExerciseCompletion('logging-auditing', 'not-an-exercise')).toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// saveScenario
// ──────────────────────────────────────────────────────────────────────────────
describe('saveScenario', () => {
  beforeEach(async () => {
    await progressStore.init()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    progressStore.resetProgress()
    localStorage.clear()
  })

  it('writes completed:true to scenarios key', () => {
    progressStore.saveScenario('logging-auditing', '01')
    const raw = localStorage.getItem('pipeline-cyber-training:progress')
    const parsed = JSON.parse(raw)
    expect(parsed.scenarios['logging-auditing/01'].completed).toBe(true)
  })

  it('getScenarioCompletion returns same object', () => {
    progressStore.saveScenario('logging-auditing', '01')
    const result = progressStore.getScenarioCompletion('logging-auditing', '01')
    expect(result.completed).toBe(true)
    expect(typeof result.completedAt).toBe('string')
  })

  it('getScenarioCompletion returns null for unknown scenario', () => {
    expect(progressStore.getScenarioCompletion('logging-auditing', 'not-a-scenario')).toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// migration runner (_migrateForTesting)
// ──────────────────────────────────────────────────────────────────────────────
describe('migration runner (_migrateForTesting)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    progressStore.resetProgress()
    localStorage.clear()
  })

  it('returns new object with same schemaVersion when already at CURRENT_VERSION', () => {
    const input = { schemaVersion: 1, lessons: {}, quizzes: {}, exercises: {}, scenarios: {} }
    const result = _migrateForTesting(input)
    expect(result.schemaVersion).toBe(1)
  })

  it('returned object is not the same reference as input', () => {
    const input = { schemaVersion: 1, lessons: {}, quizzes: {}, exercises: {}, scenarios: {} }
    const result = _migrateForTesting(input)
    expect(result).not.toBe(input)
  })

  it('mutation of returned object does not affect the input object', () => {
    const input = { schemaVersion: 1, lessons: {}, quizzes: {}, exercises: {}, scenarios: {} }
    const result = _migrateForTesting(input)
    result.lessons['logging-auditing/intro'] = { visited: true, completed: false }
    expect(input.lessons['logging-auditing/intro']).toBeUndefined()
  })

  it('result matches input for current schema', () => {
    const input = { schemaVersion: 1, lessons: {}, quizzes: {}, exercises: {}, scenarios: {} }
    const result = _migrateForTesting(input)
    expect(result).toMatchObject(input)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// importProgress — valid file
// ──────────────────────────────────────────────────────────────────────────────
describe('importProgress — valid file', () => {
  beforeEach(async () => {
    await progressStore.init()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    progressStore.resetProgress()
    localStorage.clear()
  })

  it('replaces store with imported data and returns { ok: true }', async () => {
    const importData = {
      schemaVersion: 1,
      lastVisited: { moduleId: 'logging-auditing', lessonId: 'ps-logging' },
      lessons: { 'logging-auditing/ps-logging': { visited: true, completed: true } },
      quizzes: {},
      exercises: {},
      scenarios: {}
    }
    const file = new File([JSON.stringify(importData)], 'progress.json', { type: 'application/json' })
    const result = await progressStore.importProgress(file)
    expect(result).toEqual({ ok: true })
  })

  it('getLastVisited returns imported lastVisited value after import', async () => {
    const importData = {
      schemaVersion: 1,
      lastVisited: { moduleId: 'logging-auditing', lessonId: 'ps-logging' },
      lessons: {},
      quizzes: {},
      exercises: {},
      scenarios: {}
    }
    const file = new File([JSON.stringify(importData)], 'progress.json', { type: 'application/json' })
    await progressStore.importProgress(file)
    expect(progressStore.getLastVisited()).toEqual({ moduleId: 'logging-auditing', lessonId: 'ps-logging' })
  })

  it('getLessonProgress returns imported lesson data', async () => {
    const importData = {
      schemaVersion: 1,
      lastVisited: null,
      lessons: { 'logging-auditing/intro': { visited: true, completed: true } },
      quizzes: {},
      exercises: {},
      scenarios: {}
    }
    const file = new File([JSON.stringify(importData)], 'progress.json', { type: 'application/json' })
    await progressStore.importProgress(file)
    const progress = progressStore.getLessonProgress('logging-auditing', 'intro')
    expect(progress.visited).toBe(true)
    expect(progress.completed).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// importProgress — missing schemaVersion
// ──────────────────────────────────────────────────────────────────────────────
describe('importProgress — missing schemaVersion', () => {
  beforeEach(async () => {
    await progressStore.init()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    progressStore.resetProgress()
    localStorage.clear()
  })

  it('returns { ok: false, error: ... } when schemaVersion is missing', async () => {
    const badData = { lessons: {}, quizzes: {} }
    const file = new File([JSON.stringify(badData)], 'progress.json', { type: 'application/json' })
    const result = await progressStore.importProgress(file)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Not a valid progress file (missing schemaVersion).')
  })

  it('does not overwrite existing state on missing schemaVersion import', async () => {
    progressStore.markVisited('logging-auditing', 'intro')
    const badData = { lessons: {}, quizzes: {} }
    const file = new File([JSON.stringify(badData)], 'progress.json', { type: 'application/json' })
    await progressStore.importProgress(file)
    expect(progressStore.getLessonProgress('logging-auditing', 'intro').visited).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// importProgress — unrecognizable structure
// ──────────────────────────────────────────────────────────────────────────────
describe('importProgress — unrecognizable structure', () => {
  beforeEach(async () => {
    await progressStore.init()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    progressStore.resetProgress()
    localStorage.clear()
  })

  it('returns { ok: false } when no known keys present', async () => {
    const badData = { schemaVersion: 1, foo: 'bar', baz: 123 }
    const file = new File([JSON.stringify(badData)], 'progress.json', { type: 'application/json' })
    const result = await progressStore.importProgress(file)
    expect(result.ok).toBe(false)
  })

  it('does not overwrite existing state on unrecognizable import', async () => {
    progressStore.markVisited('logging-auditing', 'intro')
    const badData = { schemaVersion: 1, foo: 'bar', baz: 123 }
    const file = new File([JSON.stringify(badData)], 'progress.json', { type: 'application/json' })
    await progressStore.importProgress(file)
    expect(progressStore.getLessonProgress('logging-auditing', 'intro').visited).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// exportProgress
// ──────────────────────────────────────────────────────────────────────────────
describe('exportProgress', () => {
  beforeEach(async () => {
    await progressStore.init()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    progressStore.resetProgress()
    localStorage.clear()
  })

  it('calls URL.createObjectURL once', () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    // Stub document.createElement for the anchor
    const mockAnchor = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor)

    progressStore.exportProgress()

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
  })

  it('created anchor has download attribute matching expected filename pattern', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const mockAnchor = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor)

    progressStore.exportProgress()

    expect(mockAnchor.download).toMatch(/^pipeline-cyber-training-progress-\d{4}-\d{2}-\d{2}\.json$/)
  })

  it('calls URL.revokeObjectURL after click', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const mockAnchor = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor)

    progressStore.exportProgress()

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// resetProgress
// ──────────────────────────────────────────────────────────────────────────────
describe('resetProgress', () => {
  beforeEach(async () => {
    await progressStore.init()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('getLessonProgress returns defaults after resetProgress()', () => {
    progressStore.markVisited('logging-auditing', 'intro')
    progressStore.resetProgress()
    const progress = progressStore.getLessonProgress('logging-auditing', 'intro')
    expect(progress).toEqual({ visited: false, completed: false })
  })

  it('localStorage item is removed after resetProgress()', () => {
    progressStore.markVisited('logging-auditing', 'intro')
    progressStore.resetProgress()
    expect(localStorage.getItem('pipeline-cyber-training:progress')).toBeNull()
  })
})
