// src/views/module-view.js
import { MODULES } from '../modules-config.js';
import { renderBadge } from '../badge.js';

const SECTION_CARDS = [
  {
    label: 'Lessons',
    body:  'Lessons coming in Phase 2. This module will contain guided lessons with PowerShell examples.',
  },
  {
    label: 'Quizzes',
    body:  'Quizzes coming in Phase 2. Knowledge checks with per-answer explanatory feedback.',
  },
  {
    label: 'Terminal Exercises',
    body:  'Terminal exercises coming in Phase 5. Practice PowerShell commands in a safe simulator.',
  },
  {
    label: 'Scenarios',
    body:  'Scenario exercises coming in Phase 6. Work through realistic compliance incident decisions.',
  },
];

export function renderModule({ moduleId }) {
  const mod = MODULES.find(m => m.id === moduleId);
  if (!mod) return renderModuleNotFound();

  const sectionCards = SECTION_CARDS.map(s => `
    <div style="border: 1px solid var(--color-border); background: var(--color-bg-secondary); padding: var(--spacing-lg); border-radius: 4px;">
      <h3 style="font-size: var(--text-body); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-muted); margin-bottom: var(--spacing-sm);">${s.label}</h3>
      <p style="font-size: var(--text-body); color: var(--color-text-muted); font-style: italic;">${s.body}</p>
    </div>
  `).join('');

  return `
    <section style="padding: var(--spacing-xl);">
      <div style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
        <i data-lucide="${mod.icon}" style="width:24px;height:24px;color:var(--color-accent)"></i>
        <h1 style="font-size: var(--text-heading); font-weight: 600;">${mod.title}</h1>
      </div>

      <div style="border-left: 3px solid var(--color-border); padding-left: var(--spacing-md); margin-bottom: var(--spacing-md); background: var(--color-bg-secondary); padding: var(--spacing-md);">
        <p style="font-size: var(--text-body); color: var(--color-text-muted); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: var(--spacing-xs);">Module goal</p>
        <p style="font-size: var(--text-body);">${mod.description}</p>
      </div>

      <div style="margin-bottom: var(--spacing-lg);">
        <p style="font-size: var(--text-body); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-muted); margin-bottom: var(--spacing-xs);">COMPLIANCE CONTROLS COVERED</p>
        <div style="display: flex; gap: var(--spacing-xs);">
          ${mod.complianceTags.map(tag => renderBadge(tag)).join('')}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--spacing-md);">
        ${sectionCards}
      </div>
    </section>
  `;
}

function renderModuleNotFound() {
  // Static text only — never inject moduleId (hash-derived) into innerHTML (T-03-01)
  return `
    <section style=”padding: var(--spacing-xl);”>
      <p style=”font-size: var(--text-body); color: var(--color-text-muted);”>Module not found.</p>
    </section>
  `;
}
