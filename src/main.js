// src/main.js
import { handleRoute } from './router.js';
import { initSidebar } from './sidebar.js';
import { setComplianceRefs, renderBadge } from './badge.js';
import { createIcons, BookOpen, Shield, Users, AlertTriangle, Wrench, ChevronLeft, Copy, Check, AlertCircle } from 'lucide';
import './style.css';

export { renderBadge };

export function activateIcons() {
  createIcons({
    icons: { BookOpen, Shield, Users, AlertTriangle, Wrench, ChevronLeft, Copy, Check, AlertCircle },
  });
}

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
  await Promise.all([handleRoute(), initSidebar()]);
}

init();
