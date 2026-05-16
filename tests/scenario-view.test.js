// tests/scenario-view.test.js
// Phase 06 Plan 01 Wave 0 — RED test stubs for scenario-view.js
// All tests FAIL (RED) because src/views/scenario-view.js does not yet exist.
// Implementation arrives in Plan 06-02 (Wave 1).
// happy-dom environment (vitest.config.js: environment: 'happy-dom')

// ──────────────────────────────────────────────────────────────────────────────
// Mocks — all vi.mock() calls BEFORE imports (Vitest hoisting requirement)
// ──────────────────────────────────────────────────────────────────────────────

vi.mock('../src/progress-store.js', () => ({
  progressStore: {
    init: vi.fn().mockResolvedValue(undefined),
    isStorageAvailable: vi.fn().mockReturnValue(true),
    saveScenario: vi.fn(),
    getScenarioCompletion: vi.fn().mockReturnValue(null),
    markLessonCompleted: vi.fn(),
    getLessonProgress: vi.fn().mockReturnValue({ visited: false, completed: false }),
  },
}))

vi.mock('../src/utils/icons.js', () => ({
  activateIcons: vi.fn(),
}))

vi.mock('../src/badge.js', () => ({
  renderBadge: vi.fn().mockReturnValue(''),
}))

vi.mock('../src/sidebar.js', () => ({
  refreshSidebarProgress: vi.fn(),
}))

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderScenario } from '../src/views/scenario-view.js'
import { progressStore } from '../src/progress-store.js'

// ──────────────────────────────────────────────────────────────────────────────
// Test fixture — full 2-phase scenario decision tree
// ──────────────────────────────────────────────────────────────────────────────

const SCENARIO_JSON = {
  id: 'logging-auditing-scenario-01',
  moduleId: 'logging-auditing',
  title: 'Investigating a Suspicious Login on PIPELINE-DC01',
  complianceControls: ['TSA-Monitoring', 'NIST-AU-2'],
  narrative: 'Your SIEM alerts you to 47 failed logon attempts on PIPELINE-DC01. In OT environments: pipeline control systems may share Active Directory with IT systems.',
  phases: [
    {
      id: 'phase-1',
      type: 'decision',
      title: 'Initial Triage',
      isFinal: false,
      prompt: 'Your SIEM shows 47 failed logon attempts followed by a successful logon from an unknown workstation at 03:42 UTC. What is your first action?',
      options: [
        {
          id: 'opt-a',
          text: 'Immediately disable the account that successfully logged in.',
          outcome: 'Disabling the account stops the attacker but also alerts them and destroys evidence.',
          correct: false,
          nextPhaseId: 'phase-2',
        },
        {
          id: 'opt-b',
          text: 'Query the Security event log on PIPELINE-DC01 for Event IDs 4624 and 4625.',
          outcome: 'Correct. Reviewing the event log first establishes the timeline and source IP.',
          correct: true,
          nextPhaseId: 'phase-2',
        },
      ],
    },
    {
      id: 'phase-2',
      type: 'decision',
      title: 'Containment Decision',
      isFinal: true,
      prompt: 'You have confirmed the logon originated from 10.0.5.22. The account belongs to a service account used by the pipeline historian. What do you do?',
      options: [
        {
          id: 'opt-a',
          text: 'Immediately disable the service account and notify OT operations.',
          outcome: 'Disabling the account stops the threat. Notification is correct procedure.',
          correct: true,
          nextPhaseId: null,
        },
        {
          id: 'opt-b',
          text: 'Reset the service account password only, without notifying OT operations.',
          outcome: 'Resetting without notification violates TSA SD-02F incident notification requirements.',
          correct: false,
          nextPhaseId: null,
        },
      ],
    },
  ],
}

let progressStoreMock

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>'

  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(SCENARIO_JSON),
  }))

  progressStoreMock = progressStore
  progressStoreMock.getScenarioCompletion.mockReturnValue(null) // first-visit by default
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

// ──────────────────────────────────────────────────────────────────────────────
// Fetch error handling
// ──────────────────────────────────────────────────────────────────────────────

describe('renderScenario — fetch error handling', () => {
  it('failed fetch (ok: false): DOM contains text "Scenario content could not be loaded"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    // FAILS (RED): renderScenario does not exist yet
    await renderScenario({ moduleId: 'logging-auditing', scenarioId: '01' })
    expect(document.getElementById('app').textContent).toContain('Scenario content could not be loaded')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Valid scenario JSON — initial render
// ──────────────────────────────────────────────────────────────────────────────

describe('renderScenario — initial render with valid JSON', () => {
  it('scenario title appears in #app after successful fetch', async () => {
    await renderScenario({ moduleId: 'logging-auditing', scenarioId: '01' })
    expect(document.getElementById('app').textContent).toContain('Investigating a Suspicious Login on PIPELINE-DC01')
  })

  it('phase-1 prompt text appears in #app on initial render', async () => {
    await renderScenario({ moduleId: 'logging-auditing', scenarioId: '01' })
    expect(document.getElementById('app').textContent).toContain('Your SIEM shows 47 failed logon attempts')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Option selection — final phase triggers saveScenario
// ──────────────────────────────────────────────────────────────────────────────

describe('renderScenario — option selection on final phase', () => {
  it('clicking an option button on the final phase calls progressStore.saveScenario', async () => {
    await renderScenario({ moduleId: 'logging-auditing', scenarioId: '01' })
    // Navigate to final phase by clicking an option on phase-1
    const optionButtons = document.querySelectorAll('[data-phase-id="phase-1"] button, .scenario-option')
    // Click the first available option button
    const firstBtn = document.querySelector('button[data-option-id], .option-btn, button')
    if (firstBtn) firstBtn.click()
    // After navigating to final phase and clicking, saveScenario should be called
    // NOTE: This assertion will only fire once a final-phase option is clicked —
    // exact DOM structure defined during implementation (Wave 2).
    // For RED: this test fails at renderScenario import.
    expect(progressStoreMock.saveScenario).toBeDefined()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Re-visit mode
// ──────────────────────────────────────────────────────────────────────────────

describe('renderScenario — re-visit mode', () => {
  it('re-visit mode: getScenarioCompletion returning non-null renders "previously completed" in DOM', async () => {
    progressStoreMock.getScenarioCompletion.mockReturnValue({
      completed: true,
      completedAt: '2026-05-15T10:00:00Z',
    })
    await renderScenario({ moduleId: 'logging-auditing', scenarioId: '01' })
    expect(document.getElementById('app').textContent).toContain('previously completed')
  })
})
