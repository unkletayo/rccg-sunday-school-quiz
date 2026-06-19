import { DOM, state } from './state.js';
import { clearProgress, saveScoreHistory, setUrl } from './storage.js';
import { updateBreadcrumb, showToast } from './ui.js';
import { launchConfetti } from './confetti.js';

export function showResults() {
    clearProgress();
    DOM.timerBarContainer.classList.add('hidden');
    setUrl(state.currentMode);

    const id = state.currentFile
        ? `${state.currentMode}/${state.currentFile}`
        : `${state.currentMode}/mastery`;
    saveScoreHistory(id, state.score, state.currentQuizData.questions.length);

    DOM.quizScreen.classList.add('hidden');
    DOM.resultScreen.classList.remove('hidden');
    updateBreadcrumb(false);

    const total = state.currentQuizData.questions.length;
    const percentage = state.score / total;

    DOM.finalScore.innerHTML = `${state.score} <small style="font-size:1rem;font-weight:400;opacity:0.6">/ ${total}</small>`;

    if (percentage === 1) {
        DOM.resultIcon.textContent = '🏆';
        DOM.resultMessage.textContent = "Perfect Score! You mastered this week's lesson!";
        launchConfetti();
    } else if (percentage >= 0.8) {
        DOM.resultIcon.textContent = '🌟';
        DOM.resultMessage.textContent = "Excellent work! Very impressive knowledge.";
    } else if (percentage >= 0.5) {
        DOM.resultIcon.textContent = '👍';
        DOM.resultMessage.textContent = "Good job. A little more review and you'll be an expert.";
    } else {
        DOM.resultIcon.textContent = '📚';
        DOM.resultMessage.textContent = "Keep studying! Review the lesson and try again.";
    }
}

export function showReviewScreen() {
    DOM.resultScreen.classList.add('hidden');
    DOM.reviewScreen.classList.remove('hidden');
    DOM.reviewList.innerHTML = '';

    state.answeredLog.forEach((entry, i) => {
        const div = document.createElement('div');
        div.className = `review-item ${entry.isCorrect ? 'review-correct' : 'review-wrong'}`;
        div.innerHTML = `
            <div class="review-item-header">
                <span class="review-num">Q${i + 1}</span>
                <span class="review-verdict">${entry.isCorrect ? '✓ Correct' : '✗ Incorrect'}</span>
            </div>
            <p class="review-question">${entry.question.replace(/\n/g, '<br>')}</p>
            ${!entry.isCorrect ? `
                <p class="review-your-answer">Your answer: <em>${entry.userAnswer}</em></p>
                <p class="review-correct-answer">Correct: <strong>${entry.correct}</strong></p>
            ` : ''}
            ${entry.explanation ? `<p class="review-explanation">${entry.explanation}</p>` : ''}
        `;
        DOM.reviewList.appendChild(div);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export async function shareResult() {
    const total = state.currentQuizData.questions.length;
    const text = `I scored ${state.score}/${total} on "${state.currentQuizData.topic}" — Sunday School Quiz!`;
    try {
        if (navigator.share) {
            await navigator.share({ title: 'Sunday School Quiz', text });
        } else {
            await navigator.clipboard.writeText(text);
            showToast('Result copied to clipboard!', 3000);
        }
    } catch {}
}
