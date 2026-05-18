// tests/content-loader.test.js
// Wave 0 stubs — tests will be RED until Wave 1 creates src/content-loader.js
// These stubs exist to enforce the Nyquist rule: write tests before implementation.
import { describe, it, expect } from 'vitest'
import { parseFrontmatter, getLessonNav, renderMarkdown } from '../src/content-loader.js'

// ──────────────────────────────────────────────────────────────────────────────
// parseFrontmatter
// ──────────────────────────────────────────────────────────────────────────────
describe('parseFrontmatter', () => {
  it('extracts all 6 frontmatter fields from valid Markdown', () => {
    const raw = [
      '---',
      'title: Test',
      'lessonId: intro',
      'moduleId: logging-auditing',
      'order: 1',
      'complianceTags: [TSA, NIST]',
      'complianceControls: [TSA-Monitoring, NIST-AU-2]',
      '---',
      '',
      '# Body',
    ].join('\n')

    const { meta, body } = parseFrontmatter(raw)

    expect(meta.title).toBe('Test')
    expect(meta.lessonId).toBe('intro')
    expect(Array.isArray(meta.complianceTags)).toBe(true)
    expect(meta.complianceTags.length).toBe(2)
    expect(body).toContain('# Body')
  })

  it('returns empty meta and full body when no frontmatter present', () => {
    const raw = '# No frontmatter\n\nJust text'
    const { meta, body } = parseFrontmatter(raw)

    expect(meta).toEqual({})
    expect(body).toBe(raw)
  })

  it('handles malformed frontmatter (missing close delimiter) gracefully', () => {
    const raw = '---\ntitle: Broken\n# Body'

    expect(() => parseFrontmatter(raw)).not.toThrow()
    const result = parseFrontmatter(raw)
    expect(result).toHaveProperty('meta')
    expect(result).toHaveProperty('body')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// getLessonNav
// ──────────────────────────────────────────────────────────────────────────────
describe('getLessonNav', () => {
  it('returns null prev for first lesson', () => {
    const result = getLessonNav('logging-auditing', 'intro')

    expect(result.prev).toBeNull()
    expect(result.next.lessonId).toBe('ps-logging')
  })

  it('returns both prev and next for middle lesson', () => {
    const result = getLessonNav('logging-auditing', 'ps-logging')

    expect(result.prev.lessonId).toBe('intro')
    expect(result.next.lessonId).toBe('audit-policies')
  })

  it('returns null next for last lesson', () => {
    const result = getLessonNav('logging-auditing', 'siem-integration')

    expect(result.next).toBeNull()
    expect(result.prev.lessonId).toBe('ot-logging-advanced')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// renderMarkdown — OT callout and code block
// ──────────────────────────────────────────────────────────────────────────────
describe('renderMarkdown — OT callout and code block', () => {
  it('returns an HTML string for valid Markdown', async () => {
    const result = await renderMarkdown('# Hello\n\nWorld')

    expect(typeof result).toBe('string')
    expect(result.includes('<h1')).toBe(true)
  })

  it('renders > [!OT] blockquote as .ot-callout element', async () => {
    const result = await renderMarkdown('> [!OT]\n> Some OT text here')

    expect(result.includes('ot-callout')).toBe(true)
    expect(result.includes('<blockquote')).toBe(false)
  })

  it('renders standard blockquote (no [!OT]) as <blockquote>', async () => {
    const result = await renderMarkdown('> Standard quote')

    expect(result.includes('<blockquote')).toBe(true)
    expect(result.includes('ot-callout')).toBe(false)
  })

  it('code block HTML contains .code-copy-btn element', async () => {
    const result = await renderMarkdown('```powershell\nGet-WinEvent\n```')

    expect(result.includes('code-copy-btn')).toBe(true)
  })
})
