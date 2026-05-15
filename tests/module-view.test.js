// tests/module-view.test.js
// Phase 04 Plan 01 — RED test stubs covering SHELL-03 (module-view progress bar
// and lesson status list). All tests import from src/views/module-view.js which
// will need to be updated in Wave 1 to show progress bars and lesson status.
// Tests that assert on progress bars and lesson status badges are RED until
// Wave 1 updates module-view.js to import computeModuleProgress from quiz-engine.
// happy-dom environment (vitest.config.js: environment: 'happy-dom')

// ──────────────────────────────────────────────────────────────────────────────
// Mock reference captures — defined before vi.mock() calls so they are accessible
// in the factory closures and in test bodies
// ──────────────────────────────────────────────────────────────────────────────

const _computeModuleProgressMock = vi.fn().mockReturnValue({ pct: 0, complete: false, numerator: 0, denominator: 2 })

// ──────────────────────────────────────────────────────────────────────────────
// Mocks — must be declared before module imports that depend on them
// ──────────────────────────────────────────────────────────────────────────────

vi.mock('../src/progress-store.js', () => ({
  progressStore: {
    init: vi.fn().mockResolvedValue(undefined),
    isStorageAvailable: vi.fn().mockReturnValue(true),
    getLessonProgress: vi.fn().mockReturnValue({ visited: false, completed: false }),
    getQuizScore: vi.fn().mockReturnValue(null),
    markVisited: vi.fn(),
    setLastVisited: vi.fn(),
    markLessonCompleted: vi.fn(),
    saveQuiz: vi.fn(),
    exportProgress: vi.fn(),
    importProgress: vi.fn().mockResolvedValue({ ok: true }),
    resetProgress: vi.fn(),
    getExerciseCompletion: vi.fn().mockReturnValue(null),
    getScenarioCompletion: vi.fn().mockReturnValue(null),
    saveExercise: vi.fn(),
    saveScenario: vi.fn(),
  },
}))

vi.mock('../src/quiz-engine.js', () => ({
  computeModuleProgress: _computeModuleProgressMock,
}))

vi.mock('../src/modules-config.js', () => ({
  MODULES: [
    {
      id: 'logging-auditing',
      title: 'Logging & Auditing',
      icon: 'BookOpen',
      description: 'Test module description.',
      order: 1,
      estimatedMinutes: 45,
      complianceTags: ['TSA'],
      lessons: [
        { id: 'intro',          title: 'Introduction to Windows Event Logs' },
        { id: 'audit-policies', title: 'Configuring Audit Policies via Group Policy', quizId: '01' },
      ],
    },
  ],
}))

vi.mock('../src/badge.js', () => ({
  renderBadge: vi.fn().mockReturnValue('<span>TSA</span>'),
}))

vi.mock('../src/utils/escape.js', () => ({
  esc: vi.fn().mockImplementation(s => s),
}))

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderModule } from '../src/views/module-view.js'
import { progressStore } from '../src/progress-store.js'

beforeEach(() => {
  _computeModuleProgressMock.mockReturnValue({ pct: 0, complete: false, numerator: 0, denominator: 2 })
  vi.mocked(progressStore.getLessonProgress).mockReturnValue({ visited: false, completed: false })
  vi.mocked(progressStore.getQuizScore).mockReturnValue(null)
})

afterEach(() => {
  vi.clearAllMocks()
})

// ──────────────────────────────────────────────────────────────────────────────
// Module-view progress bar (SHELL-03)
// ──────────────────────────────────────────────────────────────────────────────

describe('renderModule — progress bar', () => {
  it('returns a string containing a progress bar element (sidebar-progress-bar or width style)', () => {
    const html = renderModule({ moduleId: 'logging-auditing' })
    expect(typeof html).toBe('string')
    const hasProgressBar = html.includes('sidebar-progress-bar') ||
      html.includes('width:0%') ||
      html.includes('width: 0%')
    expect(hasProgressBar).toBe(true)
  })

  it('computeModuleProgress is called with the logging-auditing module object when renderModule renders', () => {
    _computeModuleProgressMock.mockClear()
    renderModule({ moduleId: 'logging-auditing' })
    expect(_computeModuleProgressMock).toHaveBeenCalledTimes(1)
    const arg = _computeModuleProgressMock.mock.calls[0][0]
    expect(arg.id).toBe('logging-auditing')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Module-view lesson list (SHELL-03, D-10)
// ──────────────────────────────────────────────────────────────────────────────

describe('renderModule — lesson list', () => {
  it('returns a string containing the lesson title "Introduction to Windows Event Logs"', () => {
    const html = renderModule({ moduleId: 'logging-auditing' })
    expect(html).toContain('Introduction to Windows Event Logs')
  })

  it('returns a string containing the lesson title "Configuring Audit Policies via Group Policy"', () => {
    const html = renderModule({ moduleId: 'logging-auditing' })
    expect(html).toContain('Configuring Audit Policies via Group Policy')
  })

  it('audit-policies row contains "quiz-passed" class or text when getQuizScore returns a score', () => {
    vi.mocked(progressStore.getQuizScore).mockReturnValue({
      score: 1, total: 1, attemptedAt: '2026-05-14T00:00:00.000Z',
    })
    const html = renderModule({ moduleId: 'logging-auditing' })
    expect(html).toContain('quiz-passed')
  })

  it('audit-policies row shows unvisited state and intro row shows visited state when appropriate', () => {
    vi.mocked(progressStore.getLessonProgress).mockImplementation((moduleId, lessonId) => {
      if (lessonId === 'intro') return { visited: true, completed: true }
      return { visited: false, completed: false }
    })
    vi.mocked(progressStore.getQuizScore).mockReturnValue(null)
    const html = renderModule({ moduleId: 'logging-auditing' })
    expect(html).toContain('visited')
    expect(html).toContain('unvisited')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Module not found (SHELL-03 error boundary)
// ──────────────────────────────────────────────────────────────────────────────

describe('renderModule — not found', () => {
  it('returns a string containing "Module not found" for an unknown moduleId', () => {
    const html = renderModule({ moduleId: 'does-not-exist' })
    expect(typeof html).toBe('string')
    expect(html).toContain('Module not found')
  })
})
