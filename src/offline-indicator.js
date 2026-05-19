// src/offline-indicator.js
// Always-visible online/offline status indicator + PWA install prompt.
// Called once from main.js init() — pure DOM API and window events, zero project imports.

// Module-level private state (singleton per module scope)
let _deferredInstallPrompt = null;
let _dotEl = null;
let _labelEl = null;
let _installLinkEl = null;

// Color constants (D-03: green online, amber offline per --color-ot-border)
const ONLINE_COLOR = '#22c55e';
const OFFLINE_COLOR = '#d97706';

/**
 * _setState — update dot color and label text based on network state.
 * @param {boolean} online
 */
function _setState(online) {
  if (_dotEl) _dotEl.style.background = online ? ONLINE_COLOR : OFFLINE_COLOR;
  if (_labelEl) _labelEl.textContent = online ? 'Online' : 'Offline';
}

/**
 * initOfflineIndicator — inject the status indicator into #top-bar > div.flex.
 * Registers window online/offline listeners and SW controllerchange listener.
 * Intercepts beforeinstallprompt; surfaces an "Install app" link on user gesture.
 */
export function initOfflineIndicator() {
  const container = document.querySelector('#top-bar > div.flex');
  if (!container) return;

  // ── Indicator wrapper ──────────────────────────────────────────────────────
  const indicator = document.createElement('span');
  indicator.id = 'offline-indicator';
  indicator.style.cssText =
    'display:flex;align-items:center;gap:4px;font-size:var(--text-body);color:var(--color-text-muted)';

  // Status dot
  const dot = document.createElement('span');
  dot.style.cssText =
    'width:8px;height:8px;border-radius:50%;background:#22c55e;flex-shrink:0';
  _dotEl = dot;

  // Label
  const label = document.createElement('span');
  label.textContent = 'Online';
  _labelEl = label;

  indicator.append(dot, label);
  container.append(indicator);

  // ── Install link (hidden until beforeinstallprompt fires) ──────────────────
  const installLink = document.createElement('a');
  installLink.id = 'install-link';
  installLink.href = '#';
  installLink.style.cssText =
    'display:none;align-items:center;gap:4px;font-size:var(--text-body);' +
    'color:var(--color-text-muted);text-decoration:none';
  installLink.setAttribute('onmouseover', "this.style.color='var(--color-accent)'");
  installLink.setAttribute('onmouseout', "this.style.color='var(--color-text-muted)'");

  // Inline SVG download icon — NOT data-lucide (Lucide createIcons() runs at startup
  // before this element is injected; data-lucide on dynamic elements renders as empty text).
  installLink.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
    '<polyline points="7 10 12 15 17 10"/>' +
    '<line x1="12" y1="15" x2="12" y2="3"/>' +
    '</svg>Install app';

  installLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (_deferredInstallPrompt) {
      _deferredInstallPrompt.prompt();
      _deferredInstallPrompt.userChoice.then(() => {
        _deferredInstallPrompt = null;
        _installLinkEl.style.display = 'none';
      });
    }
  });

  _installLinkEl = installLink;
  container.append(installLink);

  // ── Set initial state ──────────────────────────────────────────────────────
  _setState(navigator.onLine);

  // ── Primary: window online/offline events ─────────────────────────────────
  window.addEventListener('online', () => _setState(true));
  window.addEventListener('offline', () => _setState(false));

  // ── Secondary: SW controllerchange (D-04 — not solely navigator.onLine) ───
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      _setState(navigator.onLine);
    });
  }

  // ── Install prompt: intercept and defer ───────────────────────────────────
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredInstallPrompt = e;
    _installLinkEl.style.display = 'flex';
  });

  // ── Post-install: hide the install link ───────────────────────────────────
  window.addEventListener('appinstalled', () => {
    _deferredInstallPrompt = null;
    _installLinkEl.style.display = 'none';
  });
}
