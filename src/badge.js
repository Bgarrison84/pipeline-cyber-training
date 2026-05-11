// src/badge.js — standalone badge renderer, no circular deps
// renderBadge is extracted here so views can import it without pulling in main.js

let _complianceRefs = null;

export function setComplianceRefs(refs) {
  _complianceRefs = refs;
}

export function renderBadge(directiveKey) {
  const shortName = _complianceRefs?.directives?.[directiveKey]?.shortName
    ?? directiveKey;

  const colorClasses = {
    TSA:  'bg-[var(--color-badge-tsa-bg)] text-[var(--color-badge-tsa-text)]',
    NIST: 'bg-[var(--color-badge-nist-bg)] text-[var(--color-badge-nist-text)]',
  };

  return `<span class="inline-block rounded px-2 py-0.5 font-mono text-[var(--text-mono)] ${colorClasses[directiveKey] ?? ''}">${shortName}</span>`;
}
