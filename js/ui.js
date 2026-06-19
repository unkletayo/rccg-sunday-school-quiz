import { DOM, state, MODE_LABELS } from './state.js';
import { stopTimer } from './timer.js';

export function updateBreadcrumb(showQuiz = false) {
    const label = MODE_LABELS[state.currentMode] || state.currentMode;
    DOM.breadcrumbMode.textContent = label;
    if (showQuiz && state.currentQuizData) {
        const title = state.currentQuizData.week_number === 'Mastery'
            ? `${state.currentQuizData.topic} Mastery`
            : `Week ${state.currentQuizData.week_number}`;
        DOM.breadcrumbQuiz.textContent = title;
        DOM.breadcrumbQuizSep.style.display = '';
    } else {
        DOM.breadcrumbQuiz.textContent = '';
        DOM.breadcrumbQuizSep.style.display = 'none';
    }
    DOM.breadcrumb.classList.remove('hidden');
}

export function hideBreadcrumb() {
    DOM.breadcrumb.classList.add('hidden');
}

export function activateModeTab(mode) {
    DOM.modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
}

export function showToast(text, duration = 4000) {
    DOM.resumeToastText.textContent = text;
    DOM.resumeToast.classList.remove('hidden');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => DOM.resumeToast.classList.add('hidden'), duration);
}

export function updateLiveScore() {
    DOM.liveScore.textContent = `${state.score} correct`;
}

export function showQuizScreen() {
    const title = state.currentQuizData.week_number === 'Mastery'
        ? `${state.currentQuizData.topic} Mastery Quiz`
        : `Week ${state.currentQuizData.week_number}: ${state.currentQuizData.topic}`;
    DOM.quizTitle.textContent = title;
    DOM.menuScreen.classList.add('hidden');
    DOM.resultScreen.classList.add('hidden');
    DOM.reviewScreen.classList.add('hidden');
    DOM.quizScreen.classList.remove('hidden');
    updateBreadcrumb(true);
}

export function showMenuScreen() {
    stopTimer();
    DOM.quizScreen.classList.add('hidden');
    DOM.resultScreen.classList.add('hidden');
    DOM.reviewScreen.classList.add('hidden');
    DOM.menuScreen.classList.remove('hidden');
    DOM.timerBarContainer.classList.add('hidden');
    hideBreadcrumb();
}

export function showFeedback(isCorrect, explanation) {
    DOM.feedbackContainer.className = `feedback-panel ${isCorrect ? 'correct' : 'wrong'}`;
    DOM.feedbackTitle.textContent = isCorrect ? '✓ Correct!' : '✗ Incorrect';
    DOM.feedbackExplanation.textContent = explanation;
    DOM.feedbackContainer.classList.remove('hidden');
}

export function showCountModal(callback) {
    state.pendingQuizCallback = callback;
    DOM.countModal.classList.remove('hidden');
}

export function hideCountModal() {
    DOM.countModal.classList.add('hidden');
    state.pendingQuizCallback = null;
}
