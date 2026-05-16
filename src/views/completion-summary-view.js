// src/views/completion-summary-view.js
// Phase 06 Plan 04 — Completion Summary view (ASSESS-04 printable training log).
// Synchronous renderer — no fetch, reads progressStore directly.
// Threat mitigations: T-06-W3-01 (textContent for name), T-06-W3-02 (esc() on all strings),
//                     T-06-W3-04 (print-hide class on sidebar-visible elements).

import { esc } from '../utils/escape.js';
import { activateIcons } from '../utils/icons.js';
import { progressStore } from '../progress-store.js';
import { renderBadge } from '../badge.js';
import { MODULES } from '../modules-config.js';
import { computeModuleProgress } from '../quiz-engine.js';

// ──────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Get quiz score info for the first lesson with a quizId in the module.
 * @param {{ id: string, lessons: Array }} mod
 * @returns {{ score: number, total: number }|null}
 */
function getModuleQuizInfo(mod) {
  const lesson = mod.lessons.find(l => l.quizId);
  if (!lesson) return null;
  const result = progressStore.getQuizScore(mod.id, lesson.quizId);
  if (!result) return null;
  return { score: result.score, total: result.total };
}

/**
 * Get the most recent completion date across quiz/exercise/scenario for this module.
 * Returns ISO date sliced to YYYY-MM-DD, or null.
 * @param {{ id: string, lessons: Array }} mod
 * @returns {string|null}
 */
function getModuleMostRecentDate(mod) {
  let mostRecent = null;

  for (const lesson of mod.lessons) {
    if (lesson.quizId) {
      const r = progressStore.getQuizScore(mod.id, lesson.quizId);
      if (r?.attemptedAt) {
        if (!mostRecent || r.attemptedAt > mostRecent) mostRecent = r.attemptedAt;
      }
    }
    if (lesson.exerciseId) {
      const r = progressStore.getExerciseCompletion(mod.id, lesson.exerciseId);
      if (r?.completedAt) {
        if (!mostRecent || r.completedAt > mostRecent) mostRecent = r.completedAt;
      }
    }
    if (lesson.scenarioId) {
      const r = progressStore.getScenarioCompletion(mod.id, lesson.scenarioId);
      if (r?.completedAt) {
        if (!mostRecent || r.completedAt > mostRecent) mostRecent = r.completedAt;
      }
    }
  }

  return mostRecent ? mostRecent.slice(0, 10) : null;
}

/**
 * Build C-17 progress table HTML.
 * @param {Array} modules
 * @returns {string}
 */
function buildProgressTableHtml(modules) {
  const headerCellStyle = [
    'padding: var(--spacing-xs) var(--spacing-sm);',
    'font-size: 0.8125rem;',
    'font-weight: 600;',
    'text-transform: uppercase;',
    'letter-spacing: 0.06em;',
    'color: var(--color-text-muted);',
  ].join('');

  const rows = modules.map(mod => {
    const progress = computeModuleProgress(mod);
    const progressText = `${progress.numerator}/${progress.denominator} lessons`;
    const quizInfo = getModuleQuizInfo(mod);
    const quizText = quizInfo ? `${quizInfo.score}/${quizInfo.total}` : '—';
    const dateText = getModuleMostRecentDate(mod) ?? '—';

    return `
      <div style="display:grid;grid-template-columns:1fr 80px 100px 100px;border-top:1px solid var(--color-border);">
        <div style="padding:var(--spacing-xs) var(--spacing-sm);font-size:var(--text-body);color:var(--color-text-primary);">${esc(mod.title)}</div>
        <div style="padding:var(--spacing-xs) var(--spacing-sm);font-size:var(--text-body);color:var(--color-text-muted);">${esc(progressText)}</div>
        <div style="padding:var(--spacing-xs) var(--spacing-sm);font-size:var(--text-body);color:var(--color-text-muted);">${esc(quizText)}</div>
        <div style="padding:var(--spacing-xs) var(--spacing-sm);font-size:0.8125rem;color:var(--color-text-muted);">${esc(dateText)}</div>
      </div>
    `.trim();
  }).join('');

  return `
    <div style="background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:6px;overflow:hidden;margin-bottom:var(--spacing-xl);">
      <div style="display:grid;grid-template-columns:1fr 80px 100px 100px;background:var(--color-bg-base);">
        <div style="${headerCellStyle}">Module</div>
        <div style="${headerCellStyle}">Progress</div>
        <div style="${headerCellStyle}">Quiz Score</div>
        <div style="${headerCellStyle}">Date</div>
      </div>
      ${rows}
    </div>
  `.trim();
}

/**
 * Build C-18 compliance controls badges HTML.
 * Collects unique complianceTags from modules with any completed lessons.
 * @param {Array} modules
 * @returns {string}
 */
function buildControlsBadgesHtml(modules) {
  const seen = new Set();
  const badges = [];

  for (const mod of modules) {
    const progress = computeModuleProgress(mod);
    if (progress.numerator > 0 && Array.isArray(mod.complianceTags)) {
      for (const tag of mod.complianceTags) {
        if (!seen.has(tag)) {
          seen.add(tag);
          badges.push(renderBadge(tag));
        }
      }
    }
  }

  if (badges.length === 0) {
    return '<p style="font-size:var(--text-body);color:var(--color-text-muted);margin:0;">No controls covered yet.</p>';
  }

  return `<div style="display:flex;flex-wrap:wrap;gap:var(--spacing-xs);">${badges.join('')}</div>`;
}

// ──────────────────────────────────────────────────────────────────────────────
// renderCompletionSummary — main exported view renderer
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Render the completion summary view.
 * Synchronous — no fetch calls. Writes directly to #app. Returns null.
 * @returns {null}
 */
export function renderCompletionSummary() {
  // Step 1 — null-guard
  const app = document.getElementById('app');
  if (!app) return null;

  // Step 2 — Check storage availability
  const storageOk = progressStore.isStorageAvailable();

  // Step 3 — Check if there is any progress at all
  const hasProgress = MODULES.some(mod => computeModuleProgress(mod).numerator > 0);

  // Step 4 — Build and inject HTML
  let mainContent;

  if (!storageOk) {
    // Storage unavailable warning replaces C-17/C-18
    mainContent = `
      <div role="alert"
           style="background:var(--color-bg-secondary);border:1px solid var(--color-destructive);border-radius:6px;padding:var(--spacing-md);margin-bottom:var(--spacing-xl);">
        <p style="font-size:var(--text-body);color:var(--color-destructive);margin:0;font-weight:600;">
          Storage unavailable — progress not saved
        </p>
        <p style="font-size:var(--text-body);color:var(--color-text-muted);margin:var(--spacing-xs) 0 0 0;">
          Your browser's localStorage is unavailable (private browsing or quota full). Progress data cannot be read or saved.
        </p>
      </div>
    `.trim();
  } else if (!hasProgress) {
    // C-20 Empty state
    mainContent = `
      <div style="text-align:center;padding:var(--spacing-xl) 0;">
        <i data-lucide="book-open" style="width:24px;height:24px;color:var(--color-text-muted);margin:0 auto var(--spacing-sm) auto;display:block;"></i>
        <p style="font-size:var(--text-body);color:var(--color-text-muted);margin:0 0 var(--spacing-xs) 0;">No progress recorded yet.</p>
        <p style="font-size:var(--text-body);color:var(--color-text-muted);margin:0 0 var(--spacing-md) 0;">Complete at least one lesson to generate a training log.</p>
        <a href="#/module/logging-auditing"
           style="font-size:var(--text-body);font-weight:600;color:var(--color-accent);text-underline-offset:3px;">
          Go to Module 1 &rarr;
        </a>
      </div>
    `.trim();
  } else {
    // C-17 Progress table + C-18 Controls badges
    const tableHtml = buildProgressTableHtml(MODULES);
    const badgesHtml = buildControlsBadgesHtml(MODULES);

    mainContent = `
      ${tableHtml}
      <div style="margin-bottom:var(--spacing-xl);">
        <h2 style="font-size:var(--text-heading);font-weight:600;color:var(--color-text-primary);margin:0 0 var(--spacing-sm) 0;">Compliance Controls Covered</h2>
        ${badgesHtml}
      </div>
    `.trim();
  }

  app.innerHTML = `
    <div class="lesson-wrapper">
      <div class="lesson-column" style="max-width:720px;margin:0 auto;padding:var(--spacing-xl);">

        <!-- C-15 Page header -->
        <p style="font-family:var(--font-mono);font-size:0.8125rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted);margin:0 0 var(--spacing-xs) 0;">TRAINING LOG ARTIFACT</p>
        <h1 style="font-size:var(--text-display);font-weight:600;line-height:1.2;color:var(--color-text-primary);margin:0 0 var(--spacing-md) 0;">Completion Summary</h1>
        <div style="background:var(--color-bg-secondary);border-left:4px solid var(--color-accent);border-radius:0 4px 4px 0;padding:var(--spacing-sm) var(--spacing-md);margin-bottom:var(--spacing-xl);">
          <span style="font-family:var(--font-mono);font-size:0.8125rem;font-weight:600;color:var(--color-accent);margin-right:var(--spacing-xs);">Note:</span>
          <span style="font-size:var(--text-body);color:var(--color-text-muted);">This is a training log artifact. It does not constitute a compliance certification or satisfy any regulatory filing requirement.</span>
        </div>

        <!-- C-16 Learner name input (hidden in print) -->
        <div class="print-hide" style="background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:4px;padding:var(--spacing-md);margin-bottom:var(--spacing-xl);">
          <label for="learner-name-input"
                 style="display:block;font-size:0.8125rem;font-weight:600;color:var(--color-text-muted);margin-bottom:var(--spacing-xs);">
            Your name (for this training log):
          </label>
          <input id="learner-name-input"
                 type="text"
                 placeholder="Enter your name"
                 style="width:100%;min-height:44px;background:var(--color-bg-base);border:1px solid var(--color-border);border-radius:4px;padding:0 var(--spacing-sm);font-size:var(--text-body);color:var(--color-text-primary);box-sizing:border-box;" />
          <p style="font-size:0.8125rem;color:var(--color-text-muted);margin:var(--spacing-xs) 0 0 0;">
            Your name will appear in the printed log. It is not stored or transmitted.
          </p>
        </div>

        <!-- Learner name display (shown in print output) -->
        <p data-learner-name-display
           style="font-size:var(--text-body);color:var(--color-text-muted);margin:0 0 var(--spacing-xl) 0;display:none;"></p>

        <!-- C-17 / C-18 / C-20 / Storage warning -->
        ${mainContent}

        <!-- C-19 Print button (hidden in print) -->
        <div class="print-hide" style="margin-top:var(--spacing-xl);">
          <button id="print-summary-btn"
                  style="display:inline-flex;align-items:center;gap:var(--spacing-xs);background:var(--color-accent);color:#fff;border:none;border-radius:4px;padding:var(--spacing-sm) var(--spacing-md);font-size:var(--text-body);font-weight:600;cursor:pointer;">
            <i data-lucide="printer" style="width:16px;height:16px;color:#fff;flex-shrink:0;"></i>
            Print Training Log
          </button>
        </div>

      </div>
    </div>
  `.trim();

  // Step 5 — activateIcons
  activateIcons();

  // Step 6 — Wire event listeners
  const nameInput = app.querySelector('#learner-name-input');
  const nameDisplay = app.querySelector('[data-learner-name-display]');
  let learnerName = '';

  if (nameInput) {
    nameInput.addEventListener('input', e => {
      // T-06-W3-01: name is displayed via textContent — never via innerHTML
      learnerName = e.target.value;
      if (nameDisplay) {
        if (learnerName) {
          nameDisplay.textContent = 'Learner: ' + learnerName;
          nameDisplay.style.display = '';
        } else {
          nameDisplay.textContent = '';
          nameDisplay.style.display = 'none';
        }
      }
    });
  }

  const printBtn = app.querySelector('#print-summary-btn');
  if (printBtn) {
    // T-06-W3-05: No debounce — user-intentional action, no loop risk
    printBtn.addEventListener('click', () => window.print());
  }

  return null;
}
