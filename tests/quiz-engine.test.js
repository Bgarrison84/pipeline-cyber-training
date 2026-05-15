// tests/quiz-engine.test.js
// Phase 04 Plan 01 — RED test stubs covering ASSESS-01 and SHELL-03 behaviors.
// src/quiz-engine.js does not exist yet (Wave 1 creates it).
// All test bodies throw new Error('RED') — they must stay failing until
// Wave 1 implements renderQuiz() and computeModuleProgress() in quiz-engine.js.
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

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// ──────────────────────────────────────────────────────────────────────────────
// RED gate helper — all test bodies call this until Wave 1 implements quiz-engine
// ──────────────────────────────────────────────────────────────────────────────

function RED(description) {
  throw new Error('RED: ' + description + ' — src/quiz-engine.js not yet implemented (Wave 1)')
}

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

beforeEach(() => {
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
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

// ──────────────────────────────────────────────────────────────────────────────
// renderQuiz — first-visit mode (ASSESS-01)
// ──────────────────────────────────────────────────────────────────────────────

describe('renderQuiz — first-visit mode', () => {
  it('injects a .quiz-section element into .lesson-column', () => {
    RED('renderQuiz first-visit: .quiz-section injection')
  })

  it('question stem text appears in the DOM', () => {
    RED('renderQuiz first-visit: question stem in DOM')
  })

  it('answer buttons (.quiz-answer-btn) are present in the DOM', () => {
    RED('renderQuiz first-visit: .quiz-answer-btn buttons present')
  })

  it('activateIcons() is called once after quiz HTML is injected', () => {
    RED('renderQuiz first-visit: activateIcons() called after inject')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// renderQuiz — answer click behavior (ASSESS-01)
// ──────────────────────────────────────────────────────────────────────────────

describe('renderQuiz — answer click behavior', () => {
  it('clicking a .quiz-answer-btn sets data-answered="true" on the parent .quiz-question-card', () => {
    RED('renderQuiz click: data-answered set on card')
  })

  it('all answer buttons on that question get disabled after a click', () => {
    RED('renderQuiz click: all buttons disabled after answer')
  })

  it('the clicked answer feedback text appears in the DOM', () => {
    RED('renderQuiz click: feedback text appears')
  })

  it('the question explanation appears in the DOM after any answer click', () => {
    RED('renderQuiz click: explanation appears after answer')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// renderQuiz — score save (ASSESS-01)
// ──────────────────────────────────────────────────────────────────────────────

describe('renderQuiz — score save', () => {
  it('progressStore.saveQuiz() is called with (moduleId, quizId, {score, total}) when last question is answered', () => {
    RED('renderQuiz score save: saveQuiz() called with correct args')
  })

  it('progressStore.markLessonCompleted() is called when all questions are answered', () => {
    RED('renderQuiz score save: markLessonCompleted() called')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// renderQuiz — revisit mode (ASSESS-01, D-11, D-12)
// ──────────────────────────────────────────────────────────────────────────────

describe('renderQuiz — revisit mode', () => {
  it('rendered DOM contains the text "Your last attempt:" when prior score exists', () => {
    RED('renderQuiz revisit: "Your last attempt:" banner text')
  })

  it('rendered DOM contains the score "1/1" when prior score is {score:1, total:1}', () => {
    RED('renderQuiz revisit: score "1/1" displayed')
  })

  it('clicking answer buttons in revisit mode does not call saveQuiz', () => {
    RED('renderQuiz revisit: no saveQuiz on click')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// computeModuleProgress (SHELL-03, D-07)
// ──────────────────────────────────────────────────────────────────────────────

describe('computeModuleProgress', () => {
  it('returns {pct:0, complete:false} when all lessons are unvisited and no quiz score exists', () => {
    RED('computeModuleProgress: pct:0 for all-unvisited module')
  })

  it('returns {pct:100, complete:true} when the quiz-having lesson has a score', () => {
    RED('computeModuleProgress: pct:100 when quiz passed and quiz-less lesson visited')
  })

  it('returns {pct:50, complete:false} when quiz-less intro is visited but quiz-having audit-policies has no score', () => {
    RED('computeModuleProgress: pct:50 for partial completion (quiz-less visited, quiz not passed)')
  })
})
