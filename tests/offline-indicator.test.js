// tests/offline-indicator.test.js
// Phase 11 Plan 02 — Test suite for the offline indicator / PWA install prompt component.
// Covers: src/offline-indicator.js (unit) — DOM injection, online/offline transitions,
//         beforeinstallprompt handling, SW controllerchange listener, and guard for missing container.
// happy-dom environment (vitest.config.js: environment: 'happy-dom')
// NOTE: src/offline-indicator.js does not exist yet — all tests FAIL in RED phase.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// No vi.mock() blocks needed — offline-indicator.js has no project-local imports.

// Dynamic import with vi.resetModules() to reset module-level singleton state between tests.
let initOfflineIndicator

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../src/offline-indicator.js')
  initOfflineIndicator = mod.initOfflineIndicator

  // Set up the DOM structure that initOfflineIndicator() queries.
  // Mirrors index.html top-bar header (line 19) with the flex container.
  document.body.innerHTML = `
    <header id="top-bar" class="col-span-2 flex items-center justify-between">
      <span>OT Security Lab</span>
      <div class="flex items-center gap-4">
        <a href="#/compliance-index">Compliance Index</a>
      </div>
    </header>
  `

  // Mock navigator.onLine — default: online (true)
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    get: () => true,
  })

  // Mock navigator.serviceWorker to avoid "not in navigator" branch in CI
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { addEventListener: vi.fn() },
  })
})

afterEach(() => vi.restoreAllMocks())

// ── 1. DOM injection ───────────────────────────────────────────────────────────
describe('initOfflineIndicator() — DOM injection', () => {
  it('appends #offline-indicator element into #top-bar > div.flex', () => {
    initOfflineIndicator()
    const indicator = document.getElementById('offline-indicator')
    expect(indicator).toBeTruthy()
    // Must be inside the flex container div (not directly in header)
    const flexContainer = document.querySelector('#top-bar > div.flex')
    expect(flexContainer).toBeTruthy()
    expect(flexContainer.contains(indicator)).toBe(true)
  })

  it('appends #install-link element that is initially hidden (display: none)', () => {
    initOfflineIndicator()
    const installLink = document.getElementById('install-link')
    expect(installLink).toBeTruthy()
    expect(installLink.style.display).toBe('none')
  })
})

// ── 2. Online/offline state transitions ───────────────────────────────────────
describe('initOfflineIndicator() — state transitions', () => {
  it('label textContent contains "Online" when navigator.onLine is true at init', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true })
    initOfflineIndicator()
    const indicator = document.getElementById('offline-indicator')
    expect(indicator.textContent).toContain('Online')
  })

  it('label textContent contains "Offline" when navigator.onLine is false at init', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false })
    initOfflineIndicator()
    const indicator = document.getElementById('offline-indicator')
    expect(indicator.textContent).toContain('Offline')
  })

  it('status dot background contains "#22c55e" (green) when online', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true })
    initOfflineIndicator()
    const dot = document.querySelector('#offline-indicator span:first-child')
    expect(dot).toBeTruthy()
    expect(dot.style.backgroundColor).toContain('#22c55e')
  })

  it('status dot background contains "#d97706" (amber) when offline', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false })
    initOfflineIndicator()
    const dot = document.querySelector('#offline-indicator span:first-child')
    expect(dot).toBeTruthy()
    expect(dot.style.backgroundColor).toContain('#d97706')
  })

  it('window offline event transitions label to "Offline"', () => {
    initOfflineIndicator()
    window.dispatchEvent(new Event('offline'))
    const indicator = document.getElementById('offline-indicator')
    expect(indicator.textContent).toContain('Offline')
  })

  it('window online event after offline transitions label back to "Online"', () => {
    initOfflineIndicator()
    window.dispatchEvent(new Event('offline'))
    window.dispatchEvent(new Event('online'))
    const indicator = document.getElementById('offline-indicator')
    expect(indicator.textContent).toContain('Online')
  })
})

// ── 3. Install prompt ─────────────────────────────────────────────────────────
describe('initOfflineIndicator() — install prompt', () => {
  it('registers a listener for "beforeinstallprompt" on window', () => {
    const addEventSpy = vi.spyOn(window, 'addEventListener')
    initOfflineIndicator()
    const registeredEvents = addEventSpy.mock.calls.map(call => call[0])
    expect(registeredEvents).toContain('beforeinstallprompt')
  })

  it('beforeinstallprompt event causes #install-link to become visible (display !== "none")', () => {
    initOfflineIndicator()
    // Integration: verify in browser (happy-dom may not support non-standard install events)
    const mockPrompt = {
      preventDefault: vi.fn(),
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    }
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockPrompt))
    const installLink = document.getElementById('install-link')
    expect(installLink).toBeTruthy()
    expect(installLink.style.display).not.toBe('none')
  })

  it('appinstalled event after beforeinstallprompt hides #install-link (display: "none")', () => {
    initOfflineIndicator()
    const mockPrompt = {
      preventDefault: vi.fn(),
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    }
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockPrompt))
    window.dispatchEvent(new Event('appinstalled'))
    const installLink = document.getElementById('install-link')
    expect(installLink.style.display).toBe('none')
  })

  it('clicking #install-link calls deferredPrompt.prompt()', () => {
    initOfflineIndicator()
    const mockPrompt = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    }
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockPrompt))
    const installLink = document.getElementById('install-link')
    expect(installLink).toBeTruthy()
    installLink.click()
    expect(mockPrompt.prompt).toHaveBeenCalledTimes(1)
  })
})

// ── 4. SW controllerchange listener ───────────────────────────────────────────
describe('initOfflineIndicator() — serviceWorker integration', () => {
  it('calls navigator.serviceWorker.addEventListener with "controllerchange" as first arg', () => {
    const swAddListener = vi.fn()
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { addEventListener: swAddListener },
    })
    initOfflineIndicator()
    expect(swAddListener).toHaveBeenCalledWith('controllerchange', expect.any(Function))
  })
})

// ── 5. Guard: no container ─────────────────────────────────────────────────────
describe('initOfflineIndicator() — guard: no container', () => {
  it('does not throw when #top-bar > div.flex is absent from DOM', () => {
    // Replace DOM with a header that has no flex div
    document.body.innerHTML = '<header id="top-bar"><span>OT Security Lab</span></header>'
    expect(() => initOfflineIndicator()).not.toThrow()
  })
})
