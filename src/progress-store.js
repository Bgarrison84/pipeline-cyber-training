// src/progress-store.js
// Single owner of ALL localStorage access for the pipeline cyber training app.
// No other module may call localStorage directly.
//
// Covers: ASSESS-03 (resume on return), DATA-04 (schemaVersion + QuotaExceededError),
//         DATA-05 (JSON export/import)

// esc is consumed by progress-store.js consumers (lesson-view.js, sidebar.js)
// when they render progress values into innerHTML. Not used directly in this file.
// import { esc } from './utils/escape.js';

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'pipeline-cyber-training:progress';
const CURRENT_VERSION = 1;

// ──────────────────────────────────────────────────────────────────────────────
// Private module-level state — never exported directly
// ──────────────────────────────────────────────────────────────────────────────

let _store = null;
let _storageAvailable = false;

// ──────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Probe whether localStorage is actually writable.
 * Catches SecurityError (Safari private browsing) and QuotaExceededError.
 * Called once in init(); result cached in _storageAvailable.
 */
function probeStorage() {
  try {
    const KEY = '__pct_probe__';
    localStorage.setItem(KEY, '1');
    localStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Return a fresh blank store object with schemaVersion: 1.
 */
function _blankStore() {
  return {
    schemaVersion: 1,
    lastVisited: null,
    lessons: {},
    quizzes: {},
    exercises: {},
    scenarios: {},
  };
}

/**
 * Persist the current in-memory _store to localStorage.
 * No-op if storage is unavailable. Downgrades _storageAvailable on mid-session quota error.
 */
function _persist() {
  if (!_storageAvailable) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_store));
  } catch {
    // Quota filled mid-session (D-09)
    _storageAvailable = false;
  }
}

/**
 * Migration runner. Returns a NEW object (never mutates input).
 * Phase 3 ships v1 only — chain is wired for future use.
 * Also exported as _migrateForTesting for unit tests.
 *
 * @param {object} data - Parsed progress object from localStorage
 * @returns {object} Migrated progress object
 */
function migrate(data) {
  // Build a new object via deep copy to ensure no mutations affect the input.
  // When v1->v2 is needed, add: if (d.schemaVersion === 1) { d = migrateV1toV2(d); }
  const d = JSON.parse(JSON.stringify(data));
  // Ensure all required top-level keys exist (fill in blanks from blank schema)
  const blank = _blankStore();
  for (const key of Object.keys(blank)) {
    if (!(key in d)) {
      d[key] = blank[key];
    }
  }
  return d;
}

/**
 * Load and parse the progress object from localStorage.
 * Returns null if absent, invalid, or unrecognizable.
 */
function _loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.schemaVersion !== 'number') return null;
    if (parsed.schemaVersion > CURRENT_VERSION) return null; // treat as unrecognizable (CR-02/WR-05)
    return migrate(parsed); // always fill in missing keys (WR-05)
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Initialize the progress store.
 * Probes storage availability, loads and migrates existing data,
 * or writes a blank schema if no existing data is found.
 * Must be awaited before any other progressStore method is called.
 */
async function init() {
  _storageAvailable = probeStorage();
  const loaded = _storageAvailable ? _loadFromStorage() : null;
  _store = loaded ?? _blankStore();
  if (!loaded && _storageAvailable) {
    _persist();
  }
}

/** @returns {boolean} Whether localStorage is available and writable */
function isStorageAvailable() {
  return _storageAvailable;
}

/** @returns {{ moduleId: string, lessonId: string }|null} Last visited lesson, or null */
function getLastVisited() {
  return _store.lastVisited;
}

/**
 * Record the last visited lesson position.
 * @param {string} moduleId
 * @param {string} lessonId
 */
function setLastVisited(moduleId, lessonId) {
  _store.lastVisited = { moduleId, lessonId };
  _persist();
}

/**
 * Mark a lesson as visited (first open). Also updates lastVisited.
 * @param {string} moduleId
 * @param {string} lessonId
 */
function markVisited(moduleId, lessonId) {
  const key = moduleId + '/' + lessonId;
  _store.lessons[key] = {
    ...(_store.lessons[key] ?? { visited: false, completed: false }),
    visited: true,
  };
  _store.lastVisited = { moduleId, lessonId };
  _persist();
}

/**
 * Mark a lesson as completed.
 * @param {string} moduleId
 * @param {string} lessonId
 */
function markLessonCompleted(moduleId, lessonId) {
  const key = moduleId + '/' + lessonId;
  _store.lessons[key] = {
    ...(_store.lessons[key] ?? { visited: false, completed: false }),
    completed: true,
  };
  _persist();
}

/**
 * Save quiz result (last attempt only).
 * @param {string} moduleId
 * @param {string} quizId
 * @param {{ score: number, total: number }} result
 */
function saveQuiz(moduleId, quizId, { score, total }) {
  _store.quizzes[moduleId + '/' + quizId] = {
    score,
    total,
    attemptedAt: new Date().toISOString(),
  };
  _persist();
}

/**
 * Save exercise completion.
 * @param {string} moduleId
 * @param {string} exerciseId
 */
function saveExercise(moduleId, exerciseId) {
  _store.exercises[moduleId + '/' + exerciseId] = {
    completed: true,
    completedAt: new Date().toISOString(),
  };
  _persist();
}

/**
 * Save scenario completion.
 * @param {string} moduleId
 * @param {string} scenarioId
 */
function saveScenario(moduleId, scenarioId) {
  _store.scenarios[moduleId + '/' + scenarioId] = {
    completed: true,
    completedAt: new Date().toISOString(),
  };
  _persist();
}

/**
 * Get lesson progress for a specific lesson.
 * @param {string} moduleId
 * @param {string} lessonId
 * @returns {{ visited: boolean, completed: boolean }}
 */
function getLessonProgress(moduleId, lessonId) {
  return _store.lessons[moduleId + '/' + lessonId] ?? { visited: false, completed: false };
}

/**
 * Get quiz score for a specific quiz.
 * @param {string} moduleId
 * @param {string} quizId
 * @returns {{ score: number, total: number, attemptedAt: string }|null}
 */
function getQuizScore(moduleId, quizId) {
  return _store.quizzes[moduleId + '/' + quizId] ?? null;
}

/**
 * Get exercise completion for a specific exercise.
 * @param {string} moduleId
 * @param {string} exerciseId
 * @returns {{ completed: boolean, completedAt: string }|null}
 */
function getExerciseCompletion(moduleId, exerciseId) {
  return _store.exercises[moduleId + '/' + exerciseId] ?? null;
}

/**
 * Get scenario completion for a specific scenario.
 * @param {string} moduleId
 * @param {string} scenarioId
 * @returns {{ completed: boolean, completedAt: string }|null}
 */
function getScenarioCompletion(moduleId, scenarioId) {
  return _store.scenarios[moduleId + '/' + scenarioId] ?? null;
}

/**
 * Export progress data as a downloadable JSON file.
 * Uses URL.createObjectURL + anchor click pattern (static-host safe).
 */
function exportProgress() {
  const json = JSON.stringify(_store, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  a.href = url;
  a.download = 'pipeline-cyber-training-progress-' + date + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Import progress data from a user-selected JSON file.
 * Validates structure, runs migration if needed, replaces store on success.
 * Never overwrites existing state on validation failure.
 *
 * @param {File} file
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
async function importProgress(file) {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (typeof parsed.schemaVersion !== 'number') {
      return { ok: false, error: 'Not a valid progress file (missing schemaVersion).' };
    }

    if (parsed.schemaVersion > CURRENT_VERSION) {
      return {
        ok: false,
        error: `This progress file was saved by a newer version of the app (schema v${parsed.schemaVersion}). Please update the app before importing.`,
      };
    }

    const hasKnownKeys = ['lessons', 'quizzes', 'exercises', 'scenarios'].some(
      k => k in parsed
    );
    if (!hasKnownKeys) {
      return { ok: false, error: 'File structure unrecognizable.' };
    }

    const migrated = migrate(parsed);
    _store = migrated;
    _persist();
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not parse file as JSON.' };
  }
}

/**
 * Reset all progress data — clears in-memory state and removes localStorage entry.
 * Useful for testing and for a "start over" UI action.
 */
function resetProgress() {
  _store = _blankStore();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore removal errors
  }
  // Re-probe: removing the key may have freed enough quota to re-enable storage.
  _storageAvailable = probeStorage();
}

// ──────────────────────────────────────────────────────────────────────────────
// Exports
// ──────────────────────────────────────────────────────────────────────────────

export const progressStore = {
  init,
  isStorageAvailable,
  getLastVisited,
  setLastVisited,
  markVisited,
  markLessonCompleted,
  saveQuiz,
  saveExercise,
  saveScenario,
  getLessonProgress,
  getQuizScore,
  getExerciseCompletion,
  getScenarioCompletion,
  exportProgress,
  importProgress,
  resetProgress,
};

// Named export for testing — underscore prefix documents test-only intent
export { migrate as _migrateForTesting };
