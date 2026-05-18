// src/views/compliance-index-view.js
// Phase 06 Plan 03 — Compliance Index view renderer.
// Fetches compliance-index.json and renders all control groups with links.
// Returns null (writes directly to #app).

import { esc } from '../utils/escape.js';
import { activateIcons } from '../utils/icons.js';
import { renderBadge } from '../badge.js';

// ──────────────────────────────────────────────────────────────────────────────
// safePath — allowlist validator for URL path segments (prevents path traversal)
// Only allows alphanumeric characters, hyphens, and underscores.
// Copied verbatim from exercise-view.js (T-06-W2-01 mitigation).
// ──────────────────────────────────────────────────────────────────────────────

function safePath(segment) {
  if (!/^[a-zA-Z0-9_-]+$/.test(segment)) throw new Error('Invalid path segment: ' + segment);
  return segment;
}

// ──────────────────────────────────────────────────────────────────────────────
// Icon name per compliance item type
// ──────────────────────────────────────────────────────────────────────────────

function iconForType(type) {
  if (type === 'lesson')   return 'book-open';
  if (type === 'exercise') return 'terminal';
  if (type === 'scenario') return 'git-branch';
  return 'book-open';
}

// ──────────────────────────────────────────────────────────────────────────────
// href builder — uses safePath on both segments (T-06-W2-01 mitigation)
// ──────────────────────────────────────────────────────────────────────────────

function buildHref(type, moduleId, contentId) {
  try {
    const safeModule  = safePath(moduleId);
    const safeContent = safePath(contentId);
    if (type === 'lesson')   return `#/lesson/${safeModule}/${safeContent}`;
    if (type === 'exercise') return `#/exercise/${safeModule}/${safeContent}`;
    if (type === 'scenario') return `#/scenario/${safeModule}/${safeContent}`;
    return `#/lesson/${safeModule}/${safeContent}`;
  } catch {
    return '#/';
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// C-13 Loading skeleton
// ──────────────────────────────────────────────────────────────────────────────

function renderComplianceIndexLoading() {
  return `
    <div class="lesson-wrapper" aria-busy="true">
      <div class="lesson-column">
        <span class="sr-only" aria-live="polite">Loading compliance index...</span>
        <div class="lesson-skeleton-line" style="width:70%;height:1.25rem;background:var(--color-bg-secondary);border-radius:4px;margin-bottom:var(--spacing-sm);"></div>
        <div class="lesson-skeleton-line" style="width:90%;height:1rem;background:var(--color-bg-secondary);border-radius:4px;margin-bottom:var(--spacing-sm);"></div>
        <div class="lesson-skeleton-line" style="width:55%;height:1rem;background:var(--color-bg-secondary);border-radius:4px;margin-bottom:var(--spacing-sm);"></div>
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────────────────────────────────────
// C-12 Empty / error state
// ──────────────────────────────────────────────────────────────────────────────

function renderComplianceIndexEmpty() {
  return `
    <div class="lesson-wrapper">
      <div class="lesson-column">
        <div role="alert" style="display:flex;flex-direction:column;align-items:center;gap:var(--spacing-md);padding:var(--spacing-xl);text-align:center;">
          <i data-lucide="file-x" style="width:24px;height:24px;color:var(--color-text-muted);"></i>
          <h2 style="font-size:var(--text-heading);font-weight:600;">Compliance index unavailable</h2>
          <p style="font-size:var(--text-body);color:var(--color-text-muted);">The control index could not be loaded. Try reloading the page.</p>
        </div>
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────────────────────────────────────
// C-11 Single control section builder
// ──────────────────────────────────────────────────────────────────────────────

function buildControlSectionHtml(control) {
  const itemsHtml = (control.items ?? []).map(item => {
    const icon = iconForType(item.type);
    const href = buildHref(item.type, item.moduleId, item.contentId);
    return `
      <div style="display:flex;align-items:center;gap:var(--spacing-sm);padding:var(--spacing-xs) 0;">
        <span style="min-width:72px;font-family:monospace;font-size:0.75rem;color:var(--color-text-muted);text-transform:uppercase;flex-shrink:0;">${esc(item.type)}</span>
        <i data-lucide="${icon}" style="width:14px;height:14px;color:var(--color-text-muted);flex-shrink:0;"></i>
        <a href="${href}" style="font-size:var(--text-body);color:var(--color-accent);text-decoration:none;">${esc(item.title)}</a>
      </div>
    `;
  }).join('');

  return `
    <section style="margin-bottom:var(--spacing-lg);padding:var(--spacing-md);border:1px solid var(--color-border);border-radius:4px;background:var(--color-bg-secondary);">
      <div style="display:flex;align-items:center;gap:var(--spacing-sm);margin-bottom:var(--spacing-sm);">
        ${renderBadge(control.id, control.label)}
        <h2 style="font-size:1.25rem;font-weight:600;">${esc(control.label)}</h2>
      </div>
      <div style="display:flex;flex-direction:column;">
        ${itemsHtml}
      </div>
    </section>
  `;
}

// ──────────────────────────────────────────────────────────────────────────────
// C-10 Page header
// ──────────────────────────────────────────────────────────────────────────────

function buildPageHeaderHtml() {
  return `
    <div style="margin-bottom:var(--spacing-lg);">
      <p style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted);margin-bottom:var(--spacing-xs);">COMPLIANCE INDEX</p>
      <h1 style="font-size:var(--text-heading);font-weight:600;margin-bottom:var(--spacing-sm);">Compliance Control Coverage</h1>
      <p style="font-size:var(--text-body);color:var(--color-text-muted);">Every TSA pipeline security directive and NIST SP 800-82 Rev 3 control covered by this training platform, with links to all lessons and exercises that address it.</p>
    </div>
  `;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main export: renderComplianceIndex
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Render the compliance index view by writing directly to #app.
 * @returns {Promise<null>} null — view writes directly to #app
 */
export async function renderComplianceIndex() {
  const app = document.getElementById('app');
  if (!app) return null;

  // Write loading skeleton immediately (sync)
  app.innerHTML = renderComplianceIndexLoading();

  // Fetch compliance-index.json
  let data;
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'data/compliance-index.json');
    if (!res.ok) {
      app.innerHTML = renderComplianceIndexEmpty();
      return null;
    }
    data = await res.json();
  } catch {
    app.innerHTML = renderComplianceIndexEmpty();
    return null;
  }

  // Build and inject full page
  const controlSections = (data.controls || []).map(buildControlSectionHtml).join('');
  app.innerHTML = `
    <section style="padding:var(--spacing-xl);">
      ${buildPageHeaderHtml()}
      ${controlSections}
    </section>
  `;

  activateIcons();
  return null;
}
