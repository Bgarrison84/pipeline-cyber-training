// src/quiz-engine.js
// Phase 04 Plan 02 — Quiz engine: fetch, render, event delegation, score save.
// Exports: renderQuiz (async), computeModuleProgress (sync).
// No static top-level import of sidebar.js — dynamic import used to break the circular dependency.

import { esc } from './utils/escape.js';
import { activateIcons } from './utils/icons.js';
import { progressStore } from './progress-store.js';
import { MODULES } from './modules-config.js';

// ──────────────────────────────────────────────────────────────────────────────
// renderQuiz — fetch quiz JSON, determine mode, render, wire handlers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Fetch quiz JSON and render the quiz section below the lesson article.
 * @param {string} moduleId
 * @param {string} quizId
 * @param {Element} lessonColumn  — the .lesson-column DOM element to append into
 * @param {string} [lessonId]     — lessonId for markLessonCompleted(); derived from quizId if omitted
 * @returns {Promise<Element|null>}  the appended section, or null on failure
 */
export async function renderQuiz(moduleId, quizId, lessonColumn, lessonId) {
  if (!lessonColumn) return null;

  // Derive lessonId if not provided (fallback: use quizId as lessonId)
  const resolvedLessonId = lessonId || quizId;

  // Fetch quiz JSON
  const url = import.meta.env.BASE_URL + 'data/modules/' + moduleId + '/quizzes/' + quizId + '.json';
  let quiz;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    quiz = await res.json();
  } catch {
    return null;
  }

  // Build section element
  const section = document.createElement('section');
  section.className = 'quiz-section';
  section.style.cssText = 'padding-top: var(--spacing-2xl); border-top: 1px solid var(--color-border); margin-top: var(--spacing-xl);';

  // Determine first-visit vs revisit mode
  const prior = progressStore.getQuizScore(moduleId, quizId);

  if (prior !== null) {
    section.innerHTML = buildRevisitHtml(quiz, prior);
  } else {
    section.innerHTML = buildFirstVisitHtml(quiz);
  }

  const existingQuiz = lessonColumn.querySelector('.quiz-section');
  if (existingQuiz) existingQuiz.remove();
  lessonColumn.appendChild(section);
  activateIcons();

  if (prior === null) {
    attachQuizHandlers(section, moduleId, quizId, quiz, resolvedLessonId, lessonColumn);
  }

  return section;
}

// ──────────────────────────────────────────────────────────────────────────────
// buildFirstVisitHtml — interactive quiz for first-time visitors
// ──────────────────────────────────────────────────────────────────────────────

function buildFirstVisitHtml(quiz) {
  const questionsHtml = quiz.questions.map(q => `
    <div class="quiz-question-card"
         data-question-id="${esc(q.id)}"
         data-answered="false"
         style="margin-bottom: var(--spacing-xl); padding: var(--spacing-md); background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 6px;">
      <p class="quiz-stem" style="font-size: var(--text-body); font-weight: 600; color: var(--color-text-primary); margin-bottom: var(--spacing-md);">
        ${esc(q.stem)}
      </p>
      <div class="quiz-answers">
        ${q.answers.map(a => `
          <button class="quiz-answer-btn"
                  data-answer-id="${esc(a.id)}"
                  data-correct="${esc(String(a.correct))}"
                  style="cursor: pointer; width: 100%; text-align: left; padding: var(--spacing-sm) var(--spacing-md); border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-bg-secondary); margin-bottom: var(--spacing-xs); display: flex; align-items: center; gap: var(--spacing-sm);">
            <span style="flex: 1;">${esc(a.text)}</span>
            <i data-lucide="check-circle" style="width:16px;height:16px;flex-shrink:0;display:none;"></i>
            <i data-lucide="x-circle" style="width:16px;height:16px;flex-shrink:0;display:none;"></i>
          </button>
          <div class="quiz-answer-feedback"
               data-for-answer="${esc(a.id)}"
               style="display: none; font-size: var(--text-body); color: var(--color-text-muted); padding: var(--spacing-xs) var(--spacing-md); margin-bottom: var(--spacing-xs);">
            ${esc(a.feedback)}
          </div>
        `).join('')}
      </div>
      <div class="quiz-explanation"
           style="display: none; font-size: var(--text-body); color: var(--color-text-muted); padding: var(--spacing-md); border-top: 1px solid var(--color-border); margin-top: var(--spacing-sm);">
        ${esc(q.explanation)}
      </div>
    </div>
  `).join('');

  return `
    <h2 style="font-size: var(--text-heading); font-weight: 600; color: var(--color-text-primary); margin-bottom: var(--spacing-lg);">
      ${esc(quiz.title)}
    </h2>
    <div class="quiz-questions">
      ${questionsHtml}
    </div>
  `;
}

// ──────────────────────────────────────────────────────────────────────────────
// buildRevisitHtml — locked cards with score banner for returning visitors
// ──────────────────────────────────────────────────────────────────────────────

function buildRevisitHtml(quiz, prior) {
  const dateStr = prior.attemptedAt ? prior.attemptedAt.slice(0, 10) : '';
  const scoreBanner = `
    <div class="quiz-score-banner"
         style="background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 4px; padding: var(--spacing-md); margin-bottom: var(--spacing-lg);">
      <p style="font-size: var(--text-body); color: var(--color-text-primary); margin: 0;">
        Your last attempt: ${esc(String(prior.score))}/${esc(String(prior.total))} correct — ${esc(dateStr)}
      </p>
    </div>
  `;

  const questionsHtml = quiz.questions.map(q => `
    <div class="quiz-question-card"
         data-question-id="${esc(q.id)}"
         data-answered="true"
         style="margin-bottom: var(--spacing-xl); padding: var(--spacing-md); background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 6px;">
      <p class="quiz-stem" style="font-size: var(--text-body); font-weight: 600; color: var(--color-text-primary); margin-bottom: var(--spacing-md);">
        ${esc(q.stem)}
      </p>
      <div class="quiz-answers">
        ${q.answers.map(a => `
          <button class="quiz-answer-btn"
                  data-answer-id="${esc(a.id)}"
                  data-correct="${esc(String(a.correct))}"
                  aria-disabled="true"
                  style="cursor: not-allowed; width: 100%; text-align: left; padding: var(--spacing-sm) var(--spacing-md); border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-bg-secondary); margin-bottom: var(--spacing-xs); display: flex; align-items: center; gap: var(--spacing-sm); pointer-events: none;">
            <span style="flex: 1;">${esc(a.text)}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');

  return `
    ${scoreBanner}
    <h2 style="font-size: var(--text-heading); font-weight: 600; color: var(--color-text-primary); margin-bottom: var(--spacing-lg);">
      ${esc(quiz.title)}
    </h2>
    <div class="quiz-questions">
      ${questionsHtml}
    </div>
  `;
}

// ──────────────────────────────────────────────────────────────────────────────
// attachQuizHandlers — event delegation on section for answer clicks
// ──────────────────────────────────────────────────────────────────────────────

function attachQuizHandlers(section, moduleId, quizId, quiz, lessonId, lessonColumn) {
  const totalQuestions = quiz.questions.length;
  let answeredCount = 0;
  let score = 0;

  section.addEventListener('click', (e) => {
    const clickedBtn = e.target.closest('.quiz-answer-btn');
    if (!clickedBtn) return;

    const questionCard = clickedBtn.closest('.quiz-question-card');
    if (!questionCard || questionCard.dataset.answered === 'true') return;

    // Lock the question
    questionCard.dataset.answered = 'true';

    // Track correctness of this click
    const isCorrect = clickedBtn.dataset.correct === 'true';
    if (isCorrect) score++;

    // Apply visual state to all answer buttons in this question
    const allBtns = questionCard.querySelectorAll('.quiz-answer-btn');
    allBtns.forEach(btn => {
      // Disable pointer events
      btn.style.pointerEvents = 'none';
      btn.style.cursor = 'not-allowed';

      const btnCorrect = btn.dataset.correct === 'true';
      if (btnCorrect) {
        // Green border for the correct answer
        btn.style.borderColor = '#22c55e';
        // Show check-circle icon, hide x-circle
        const checkIcon = btn.querySelector('[data-lucide="check-circle"]');
        const xIcon = btn.querySelector('[data-lucide="x-circle"]');
        if (checkIcon) checkIcon.style.display = '';
        if (xIcon) xIcon.style.display = 'none';
      } else {
        // Red border for wrong answers
        btn.style.borderColor = 'var(--color-destructive)';
        // Show x-circle icon, hide check-circle
        const checkIcon = btn.querySelector('[data-lucide="check-circle"]');
        const xIcon = btn.querySelector('[data-lucide="x-circle"]');
        if (checkIcon) checkIcon.style.display = 'none';
        if (xIcon) xIcon.style.display = '';
      }
    });

    // Show feedback for the clicked answer
    const clickedAnswerId = clickedBtn.dataset.answerId;
    const feedbackDiv = questionCard.querySelector(`.quiz-answer-feedback[data-for-answer="${CSS.escape(clickedAnswerId)}"]`);
    if (feedbackDiv) feedbackDiv.style.display = '';

    // Show the explanation for this question
    const explanationDiv = questionCard.querySelector('.quiz-explanation');
    if (explanationDiv) explanationDiv.style.display = '';

    // Activate icons to render newly visible Lucide icons
    activateIcons();

    answeredCount++;

    if (answeredCount === totalQuestions) {
      // All questions answered — save score
      progressStore.saveQuiz(moduleId, quizId, { score, total: totalQuestions });
      progressStore.markLessonCompleted(moduleId, lessonId);

      // Update sidebar progress bar (dynamic import to break circular dependency)
      import('./sidebar.js').then(m => m.refreshSidebarProgress(moduleId));

      // Render completion banner
      const completionBanner = document.createElement('div');
      completionBanner.className = 'quiz-completion-banner';
      completionBanner.style.cssText = 'padding: var(--spacing-md); margin-top: var(--spacing-lg); text-align: center;';
      const completionP = document.createElement('p');
      completionP.style.cssText = 'font-size: var(--text-body); font-weight: 600; margin: 0;';
      completionP.style.color = score === totalQuestions ? '#22c55e' : 'var(--color-text-muted)';
      completionP.textContent = `Quiz complete — ${score}/${totalQuestions} correct`;
      completionBanner.appendChild(completionP);
      lessonColumn.appendChild(completionBanner);
    }
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// computeModuleProgress — D-07 formula (synchronous)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Compute module completion progress using the D-07 formula.
 * - Lessons with quizId: complete when getQuizScore returns non-null
 * - Lessons without quizId: complete when getLessonProgress().visited is true
 * @param {{ id: string, lessons: Array<{id: string, quizId?: string}> }} mod
 * @returns {{ numerator: number, denominator: number, pct: number, complete: boolean }}
 */
export function computeModuleProgress(mod) {
  let numerator = 0;
  let denominator = 0;

  for (const lesson of mod.lessons) {
    denominator++;
    if (lesson.quizId) {
      // Quiz-backed lesson: counts as complete only when quiz is passed
      const quizScore = progressStore.getQuizScore(mod.id, lesson.quizId);
      if (quizScore !== null) numerator++;
    } else {
      // Quiz-less lesson: counts as complete when visited
      const progress = progressStore.getLessonProgress(mod.id, lesson.id);
      if (progress && progress.visited) numerator++;
    }
  }

  if (denominator === 0) {
    return { numerator: 0, denominator: 0, pct: 0, complete: false };
  }

  const pct = Math.round((numerator / denominator) * 100);
  return { numerator, denominator, pct, complete: pct === 100 };
}
