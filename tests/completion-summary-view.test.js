// tests/completion-summary-view.test.js
// Phase 06 Plan 01 Wave 0 — RED test stubs for completion-summary-view.js
// All tests FAIL (RED) because src/views/completion-summary-view.js does not yet exist.
// Implementation arrives in Plan 06-02 (Wave 1).
// happy-dom environment (vitest.config.js: environment: 'happy-dom')

// ──────────────────────────────────────────────────────────────────────────────
// Mocks — all vi.mock() calls BEFORE imports (Vitest hoisting requirement)
// ──────────────────────────────────────────────────────────────────────────────

vi.mock('../src/progress-store.js', () => ({
  progressStore: {
    init: vi.fn().mockResolvedValue(undefined),
    isStorageAvailable: vi.fn().mockReturnValue(true),
    getQuizScore: vi.fn().mockReturnValue(null),
    getExerciseCompletion: vi.fn().mockReturnValue(null),
    getScenarioCompletion: vi.fn().mockReturnValue(null),
    getLessonProgress: vi.fn().mockReturnValue({ visited: false, completed: false }),
  },
}))

vi.mock('../src/utils/icons.js', () => ({
  activateIcons: vi.fn(),
}))

vi.mock('../src/badge.js', () => ({
  renderBadge: vi.fn().mockReturnValue(''),
}))

vi.mock('../src/modules-config.js', () => ({
  MODULES: [
    {
      id: 'logging-auditing',
      title: 'Logging & Auditing',
      icon: 'BookOpen',
      description: 'Test module',
      complianceTags: ['TSA', 'NIST'],
      lessons: [
        { id: 'intro', title: 'Introduction to Windows Event Logs' },
        { id: 'audit-policies', title: 'Configuring Audit Policies via Group Policy', quizId: '01' },
      ],
    },
  ],
}))

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderCompletionSummary } from '../src/views/completion-summary-view.js'
import { progressStore } from '../src/progress-store.js'

let progressStoreMock

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>'

  progressStoreMock = progressStore
  progressStoreMock.isStorageAvailable.mockReturnValue(true)

  vi.spyOn(window, 'print').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

// ──────────────────────────────────────────────────────────────────────────────
// Basic render
// ──────────────────────────────────────────────────────────────────────────────

describe('renderCompletionSummary — basic render', () => {
  it('renders "Completion Summary" heading in #app', async () => {
    // FAILS (RED): renderCompletionSummary does not exist yet
    await renderCompletionSummary()
    expect(document.getElementById('app').textContent).toContain('Completion Summary')
  })

  it('HTML contains text "training log artifact"', async () => {
    await renderCompletionSummary()
    expect(document.getElementById('app').innerHTML).toContain('training log artifact')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Print button
// ──────────────────────────────────────────────────────────────────────────────

describe('renderCompletionSummary — print button', () => {
  it('print button with id="print-summary-btn" exists in #app', async () => {
    await renderCompletionSummary()
    const btn = document.getElementById('print-summary-btn')
    expect(btn).not.toBeNull()
  })

  it('clicking #print-summary-btn calls window.print()', async () => {
    await renderCompletionSummary()
    const btn = document.getElementById('print-summary-btn')
    btn.click()
    expect(window.print).toHaveBeenCalled()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Storage unavailable warning
// ──────────────────────────────────────────────────────────────────────────────

describe('renderCompletionSummary — storage unavailable', () => {
  it('storage unavailable triggers warning text in DOM', async () => {
    progressStoreMock.isStorageAvailable.mockReturnValue(false)
    await renderCompletionSummary()
    expect(document.getElementById('app').textContent).toMatch(/storage.*unavailable|unavailable.*storage|progress.*not.*saved/i)
  })
})
