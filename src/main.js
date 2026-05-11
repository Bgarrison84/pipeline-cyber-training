// src/main.js
import { handleRoute } from './router.js';
import './style.css';

// Module-level cache — fetched once on init, shared across all views
let complianceRefs = null;

export async function loadComplianceRefs() {
  // import.meta.env.BASE_URL = '/pipeline-cyber-training/' in prod, '/' in dev
  const url = import.meta.env.BASE_URL + 'data/compliance-refs.json';
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    complianceRefs = await res.json();
    return complianceRefs;
  } catch {
    return null;
  }
}

export function getComplianceRefs() {
  return complianceRefs;
}

export function renderBadge(directiveKey) {
  // Use shortName from compliance-refs.json; fallback to key only if fetch failed
  const shortName = complianceRefs?.directives?.[directiveKey]?.shortName
    ?? directiveKey;

  const colorClasses = {
    TSA:  'bg-[var(--color-badge-tsa-bg)] text-[var(--color-badge-tsa-text)]',
    NIST: 'bg-[var(--color-badge-nist-bg)] text-[var(--color-badge-nist-text)]',
  };

  return `<span class="inline-block rounded px-2 py-0.5 font-mono text-[var(--text-mono)] ${colorClasses[directiveKey] ?? ''}">${shortName}</span>`;
}

async function init() {
  await loadComplianceRefs();
  handleRoute();             // render the initial view from current hash
}

init();
