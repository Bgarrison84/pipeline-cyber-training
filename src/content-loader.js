// src/content-loader.js
// Wave 0 stub — exports present so test files load without import errors.
// Implementation ships in Wave 1 (Plan 02-02).

/**
 * Parse YAML frontmatter from a Markdown string.
 * @param {string} raw - Full Markdown content including optional frontmatter
 * @returns {{ meta: object, body: string }}
 */
export function parseFrontmatter(raw) {
  throw new Error('parseFrontmatter: not yet implemented (Wave 1)')
}

/**
 * Compute prev/next navigation for a lesson within a module.
 * @param {string} moduleId
 * @param {string} lessonId
 * @returns {{ prev: object|null, next: object|null }}
 */
export function getLessonNav(moduleId, lessonId) {
  throw new Error('getLessonNav: not yet implemented (Wave 1)')
}

/**
 * Render a Markdown string to HTML using marked.js + Shiki.
 * @param {string} markdownBody - Markdown body (no frontmatter)
 * @returns {Promise<string>} HTML string
 */
export async function renderMarkdown(markdownBody) {
  throw new Error('renderMarkdown: not yet implemented (Wave 1)')
}

/**
 * Fetch a lesson Markdown file from public/data/modules/{moduleId}/lessons/{lessonId}.md
 * @param {string} moduleId
 * @param {string} lessonId
 * @returns {Promise<string>} Raw Markdown text
 */
export async function fetchLesson(moduleId, lessonId) {
  throw new Error('fetchLesson: not yet implemented (Wave 1)')
}

/**
 * Check if a lesson file is available (HEAD fetch).
 * @param {string} moduleId
 * @param {string} lessonId
 * @returns {Promise<boolean>}
 */
export async function checkLessonAvailability(moduleId, lessonId) {
  throw new Error('checkLessonAvailability: not yet implemented (Wave 1)')
}
