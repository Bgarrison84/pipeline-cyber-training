// src/views/module-view.js
import { MODULES } from '../modules-config.js';
import { renderBadge } from '../badge.js';
import { esc } from '../utils/escape.js';
import { computeModuleProgress } from '../quiz-engine.js';
import { progressStore } from '../progress-store.js';

/**
 * Determine lesson status badge HTML for a lesson.
 * Badge text values are hard-coded string literals (T-04-W2-03: accept).
 */
function lessonStatusBadge(mod, lesson) {
  const quizPassedStyle = 'background:#22c55e;color:#fff;padding:1px 6px;border-radius:3px;font-size:0.75rem;font-weight:600;';
  const visitedStyle = 'background:var(--color-bg-secondary);color:var(--color-text-muted);padding:1px 6px;border-radius:3px;font-size:0.75rem;border:1px solid var(--color-border);';
  const unvisitedStyle = 'background:transparent;color:var(--color-text-muted);padding:1px 6px;border-radius:3px;font-size:0.75rem;border:1px solid var(--color-border);opacity:0.5;';

  if (lesson.quizId) {
    const score = progressStore.getQuizScore(mod.id, lesson.quizId);
    if (score !== null) {
      return '<span style="' + quizPassedStyle + '">quiz-passed</span>';
    }
    const lp = progressStore.getLessonProgress(mod.id, lesson.id);
    if (lp.visited) {
      return '<span style="' + visitedStyle + '">visited</span>';
    }
    return '<span style="' + unvisitedStyle + '">unvisited</span>';
  } else {
    const lp = progressStore.getLessonProgress(mod.id, lesson.id);
    if (lp.visited) {
      return '<span style="' + visitedStyle + '">visited</span>';
    }
    return '<span style="' + unvisitedStyle + '">unvisited</span>';
  }
}

export function renderModule({ moduleId }) {
  const mod = MODULES.find(m => m.id === moduleId);
  if (!mod) return renderModuleNotFound();

  const { pct } = computeModuleProgress(mod);

  const lessonRows = mod.lessons.map(lesson => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--spacing-sm) var(--spacing-md);border:1px solid var(--color-border);border-radius:4px;margin-bottom:var(--spacing-xs);background:var(--color-bg-secondary);">
      <a href="#/lesson/${esc(mod.id)}/${esc(lesson.id)}"
         style="color:var(--color-text-primary);text-decoration:none;font-size:var(--text-body);">${esc(lesson.title)}</a>
      ${lessonStatusBadge(mod, lesson)}
    </div>
  `).join('');

  return `
    <section style="padding: var(--spacing-xl);">
      <div style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
        <i data-lucide="${esc(mod.icon.toLowerCase())}" style="width:24px;height:24px;color:var(--color-accent)"></i>
        <h1 style="font-size: var(--text-heading); font-weight: 600;">${esc(mod.title)}</h1>
      </div>

      <div style="border-left: 3px solid var(--color-border); padding-left: var(--spacing-md); margin-bottom: var(--spacing-md); background: var(--color-bg-secondary); padding: var(--spacing-md);">
        <p style="font-size: var(--text-body); color: var(--color-text-muted); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: var(--spacing-xs);">Module goal</p>
        <p style="font-size: var(--text-body);">${esc(mod.description)}</p>
      </div>

      <div style="margin-bottom: var(--spacing-lg);">
        <p style="font-size: var(--text-body); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-muted); margin-bottom: var(--spacing-xs);">COMPLIANCE CONTROLS COVERED</p>
        <div style="display: flex; gap: var(--spacing-xs);">
          ${mod.complianceTags.map(tag => renderBadge(tag)).join('')}
        </div>
      </div>

      <div style="margin-bottom:var(--spacing-lg);">
        <p style="font-size:0.8125rem;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:var(--spacing-xs);">Module progress: ${pct}%</p>
        <div style="height:4px;background:var(--color-bg-secondary);border-radius:2px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:var(--color-accent);transition:width 300ms ease;"></div>
        </div>
      </div>

      <div>
        <p style="font-size:0.8125rem;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:var(--spacing-sm);">Lessons</p>
        ${lessonRows}
      </div>
    </section>
  `;
}

function renderModuleNotFound() {
  // Static text only — never inject moduleId (hash-derived) into innerHTML (T-03-01)
  return `
    <section style="padding: var(--spacing-xl);">
      <p style="font-size: var(--text-body); color: var(--color-text-muted);">Module not found.</p>
    </section>
  `;
}
