// src/views/not-found-view.js
export function renderNotFound() {
  return `
    <section style="padding: var(--spacing-xl);">
      <h1 style="font-size: var(--text-heading); font-weight: 600; margin-bottom: var(--spacing-sm);">Page not found</h1>
      <p style="font-size: var(--text-body); color: var(--color-text-muted);">
        Use the sidebar to navigate to a module.
      </p>
    </section>
  `;
}
