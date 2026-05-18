// src/fork-config.js — fork configuration singleton
// Loads public/fork.config.json and exposes helpers for branding.
import { esc } from './utils/escape.js';

let _forkConfig = null;

export const DEFAULT_FORK_CONFIG = {
  orgName: 'OT Security Lab',
  logoPath: null,
  activeModules: [
    'logging-auditing',
    'network-hardening',
    'account-access',
    'incident-response',
    'patch-management',
  ],
};

/** Always returns a config object — never null. */
export function getForkConfig() {
  return _forkConfig ?? DEFAULT_FORK_CONFIG;
}

/** Fetch and validate public/fork.config.json. Falls back to DEFAULT_FORK_CONFIG on any error. */
export async function loadForkConfig() {
  const url = import.meta.env.BASE_URL + 'fork.config.json';
  try {
    const res = await fetch(url);
    if (!res.ok) {
      _forkConfig = DEFAULT_FORK_CONFIG;
      return DEFAULT_FORK_CONFIG;
    }
    const parsed = await res.json();
    // Validate required fields
    if (
      typeof parsed.orgName === 'string' &&
      Array.isArray(parsed.activeModules) &&
      parsed.activeModules.length > 0
    ) {
      _forkConfig = parsed;
      return parsed;
    }
    _forkConfig = DEFAULT_FORK_CONFIG;
    return DEFAULT_FORK_CONFIG;
  } catch {
    _forkConfig = DEFAULT_FORK_CONFIG;
    return DEFAULT_FORK_CONFIG;
  }
}

/** Apply org branding to the top bar and document title. Not async. */
export function applyForkBranding(config) {
  const span = document.querySelector('#top-bar > span');
  if (!span) return;

  if (config.logoPath) {
    const imgSrc = import.meta.env.BASE_URL + config.logoPath;
    span.innerHTML =
      `<img src="${esc(imgSrc)}" alt="${esc(config.orgName)}" ` +
      `style="height:32px;width:auto;vertical-align:middle;margin-right:8px">` +
      `<span>${esc(config.orgName)}</span>`;
  } else {
    span.textContent = config.orgName;
  }

  document.title = config.orgName + ' — OT Cyber Training';
}
