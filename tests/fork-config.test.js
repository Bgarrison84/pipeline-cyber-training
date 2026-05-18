// tests/fork-config.test.js
// Phase 10 Plan 05 — Test suite for the fork configuration system.
// Covers: src/fork-config.js (unit), router.js inactive-module guard (integration),
//         completion-summary-view.js active-module filter (integration).
// happy-dom environment (vitest.config.js: environment: 'happy-dom')

// ── vi.mock() calls BEFORE imports (Vitest hoisting requirement) ──────────────

vi.mock('../src/utils/icons.js', () => ({ activateIcons: vi.fn() }))

vi.mock('../src/badge.js', () => ({
  renderBadge: vi.fn().mockReturnValue('<span class="badge">TSA</span>'),
  setComplianceRefs: vi.fn(),
  renderBadge: vi.fn().mockReturnValue('<span>badge</span>'),
}))

vi.mock('../src/progress-store.js', () => ({
  progressStore: {
    init: vi.fn().mockResolvedValue(undefined),
    isStorageAvailable: vi.fn().mockReturnValue(true),
    getQuizScore: vi.fn().mockReturnValue(null),
    getExerciseCompletion: vi.fn().mockReturnValue(null),
    getScenarioCompletion: vi.fn().mockReturnValue(null),
    getLessonProgress: vi.fn().mockReturnValue({ visited: false, completed: false }),
    getLastVisited: vi.fn().mockReturnValue(null),
    exportProgress: vi.fn(),
    importProgress: vi.fn().mockResolvedValue({ ok: true }),
    resetProgress: vi.fn(),
    markVisited: vi.fn(),
    markLessonCompleted: vi.fn(),
    saveQuiz: vi.fn(),
    saveExercise: vi.fn(),
    saveScenario: vi.fn(),
  },
}))

vi.mock('../src/content-loader.js', () => ({
  checkLessonAvailability: vi.fn().mockResolvedValue(true),
  fetchLesson: vi.fn().mockResolvedValue('# Lesson'),
  parseFrontmatter: vi.fn().mockReturnValue({ meta: {}, body: '# Lesson' }),
  renderMarkdown: vi.fn().mockResolvedValue('<h1>Lesson</h1>'),
  getLessonNav: vi.fn().mockReturnValue({ prev: null, next: null }),
}))

vi.mock('../src/views/module-view.js', () => ({
  renderModule: vi.fn().mockResolvedValue('<div>Module View</div>'),
}))

vi.mock('../src/sidebar.js', () => ({
  initSidebar: vi.fn().mockResolvedValue(undefined),
  setActiveModule: vi.fn(),
  setActiveLesson: vi.fn(),
  refreshSidebarProgress: vi.fn(),
}))

vi.mock('../src/quiz-engine.js', () => ({
  computeModuleProgress: vi.fn().mockReturnValue({
    pct: 0, numerator: 0, denominator: 2, complete: false,
  }),
}))

vi.mock('../src/modules-config.js', () => ({
  MODULES: [
    {
      id: 'logging-auditing',
      title: 'Logging & Auditing',
      icon: 'BookOpen',
      description: 'Mod 1',
      complianceTags: ['TSA'],
      lessons: [{ id: 'intro', title: 'Introduction' }],
    },
    {
      id: 'network-hardening',
      title: 'Network Hardening',
      icon: 'Shield',
      description: 'Mod 2',
      complianceTags: ['TSA'],
      lessons: [{ id: 'intro', title: 'Introduction' }],
    },
    {
      id: 'patch-management',
      title: 'Patch Management',
      icon: 'RefreshCw',
      description: 'Mod 5',
      complianceTags: ['TSA'],
      lessons: [{ id: 'intro', title: 'Introduction' }],
    },
  ],
}))

// ── Imports ───────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DEFAULT_FORK_CONFIG } from '../src/fork-config.js'

// ── 1. DEFAULT_FORK_CONFIG shape ──────────────────────────────────────────────

describe('DEFAULT_FORK_CONFIG', () => {
  it('has orgName "OT Security Lab"', () => {
    expect(DEFAULT_FORK_CONFIG.orgName).toBe('OT Security Lab')
  })

  it('has logoPath null', () => {
    expect(DEFAULT_FORK_CONFIG.logoPath).toBeNull()
  })

  it('has activeModules as an array of length 5', () => {
    expect(Array.isArray(DEFAULT_FORK_CONFIG.activeModules)).toBe(true)
    expect(DEFAULT_FORK_CONFIG.activeModules.length).toBe(5)
  })

  it('contains all 5 canonical module IDs', () => {
    const ids = DEFAULT_FORK_CONFIG.activeModules
    expect(ids).toContain('logging-auditing')
    expect(ids).toContain('network-hardening')
    expect(ids).toContain('account-access')
    expect(ids).toContain('incident-response')
    expect(ids).toContain('patch-management')
  })
})

// ── 2. getForkConfig() before loadForkConfig() ────────────────────────────────

describe('getForkConfig() before loadForkConfig()', () => {
  let getForkConfig, modDefault

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../src/fork-config.js')
    getForkConfig = mod.getForkConfig
    modDefault = mod.DEFAULT_FORK_CONFIG
  })

  afterEach(() => vi.restoreAllMocks())

  it('returns DEFAULT_FORK_CONFIG when called before loadForkConfig()', () => {
    expect(getForkConfig()).toEqual(modDefault)
  })

  it('never returns null', () => {
    expect(getForkConfig()).not.toBeNull()
  })

  it('returns an object with orgName "OT Security Lab"', () => {
    expect(getForkConfig().orgName).toBe('OT Security Lab')
  })
})

// ── 3. loadForkConfig() failure cases ─────────────────────────────────────────

describe('loadForkConfig() — fetch failure cases', () => {
  let loadForkConfig, DEFAULT_FC

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../src/fork-config.js')
    loadForkConfig = mod.loadForkConfig
    DEFAULT_FC = mod.DEFAULT_FORK_CONFIG
    global.fetch = vi.fn()
  })

  afterEach(() => vi.restoreAllMocks())

  it('returns DEFAULT_FORK_CONFIG when fetch throws a network error', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'))
    const result = await loadForkConfig()
    expect(result).toEqual(DEFAULT_FC)
    expect(result).not.toBeNull()
  })

  it('returns DEFAULT_FORK_CONFIG when fetch returns 404 (!res.ok)', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 404 })
    const result = await loadForkConfig()
    expect(result).toEqual(DEFAULT_FC)
    expect(result).not.toBeNull()
  })

  it('returns DEFAULT_FORK_CONFIG when response body is invalid JSON', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
    })
    const result = await loadForkConfig()
    expect(result).toEqual(DEFAULT_FC)
    expect(result).not.toBeNull()
  })

  it('returns DEFAULT_FORK_CONFIG when JSON is missing orgName', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ activeModules: ['logging-auditing'] }),
    })
    const result = await loadForkConfig()
    expect(result).toEqual(DEFAULT_FC)
  })

  it('returns DEFAULT_FORK_CONFIG when activeModules is not an array', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ orgName: 'Acme', activeModules: 'not-an-array' }),
    })
    const result = await loadForkConfig()
    expect(result).toEqual(DEFAULT_FC)
  })

  it('returns DEFAULT_FORK_CONFIG when activeModules is an empty array', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ orgName: 'Acme', activeModules: [] }),
    })
    const result = await loadForkConfig()
    expect(result).toEqual(DEFAULT_FC)
  })
})

// ── 4. loadForkConfig() success ───────────────────────────────────────────────

describe('loadForkConfig() — success', () => {
  let loadForkConfig, getForkConfig

  const VALID_CONFIG = {
    orgName: 'OkieOps',
    logoPath: 'OkieOps.png',
    activeModules: ['logging-auditing', 'network-hardening'],
  }

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../src/fork-config.js')
    loadForkConfig = mod.loadForkConfig
    getForkConfig = mod.getForkConfig
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(VALID_CONFIG),
    })
  })

  afterEach(() => vi.restoreAllMocks())

  it('returns the parsed config on valid fetch response', async () => {
    const result = await loadForkConfig()
    expect(result.orgName).toBe('OkieOps')
    expect(result.logoPath).toBe('OkieOps.png')
    expect(result.activeModules).toEqual(['logging-auditing', 'network-hardening'])
  })

  it('never returns null on success', async () => {
    const result = await loadForkConfig()
    expect(result).not.toBeNull()
  })

  it('getForkConfig() returns the loaded config after successful loadForkConfig()', async () => {
    await loadForkConfig()
    const config = getForkConfig()
    expect(config.orgName).toBe('OkieOps')
    expect(config.activeModules).toEqual(['logging-auditing', 'network-hardening'])
  })
})

// ── 5. applyForkBranding() — logoPath null (text-only) ───────────────────────

describe('applyForkBranding() — logoPath null (text-only)', () => {
  let applyForkBranding

  beforeEach(async () => {
    vi.resetModules()
    ;({ applyForkBranding } = await import('../src/fork-config.js'))
    document.body.innerHTML = '<header id="top-bar"><span>OT Security Lab</span></header>'
  })

  afterEach(() => vi.restoreAllMocks())

  const CONFIG = { orgName: 'AcmePipeline', logoPath: null, activeModules: [] }

  it('sets document.title to "orgName — OT Cyber Training"', () => {
    applyForkBranding(CONFIG)
    expect(document.title).toBe('AcmePipeline — OT Cyber Training')
  })

  it('sets span.textContent to orgName', () => {
    applyForkBranding(CONFIG)
    const span = document.querySelector('#top-bar > span')
    expect(span.textContent).toBe('AcmePipeline')
  })

  it('does not inject an img element when logoPath is null', () => {
    applyForkBranding(CONFIG)
    const span = document.querySelector('#top-bar > span')
    expect(span.querySelector('img')).toBeNull()
  })

  it('returns without error when #top-bar > span is absent', () => {
    document.body.innerHTML = '<div></div>'
    expect(() => applyForkBranding(CONFIG)).not.toThrow()
  })
})

// ── 6. applyForkBranding() — logoPath set (img + text) ───────────────────────

describe('applyForkBranding() — logoPath set (img + text)', () => {
  let applyForkBranding

  beforeEach(async () => {
    vi.resetModules()
    ;({ applyForkBranding } = await import('../src/fork-config.js'))
    document.body.innerHTML = '<header id="top-bar"><span>OT Security Lab</span></header>'
  })

  afterEach(() => vi.restoreAllMocks())

  const CONFIG = { orgName: 'OkieOps', logoPath: 'OkieOps.png', activeModules: [] }

  it('sets document.title to "orgName — OT Cyber Training"', () => {
    applyForkBranding(CONFIG)
    expect(document.title).toBe('OkieOps — OT Cyber Training')
  })

  it('injects an img element into the top-bar span', () => {
    applyForkBranding(CONFIG)
    const img = document.querySelector('#top-bar > span img')
    expect(img).not.toBeNull()
  })

  it('img src attribute includes the logoPath', () => {
    applyForkBranding(CONFIG)
    const img = document.querySelector('#top-bar > span img')
    expect(img.getAttribute('src')).toContain('OkieOps.png')
  })

  it('img alt attribute equals orgName', () => {
    applyForkBranding(CONFIG)
    const img = document.querySelector('#top-bar > span img')
    expect(img.getAttribute('alt')).toBe('OkieOps')
  })
})

// ── 7. router.js inactive-module guard ───────────────────────────────────────

describe('router.js inactive-module guard', () => {
  let handleRoute, _resetInitialLoadForTesting

  beforeEach(async () => {
    vi.resetModules()

    // Load fork-config fresh and prime it with a limited activeModules list
    const forkMod = await import('../src/fork-config.js')
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        orgName: 'TestOrg',
        logoPath: null,
        activeModules: ['logging-auditing'],
      }),
    })
    await forkMod.loadForkConfig()
    global.fetch.mockReset()

    // Import router (shares the same fork-config instance via module cache)
    const routerMod = await import('../src/router.js')
    handleRoute = routerMod.handleRoute
    _resetInitialLoadForTesting = routerMod._resetInitialLoadForTesting
    _resetInitialLoadForTesting()

    document.body.innerHTML = '<div id="app"></div>'
  })

  afterEach(() => vi.restoreAllMocks())

  it('renders "not enabled" message when navigating to an inactive module', async () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { hash: '#/module/patch-management' },
    })
    await handleRoute()
    expect(document.getElementById('app').innerHTML)
      .toContain('not enabled for your organization')
  })

  it('does NOT render "not enabled" when navigating to an active module', async () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { hash: '#/module/logging-auditing' },
    })
    await handleRoute()
    expect(document.getElementById('app').innerHTML)
      .not.toContain('not enabled for your organization')
  })
})

// ── 8. completion-summary-view.js active filter ───────────────────────────────

describe('completion-summary-view.js active filter', () => {
  let renderCompletionSummary

  beforeEach(async () => {
    vi.resetModules()

    // Prime fork-config with only 1 active module
    const forkMod = await import('../src/fork-config.js')
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        orgName: 'TestOrg',
        logoPath: null,
        activeModules: ['logging-auditing'],
      }),
    })
    await forkMod.loadForkConfig()
    global.fetch.mockReset()

    // Configure computeModuleProgress to report progress so the table renders
    const qe = await import('../src/quiz-engine.js')
    qe.computeModuleProgress.mockReturnValue({ pct: 100, numerator: 1, denominator: 1, complete: true })

    const mod = await import('../src/views/completion-summary-view.js')
    renderCompletionSummary = mod.renderCompletionSummary

    document.body.innerHTML = '<div id="app"></div>'
  })

  afterEach(() => vi.restoreAllMocks())

  it('renders the Completion Summary heading', () => {
    renderCompletionSummary()
    expect(document.getElementById('app').textContent).toContain('Completion Summary')
  })

  it('renders only the active module in the progress table — inactive modules absent', () => {
    renderCompletionSummary()
    const html = document.getElementById('app').innerHTML
    // Active module appears
    expect(html).toContain('Logging')
    // Inactive modules from the mocked MODULES list are absent
    expect(html).not.toContain('Network Hardening')
    expect(html).not.toContain('Patch Management')
  })
})
