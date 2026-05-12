// tests/lesson-view.test.js
// Wave 0 stubs — tests use it.todo so the suite exits 0 until Wave 2 ships renderLesson.
// The clipboard stub is registered here as a beforeEach for when the todo is implemented.
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock lesson-view.js since it won't exist until Wave 2.
// This import pattern lets the file load cleanly in the stub phase.
vi.mock('../src/views/lesson-view.js', () => ({
  renderLesson: vi.fn(),
}))

// ──────────────────────────────────────────────────────────────────────────────
// Compliance bar
// ──────────────────────────────────────────────────────────────────────────────
describe('lesson view — compliance bar', () => {
  it.todo('renders compliance badge row when complianceTags is non-empty')
  // TODO Wave 2: import renderLessonHtml and assert .compliance-bar contains TSA badge

  it.todo('badge row is absent when complianceTags is empty')
})

// ──────────────────────────────────────────────────────────────────────────────
// Copy button
// ──────────────────────────────────────────────────────────────────────────────
describe('lesson view — copy button', () => {
  it.todo('copy button is present in rendered code block HTML')

  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
    })
  })

  it.todo('navigator.clipboard.writeText called with raw code on button click')
  // TODO Wave 2: render lesson, click .code-copy-btn, assert clipboard.writeText called
})
