// src/sidebar.js
import { MODULES } from './modules-config.js';
import { esc } from './utils/escape.js';
import { checkLessonAvailability } from './content-loader.js';
import { activateIcons } from './main.js';

export async function initSidebar() {
  const sidebarModules = document.getElementById('sidebar-modules');
  if (!sidebarModules) return;

  // Run all HEAD fetch availability checks in parallel
  const allChecks = MODULES.flatMap(mod =>
    mod.lessons.map(lesson =>
      checkLessonAvailability(mod.id, lesson.id).then(ok => ({
        key: mod.id + '/' + lesson.id,
        ok,
      }))
    )
  );
  const results = await Promise.all(allChecks);
  const available = new Set(results.filter(r => r.ok).map(r => r.key));

  sidebarModules.innerHTML = MODULES.map(mod => `
    <div class="sidebar-module" data-module-id="${esc(mod.id)}">
      <a href="#/module/${esc(mod.id)}"
         aria-label="${esc(mod.title)}"
         style="display: flex; align-items: center; gap: var(--spacing-sm); padding: var(--spacing-sm) var(--spacing-md); color: var(--color-text-primary); text-decoration: none; cursor: pointer; border-left: 3px solid transparent; transition: border-color 150ms ease, background 150ms ease;"
         onmouseover="this.style.color='var(--color-accent)'"
         onmouseout="if(!this.closest('.sidebar-module--active'))this.style.color='var(--color-text-primary)'">
        <i data-lucide="${esc(mod.icon.toLowerCase())}" style="width:20px;height:20px;flex-shrink:0;"></i>
        <span class="sidebar-label" style="font-size: var(--text-body); font-weight: 400; white-space: nowrap; overflow: hidden;">${esc(mod.title)}</span>
      </a>
      <div class="sidebar-lessons" style="padding-left: calc(20px + var(--spacing-sm) + var(--spacing-md));">
        ${mod.lessons.map(lesson => {
          const key = mod.id + '/' + lesson.id;
          if (available.has(key)) {
            return `<a class="sidebar-lesson-link" href="#/lesson/${esc(mod.id)}/${esc(lesson.id)}" aria-label="${esc(lesson.title)}" data-module-id="${esc(mod.id)}" data-lesson-id="${esc(lesson.id)}" style="display: block; padding: var(--spacing-xs) var(--spacing-sm); font-size: var(--text-body); color: var(--color-text-primary); text-decoration: none; border-left: 3px solid transparent; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(lesson.title)}</a>`;
          } else {
            return `<span aria-disabled="true" aria-label="${esc(lesson.title)} — not yet available" style="display: block; padding: var(--spacing-xs) var(--spacing-sm); font-size: var(--text-body); color: var(--color-text-muted); opacity: 0.4; pointer-events: none; cursor: default; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(lesson.title)}</span>`;
          }
        }).join('')}
      </div>
    </div>
  `).join('');

  // Activate Lucide icons in sidebar
  activateIcons();

  // Collapse toggle
  const shell     = document.getElementById('shell');
  const toggleBtn = document.getElementById('sidebar-toggle');
  let isCollapsed = false;

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isCollapsed = !isCollapsed;
      shell.classList.toggle('sidebar-collapsed', isCollapsed);
      toggleBtn.setAttribute('aria-label',
        isCollapsed ? 'Expand navigation' : 'Collapse navigation'
      );
      document.querySelectorAll('.sidebar-label').forEach(el => {
        el.style.opacity  = isCollapsed ? '0' : '1';
        el.style.width    = isCollapsed ? '0' : '';
        el.style.overflow = isCollapsed ? 'hidden' : '';
      });
    });
  }
}

export function setActiveModule(moduleId) {
  document.querySelectorAll('.sidebar-module').forEach(el => {
    const id       = el.dataset.moduleId;
    const isActive = id === moduleId;
    const link     = el.querySelector('a');

    el.classList.toggle('sidebar-module--active', isActive);
    if (isActive) {
      el.setAttribute('aria-current', 'page');
    } else {
      el.removeAttribute('aria-current');
    }

    if (link) {
      if (isActive) {
        link.style.borderLeftColor = 'var(--color-accent)';
        link.style.background = 'rgba(249, 115, 22, 0.08)';
        link.style.color = 'var(--color-accent)';
      } else {
        link.style.borderLeftColor = 'transparent';
        link.style.background = '';
        link.style.color = 'var(--color-text-primary)';
      }
    }

    // Show/hide lesson list with max-height transition
    const lessonList = el.querySelector('.sidebar-lessons');
    if (lessonList) {
      lessonList.style.maxHeight = isActive ? lessonList.scrollHeight + 'px' : '0';
    }
  });
}

export function setActiveLesson(moduleId, lessonId) {
  document.querySelectorAll('.sidebar-lesson-link').forEach(link => {
    const isActive =
      link.dataset.moduleId === moduleId && link.dataset.lessonId === lessonId;

    if (isActive) {
      link.style.borderLeftColor = 'var(--color-accent)';
      link.style.background = 'rgba(249, 115, 22, 0.08)';
      link.style.color = 'var(--color-accent)';
      link.setAttribute('aria-current', 'page');
      link.classList.add('sidebar-lesson-link--active');
    } else {
      link.style.borderLeftColor = 'transparent';
      link.style.background = '';
      link.style.color = 'var(--color-text-primary)';
      link.removeAttribute('aria-current');
      link.classList.remove('sidebar-lesson-link--active');
    }
  });
}
