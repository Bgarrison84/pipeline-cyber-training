// tests/exercise-view.test.js
// Phase 05 Plan 01 Wave 0 — RED test stubs for exercise-view.js
// All tests FAIL (RED) because src/views/exercise-view.js is a stub that throws.
// Implementation arrives in Wave 2 (Plan 05-03).
// happy-dom environment (vitest.config.js: environment: 'happy-dom')

// ──────────────────────────────────────────────────────────────────────────────
// Mocks — all vi.mock() calls BEFORE imports (Vitest hoisting requirement)
// ──────────────────────────────────────────────────────────────────────────────

vi.mock('../src/progress-store.js', () => ({
  progressStore: {
    init: vi.fn().mockResolvedValue(undefined),
    isStorageAvailable: vi.fn().mockReturnValue(true),
    saveExercise: vi.fn(),
    getExerciseCompletion: vi.fn().mockReturnValue(null),
    markLessonCompleted: vi.fn(),
    getLessonProgress: vi.fn().mockReturnValue({ visited: false, completed: false }),
  },
}))

vi.mock('../src/utils/icons.js', () => ({
  activateIcons: vi.fn(),
}))

vi.mock('../src/modules-config.js', () => ({
  MODULES: [
    {
      id: 'logging-auditing',
      lessons: [
        { id: 'ps-logging', title: 'Enabling PowerShell Script Block Logging', exerciseId: '01' },
      ],
    },
  ],
}))

vi.mock('../src/sidebar.js', () => ({
  refreshSidebarProgress: vi.fn(),
}))

vi.mock('../src/terminal-engine.js', () => ({
  createTerminal: vi.fn().mockReturnValue({
    appendOutput: vi.fn(),
    disable: vi.fn(),
    setPrompt: vi.fn(),
    focus: vi.fn(),
  }),
}))

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderExercise } from '../src/views/exercise-view.js'
import { progressStore } from '../src/progress-store.js'
import { createTerminal } from '../src/terminal-engine.js'

// ──────────────────────────────────────────────────────────────────────────────
// Test fixture — 2-step exercise (simpler than 3-step for progression testing)
// ──────────────────────────────────────────────────────────────────────────────

const EXERCISE_JSON = {
  id: 'logging-auditing-ex-01',
  moduleId: 'logging-auditing',
  title: 'Enable Script Block Logging',
  description: 'Use PowerShell to enable Script Block Logging via the registry on PIPELINE-DC01.',
  complianceControls: ['TSA-Monitoring', 'NIST-AU-12'],
  context: 'You are logged into PIPELINE-DC01 as a domain administrator.',
  steps: [
    {
      id: 'step-1',
      instruction: 'Check whether the ScriptBlockLogging registry key exists.',
      hint: 'Use Get-ItemProperty with the HKLM: path.',
      hintPatterns: [
        {
          pattern: 'Get-Item\\s+HKLM',
          hint: 'Close — try Get-ItemProperty.',
        },
      ],
      expectedCommands: [
        {
          pattern: 'Get-ItemProperty.*ScriptBlockLogging',
          matchType: 'regex',
          caseSensitive: false,
        },
      ],
      successOutput: 'Cannot find path...',
      feedbackOnWrong: 'Navigate to HKLM:\\...',
    },
    {
      id: 'step-2',
      instruction: 'Create the ScriptBlockLogging registry key.',
      hint: 'Use New-Item.',
      hintPatterns: [],
      expectedCommands: [
        {
          pattern: 'New-Item.*ScriptBlockLogging',
          matchType: 'regex',
          caseSensitive: false,
        },
      ],
      successOutput: 'ScriptBlockLogging created.',
      feedbackOnWrong: 'Use New-Item to create the key.',
    },
  ],
}

let progressStoreMock
let createTerminalMock
let terminalMock

beforeEach(async () => {
  document.body.innerHTML = '<div id="app"></div>'

  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(EXERCISE_JSON),
  }))

  progressStoreMock = progressStore
  progressStoreMock.getExerciseCompletion.mockReturnValue(null) // first-visit by default

  createTerminalMock = createTerminal
  terminalMock = {
    appendOutput: vi.fn(),
    disable: vi.fn(),
    setPrompt: vi.fn(),
    focus: vi.fn(),
  }
  createTerminalMock.mockReturnValue(terminalMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

// ──────────────────────────────────────────────────────────────────────────────
// Fetch error handling
// ──────────────────────────────────────────────────────────────────────────────

describe('renderExercise — fetch error handling', () => {
  it('failed fetch (ok: false): DOM contains text "Exercise content could not be loaded"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    // FAILS (RED): renderExercise stub throws Error('renderExercise: not implemented')
    await renderExercise({ moduleId: 'logging-auditing', exerciseId: '01' })
    expect(document.getElementById('app').textContent).toContain('Exercise content could not be loaded')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Valid exercise JSON — initial render
// ──────────────────────────────────────────────────────────────────────────────

describe('renderExercise — initial render with valid JSON', () => {
  it('exercise title appears in #app innerHTML', async () => {
    await renderExercise({ moduleId: 'logging-auditing', exerciseId: '01' })
    expect(document.getElementById('app').textContent).toContain('Enable Script Block Logging')
  })

  it('simulator label text "PS SIMULATOR — commands do not run on any real system" is present in #app innerHTML (TERM-04)', async () => {
    await renderExercise({ moduleId: 'logging-auditing', exerciseId: '01' })
    expect(document.getElementById('app').innerHTML).toContain(
      'PS SIMULATOR — commands do not run on any real system'
    )
  })

  it('step panel shows "Step 1 of 2" on initial render', async () => {
    await renderExercise({ moduleId: 'logging-auditing', exerciseId: '01' })
    expect(document.getElementById('app').textContent).toContain('Step 1 of 2')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Step progression — correct command on step 1
// ──────────────────────────────────────────────────────────────────────────────

describe('renderExercise — step progression (correct command on step 1 of 2)', () => {
  it('correct command on step 1 of 2: progressStore.saveExercise NOT called (not last step)', async () => {
    await renderExercise({ moduleId: 'logging-auditing', exerciseId: '01' })
    // Get commandHandler from createTerminal's first call
    const commandHandler = createTerminalMock.mock.calls[0][1]
    expect(typeof commandHandler).toBe('function')
    // Send correct step-1 command
    commandHandler('Get-ItemProperty HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging')
    expect(progressStoreMock.saveExercise).not.toHaveBeenCalled()
  })

  it('correct command on step 1: step panel text changes to "Step 2 of 2"', async () => {
    await renderExercise({ moduleId: 'logging-auditing', exerciseId: '01' })
    const commandHandler = createTerminalMock.mock.calls[0][1]
    commandHandler('Get-ItemProperty HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging')
    expect(document.getElementById('app').textContent).toContain('Step 2 of 2')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Step progression — correct command on last step
// ──────────────────────────────────────────────────────────────────────────────

describe('renderExercise — step progression (correct command on last step)', () => {
  it('correct command on last step: progressStore.saveExercise("logging-auditing", "01") called', async () => {
    await renderExercise({ moduleId: 'logging-auditing', exerciseId: '01' })
    const commandHandler = createTerminalMock.mock.calls[0][1]
    // Complete step 1
    commandHandler('Get-ItemProperty HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging')
    // Complete step 2 (last step)
    commandHandler('New-Item -Path HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging')
    expect(progressStoreMock.saveExercise).toHaveBeenCalledWith('logging-auditing', '01')
  })

  it('correct command on last step: progressStore.markLessonCompleted("logging-auditing", "ps-logging") called', async () => {
    await renderExercise({ moduleId: 'logging-auditing', exerciseId: '01' })
    const commandHandler = createTerminalMock.mock.calls[0][1]
    // Complete step 1
    commandHandler('Get-ItemProperty HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging')
    // Complete step 2 (last step)
    commandHandler('New-Item -Path HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging')
    expect(progressStoreMock.markLessonCompleted).toHaveBeenCalledWith('logging-auditing', 'ps-logging')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Hint display — near-miss command (TERM-03)
// ──────────────────────────────────────────────────────────────────────────────

describe('renderExercise — near-miss hint display (TERM-03)', () => {
  it('near-miss command matching a hintPattern: hint area in DOM contains the hint text from that hintPattern', async () => {
    await renderExercise({ moduleId: 'logging-auditing', exerciseId: '01' })
    const commandHandler = createTerminalMock.mock.calls[0][1]
    // "Get-Item HKLM:..." matches hintPatterns[0].pattern = 'Get-Item\\s+HKLM'
    commandHandler('Get-Item HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell')
    expect(document.getElementById('app').textContent).toContain('Close — try Get-ItemProperty.')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Wrong command (no hint match)
// ──────────────────────────────────────────────────────────────────────────────

describe('renderExercise — wrong command with no hint match', () => {
  it('wrong command (no hint match): terminal.appendOutput called with feedbackOnWrong text', async () => {
    await renderExercise({ moduleId: 'logging-auditing', exerciseId: '01' })
    const commandHandler = createTerminalMock.mock.calls[0][1]
    // A command that matches no expectedCommand and no hintPattern
    commandHandler('Write-Host hello')
    expect(terminalMock.appendOutput).toHaveBeenCalledWith(
      expect.stringContaining('Navigate to HKLM'),
      expect.anything()
    )
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Re-visit mode
// ──────────────────────────────────────────────────────────────────────────────

describe('renderExercise — re-visit mode', () => {
  beforeEach(() => {
    progressStoreMock.getExerciseCompletion.mockReturnValue({
      completed: true,
      completedAt: '2026-05-15T10:00:00Z',
    })
  })

  it('re-visit mode (getExerciseCompletion returns non-null): terminal.disable() called', async () => {
    await renderExercise({ moduleId: 'logging-auditing', exerciseId: '01' })
    expect(terminalMock.disable).toHaveBeenCalled()
  })

  it('re-visit: DOM contains text "previously completed"', async () => {
    await renderExercise({ moduleId: 'logging-auditing', exerciseId: '01' })
    expect(document.getElementById('app').textContent).toContain('previously completed')
  })
})
