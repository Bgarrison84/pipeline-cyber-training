// src/views/exercise-view.js
// Wave 2 implementation — Exercise view async renderer.
// Mirrors lesson-view.js: fetch exercise JSON, render stacked layout, mount terminal,
// manage step state, handle command matching, save completion to progressStore.

import { esc } from '../utils/escape.js';
import { activateIcons } from '../utils/icons.js';
import { progressStore } from '../progress-store.js';
import { renderBadge } from '../badge.js';
import { createTerminal } from '../terminal-engine.js';
import { MODULES } from '../modules-config.js';
// NOTE: sidebar.js is always imported dynamically (never static) — prevents circular dep.

// ──────────────────────────────────────────────────────────────────────────────
// renderExercise — main async view renderer
// Writes to #app directly (does NOT return HTML to the router).
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Render the exercise view by writing directly to #app.
 * @param {{ moduleId: string, exerciseId: string }} params
 * @returns {Promise<null>} null — view writes directly to #app
 */
export async function renderExercise({ moduleId, exerciseId }) {
  // Step 1 — null-guard
  const app = document.getElementById('app');
  if (!app) return null;

  // Step 2 — Loading skeleton (synchronous DOM write)
  app.innerHTML = renderExerciseLoading();

  // Step 3 — Fetch exercise JSON
  const url = import.meta.env.BASE_URL + 'data/modules/' + moduleId + '/exercises/' + exerciseId + '.json';
  let exercise;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      app.innerHTML = renderExerciseError(moduleId);
      return null;
    }
    exercise = await res.json();
  } catch {
    app.innerHTML = renderExerciseError(moduleId);
    return null;
  }

  // Step 4 — Derive lessonId from MODULES config
  const mod = MODULES.find(m => m.id === moduleId);
  const lesson = mod?.lessons.find(l => l.exerciseId === exerciseId);
  const lessonId = lesson?.id ?? exerciseId;

  // Step 5 — Check re-visit state
  const priorCompletion = progressStore.getExerciseCompletion(moduleId, exerciseId);

  // Step 6 — Build and inject full view HTML
  app.innerHTML = buildExerciseHtml(exercise, moduleId, priorCompletion);

  // Step 7 — Storage warning
  if (!progressStore.isStorageAvailable()) {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'storage-warning';
    warningDiv.setAttribute('role', 'alert');
    warningDiv.innerHTML = '<p style="font-size: var(--text-body); color: var(--color-text-muted); margin: 0 0 var(--spacing-sm) 0;">Progress cannot be saved — storage is unavailable (private browsing or quota full). Your progress this session will be lost when you close the tab.</p>';
    const lessonColumn = app.querySelector('.lesson-column');
    if (lessonColumn) lessonColumn.prepend(warningDiv);
  }

  // Step 8 — activateIcons after all innerHTML injection
  activateIcons();

  // Step 9 — Mount terminal into #terminal-mount
  const termMount = app.querySelector('#terminal-mount');
  let terminal = null;
  if (termMount) {
    terminal = createTerminal(termMount, (rawInput) => handleCommand(rawInput));
    terminal.setPrompt('PS PIPELINE-DC01 >');
  }

  // Step 10 — Step state
  let currentStepIndex = 0;
  const steps = exercise.steps ?? [];

  // Step 11 — Re-visit mode
  if (priorCompletion) {
    if (terminal) terminal.disable();
    return null;
  }

  // Step 12 — Fresh mode
  if (terminal) terminal.focus();

  // Step 13 — handleCommand (closed over step state, terminal, app)
  function handleCommand(trimmed) {
    if (currentStepIndex >= steps.length) return;
    const step = steps[currentStepIndex];

    // Check expectedCommands for correct match
    for (const cmd of (step.expectedCommands ?? [])) {
      try {
        const flags = cmd.caseSensitive ? '' : 'i';
        if (new RegExp(cmd.pattern, flags).test(trimmed)) {
          // Correct command matched
          terminal?.appendOutput(step.successOutput ?? '');
          markStepDone(app, currentStepIndex);
          currentStepIndex++;
          if (currentStepIndex >= steps.length) {
            completeExercise();
          } else {
            showActiveStep(app, currentStepIndex, steps);
            activateIcons();
          }
          return;
        }
      } catch {
        // Swallow malformed RegExp — treat as no-match
      }
    }

    // Check hintPatterns for near-miss
    for (const hp of (step.hintPatterns ?? [])) {
      try {
        if (new RegExp(hp.pattern, 'i').test(trimmed)) {
          showHint(app, currentStepIndex, hp.hint);
          return;
        }
      } catch {
        // Swallow malformed RegExp — treat as no-match
      }
    }

    // Fallback — show feedbackOnWrong in terminal
    terminal?.appendOutput(step.feedbackOnWrong ?? 'Try a different command.', 'var(--color-text-muted)');
  }

  // ── Helper: markStepDone — visually marks a step card as completed
  function markStepDone(appEl, index) {
    const card = appEl.querySelector(`[data-step-index="${index}"]`);
    if (!card) return;
    card.style.borderLeft = '3px solid #22c55e';
    const icon = card.querySelector('[data-step-icon]');
    if (icon) {
      icon.setAttribute('data-lucide', 'check-circle');
      icon.style.color = '#22c55e';
    }
    const instruction = card.querySelector('[data-step-instruction]');
    if (instruction) instruction.style.opacity = '0.5';
    const hintArea = card.querySelector('[data-hint-area]');
    if (hintArea) hintArea.style.display = 'none';
  }

  // ── Helper: showActiveStep — reveals the next step's instruction
  function showActiveStep(appEl, index, allSteps) {
    const card = appEl.querySelector(`[data-step-index="${index}"]`);
    if (!card) return;
    card.style.borderLeft = '3px solid var(--color-accent)';
    const icon = card.querySelector('[data-step-icon]');
    if (icon) {
      icon.setAttribute('data-lucide', 'terminal');
      icon.style.color = 'var(--color-accent)';
    }
    const instruction = card.querySelector('[data-step-instruction]');
    if (instruction) {
      instruction.textContent = allSteps[index]?.instruction ?? '';
      instruction.style.opacity = '1';
      instruction.style.display = '';
    }
    const counter = card.querySelector('[data-step-counter]');
    if (counter) {
      counter.textContent = 'Step ' + (index + 1) + ' of ' + allSteps.length;
    }
    card.style.opacity = '1';
  }

  // ── Helper: showHint — reveals the hint area for a step
  function showHint(appEl, stepIndex, hintText) {
    const card = appEl.querySelector(`[data-step-index="${stepIndex}"]`);
    if (!card) return;
    const hintArea = card.querySelector('[data-hint-area]');
    if (!hintArea) return;
    const hintContent = hintArea.querySelector('[data-hint-text]');
    if (hintContent) hintContent.textContent = hintText;
    hintArea.style.display = '';
  }

  // ── completeExercise — save progress, disable terminal, show banner
  function completeExercise() {
    progressStore.saveExercise(moduleId, exerciseId);
    progressStore.markLessonCompleted(moduleId, lessonId);
    import('../sidebar.js').then(m => m.refreshSidebarProgress(moduleId));
    if (terminal) terminal.disable();
    renderCompletionBanner(app, exercise);
  }

  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// renderCompletionBanner — appends C-06 completion card to .lesson-column
// ──────────────────────────────────────────────────────────────────────────────

function renderCompletionBanner(appEl, exercise) {
  const lessonColumn = appEl.querySelector('.lesson-column');
  if (!lessonColumn) return;

  const controls = Array.isArray(exercise.complianceControls) ? exercise.complianceControls : [];
  const badges = controls.map(tag => renderBadge(tag)).join('');

  const banner = document.createElement('div');
  banner.setAttribute('data-completion-banner', '');
  banner.style.cssText = [
    'background: var(--color-bg-secondary);',
    'border: 1px solid #22c55e;',
    'border-radius: 6px;',
    'padding: var(--spacing-lg);',
    'margin-top: var(--spacing-lg);',
    'text-align: center;',
  ].join('');

  banner.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;gap:var(--spacing-sm);margin-bottom:var(--spacing-sm);">
      <i data-lucide="check-circle" style="width:24px;height:24px;color:#22c55e;flex-shrink:0;"></i>
      <p style="font-size:var(--text-body);font-weight:600;color:#22c55e;margin:0;">Exercise complete — well done.</p>
    </div>
    ${badges ? `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:var(--spacing-xs);margin-bottom:var(--spacing-sm);">${badges}</div>` : ''}
    <p style="font-size:var(--text-body);color:var(--color-text-muted);margin:0;">Use the sidebar or the back link to continue.</p>
  `;

  lessonColumn.appendChild(banner);
  activateIcons();
}

// ──────────────────────────────────────────────────────────────────────────────
// buildExerciseHtml — pure function; returns full exercise layout HTML string
// ──────────────────────────────────────────────────────────────────────────────

function buildExerciseHtml(exercise, moduleId, priorCompletion) {
  const steps = Array.isArray(exercise.steps) ? exercise.steps : [];
  const controls = Array.isArray(exercise.complianceControls) ? exercise.complianceControls : [];
  const badges = controls.map(tag => renderBadge(tag)).join('');

  // Build step cards
  const stepCards = steps.map((step, i) => {
    const isFirst = i === 0 && !priorCompletion;
    const isDone = !!priorCompletion;

    const borderColor = isDone
      ? '#22c55e'
      : isFirst
        ? 'var(--color-accent)'
        : 'var(--color-border)';
    const iconName = isDone ? 'check-circle' : isFirst ? 'terminal' : 'circle';
    const iconColor = isDone ? '#22c55e' : isFirst ? 'var(--color-accent)' : 'var(--color-text-muted)';
    const cardOpacity = (!isDone && !isFirst) ? '0.5' : '1';
    const instructionOpacity = isDone ? '0.5' : '1';
    const instructionDisplay = (!isDone && !isFirst) ? 'display:none;' : '';

    return `
      <div data-step-index="${i}"
           style="background:var(--color-bg-secondary);border:1px solid var(--color-border);border-left:3px solid ${borderColor};border-radius:6px;padding:var(--spacing-md);margin-bottom:var(--spacing-sm);opacity:${cardOpacity};">
        <div style="display:flex;align-items:center;gap:var(--spacing-sm);margin-bottom:var(--spacing-xs);">
          <i data-lucide="${iconName}" data-step-icon style="width:16px;height:16px;color:${iconColor};flex-shrink:0;"></i>
          <span data-step-counter style="font-size:0.8125rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-muted);">Step ${i + 1} of ${steps.length}</span>
        </div>
        <p data-step-instruction style="font-size:var(--text-body);color:var(--color-text-primary);margin:0 0 var(--spacing-xs) 0;opacity:${instructionOpacity};${instructionDisplay}">${esc(step.instruction ?? '')}</p>
        <div data-hint-area style="display:none;background:var(--color-bg-secondary);border:1px solid var(--color-accent);border-radius:4px;padding:var(--spacing-xs) var(--spacing-sm);margin-top:var(--spacing-xs);">
          <span style="font-size:0.8125rem;font-weight:600;color:var(--color-accent);margin-right:var(--spacing-xs);">Hint:</span><span data-hint-text id="step-hint-${i}" style="font-size:var(--text-body);color:var(--color-text-primary);"></span>
        </div>
      </div>
    `;
  }).join('');

  // Re-visit completion banner (inline, for re-visit mode)
  const completedAt = priorCompletion?.completedAt ? priorCompletion.completedAt.slice(0, 10) : '';
  const revisitBanner = priorCompletion ? `
    <div data-completion-banner style="background:var(--color-bg-secondary);border:1px solid #22c55e;border-radius:6px;padding:var(--spacing-lg);margin-top:var(--spacing-lg);text-align:center;">
      <div style="display:flex;align-items:center;justify-content:center;gap:var(--spacing-sm);margin-bottom:var(--spacing-sm);">
        <i data-lucide="check-circle" style="width:24px;height:24px;color:#22c55e;flex-shrink:0;"></i>
        <p style="font-size:var(--text-body);font-weight:600;color:#22c55e;margin:0;">Exercise previously completed${completedAt ? ' — ' + esc(completedAt) : ''}.</p>
      </div>
      ${badges ? `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:var(--spacing-xs);margin-bottom:var(--spacing-sm);">${badges}</div>` : ''}
      <p style="font-size:var(--text-body);color:var(--color-text-muted);margin:0;">Use the sidebar or the back link to continue.</p>
    </div>
  ` : '';

  return `
    <div class="lesson-wrapper">
      <div class="lesson-column" style="max-width:var(--lesson-reading-width,720px);margin:0 auto;padding:var(--spacing-xl);">

        <!-- C-02: Exercise header card -->
        <div style="background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:6px;padding:var(--spacing-md);margin-bottom:var(--spacing-lg);">
          <p style="font-size:0.8125rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted);margin:0 0 var(--spacing-xs) 0;">EXERCISE</p>
          <h1 style="font-size:var(--text-display);font-weight:600;line-height:1.2;color:var(--color-text-primary);margin:0 0 var(--spacing-sm) 0;">${esc(exercise.title ?? '')}</h1>
          <p style="font-size:var(--text-body);color:var(--color-text-muted);margin:0 0 var(--spacing-sm) 0;">${esc(exercise.description ?? '')}</p>
          ${badges ? `<div role="list" aria-label="Compliance controls covered" style="display:flex;flex-wrap:wrap;gap:var(--spacing-xs);margin-bottom:var(--spacing-sm);">${badges}</div>` : ''}
          ${exercise.context ? `<div style="display:flex;align-items:center;gap:var(--spacing-xs);"><i data-lucide="monitor" style="width:14px;height:14px;color:var(--color-text-muted);flex-shrink:0;"></i><span style="font-size:0.8125rem;color:var(--color-text-muted);">${esc(exercise.context)}</span></div>` : ''}
        </div>

        <!-- C-03: Step panel -->
        <div style="margin-bottom:var(--spacing-md);">
          ${stepCards}
        </div>

        ${revisitBanner}

        <!-- C-04: Simulator banner -->
        <div style="background:var(--color-bg-secondary);border:1px solid var(--color-destructive);border-radius:4px 4px 0 0;padding:var(--spacing-xs) var(--spacing-md);display:flex;align-items:center;gap:var(--spacing-xs);">
          <i data-lucide="alert-triangle" style="width:14px;height:14px;color:var(--color-destructive);flex-shrink:0;"></i>
          <span style="font-size:0.8125rem;font-weight:600;color:var(--color-destructive);">PS SIMULATOR — commands do not run on any real system</span>
        </div>

        <!-- C-05: Terminal mount -->
        <div id="terminal-mount" data-terminal-wrapper style="border:1px solid var(--color-border);border-top:none;border-radius:0 0 4px 4px;overflow:hidden;"></div>

      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────────────────────────────────────
// renderExerciseLoading — loading skeleton (C-09)
// ──────────────────────────────────────────────────────────────────────────────

function renderExerciseLoading() {
  return `<div class="lesson-wrapper" aria-busy="true">
    <div class="lesson-column" style="max-width:var(--lesson-reading-width,720px);margin:0 auto;padding:var(--spacing-xl);">
      <div class="lesson-skeleton-line" style="width:90%;height:16px;background:var(--color-bg-secondary,#2a2a2a);border-radius:4px;margin-bottom:var(--spacing-sm,8px);animation:lesson-pulse 1.5s ease-in-out infinite;"></div>
      <div class="lesson-skeleton-line" style="width:75%;height:16px;background:var(--color-bg-secondary,#2a2a2a);border-radius:4px;margin-bottom:var(--spacing-sm,8px);animation:lesson-pulse 1.5s ease-in-out infinite;"></div>
      <div class="lesson-skeleton-line" style="width:55%;height:16px;background:var(--color-bg-secondary,#2a2a2a);border-radius:4px;animation:lesson-pulse 1.5s ease-in-out infinite;"></div>
    </div>
    <div aria-live="polite" class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;">Loading exercise...</div>
  </div>`;
}

// ──────────────────────────────────────────────────────────────────────────────
// renderExerciseError — error state (C-08)
// ──────────────────────────────────────────────────────────────────────────────

function renderExerciseError(moduleId) {
  return `<section style="padding:var(--spacing-xl);">
    <div class="lesson-error" role="alert"
         style="background:var(--color-bg-secondary);border:1px solid var(--color-destructive);border-radius:6px;padding:var(--spacing-lg);max-width:var(--lesson-reading-width,720px);margin:0 auto;">
      <div style="display:flex;align-items:center;gap:var(--spacing-sm);margin-bottom:var(--spacing-sm);">
        <i data-lucide="alert-circle" style="width:20px;height:20px;color:var(--color-destructive);flex-shrink:0;"></i>
        <p style="font-size:var(--text-body);font-weight:600;color:var(--color-text-primary);margin:0;">
          Exercise content could not be loaded
        </p>
      </div>
      <p style="font-size:var(--text-body);color:var(--color-text-muted);margin-bottom:var(--spacing-sm);">
        This exercise may still be in development.
      </p>
      <a href="#/module/${esc(moduleId)}"
         style="font-size:var(--text-body);font-weight:600;color:var(--color-accent);text-underline-offset:3px;">
        Return to module
      </a>
    </div>
  </section>`;
}
