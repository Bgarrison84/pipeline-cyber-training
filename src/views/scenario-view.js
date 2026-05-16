// src/views/scenario-view.js
// Phase 6 Plan 02 — Scenario view async renderer.
// Mirrors exercise-view.js: fetch scenario JSON, render decision-tree phases,
// manage option selection, reveal outcomes, advance phases, save completion to progressStore.
// NOTE: sidebar.js is always imported dynamically (never static) — prevents circular dep.

import { esc } from '../utils/escape.js';
import { activateIcons } from '../utils/icons.js';
import { progressStore } from '../progress-store.js';
import { renderBadge } from '../badge.js';

// ──────────────────────────────────────────────────────────────────────────────
// safePath — allowlist validator for URL path segments (prevents path traversal)
// Only allows alphanumeric characters, hyphens, and underscores.
// ──────────────────────────────────────────────────────────────────────────────

function safePath(segment) {
  if (!/^[a-zA-Z0-9_-]+$/.test(segment)) throw new Error('Invalid path segment: ' + segment);
  return segment;
}

// ──────────────────────────────────────────────────────────────────────────────
// validateScenario — checks all nextPhaseId references resolve to real phase IDs
// ──────────────────────────────────────────────────────────────────────────────

function validateScenario(scenario) {
  const phaseIds = new Set((scenario.phases ?? []).map(p => p.id));
  for (const phase of scenario.phases ?? []) {
    for (const option of phase.options ?? []) {
      if (option.nextPhaseId && !phaseIds.has(option.nextPhaseId)) return false;
    }
  }
  return true;
}

// ──────────────────────────────────────────────────────────────────────────────
// renderScenario — main async view renderer
// Writes to #app directly (does NOT return HTML to the router).
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Render the scenario view by writing directly to #app.
 * @param {{ moduleId: string, scenarioId: string }} params
 * @returns {Promise<null>} null — view writes directly to #app
 */
export async function renderScenario({ moduleId, scenarioId }) {
  // Step 1 — null-guard
  const app = document.getElementById('app');
  if (!app) return null;

  // Step 2 — Loading skeleton (synchronous DOM write)
  app.innerHTML = renderScenarioLoading();

  // Step 3 — safePath guard
  let url;
  try {
    url = import.meta.env.BASE_URL + 'data/modules/' + safePath(moduleId) + '/scenarios/' + safePath(scenarioId) + '.json';
  } catch {
    app.innerHTML = renderScenarioError(moduleId);
    return null;
  }

  // Step 4 — Fetch scenario JSON
  let scenario;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      app.innerHTML = renderScenarioError(moduleId);
      return null;
    }
    scenario = await res.json();
  } catch {
    app.innerHTML = renderScenarioError(moduleId);
    return null;
  }

  // Step 5 — Validate scenario JSON integrity
  if (!validateScenario(scenario)) {
    app.innerHTML = renderScenarioError(moduleId);
    return null;
  }

  // Step 6 — Check re-visit state
  const priorCompletion = progressStore.getScenarioCompletion(moduleId, scenarioId);

  // Step 7 — Build and inject full view HTML
  app.innerHTML = buildScenarioHtml(scenario, moduleId, priorCompletion);

  // Step 8 — Storage warning
  if (!progressStore.isStorageAvailable()) {
    const warningDiv = document.createElement('div');
    warningDiv.setAttribute('role', 'alert');
    warningDiv.innerHTML = '<p style="font-size: var(--text-body); color: var(--color-text-muted); margin: 0 0 var(--spacing-sm) 0;">Progress cannot be saved — storage unavailable. Your scenario completion will not be recorded.</p>';
    const lessonColumn = app.querySelector('.lesson-column');
    if (lessonColumn) lessonColumn.prepend(warningDiv);
  }

  // Step 9 — activateIcons after all innerHTML injection
  activateIcons();

  // Step 10 — Re-visit mode: no event wiring needed
  if (priorCompletion) return null;

  // Step 11 — Fresh mode: wire interactive handlers
  runScenarioFlow(app, scenario, moduleId, scenarioId);

  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// runScenarioFlow — internal interactive state machine for fresh scenarios
// ──────────────────────────────────────────────────────────────────────────────

function runScenarioFlow(app, scenario, moduleId, scenarioId) {
  let currentPhaseId = scenario.phases[0].id;

  // Event delegation on #app for option button clicks
  app.addEventListener('click', function handleOptionClick(event) {
    const optionBtn = event.target.closest('[data-option-id]');
    if (!optionBtn) {
      // Check for Continue button click
      const continueBtn = event.target.closest('[data-continue-btn]');
      if (continueBtn) {
        const nextPhaseId = continueBtn.getAttribute('data-next-phase-id');
        const isCurrentFinal = continueBtn.getAttribute('data-is-final') === 'true';

        if (isCurrentFinal) {
          completeScenario();
          app.removeEventListener('click', handleOptionClick);
        } else if (nextPhaseId) {
          // Inject next phase card
          const nextPhase = scenario.phases.find(p => p.id === nextPhaseId);
          if (nextPhase) {
            currentPhaseId = nextPhaseId;
            const lessonColumn = app.querySelector('.lesson-column');
            if (lessonColumn) {
              const nextPhaseDiv = document.createElement('div');
              nextPhaseDiv.innerHTML = buildPhaseNodeHtml(nextPhase, 'active', null);
              lessonColumn.appendChild(nextPhaseDiv.firstElementChild);
              // Scroll into view
              const newCard = lessonColumn.querySelector(`[data-phase-id="${nextPhaseId}"]`);
              if (newCard) newCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
              activateIcons();
            }
          }
        }
      }
      return;
    }

    // Find the phase card this option belongs to
    const phaseCard = optionBtn.closest('[data-phase-id]');
    if (!phaseCard) return;
    const phaseId = phaseCard.getAttribute('data-phase-id');
    if (phaseId !== currentPhaseId) return; // Only interact with active phase

    const optionId = optionBtn.getAttribute('data-option-id');
    const phase = scenario.phases.find(p => p.id === phaseId);
    if (!phase) return;

    const pickedOption = phase.options.find(o => o.id === optionId);
    if (!pickedOption) return;

    // Lock all option buttons in this phase (pointer-events: none)
    phaseCard.querySelectorAll('[data-option-id]').forEach(btn => {
      btn.style.pointerEvents = 'none';
    });

    // Apply visual states per C-04
    phase.options.forEach(option => {
      const btn = phaseCard.querySelector(`[data-option-id="${option.id}"]`);
      if (!btn) return;

      if (option.correct) {
        // Correct option: green border + bg
        btn.style.border = '1px solid #22c55e';
        btn.style.background = 'rgba(34,197,94,0.06)';
        const icon = btn.querySelector('[data-option-icon]');
        if (icon) {
          icon.setAttribute('data-lucide', 'check-circle');
          icon.style.color = '#22c55e';
          icon.style.display = 'inline-block';
        }
      } else if (option.id === optionId) {
        // User's wrong pick: destructive border
        btn.style.border = '1px solid var(--color-destructive)';
        btn.style.opacity = '0.7';
        const icon = btn.querySelector('[data-option-icon]');
        if (icon) {
          icon.setAttribute('data-lucide', 'x-circle');
          icon.style.color = 'var(--color-destructive)';
          icon.style.display = 'inline-block';
        }
      } else {
        // Other wrong options: muted
        btn.style.border = '1px solid var(--color-border)';
        btn.style.opacity = '0.5';
      }
    });

    // Re-activate icons to render the newly set data-lucide attributes
    activateIcons();

    // Inject outcome block
    const outcomeDiv = document.createElement('div');
    outcomeDiv.style.cssText = 'margin-top:var(--spacing-sm);padding:var(--spacing-sm);background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:4px;';
    outcomeDiv.innerHTML = `<span style="font-size:0.8125rem;font-weight:600;color:var(--color-text-muted);margin-right:var(--spacing-xs);">Outcome:</span><span style="font-size:var(--text-body);color:var(--color-text-primary);">${esc(pickedOption.outcome)}</span>`;
    phaseCard.appendChild(outcomeDiv);

    // Inject Continue button
    const continueDiv = document.createElement('div');
    continueDiv.style.cssText = 'margin-top:var(--spacing-sm);text-align:right;';
    const isFinal = !!phase.isFinal;
    const nextPhaseId = pickedOption.nextPhaseId ?? null;
    continueDiv.innerHTML = `<button data-continue-btn data-next-phase-id="${nextPhaseId ? esc(nextPhaseId) : ''}" data-is-final="${isFinal}" style="display:inline-flex;align-items:center;gap:var(--spacing-xs);font-size:var(--text-body);font-weight:600;color:var(--color-accent);background:none;border:none;cursor:pointer;padding:var(--spacing-xs) 0;">Continue →</button>`;
    phaseCard.appendChild(continueDiv);
  });

  // ── completeScenario — save progress, inject banner
  function completeScenario() {
    progressStore.saveScenario(moduleId, scenarioId);
    import('../sidebar.js').then(m => m.refreshSidebarProgress(moduleId));

    const lessonColumn = app.querySelector('.lesson-column');
    if (!lessonColumn) return;

    const controls = Array.isArray(scenario.complianceControls) ? scenario.complianceControls : [];
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
        <p style="font-size:var(--text-body);font-weight:600;color:#22c55e;margin:0;">Scenario complete — well done.</p>
      </div>
      ${badges ? `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:var(--spacing-xs);margin-bottom:var(--spacing-sm);">${badges}</div>` : ''}
      <p style="font-size:var(--text-body);color:var(--color-text-muted);margin:0;">Use the sidebar or the back link to continue.</p>
    `;

    lessonColumn.appendChild(banner);
    activateIcons();
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// buildScenarioHtml — pure function; returns full scenario layout HTML string
// ──────────────────────────────────────────────────────────────────────────────

function buildScenarioHtml(scenario, moduleId, priorCompletion) {
  const controls = Array.isArray(scenario.complianceControls) ? scenario.complianceControls : [];
  const badges = controls.map(tag => renderBadge(tag)).join('');

  // Header card (C-02)
  const headerHtml = `
    <div style="background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:6px;padding:var(--spacing-md);margin-bottom:var(--spacing-lg);">
      <p style="font-size:0.8125rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted);margin:0 0 var(--spacing-xs) 0;">SCENARIO</p>
      <h1 style="font-size:28px;font-weight:600;line-height:1.2;color:var(--color-text-primary);margin:0 0 var(--spacing-sm) 0;">${esc(scenario.title ?? '')}</h1>
      <p style="font-size:var(--text-body);color:var(--color-text-muted);margin:0 0 var(--spacing-sm) 0;">${esc(scenario.narrative ?? '')}</p>
      ${badges ? `<div role="list" aria-label="Compliance controls covered" style="display:flex;flex-wrap:wrap;gap:var(--spacing-xs);margin-bottom:var(--spacing-sm);">${badges}</div>` : ''}
    </div>
  `;

  // Phase nodes
  let phasesHtml = '';
  if (priorCompletion) {
    // Re-visit mode: all phases locked
    const phases = scenario.phases ?? [];
    phasesHtml = phases.map(phase => buildPhaseNodeHtml(phase, 'revisit-locked', null)).join('');

    // Completion banner (re-visit variant)
    const completedDate = priorCompletion.completedAt ? priorCompletion.completedAt.slice(0, 10) : '';
    const revisitBanner = `
      <div data-completion-banner style="background:var(--color-bg-secondary);border:1px solid #22c55e;border-radius:6px;padding:var(--spacing-lg);margin-top:var(--spacing-lg);text-align:center;">
        <div style="display:flex;align-items:center;justify-content:center;gap:var(--spacing-sm);margin-bottom:var(--spacing-sm);">
          <i data-lucide="check-circle" style="width:24px;height:24px;color:#22c55e;flex-shrink:0;"></i>
          <p style="font-size:var(--text-body);font-weight:600;color:#22c55e;margin:0;">Scenario previously completed${completedDate ? ' — ' + esc(completedDate) : ''}</p>
        </div>
        ${badges ? `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:var(--spacing-xs);margin-bottom:var(--spacing-sm);">${badges}</div>` : ''}
        <p style="font-size:var(--text-body);color:var(--color-text-muted);margin:0;">Use the sidebar or the back link to continue.</p>
      </div>
    `;
    phasesHtml += revisitBanner;
  } else {
    // Fresh mode: only first phase active
    const phases = scenario.phases ?? [];
    if (phases.length > 0) {
      phasesHtml = buildPhaseNodeHtml(phases[0], 'active', null);
    }
  }

  return `
    <div class="lesson-wrapper">
      <div class="lesson-column" style="max-width:var(--lesson-reading-width,720px);margin:0 auto;padding:var(--spacing-xl);">
        ${headerHtml}
        <div style="margin-bottom:var(--spacing-md);">
          ${phasesHtml}
        </div>
        <div style="margin-top:var(--spacing-md);">
          <a href="#/module/${esc(moduleId)}" style="font-size:var(--text-body);color:var(--color-text-muted);text-decoration:none;">← Return to module</a>
        </div>
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────────────────────────────────────
// buildPhaseNodeHtml — renders a single phase card (C-03)
// state: 'active' | 'locked' | 'revisit-locked'
// ──────────────────────────────────────────────────────────────────────────────

function buildPhaseNodeHtml(phase, state, priorPickedOptionId) {
  let borderColor, iconName, iconColor, opacity;

  if (state === 'active') {
    borderColor = 'var(--color-accent)';
    iconName = 'help-circle';
    iconColor = 'var(--color-accent)';
    opacity = '1';
  } else if (state === 'locked') {
    borderColor = 'var(--color-border)';
    iconName = 'check-circle';
    iconColor = 'var(--color-text-muted)';
    opacity = '1';
  } else {
    // revisit-locked
    borderColor = '#22c55e';
    iconName = 'check-circle';
    iconColor = '#22c55e';
    opacity = '0.8';
  }

  const options = phase.options ?? [];

  // Build option buttons per C-04
  const optionButtonsHtml = options.map(option => {
    let btnStyle = `display:block;width:100%;min-height:44px;text-align:left;padding:var(--spacing-sm) var(--spacing-md);margin-bottom:var(--spacing-xs);border:1px solid var(--color-border);border-radius:4px;background:var(--color-bg-secondary);cursor:pointer;position:relative;`;

    if (state !== 'active') {
      btnStyle += 'pointer-events:none;';
    }

    return `
      <button data-option-id="${esc(option.id)}" style="${btnStyle}">
        <span style="font-size:var(--text-body);color:var(--color-text-primary);">${esc(option.text)}</span>
        <i data-option-icon data-lucide="circle" style="width:16px;height:16px;position:absolute;right:var(--spacing-sm);top:50%;transform:translateY(-50%);display:none;flex-shrink:0;"></i>
      </button>
    `;
  }).join('');

  return `
    <div data-phase-id="${esc(phase.id)}"
         style="background:var(--color-bg-secondary);border:1px solid var(--color-border);border-left:3px solid ${borderColor};border-radius:6px;padding:var(--spacing-md);margin-bottom:var(--spacing-md);opacity:${opacity};">
      <div style="display:flex;align-items:center;gap:var(--spacing-sm);margin-bottom:var(--spacing-sm);">
        <i data-lucide="${iconName}" style="width:16px;height:16px;color:${iconColor};flex-shrink:0;"></i>
        <h2 style="font-size:var(--text-body);font-weight:600;color:var(--color-text-primary);margin:0;">${esc(phase.title ?? '')}</h2>
      </div>
      <p style="font-size:var(--text-body);color:var(--color-text-muted);margin:0 0 var(--spacing-md) 0;">${esc(phase.prompt ?? '')}</p>
      <div>
        ${optionButtonsHtml}
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────────────────────────────────────
// renderScenarioLoading — loading skeleton (C-08)
// ──────────────────────────────────────────────────────────────────────────────

function renderScenarioLoading() {
  return `<div class="lesson-wrapper" aria-busy="true">
    <div class="lesson-column" style="max-width:var(--lesson-reading-width,720px);margin:0 auto;padding:var(--spacing-xl);">
      <div class="lesson-skeleton-line" style="width:80%;height:16px;background:var(--color-bg-secondary,#2a2a2a);border-radius:4px;margin-bottom:var(--spacing-sm,8px);animation:lesson-pulse 1.5s ease-in-out infinite;"></div>
      <div class="lesson-skeleton-line" style="width:65%;height:16px;background:var(--color-bg-secondary,#2a2a2a);border-radius:4px;margin-bottom:var(--spacing-sm,8px);animation:lesson-pulse 1.5s ease-in-out infinite;"></div>
      <div class="lesson-skeleton-line" style="width:45%;height:16px;background:var(--color-bg-secondary,#2a2a2a);border-radius:4px;animation:lesson-pulse 1.5s ease-in-out infinite;"></div>
    </div>
    <div aria-live="polite" class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;">Loading scenario...</div>
  </div>`;
}

// ──────────────────────────────────────────────────────────────────────────────
// renderScenarioError — error state (C-07)
// ──────────────────────────────────────────────────────────────────────────────

function renderScenarioError(moduleId) {
  return `<section style="padding:var(--spacing-xl);">
    <div class="lesson-error" role="alert"
         style="background:var(--color-bg-secondary);border:1px solid var(--color-destructive);border-radius:6px;padding:var(--spacing-lg);max-width:var(--lesson-reading-width,720px);margin:0 auto;">
      <div style="display:flex;align-items:center;gap:var(--spacing-sm);margin-bottom:var(--spacing-sm);">
        <i data-lucide="alert-circle" style="width:20px;height:20px;color:var(--color-destructive);flex-shrink:0;"></i>
        <p style="font-size:var(--text-body);font-weight:600;color:var(--color-text-primary);margin:0;">
          Scenario content could not be loaded
        </p>
      </div>
      <p style="font-size:var(--text-body);color:var(--color-text-muted);margin-bottom:var(--spacing-sm);">
        This scenario may still be in development.
      </p>
      <a href="#/module/${esc(moduleId)}"
         style="font-size:var(--text-body);font-weight:600;color:var(--color-accent);text-underline-offset:3px;">
        Return to module
      </a>
    </div>
  </section>`;
}
