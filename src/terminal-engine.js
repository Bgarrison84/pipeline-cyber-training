// src/terminal-engine.js
// Wave 1 — createTerminal factory (Phase 05 Plan 02)
// Pure ES module: no imports, self-contained DOM manipulation only.
// Exports a single named factory function consumed by exercise-view.js.

/**
 * Creates a simulated PowerShell terminal UI inside `container` and returns
 * a 4-method API object. The terminal echoes typed commands, maintains a
 * command history (↑/↓ keys), and calls `commandHandler` with the trimmed
 * input on Enter.
 *
 * @param {HTMLElement} container      - The #terminal-mount div; termBody is appended into it.
 * @param {(rawInput: string) => void} commandHandler - Called with trimmed input on Enter keydown.
 * @returns {{ appendOutput: Function, disable: Function, setPrompt: Function, focus: Function }}
 */
export function createTerminal(container, commandHandler) {
  // ── State (closure) ─────────────────────────────────────────────────────────
  const history = [];
  let historyIndex = -1;
  let disabled = false;

  // ── DOM construction ─────────────────────────────────────────────────────────

  // Terminal body: dark background, monospace 13px, scrollable
  const termBody = document.createElement('div');
  termBody.style.cssText = [
    'background:#1a1a1a',
    'font-family:\'Courier New\',monospace',
    'font-size:13px',
    'line-height:1.6',
    'color:var(--color-text-primary)',
    'min-height:320px',
    'max-height:480px',
    'overflow-y:auto',
    'padding:var(--spacing-md)',
    'border-radius:0 0 4px 4px',
    'cursor:text',
  ].join(';');

  // Output list: inherits font from termBody; output lines appended here
  const outputList = document.createElement('div');
  termBody.appendChild(outputList);

  // Prompt row: flex row containing prompt span + input
  const promptRow = document.createElement('div');
  promptRow.style.cssText = 'display:flex;align-items:baseline;gap:var(--spacing-xs)';

  // Prompt span: bright green, no-select, no-wrap
  const promptSpan = document.createElement('span');
  promptSpan.style.cssText = [
    'color:#22c55e',
    'font-family:\'Courier New\',monospace',
    'font-size:13px',
    'white-space:nowrap',
    'user-select:none',
    'flex-shrink:0',
  ].join(';');
  promptSpan.textContent = 'PS PIPELINE-DC01 >';

  // Command input: transparent, no border, full-width in flex row
  const input = document.createElement('input');
  input.type = 'text';
  input.style.cssText = [
    'background:transparent',
    'border:none',
    'outline:none',
    'color:var(--color-text-primary)',
    'font-family:\'Courier New\',monospace',
    'font-size:13px',
    'flex:1',
    'min-height:44px',
    'caret-color:#22c55e',
    'line-height:1.6',
  ].join(';');
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('spellcheck', 'false');

  // Assemble DOM tree
  promptRow.appendChild(promptSpan);
  promptRow.appendChild(input);
  termBody.appendChild(promptRow);
  container.appendChild(termBody);

  // ── Event listeners ───────────────────────────────────────────────────────────

  // Click on terminal body → focus input (unless disabled)
  termBody.addEventListener('click', () => {
    if (!disabled) input.focus();
  });

  // Input focus: highlight wrapper border green
  const _getWrapper = () =>
    container.closest('[data-terminal-wrapper]') ?? container.parentElement;

  input.addEventListener('focus', () => {
    const wrapper = _getWrapper();
    if (wrapper) wrapper.style.borderColor = '#22c55e';
  });

  // Input blur: reset wrapper border
  input.addEventListener('blur', () => {
    const wrapper = _getWrapper();
    if (wrapper) wrapper.style.borderColor = 'var(--color-border)';
  });

  // Keydown: Enter, ArrowUp, ArrowDown
  input.addEventListener('keydown', (e) => {
    if (disabled) return;

    if (e.key === 'Enter') {
      const raw = input.value;
      const trimmed = raw.trim();
      if (!trimmed) return;                         // empty input — ignore

      // Echo command line (uses textContent — never innerHTML)
      appendOutput(promptSpan.textContent + ' ' + raw);

      // Update history (unshift so history[0] is always most recent)
      history.unshift(trimmed);
      historyIndex = -1;

      // Clear input before calling handler
      input.value = '';

      commandHandler(trimmed);
      scrollToBottom();

    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        historyIndex++;
        input.value = history[historyIndex];
      }

    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        input.value = history[historyIndex];
      } else if (historyIndex === 0) {
        historyIndex = -1;
        input.value = '';
      }
    }
  });

  // ── Internal helpers ──────────────────────────────────────────────────────────

  function scrollToBottom() {
    termBody.scrollTop = termBody.scrollHeight;
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  /**
   * Append a line of text to the terminal output.
   * CRITICAL: uses textContent (never innerHTML) — successOutput strings may
   * contain angle brackets from PS error messages. (T-05-W1-01)
   *
   * @param {string} text   - Output text; \n renders as newline via white-space:pre-wrap.
   * @param {string} [color] - Optional CSS color for this line.
   */
  function appendOutput(text, color) {
    const line = document.createElement('div');
    line.style.cssText = 'display:block;white-space:pre-wrap;word-break:break-all;';
    if (color) line.style.color = color;
    line.textContent = text;      // textContent — XSS-safe regardless of PS output content
    outputList.appendChild(line);
    scrollToBottom();
  }

  /**
   * Disable the terminal input (exercise complete or re-visit mode).
   * Sets readonly + dims the prompt row to indicate non-interactivity.
   */
  function disable() {
    disabled = true;
    input.setAttribute('readonly', '');
    input.style.pointerEvents = 'none';
    input.style.opacity = '0.4';
    promptSpan.style.opacity = '0.4';
  }

  /**
   * Update the prompt text (called by exercise-view after mounting, per D-02).
   * @param {string} text - New prompt string (e.g. "PS PIPELINE-DC01 >").
   */
  function setPrompt(text) {
    promptSpan.textContent = text;
  }

  /**
   * Focus the terminal input (called by exercise-view on fresh-mode load).
   */
  function focus() {
    input.focus();
  }

  return { appendOutput, disable, setPrompt, focus };
}
