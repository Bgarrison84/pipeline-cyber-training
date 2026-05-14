// src/router.js
import { renderHome }     from './views/home-view.js';
import { renderModule }   from './views/module-view.js';
import { renderNotFound } from './views/not-found-view.js';
import { renderLesson }   from './views/lesson-view.js';
import { setActiveModule, setActiveLesson } from './sidebar.js';
import { activateIcons } from './main.js';
import { progressStore } from './progress-store.js';

const routes = [
  { pattern: '#/',                              view: 'home' },
  { pattern: '#/module/:moduleId',              view: 'module' },
  { pattern: '#/lesson/:moduleId/:lessonId',    view: 'lesson' },
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
  lesson:      (params) => renderLesson(params),
  'not-found': (params) => renderNotFound(params),
};

export async function handleRoute() {
  const app = document.getElementById('app');
  if (!app) return;
  const isInitialLoad = !window.location.hash || window.location.hash === '#/';
  if (isInitialLoad) {
    const last = progressStore.getLastVisited();
    if (last?.moduleId && last?.lessonId) {
      window.location.hash = '#/lesson/' + last.moduleId + '/' + last.lessonId;
      return; // hashchange event fires handleRoute() again with new hash
    }
  }
  const { view, params } = matchRoute(window.location.hash);
  const renderer = viewRenderers[view] ?? viewRenderers['not-found'];
  const viewHtml = await renderer(params);
  if (viewHtml !== null) {
    // null = renderer already owns the DOM (e.g. renderLesson writes directly)
    // '' or string = router sets innerHTML
    app.innerHTML = viewHtml;
  }
  setActiveModule(params.moduleId ?? null);
  if (params.lessonId) {
    setActiveLesson(params.moduleId, params.lessonId);
  }
  // Activate Lucide icons injected into DOM
  activateIcons();
}

// hashchange handles all navigations after initial load
// 'load' listener removed — init() in main.js owns the initial render
// (after loadComplianceRefs resolves, so badges show correct text on first paint)
window.addEventListener('hashchange', handleRoute);
