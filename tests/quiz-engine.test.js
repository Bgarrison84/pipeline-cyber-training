// tests/quiz-engine.test.js
// Phase 04 Plan 02 — GREEN tests covering ASSESS-01 and SHELL-03 behaviors.
// happy-dom environment (vitest.config.js: environment: 'happy-dom')

// ──────────────────────────────────────────────────────────────────────────────
// Mocks — must be declared before module imports that depend on them
// ──────────────────────────────────────────────────────────────────────────────

vi.mock('../src/progress-store.js', () => ({
  progressStore: {
    init: vi.fn().mockResolvedValue(undefined),
    isStorageAvailable: vi.fn().mockReturnValue(true),
    markVisited: vi.fn(),
    setLastVisited: vi.fn(),
    markLessonCompleted: vi.fn(),
    saveQuiz: vi.fn(),
    getQuizScore: vi.fn().mockReturnValue(null),
    getLessonProgress: vi.fn().mockReturnValue({ visited: false, completed: false }),
    exportProgress: vi.fn(),
    importProgress: vi.fn().mockResolvedValue({ ok: true }),
    resetProgress: vi.fn(),
    getExerciseCompletion: vi.fn().mockReturnValue(null),
    getScenarioCompletion: vi.fn().mockReturnValue(null),
    saveExercise: vi.fn(),
    saveScenario: vi.fn(),
  },
}))

vi.mock('../src/utils/icons.js', () => ({
  activateIcons: vi.fn(),
}))

vi.mock('../src/modules-config.js', () => ({
  MODULES: [
    {
      id: 'logging-auditing',
      title: 'Logging & Auditing',
      icon: 'BookOpen',
      description: 'Test module',
      complianceTags: ['TSA'],
      lessons: [
        { id: 'intro',          title: 'Introduction' },
        { id: 'audit-policies', title: 'Configuring Audit Policies', quizId: '01' },
      ],
    },
  ],
}))

// Mock sidebar.js to break circular dependency in tests
vi.mock('../src/sidebar.js', () => ({
  initSidebar: vi.fn().mockResolvedValue(undefined),
  setActiveModule: vi.fn(),
  setActiveLesson: vi.fn(),
  refreshSidebarProgress: vi.fn(),
}))

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// ──────────────────────────────────────────────────────────────────────────────
// Test data
// ──────────────────────────────────────────────────────────────────────────────

const QUIZ_JSON = {
  id: 'logging-auditing-quiz-01',
  moduleId: 'logging-auditing',
  title: 'Logging & Auditing Knowledge Check',
  questions: [
    {
      id: 'q-01',
      type: 'multiple-choice',
      stem: 'Which Event ID captures script block content?',
      complianceControls: ['NIST-AU-12'],
      answers: [
        { id: 'a', text: '4624', correct: false, feedback: 'That is a logon event.' },
        { id: 'b', text: '4104', correct: true,  feedback: 'Correct. 4104 captures script blocks.' },
        { id: 'c', text: '4688', correct: false, feedback: 'That is process creation.' },
        { id: 'd', text: '7045', correct: false, feedback: 'That is service installation.' },
      ],
      explanation: 'Event ID 4104 captures PowerShell script block content.',
    },
  ],
}

let progressStoreMock
let activateIconsMock
let renderQuiz
let computeModuleProgress

beforeEach(async () => {
  document.body.innerHTML = `
    <div id="app">
      <div class="lesson-wrapper">
        <div class="lesson-column"></div>
      </div>
    </div>
  `
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(QUIZ_JSON),
  }))

  const psModule = await import('../src/progress-store.js')
  progressStoreMock = psModule.progressStore
  progressStoreMock.getQuizScore.mockReturnValue(null)  // first-visit mode by default
  progressStoreMock.getLessonProgress.mockReturnValue({ visited: false, completed: false })

  const iconsModule = await import('../src/utils/icons.js')
  activateIconsMock = iconsModule.activateIcons

  const qeModule = await import('../src/quiz-engine.js')
  renderQuiz = qeModule.renderQuiz
  computeModuleProgress = qeModule.computeModuleProgress
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

// ──────────────────────────────────────────────────────────────────────────────
// renderQuiz — first-visit mode (ASSESS-01)
// ──────────────────────────────────────────────────────────────────────────────

describe('renderQuiz — first-visit mode', () => {
  it('injects a .quiz-section element into .lesson-column', async () => {
    const lessonColumn = document.querySelector('.lesson-column')
    await renderQuiz('logging-auditing', '01', lessonColumn, 'audit-policies')
    const section = lessonColumn.querySelector('.quiz-section')
    expect(section).not.toBeNull()
  })

  it('question stem text appears in the DOM', async () => {
    const lessonColumn = document.querySelector('.lesson-column')
    await renderQuiz('logging-auditing', '01', lessonColumn, 'audit-policies')
    expect(lessonColumn.textContent).toContain('Which Event ID captures script block content?')
  })

  it('answer buttons (.quiz-answer-btn) are present in the DOM', async () => {
    const lessonColumn = document.querySelector('.lesson-column')
    await renderQuiz('logging-auditing', '01', lessonColumn, 'audit-policies')
    const btns = lessonColumn.querySelectorAll('.quiz-answer-btn')
    expect(btns.length).toBeGreaterThan(0)
  })

  it('activateIcons() is called once after quiz HTML is injected', async () => {
    const lessonColumn = document.querySelector('.lesson-column')
    await renderQuiz('logging-auditing', '01', lessonColumn, 'audit-policies')
    expect(activateIconsMock).toHaveBeenCalledTimes(1)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// renderQuiz — answer click behavior (ASSESS-01)
// ──────────────────────────────────────────────────────────────────────────────

describe('renderQuiz — answer click behavior', () => {
  it('clicking a .quiz-answer-btn sets data-answered="true" on the parent .quiz-question-card', async () => {
    const lessonColumn = document.querySelector('.lesson-column')
    await renderQuiz('logging-auditing', '01', lessonColumn, 'audit-policies')
    const btn = lessonColumn.querySelector('.quiz-answer-btn')
    btn.click()
    await new Promise(resolve => setTimeout(resolve, 0))
    const card = lessonColumn.querySelector('.quiz-question-card')
    expect(card.dataset.answered).toBe('true')
  })

  it('all answer buttons on that question get disabled after a click', async () => {
    const lessonColumn = document.querySelector('.lesson-column')
    await renderQuiz('logging-auditing', '01', lessonColumn, 'audit-policies')
    const btn = lessonColumn.querySelector('.quiz-answer-btn')
    btn.click()
    await new Promise(resolve => setTimeout(resolve, 0))
    const card = lessonColumn.querySelector('.quiz-question-card')
    const allBtns = card.querySelectorAll('.quiz-answer-btn')
    allBtns.forEach(b => {
      expect(b.style.pointerEvents).toBe('none')
    })
  })

  it('the clicked answer feedback text appears in the DOM', async () => {
    const lessonColumn = document.querySelector('.lesson-column')
    await renderQuiz('logging-auditing', '01', lessonColumn, 'audit-policies')
    // Click the first answer (id='a')
    const btnA = lessonColumn.querySelector('.quiz-answer-btn[data-answer-id="a"]')
    btnA.click()
    await new Promise(resolve => setTimeout(resolve, 0))
    const feedback = lessonColumn.querySelector('.quiz-answer-feedback[data-for-answer="a"]')
    expect(feedback).not.toBeNull()
    expect(feedback.style.display).not.toBe('none')
    expect(feedback.textContent).toContain('That is a logon event.')
  })

  it('the question explanation appears in the DOM after any answer click', async () => {
    const lessonColumn = document.querySelector('.lesson-column')
    await renderQuiz('logging-auditing', '01', lessonColumn, 'audit-policies')
    const btn = lessonColumn.querySelector('.quiz-answer-btn')
    btn.click()
    await new Promise(resolve => setTimeout(resolve, 0))
    const explanation = lessonColumn.querySelector('.quiz-explanation')
    expect(explanation).not.toBeNull()
    expect(explanation.style.display).not.toBe('none')
    expect(explanation.textContent).toContain('Event ID 4104 captures PowerShell script block content.')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// renderQuiz — score save (ASSESS-01)
// ──────────────────────────────────────────────────────────────────────────────

describe('renderQuiz — score save', () => {
  it('progressStore.saveQuiz() is called with (moduleId, quizId, {score, total}) when last question is answered', async () => {
    const lessonColumn = document.querySelector('.lesson-column')
    await renderQuiz('logging-auditing', '01', lessonColumn, 'audit-policies')
    // Answer the only question (the quiz has 1 question)
    const btn = lessonColumn.querySelector('.quiz-answer-btn')
    btn.click()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(progressStoreMock.saveQuiz).toHaveBeenCalledWith(
      'logging-auditing',
      '01',
      expect.objectContaining({ total: 1 })
    )
  })

  it('progressStore.markLessonCompleted() is called when all questions are answered', async () => {
    const lessonColumn = document.querySelector('.lesson-column')
    await renderQuiz('logging-auditing', '01', lessonColumn, 'audit-policies')
    const btn = lessonColumn.querySelector('.quiz-answer-btn')
    btn.click()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(progressStoreMock.markLessonCompleted).toHaveBeenCalledWith('logging-auditing', 'audit-policies')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// renderQuiz — revisit mode (ASSESS-01, D-11, D-12)
// ──────────────────────────────────────────────────────────────────────────────

describe('renderQuiz — revisit mode', () => {
  beforeEach(() => {
    // Set prior quiz score to simulate revisit mode
    progressStoreMock.getQuizScore.mockReturnValue({
      score: 1,
      total: 1,
      attemptedAt: '2026-05-15T12:00:00Z',
    })
  })

  it('rendered DOM contains the text "Your last attempt:" when prior score exists', async () => {
    const lessonColumn = document.querySelector('.lesson-column')
    await renderQuiz('logging-auditing', '01', lessonColumn, 'audit-policies')
    expect(lessonColumn.textContent).toContain('Your last attempt:')
  })

  it('rendered DOM contains the score "1/1" when prior score is {score:1, total:1}', async () => {
    const lessonColumn = document.querySelector('.lesson-column')
    await renderQuiz('logging-auditing', '01', lessonColumn, 'audit-policies')
    expect(lessonColumn.textContent).toContain('1/1')
  })

  it('clicking answer buttons in revisit mode does not call saveQuiz', async () => {
    const lessonColumn = document.querySelector('.lesson-column')
    await renderQuiz('logging-auditing', '01', lessonColumn, 'audit-policies')
    // Try to click an answer button — in revisit mode they should have pointer-events:none
    // but we can dispatch a click event directly to the section to verify no saveQuiz call
    const section = lessonColumn.querySelector('.quiz-section')
    const btn = section.querySelector('.quiz-answer-btn')
    // Dispatch click — event delegation will run but should find data-answered="true" on card
    if (btn) btn.click()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(progressStoreMock.saveQuiz).not.toHaveBeenCalled()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// computeModuleProgress (SHELL-03, D-07)
// ──────────────────────────────────────────────────────────────────────────────

describe('computeModuleProgress', () => {
  it('returns {pct:0, complete:false} when all lessons are unvisited and no quiz score exists', async () => {
    // progressStoreMock.getQuizScore returns null (no score)
    // progressStoreMock.getLessonProgress returns {visited:false}
    const mod = {
      id: 'logging-auditing',
      lessons: [
        { id: 'intro' },
        { id: 'audit-policies', quizId: '01' },
      ],
    }
    const result = computeModuleProgress(mod)
    expect(result.pct).toBe(0)
    expect(result.complete).toBe(false)
  })

  it('returns {pct:100, complete:true} when the quiz-having lesson has a score', async () => {
    // Both lessons complete: intro visited, audit-policies quiz passed
    progressStoreMock.getLessonProgress.mockReturnValue({ visited: true, completed: true })
    progressStoreMock.getQuizScore.mockReturnValue({ score: 1, total: 1, attemptedAt: '2026-05-15T12:00:00Z' })
    const mod = {
      id: 'logging-auditing',
      lessons: [
        { id: 'intro' },
        { id: 'audit-policies', quizId: '01' },
      ],
    }
    const result = computeModuleProgress(mod)
    expect(result.pct).toBe(100)
    expect(result.complete).toBe(true)
  })

  it('returns {pct:50, complete:false} when quiz-less intro is visited but quiz-having audit-policies has no score', async () => {
    // intro: visited=true (counts); audit-policies: getQuizScore=null (doesn't count)
    progressStoreMock.getLessonProgress.mockImplementation((moduleId, lessonId) => {
      if (lessonId === 'intro') return { visited: true, completed: false }
      return { visited: false, completed: false }
    })
    progressStoreMock.getQuizScore.mockReturnValue(null)
    const mod = {
      id: 'logging-auditing',
      lessons: [
        { id: 'intro' },
        { id: 'audit-policies', quizId: '01' },
      ],
    }
    const result = computeModuleProgress(mod)
    expect(result.pct).toBe(50)
    expect(result.complete).toBe(false)
  })

  it('exercise-backed lesson with non-null completion counts as complete', async () => {
    // FAILS (RED): computeModuleProgress has no else-if exerciseId branch yet
    progressStoreMock.getExerciseCompletion.mockReturnValue({ completed: true, completedAt: '2026-05-15T10:00:00Z' })
    const mod = {
      id: 'logging-auditing',
      lessons: [
        { id: 'ps-logging', exerciseId: '01' },
      ],
    }
    const result = computeModuleProgress(mod)
    expect(result.pct).toBe(100)
    expect(result.complete).toBe(true)
  })

  it('exercise-backed lesson with null completion does not count', async () => {
    // FAILS (RED): computeModuleProgress has no else-if exerciseId branch yet
    progressStoreMock.getExerciseCompletion.mockReturnValue(null)
    const mod = {
      id: 'logging-auditing',
      lessons: [
        { id: 'ps-logging', exerciseId: '01' },
      ],
    }
    const result = computeModuleProgress(mod)
    expect(result.pct).toBe(0)
    expect(result.complete).toBe(false)
  })

  it('scenario-backed lesson with non-null completion counts as complete', async () => {
    progressStoreMock.getScenarioCompletion.mockReturnValue({ completed: true, completedAt: '2026-05-16T10:00:00Z' })
    const mod = {
      id: 'logging-auditing',
      lessons: [
        { id: 'intro', scenarioId: '01' },
      ],
    }
    const result = computeModuleProgress(mod)
    expect(result.pct).toBe(100)
    expect(result.complete).toBe(true)
  })

  it('scenario-backed lesson with null completion does not count', async () => {
    progressStoreMock.getScenarioCompletion.mockReturnValue(null)
    const mod = {
      id: 'logging-auditing',
      lessons: [
        { id: 'intro', scenarioId: '01' },
      ],
    }
    const result = computeModuleProgress(mod)
    expect(result.pct).toBe(0)
    expect(result.complete).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// renderQuiz — multi-question partial credit (IN-03)
// ──────────────────────────────────────────────────────────────────────────────

const QUIZ_3Q = {
  id: 'logging-auditing-quiz-01',
  moduleId: 'logging-auditing',
  title: 'Logging & Auditing Knowledge Check',
  questions: [
    {
      id: 'q-01',
      type: 'multiple-choice',
      stem: 'Which Event ID captures script block content?',
      complianceControls: ['NIST-AU-12'],
      answers: [
        { id: 'a', text: '4624', correct: false, feedback: 'That is a logon event.' },
        { id: 'b', text: '4104', correct: true,  feedback: 'Correct. 4104 captures script blocks.' },
        { id: 'c', text: '4688', correct: false, feedback: 'That is process creation.' },
        { id: 'd', text: '7045', correct: false, feedback: 'That is service installation.' },
      ],
      explanation: 'Event ID 4104 captures PowerShell script block content.',
    },
    {
      id: 'q-02',
      type: 'multiple-choice',
      stem: "Which cmdlet retrieves Security event log entries filtered by Event ID?",
      complianceControls: ['NIST-AU-6'],
      answers: [
        { id: 'a', text: "Get-WinEvent -FilterHashtable @{LogName='Security';Id=4624}", correct: true, feedback: 'Correct. Get-WinEvent with a filter hashtable is efficient.' },
        { id: 'b', text: 'Get-EventLog -LogName Security -EventId 4624', correct: false, feedback: 'Less efficient than Get-WinEvent with a filter hashtable.' },
        { id: 'c', text: 'Search-EventLog -Id 4624', correct: false, feedback: 'Search-EventLog is not a valid PowerShell cmdlet.' },
        { id: 'd', text: 'Read-EventLog -Source Security -EventId 4624', correct: false, feedback: 'Read-EventLog is not a valid PowerShell cmdlet.' },
      ],
      explanation: 'Get-WinEvent with -FilterHashtable is the preferred method in PowerShell 5.1.',
    },
    {
      id: 'q-03',
      type: 'multiple-choice',
      stem: 'Under TSA SD-02F, what is the minimum log retention period for OT systems?',
      complianceControls: ['TSA-SD-02F'],
      answers: [
        { id: 'a', text: '30 days', correct: false, feedback: '30 days is insufficient.' },
        { id: 'b', text: '90 days', correct: false, feedback: '90 days does not meet TSA SD-02F.' },
        { id: 'c', text: '12 months', correct: true, feedback: 'Correct. TSA SD-02F requires 12 months minimum.' },
        { id: 'd', text: '7 years', correct: false, feedback: '7 years is a SOX financial standard, not TSA.' },
      ],
      explanation: 'TSA SD-02F mandates a 12-month minimum retention period for cybersecurity event logs.',
    },
  ],
}

describe('renderQuiz — partial credit with multi-question quiz (IN-03)', () => {
  beforeEach(() => {
    // Override global fetch mock to return the 3-question fixture
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(QUIZ_3Q),
    }))
    progressStoreMock.getQuizScore.mockReturnValue(null)
  })

  it('saveQuiz is called with { score: 1, total: 3 } when only q-01 is answered correctly', async () => {
    const lessonColumn = document.querySelector('.lesson-column')
    await renderQuiz('logging-auditing', '01', lessonColumn, 'audit-policies')

    // Answer q-01 correctly (id 'b' is correct)
    const cards = lessonColumn.querySelectorAll('.quiz-question-card')
    expect(cards.length).toBe(3)

    const btnB_q01 = cards[0].querySelector('.quiz-answer-btn[data-answer-id="b"]')
    btnB_q01.click()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Answer q-02 incorrectly (id 'b' is wrong for q-02)
    const btnB_q02 = cards[1].querySelector('.quiz-answer-btn[data-answer-id="b"]')
    btnB_q02.click()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Answer q-03 incorrectly (id 'a' is wrong for q-03)
    const btnA_q03 = cards[2].querySelector('.quiz-answer-btn[data-answer-id="a"]')
    btnA_q03.click()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(progressStoreMock.saveQuiz).toHaveBeenCalledWith(
      'logging-auditing',
      '01',
      expect.objectContaining({ score: 1, total: 3 })
    )
  })

  it('completion banner text reads "Quiz complete — 1/3 correct" when score < totalQuestions', async () => {
    const lessonColumn = document.querySelector('.lesson-column')
    await renderQuiz('logging-auditing', '01', lessonColumn, 'audit-policies')

    const cards = lessonColumn.querySelectorAll('.quiz-question-card')

    // Answer q-01 correctly
    cards[0].querySelector('.quiz-answer-btn[data-answer-id="b"]').click()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Answer q-02 incorrectly
    cards[1].querySelector('.quiz-answer-btn[data-answer-id="b"]').click()
    await new Promise(resolve => setTimeout(resolve, 0))

    // Answer q-03 incorrectly
    cards[2].querySelector('.quiz-answer-btn[data-answer-id="a"]').click()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(lessonColumn.textContent).toContain('Quiz complete — 1/3 correct')
  })
})
