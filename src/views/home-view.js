// src/views/home-view.js
import { MODULES } from '../modules-config.js';
import { renderBadge } from '../main.js';

export function renderHome() {
  const cards = MODULES.map(mod => `
    <article class="border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-[var(--spacing-lg)] rounded hover:border-[var(--color-accent)] transition-colors duration-150 cursor-pointer"
             role="link"
             tabindex="0"
             onclick="location.hash='#/module/${mod.id}'"
             onkeydown="if(event.key==='Enter')location.hash='#/module/${mod.id}'">
      <div class="flex items-center justify-between">
        <h2 class="text-[var(--text-heading)] font-semibold">${mod.title}</h2>
        <i data-lucide="arrow-right" style="width:16px;height:16px;color:var(--color-text-muted)"></i>
      </div>
      <p style="font-size: var(--text-body); color: var(--color-text-muted); margin-top: var(--spacing-sm);">${mod.description}</p>
      <div style="display: flex; gap: var(--spacing-xs); margin-top: var(--spacing-sm);">
        ${mod.complianceTags.map(tag => renderBadge(tag)).join('')}
      </div>
    </article>
  `).join('');

  return `
    <section style="padding: var(--spacing-xl); max-width: 800px; margin: 0 auto;">
      <h1 style="font-size: var(--text-heading); font-weight: 600; margin-bottom: var(--spacing-sm);">Select a module to begin</h1>
      <p style="font-size: var(--text-body); color: var(--color-text-muted); margin-bottom: var(--spacing-xl);">
        Five modules covering TSA SD&#8209;02F and NIST SP&nbsp;800&#8209;82 Rev&nbsp;3 compliance controls.
      </p>
      <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">${cards}</div>
    </section>
  `;
}
