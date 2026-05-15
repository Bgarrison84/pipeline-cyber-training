// src/views/lesson-view.js
// Full lesson view — Wave 2 implementation.
// Loading skeleton → fetch → parse → render → compliance bar → prev/next footer.
// Writes directly to #app (async view pattern); returns '' so router no-ops its own innerHTML set.

import { MODULES } from '../modules-config.js';
import { fetchLesson, parseFrontmatter, renderMarkdown, getLessonNav } from '../content-loader.js';
import { renderBadge } from '../badge.js';
import { setActiveLesson } from '../sidebar.js';
import { activateIcons } from '../utils/icons.js';
import { esc } from '../utils/escape.js';
import { progressStore } from '../progress-store.js';
import { renderQuiz } from '../quiz-engine.js';

// ──────────────────────────────────────────────────────────────────────────────
// renderLesson — main async view renderer
// Writes to #app directly (does NOT return HTML to the router).
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Render the lesson view by writing directly to #app.
 * @param {{ moduleId: string, lessonId: string }} params
 * @returns {Promise<null>} null — view writes directly to #app
 */
export async function renderLesson({ moduleId, lessonId }) {
  if (!moduleId || !lessonId) {
    const app = document.getElementById('app');
    if (app) app.innerHTML = renderLessonNotFound();
    return null;
  }

  const mod = MODULES.find(m => m.id === moduleId);
  if (!mod) {
    const app = document.getElementById('app');
    if (app) app.innerHTML = renderLessonNotFound();
    return null;
  }

  // Step 1 — Set loading state immediately (synchronous DOM write)
  const app = document.getElementById('app');
  if (app) {
    app.setAttribute('aria-busy', 'true');
    app.innerHTML = renderLessonLoading();
  }

  // Step 2 — Fetch lesson Markdown
  const raw = await fetchLesson(moduleId, lessonId);
  if (raw === null) {
    if (app) {
      app.innerHTML = renderLessonError('not-found');
      app.removeAttribute('aria-busy');
    }
    return null;
  }

  // Step 3 — Parse frontmatter + render Markdown
  const { meta, body } = parseFrontmatter(raw);
  const html = await renderMarkdown(body);

  // Step 4 — Build nav and inject full lesson HTML
  const nav = getLessonNav(moduleId, lessonId);
  const lessonHtml = buildLessonHtml(meta, html, nav);
  if (app) {
    app.innerHTML = lessonHtml;
    app.removeAttribute('aria-busy');
  }

  // Step 5 — Post-render wiring (must happen AFTER innerHTML is set)
  // Record lesson visited state and last position (D-03, D-10)
  progressStore.markVisited(moduleId, lessonId);
  progressStore.setLastVisited(moduleId, lessonId);

  // Show storage warning when storage is unavailable (D-10, SC-3)
  if (!progressStore.isStorageAvailable()) {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'storage-warning';
    warningDiv.setAttribute('role', 'alert');
    warningDiv.innerHTML = '<p style="font-size: var(--text-body); color: var(--color-text-muted); margin: 0 0 var(--spacing-sm) 0;">Progress cannot be saved — storage is unavailable (private browsing or quota full). Your progress this session will be lost when you close the tab.</p>';
    const lessonColumn = document.querySelector('.lesson-column');
    if (lessonColumn) lessonColumn.prepend(warningDiv);
  }

  setActiveLesson(moduleId, lessonId);
  activateIcons();
  attachCopyHandlers();

  if (meta.quizId) {
    const lessonColumn = document.querySelector('.lesson-column');
    if (lessonColumn) {
      await renderQuiz(moduleId, meta.quizId, lessonColumn, lessonId);
    }
  }

  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// renderLessonLoading — loading skeleton shown while fetch is in flight
// ──────────────────────────────────────────────────────────────────────────────

function renderLessonLoading() {
  return `<div class="lesson-wrapper" aria-busy="true">
    <div class="lesson-column" style="max-width: var(--lesson-reading-width, 720px); margin: 0 auto; padding: var(--spacing-xl);">
      <div class="lesson-skeleton-line" style="width: 90%; height: 16px; background: var(--color-bg-secondary, #2a2a2a); border-radius: 4px; margin-bottom: var(--spacing-sm, 8px); animation: lesson-pulse 1.5s ease-in-out infinite;"></div>
      <div class="lesson-skeleton-line" style="width: 75%; height: 16px; background: var(--color-bg-secondary, #2a2a2a); border-radius: 4px; margin-bottom: var(--spacing-sm, 8px); animation: lesson-pulse 1.5s ease-in-out infinite;"></div>
      <div class="lesson-skeleton-line" style="width: 55%; height: 16px; background: var(--color-bg-secondary, #2a2a2a); border-radius: 4px; animation: lesson-pulse 1.5s ease-in-out infinite;"></div>
    </div>
    <div aria-live="polite" class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;">Loading lesson…</div>
  </div>`;
}

// ──────────────────────────────────────────────────────────────────────────────
// buildLessonHtml — construct full lesson layout HTML
// ──────────────────────────────────────────────────────────────────────────────

function buildLessonHtml(meta, bodyHtml, nav) {
  const complianceTags = Array.isArray(meta.complianceTags) ? meta.complianceTags : [];

  let complianceBarContent = '';
  if (complianceTags.length > 0) {
    const badges = complianceTags.map(tag => renderBadge(tag)).join('');
    complianceBarContent = `
      <p style="font-size: 0.8125rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-muted); margin-bottom: var(--spacing-xs);">COMPLIANCE CONTROLS</p>
      <div role="list" aria-label="Compliance controls covered" style="display: flex; flex-wrap: wrap; gap: var(--spacing-xs); align-items: center;">
        ${badges}
      </div>`;
  }

  return `<div class="lesson-wrapper">
    <div class="lesson-column" style="max-width: var(--lesson-reading-width, 720px); margin: 0 auto; padding: var(--spacing-xl);">
      <h1 style="font-size: var(--text-display); font-weight: 600; line-height: 1.2;
                 color: var(--color-text-primary); margin-bottom: var(--spacing-sm);">
        ${esc(meta.title || 'Lesson')}
      </h1>
      <div class="compliance-bar" style="margin-bottom: var(--spacing-lg);">
        ${complianceBarContent}
      </div>
      <article class="lesson-body"
               style="font-size: var(--text-prose-body); font-weight: 400; line-height: 1.7;
                      color: var(--color-text-primary);">
        ${bodyHtml}
      </article>
      <div aria-live="polite" class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;"></div>
      <nav class="lesson-footer" aria-label="Lesson navigation"
           style="display: flex; justify-content: space-between; align-items: flex-start;
                  padding-top: var(--spacing-2xl); border-top: 1px solid var(--color-border);
                  margin-top: var(--spacing-2xl);">
        ${buildLessonFooter(nav)}
      </nav>
    </div>
  </div>`;
}

// ──────────────────────────────────────────────────────────────────────────────
// buildLessonFooter — prev/next nav links per UI-SPEC Component 11
// ──────────────────────────────────────────────────────────────────────────────

function buildLessonFooter(nav) {
  let prevHtml;
  if (nav.prev) {
    const truncated = nav.prev.title.slice(0, 32) + (nav.prev.title.length > 32 ? '…' : '');
    prevHtml = `<a class="lesson-nav-btn"
        href="#/lesson/${esc(nav.prev.moduleId)}/${esc(nav.prev.lessonId)}"
        aria-label="Previous lesson: ${esc(nav.prev.title)}"
        style="display: inline-flex; flex-direction: column; gap: var(--spacing-xs);
               padding: var(--spacing-sm); border: 1px solid var(--color-border);
               border-radius: 4px; text-decoration: none; min-width: 140px;">
      <span class="lesson-nav-direction" style="font-size: 0.8125rem; color: var(--color-text-muted);
            text-transform: uppercase; letter-spacing: 0.06em;">← Previous</span>
      <span class="lesson-nav-title" style="font-size: var(--text-body); font-weight: 400;
            color: var(--color-text-primary);">${esc(truncated)}</span>
    </a>`;
  } else {
    prevHtml = `<div class="lesson-nav-spacer"></div>`;
  }

  let nextHtml;
  if (nav.next) {
    const truncated = nav.next.title.slice(0, 32) + (nav.next.title.length > 32 ? '…' : '');
    nextHtml = `<a class="lesson-nav-btn lesson-nav-next"
        href="#/lesson/${esc(nav.next.moduleId)}/${esc(nav.next.lessonId)}"
        aria-label="Next lesson: ${esc(nav.next.title)}"
        style="display: inline-flex; flex-direction: column; gap: var(--spacing-xs);
               padding: var(--spacing-sm); border: 1px solid var(--color-border);
               border-radius: 4px; text-decoration: none; min-width: 140px; text-align: right;">
      <span class="lesson-nav-direction" style="font-size: 0.8125rem; color: var(--color-text-muted);
            text-transform: uppercase; letter-spacing: 0.06em;">Next →</span>
      <span class="lesson-nav-title" style="font-size: var(--text-body); font-weight: 400;
            color: var(--color-text-primary);">${esc(truncated)}</span>
    </a>`;
  } else {
    nextHtml = `<div class="lesson-nav-spacer"></div>`;
  }

  return prevHtml + nextHtml;
}

// ──────────────────────────────────────────────────────────────────────────────
// attachCopyHandlers — event delegation on .lesson-wrapper for copy buttons
// ──────────────────────────────────────────────────────────────────────────────

function attachCopyHandlers() {
  document.querySelector('.lesson-wrapper')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.code-copy-btn');
    if (!btn) return;
    const code = btn.dataset.code ?? '';
    try {
      await navigator.clipboard.writeText(code);
      // Success: swap icon Copy → Check for 2 seconds
      const icon = btn.querySelector('[data-lucide]');
      if (icon) {
        icon.setAttribute('data-lucide', 'check');
        icon.style.color = '#4ade80';
        btn.setAttribute('aria-label', 'Copied!');
        // Re-run createIcons to render the Check icon
        import('lucide').then(({ createIcons, Check }) => {
          createIcons({ icons: { Check }, attrs: { 'stroke-width': 2 }, rootNode: btn });
        });
      }
      setTimeout(() => {
        const liveIcon = btn.querySelector('[data-lucide], svg');
        if (liveIcon) {
          liveIcon.setAttribute('data-lucide', 'copy');
          liveIcon.style.color = '';
          btn.setAttribute('aria-label', 'Copy code to clipboard');
          import('lucide').then(({ createIcons, Copy }) => {
            createIcons({ icons: { Copy }, attrs: { 'stroke-width': 2 }, rootNode: btn });
          });
        }
      }, 2000);
    } catch {
      // Silent failure per CONTEXT.md — clipboard is optional convenience
      console.warn('Clipboard write failed');
    }
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Static error states — no moduleId/lessonId injection (T-02-07 security)
// ──────────────────────────────────────────────────────────────────────────────

function renderLessonNotFound() {
  return `<section style="padding: var(--spacing-xl);">
    <p style="font-size: var(--text-body); color: var(--color-text-muted);">
      Lesson not found. Use the sidebar to select a lesson.
    </p>
  </section>`;
}

function renderLessonError(type) {
  const message = type === 'not-found'
    ? 'This lesson file was not found. It may still be in development.'
    : 'Could not connect. Check your network connection and reload the page.';
  return `<section style="padding: var(--spacing-xl);">
    <div class="lesson-error" role="alert"
         style="background: var(--color-bg-secondary); border: 1px solid var(--color-destructive);
                border-radius: 6px; padding: var(--spacing-lg); max-width: var(--lesson-reading-width, 720px); margin: 0 auto;">
      <div style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm);">
        <i data-lucide="alert-circle" style="width:20px;height:20px;color:var(--color-destructive);flex-shrink:0;"></i>
        <p style="font-size: var(--text-body); font-weight: 600; color: var(--color-text-primary); margin: 0;">
          Lesson content could not be loaded
        </p>
      </div>
      <p style="font-size: var(--text-body); color: var(--color-text-muted); margin-bottom: var(--spacing-sm);">
        ${message}
      </p>
      <a href="" onclick="window.location.reload();return false;"
         style="font-size: var(--text-body); font-weight: 600; color: var(--color-accent); text-underline-offset: 3px;">
        Reload page
      </a>
    </div>
  </section>`;
}
