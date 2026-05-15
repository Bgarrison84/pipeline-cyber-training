// tests/terminal-engine.test.js
// Phase 05 Plan 01 Wave 0 — RED test stubs for terminal-engine.js
// All tests FAIL (RED) because src/terminal-engine.js is a stub that throws.
// Implementation arrives in Wave 1 (Plan 05-02).
// happy-dom environment (vitest.config.js: environment: 'happy-dom')

// ──────────────────────────────────────────────────────────────────────────────
// No vi.mock() calls needed — terminal-engine.js has no external deps.
// vi.mock() calls (none here) would appear before imports per Vitest hoisting rule.
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createTerminal } from '../src/terminal-engine.js'

beforeEach(() => {
  document.body.innerHTML = '<div id="terminal-container"></div>'
})

afterEach(() => {
  vi.clearAllMocks()
})

// ──────────────────────────────────────────────────────────────────────────────
// createTerminal API shape
// ──────────────────────────────────────────────────────────────────────────────

describe('createTerminal — API shape', () => {
  it('createTerminal() returns an object with appendOutput, disable, setPrompt, focus methods', () => {
    const container = document.getElementById('terminal-container')
    // FAILS (RED): createTerminal stub throws Error('createTerminal: not implemented')
    const terminal = createTerminal(container, vi.fn())
    expect(typeof terminal.appendOutput).toBe('function')
    expect(typeof terminal.disable).toBe('function')
    expect(typeof terminal.setPrompt).toBe('function')
    expect(typeof terminal.focus).toBe('function')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// appendOutput
// ──────────────────────────────────────────────────────────────────────────────

describe('createTerminal — appendOutput', () => {
  it('appendOutput(text) creates a DOM element with textContent === text in the output container', () => {
    const container = document.getElementById('terminal-container')
    const terminal = createTerminal(container, vi.fn())
    terminal.appendOutput('Hello terminal')
    expect(container.textContent).toContain('Hello terminal')
  })

  it('appendOutput(text) uses textContent not innerHTML (angle brackets appear as-is)', () => {
    const container = document.getElementById('terminal-container')
    const terminal = createTerminal(container, vi.fn())
    terminal.appendOutput('At line:1 char:1\n+ <ScriptBlock>')
    // textContent: angle brackets are literal characters, not HTML tags
    // If innerHTML was used, <ScriptBlock> would disappear from textContent
    expect(container.textContent).toContain('<ScriptBlock>')
  })

  it('appendOutput(text, color) sets style.color on the output element to the provided color', () => {
    const container = document.getElementById('terminal-container')
    const terminal = createTerminal(container, vi.fn())
    terminal.appendOutput('muted text', 'var(--color-text-muted)')
    const coloredEls = [...container.querySelectorAll('*')].filter(
      el => el.style.color === 'var(--color-text-muted)'
    )
    expect(coloredEls.length).toBeGreaterThan(0)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// disable()
// ──────────────────────────────────────────────────────────────────────────────

describe('createTerminal — disable()', () => {
  it('disable() sets readonly attribute on the input element', () => {
    const container = document.getElementById('terminal-container')
    const terminal = createTerminal(container, vi.fn())
    terminal.disable()
    const input = container.querySelector('input')
    expect(input).not.toBeNull()
    expect(input.hasAttribute('readonly')).toBe(true)
  })

  it('disable() sets input.style.pointerEvents === "none"', () => {
    const container = document.getElementById('terminal-container')
    const terminal = createTerminal(container, vi.fn())
    terminal.disable()
    const input = container.querySelector('input')
    expect(input.style.pointerEvents).toBe('none')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Enter key handler
// ──────────────────────────────────────────────────────────────────────────────

describe('createTerminal — Enter key handler', () => {
  it('Enter key with empty trimmed string: commandHandler is NOT called', () => {
    const container = document.getElementById('terminal-container')
    const handler = vi.fn()
    createTerminal(container, handler)
    const input = container.querySelector('input')
    input.value = '   '
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(handler).not.toHaveBeenCalled()
  })

  it('Enter key with non-empty string: commandHandler IS called with the trimmed value', () => {
    const container = document.getElementById('terminal-container')
    const handler = vi.fn()
    createTerminal(container, handler)
    const input = container.querySelector('input')
    input.value = '  Get-ItemProperty HKLM:\\test  '
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(handler).toHaveBeenCalledWith('Get-ItemProperty HKLM:\\test')
  })

  it('Enter key: input.value === "" after commandHandler call (input cleared)', () => {
    const container = document.getElementById('terminal-container')
    const handler = vi.fn()
    createTerminal(container, handler)
    const input = container.querySelector('input')
    input.value = 'Get-Item test'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(input.value).toBe('')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Command history — ArrowUp / ArrowDown
// ──────────────────────────────────────────────────────────────────────────────

describe('createTerminal — command history', () => {
  it('ArrowUp key: input.value becomes last submitted command', () => {
    const container = document.getElementById('terminal-container')
    const handler = vi.fn()
    createTerminal(container, handler)
    const input = container.querySelector('input')

    input.value = 'Get-ItemProperty HKLM:\\test'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    expect(input.value).toBe('Get-ItemProperty HKLM:\\test')
  })

  it('ArrowUp twice: input.value becomes second-to-last submitted command', () => {
    const container = document.getElementById('terminal-container')
    const handler = vi.fn()
    createTerminal(container, handler)
    const input = container.querySelector('input')

    input.value = 'first-command'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    input.value = 'second-command'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    expect(input.value).toBe('second-command')

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    expect(input.value).toBe('first-command')
  })

  it('ArrowDown after ArrowUp: input.value advances forward through history', () => {
    const container = document.getElementById('terminal-container')
    const handler = vi.fn()
    createTerminal(container, handler)
    const input = container.querySelector('input')

    input.value = 'first-command'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    input.value = 'second-command'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    // ArrowUp twice → first-command
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    expect(input.value).toBe('first-command')

    // ArrowDown once → second-command (forward)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    expect(input.value).toBe('second-command')
  })

  it('ArrowDown at history start (historyIndex === 0 → -1): input.value === "" (cleared)', () => {
    const container = document.getElementById('terminal-container')
    const handler = vi.fn()
    createTerminal(container, handler)
    const input = container.querySelector('input')

    input.value = 'only-command'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    // ArrowUp to get to only-command (historyIndex = 0)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    expect(input.value).toBe('only-command')

    // ArrowDown — at historyIndex 0, clears input
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    expect(input.value).toBe('')
  })
})
