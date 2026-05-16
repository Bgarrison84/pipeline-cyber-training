// tests/setup.js
// Global test environment setup for happy-dom.
// Defines browser APIs that happy-dom does not implement natively.

// window.print is not implemented in happy-dom — define as no-op so vi.spyOn() works.
if (typeof window !== 'undefined' && typeof window.print !== 'function') {
  window.print = () => {};
}
