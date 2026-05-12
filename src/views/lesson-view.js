// src/views/lesson-view.js
// Async lesson view renderer — Wave 1 vertical slice implementation.
// Fetches .md file, parses frontmatter, renders Markdown with Shiki highlighting.
// Compliance bar and footer nav placeholders are filled in Wave 2 (Plan 02-03).

import { MODULES } from '../modules-config.js';
import { fetchLesson, parseFrontmatter, renderMarkdown, getLessonNav } from '../content-loader.js';
import { esc } from '../utils/escape.js';
import { activateIcons } from '../main.js';

/**
 * Render the lesson view as an HTML string.
 * @param {{ moduleId: string, lessonId: string }} params
 * @returns {Promise<string>} HTML string for app.innerHTML
 */
export async function renderLesson({ moduleId, lessonId }) {
  if (!moduleId || !lessonId) return renderLessonNotFound();

  const mod = MODULES.find(m => m.id === moduleId);
  if (!mod) return renderLessonNotFound();

  const raw = await fetchLesson(moduleId, lessonId);
  if (raw === null) return renderLessonError('not-found');

  const { meta, body } = parseFrontmatter(raw);
  const html = await renderMarkdown(body);

  return `<div class="lesson-wrapper" aria-busy="false">
    <div class="lesson-column" style="max-width: var(--lesson-reading-width, 720px); margin: 0 auto; padding: var(--spacing-xl);">
      <h1 style="font-size: var(--text-display); font-weight: 600; line-height: 1.2;
                 color: var(--color-text-primary); margin-bottom: var(--spacing-sm);">
        ${esc(meta.title || 'Lesson')}
      </h1>
      <!-- compliance bar placeholder — Wave 2 fills this in -->
      <div class="compliance-bar" id="lesson-compliance-bar"></div>
      <!-- rendered markdown body -->
      <article class="lesson-body"
               style="font-size: var(--text-prose-body, var(--text-body)); font-weight: 400; line-height: 1.7;
                      color: var(--color-text-primary);">
        ${html}
      </article>
      <!-- footer placeholder — Wave 2 fills this in -->
      <nav class="lesson-footer" aria-label="Lesson navigation" id="lesson-footer"></nav>
    </div>
  </div>`;
}

function renderLessonNotFound() {
  // Static text only — never inject moduleId/lessonId (hash-derived) into innerHTML
  return `<section style="padding: var(--spacing-xl);"><p style="color: var(--color-text-muted);">Lesson not found. Use the sidebar to select a lesson.</p></section>`;
}

function renderLessonError(type) {
  return `<section style="padding: var(--spacing-xl);"><div class="lesson-error" role="alert"><p style="font-weight: 600; color: var(--color-text-primary); margin-bottom: var(--spacing-sm);">Lesson content could not be loaded</p><p style="color: var(--color-text-muted);">${type === 'not-found' ? 'This lesson file was not found. It may still be in development.' : 'Could not connect. Check your network connection and reload the page.'}</p><a href="" onclick="window.location.reload();return false;" style="color: var(--color-accent); font-weight: 600;">Reload page</a></div></section>`;
}
