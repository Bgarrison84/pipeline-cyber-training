// src/badge.js — standalone badge renderer, no circular deps
// renderBadge is extracted here so views can import it without pulling in main.js
import { esc } from './utils/escape.js';

let _complianceRefs = null;

export function setComplianceRefs(refs) {
  _complianceRefs = refs;
}

export function renderBadge(directiveKey) {
  const directive = _complianceRefs?.directives?.[directiveKey];
  const shortName = directive?.shortName ?? directiveKey;
  const status = directive?.status ?? 'active';

  const expiredClasses = 'bg-[var(--color-badge-expired-bg)] text-[var(--color-badge-expired-text)]';

  const colorClasses = {
    TSA:  'bg-[var(--color-badge-tsa-bg)] text-[var(--color-badge-tsa-text)]',
    NIST: 'bg-[var(--color-badge-nist-bg)] text-[var(--color-badge-nist-text)]',
  };

  if (status === 'expired') {
    return `<span class="inline-block rounded px-2 py-0.5 font-mono text-[var(--text-mono)] ${esc(expiredClasses)}" title="This directive has expired. Verify successor at TSA.gov." aria-label="${esc(shortName)} — EXPIRED"><span style="text-decoration: line-through;">${esc(shortName)}</span> [EXPIRED]</span>`;
  }

  const safeClasses = colorClasses[directiveKey] ?? '';
  return `<span class="inline-block rounded px-2 py-0.5 font-mono text-[var(--text-mono)] ${esc(safeClasses)}">${esc(shortName)}</span>`;
}
