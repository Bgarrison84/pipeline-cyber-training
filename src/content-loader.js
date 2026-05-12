// src/content-loader.js
// Fetch + parse + render pipeline for lesson Markdown files.
// Shiki singleton, marked.js async walkTokens integration, frontmatter parser, fetch cache.

import { createHighlighter } from 'shiki';
import { marked } from 'marked';
import { esc } from './utils/escape.js';
import { MODULES } from './modules-config.js';

// ──────────────────────────────────────────────────────────────────────────────
// Shiki singleton
// ──────────────────────────────────────────────────────────────────────────────

let _highlighter = null;

export async function getHighlighter() {
  if (_highlighter) return _highlighter;
  _highlighter = await createHighlighter({
    themes: ['github-dark'],
    langs: ['powershell'],
  });
  return _highlighter;
}

// ──────────────────────────────────────────────────────────────────────────────
// marked configuration — called ONCE at module load time
// ──────────────────────────────────────────────────────────────────────────────

marked.use({
  async: true,

  async walkTokens(token) {
    if (token.type !== 'code') return;
    const hl = await getHighlighter();
    const lang = token.lang?.toLowerCase() || 'text';
    const shikiLang =
      lang === 'powershell' || lang === 'ps1' || lang === 'ps'
        ? 'powershell'
        : lang;

    // For non-powershell langs, attempt lazy-load (catch unsupported langs)
    if (shikiLang !== 'powershell' && shikiLang !== 'text') {
      try {
        await hl.loadLanguage(shikiLang);
      } catch {
        // Language not in Shiki bundle — fall back to plain code block
      }
    }

    try {
      token.shikiHtml = hl.codeToHtml(token.text, {
        lang: shikiLang === 'text' ? 'text' : shikiLang,
        theme: 'github-dark',
      });
    } catch {
      token.shikiHtml = null;
    }
  },

  renderer: {
    code(token) {
      const lang = token.lang || '';
      const displayLang =
        lang === 'powershell' || lang === 'ps1' || lang === 'ps'
          ? 'PowerShell'
          : lang || 'Code';
      const rawCode = esc(token.text);
      const tokenBody = token.shikiHtml
        ? token.shikiHtml
        : `<pre><code>${rawCode}</code></pre>`;

      return `<div class="code-block"><div class="code-block-header"><span class="code-lang-label">${esc(displayLang)}</span><button class="code-copy-btn" aria-label="Copy code to clipboard" data-code="${rawCode}"><i data-lucide="copy" style="width:14px;height:14px;pointer-events:none;"></i></button></div><div class="code-block-body">${tokenBody}</div></div>`;
    },

    blockquote(token) {
      const rawText = token.raw || '';

      if (rawText.trimStart().startsWith('> [!OT]')) {
        // Filter out the [!OT] marker paragraph — leave only the body content
        const bodyTokens = (token.tokens ?? []).filter(
          t => !(t.type === 'paragraph' && (t.raw ?? '').trim().startsWith('[!OT]'))
        );
        const inner = marked.parser(bodyTokens);
        return `<aside class="ot-callout" aria-label="OT environment note"><div class="ot-callout-label">IN OT ENVIRONMENTS</div><div class="ot-callout-body">${inner}</div></aside>`;
      }

      // Standard blockquote
      const inner = marked.parser(token.tokens ?? []);
      return `<blockquote style="border-left: 3px solid var(--color-border); padding-left: var(--spacing-md); color: var(--color-text-muted); font-style: italic;">${inner}</blockquote>`;
    },
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// parseFrontmatter — manual YAML split (no gray-matter dependency)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Parse YAML frontmatter from a raw Markdown string.
 * @param {string} raw - Full Markdown content including optional frontmatter
 * @returns {{ meta: object, body: string }}
 */
export function parseFrontmatter(raw) {
  const DELIMITER = '---';
  const lines = raw.split('\n');

  if (lines[0].trim() !== DELIMITER) {
    return { meta: {}, body: raw };
  }

  const closeIdx = lines.indexOf(DELIMITER, 1);
  if (closeIdx === -1) {
    return { meta: {}, body: raw };
  }

  const yamlLines = lines.slice(1, closeIdx);
  const body = lines.slice(closeIdx + 1).join('\n').trimStart();
  const meta = {};

  for (const line of yamlLines) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim();

    if (val.startsWith('[') && val.endsWith(']')) {
      // Array: `[a, b, c]`
      meta[key] = val
        .slice(1, -1)
        .split(',')
        .map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    } else {
      meta[key] = val.replace(/^['"]|['"]$/g, '');
    }
  }

  return { meta, body };
}

// ──────────────────────────────────────────────────────────────────────────────
// getLessonNav — prev/next from MODULES config
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Compute prev/next navigation for a lesson within a module.
 * @param {string} moduleId
 * @param {string} lessonId
 * @returns {{ prev: object|null, next: object|null }}
 */
export function getLessonNav(moduleId, lessonId) {
  const mod = MODULES.find(m => m.id === moduleId);
  if (!mod) return { prev: null, next: null };

  const idx = mod.lessons.findIndex(l => l.id === lessonId);
  if (idx === -1) return { prev: null, next: null };

  return {
    prev:
      idx > 0
        ? {
            moduleId,
            lessonId: mod.lessons[idx - 1].id,
            title: mod.lessons[idx - 1].title,
          }
        : null,
    next:
      idx < mod.lessons.length - 1
        ? {
            moduleId,
            lessonId: mod.lessons[idx + 1].id,
            title: mod.lessons[idx + 1].title,
          }
        : null,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Fetch cache — in-memory Map keyed by `moduleId/lessonId`
// ──────────────────────────────────────────────────────────────────────────────

const _lessonCache = new Map();

/**
 * Fetch a lesson Markdown file from public/data/modules/{moduleId}/lessons/{lessonId}.md
 * Results are cached in memory for the session.
 * @param {string} moduleId
 * @param {string} lessonId
 * @returns {Promise<string|null>} Raw Markdown text, or null on 404/error
 */
export async function fetchLesson(moduleId, lessonId) {
  const key = `${moduleId}/${lessonId}`;
  if (_lessonCache.has(key)) return _lessonCache.get(key);

  const url =
    import.meta.env.BASE_URL + `data/modules/${moduleId}/lessons/${lessonId}.md`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    _lessonCache.set(key, text);
    return text;
  } catch {
    return null;
  }
}

/**
 * Check if a lesson file is available via HEAD fetch.
 * @param {string} moduleId
 * @param {string} lessonId
 * @returns {Promise<boolean>}
 */
export async function checkLessonAvailability(moduleId, lessonId) {
  const url =
    import.meta.env.BASE_URL + `data/modules/${moduleId}/lessons/${lessonId}.md`;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// renderMarkdown — async marked.parse wrapper
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Render a Markdown string to HTML.
 * Uses the marked.js pipeline configured above (Shiki via walkTokens, custom renderers).
 * @param {string} markdownBody - Markdown body (no frontmatter)
 * @returns {Promise<string>} HTML string
 */
export async function renderMarkdown(markdownBody) {
  return await marked.parse(markdownBody);
}
