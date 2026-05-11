// src/router.js
import { renderHome }     from './views/home-view.js';
import { renderModule }   from './views/module-view.js';
import { renderNotFound } from './views/not-found-view.js';
import { setActiveModule } from './sidebar.js';

const routes = [
  { pattern: '#/',                 view: 'home' },
  { pattern: '#/module/:moduleId', view: 'module' },
  // Phase 2+ will add: { pattern: '#/lesson/:moduleId/:lessonId', view: 'lesson' }
];

function extractParams(hash, pattern) {
  const hashParts    = hash.slice(1).split('/').filter(Boolean);
  const patternParts = pattern.slice(1).split('/').filter(Boolean);
  if (hashParts.length !== patternParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(hashParts[i]);
    } else if (patternParts[i] !== hashParts[i]) {
      return null;
    }
  }
  return params;
}

export function matchRoute(hash) {
  const cleanHash = hash || '#/';
  for (const route of routes) {
    const params = extractParams(cleanHash, route.pattern);
    if (params !== null) return { view: route.view, params };
  }
  return { view: 'not-found', params: {} };
}

const viewRenderers = {
  home:        (params) => renderHome(params),
  module:      (params) => renderModule(params),
  'not-found': (params) => renderNotFound(params),
};

export function handleRoute() {
  const { view, params } = matchRoute(window.location.hash);
  const app = document.getElementById('app');
  const renderer = viewRenderers[view] ?? viewRenderers['not-found'];
  app.innerHTML = renderer(params);
  setActiveModule(params.moduleId ?? null);
  // Activate Lucide icons injected into DOM
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', handleRoute);
