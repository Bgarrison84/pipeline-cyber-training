// src/main.js
import { handleRoute } from './router.js';
import { initSidebar } from './sidebar.js';
import { setComplianceRefs, renderBadge } from './badge.js';
import './style.css';

export { renderBadge };

let complianceRefs = null;

export async function loadComplianceRefs() {
  const url = import.meta.env.BASE_URL + 'data/compliance-refs.json';
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    complianceRefs = await res.json();
    setComplianceRefs(complianceRefs);
    return complianceRefs;
  } catch {
    return null;
  }
}

export function getComplianceRefs() {
  return complianceRefs;
}

async function init() {
  await loadComplianceRefs();
  handleRoute();
  initSidebar();
}

init();
