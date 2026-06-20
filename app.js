import { DOM, state } from './js/state.js';
import { getUrl, setUrl, loadProgress, clearProgress } from './js/storage.js';
import { stopTimer } from './js/timer.js';
import { activateModeTab, showToast, showMenuScreen, showQuizScreen, updateLiveScore, showCountModal, hideCountModal } from './js/ui.js';
import { buildMixQuiz, generateDynamicQuiz } from './js/quiz-data.js';
import { loadQuizzesForMode, renderMenu } from './js/menu.js';
import { startQuiz, loadQuiz, handleNext, renderQuestion } from './js/quiz-engine.js';
import { showReviewScreen, shareResult } from './js/results.js';

DOM.countBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const val = btn.dataset.count;
        const count = val === 'all' ? Infinity : parseInt(val, 10);
        const cb = state.pendingQuizCallback;
        hideCountModal();
        if (cb) cb(count);
    });
});

DOM.countCancel.addEventListener('click', hideCountModal);
DOM.countModal.addEventListener('click', (e) => {
    if (e.target === DOM.countModal) hideCountModal();
});

DOM.resumeDismiss.addEventListener('click', () => {
    DOM.resumeToast.classList.add('hidden');
    clearTimeout(state.toastTimer);
});

document.addEventListener('keydown', (e) => {
    if (DOM.quizScreen.classList.contains('hidden')) return;
    const options = DOM.optionsContainer.querySelectorAll('.option-btn');
    if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key, 10) - 1;
        if (options[idx] && !options[idx].disabled) options[idx].click();
    }
    if ((e.key === 'Enter' || e.key === ' ') && !DOM.nextBtn.disabled) {
        e.preventDefault();
        DOM.nextBtn.click();
    }
});

function returnToMenu() {
    clearProgress();
    stopTimer();
    setUrl(state.currentMode);
    state.currentFile = null;
    showMenuScreen();
    loadQuizzesForMode(state.currentMode);
}

async function init() {
    DOM.timerToggle.addEventListener('click', () => {
        state.timerEnabled = !state.timerEnabled;
        DOM.timerToggle.textContent = `⏱ Timer: ${state.timerEnabled ? 'On' : 'Off'}`;
        DOM.timerToggle.classList.toggle('active', state.timerEnabled);
    });

    DOM.modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = e.target.dataset.mode;
            state.currentMode = mode;
            state.currentFile = null;
            DOM.searchInput.value = '';
            activateModeTab(mode);
            setUrl(mode);
            loadQuizzesForMode(mode);
            showMenuScreen();
        });
    });

    DOM.searchInput.addEventListener('input', (e) => {
        renderMenu(e.target.value.toLowerCase());
    });

    document.getElementById('logo-home').addEventListener('click', returnToMenu);
    DOM.breadcrumbHome.addEventListener('click', returnToMenu);
    DOM.breadcrumbMode.addEventListener('click', returnToMenu);

    DOM.reviewBtn.addEventListener('click', showReviewScreen);
    DOM.reviewBackBtn.addEventListener('click', () => {
        DOM.reviewScreen.classList.add('hidden');
        DOM.resultScreen.classList.remove('hidden');
    });
    DOM.shareBtn.addEventListener('click', shareResult);

    const { mode, file } = getUrl();
    if (mode) {
        state.currentMode = mode;
        activateModeTab(mode);
    } else {
        setUrl(state.currentMode);
    }

    await loadQuizzesForMode(state.currentMode);

    if (file) {
        state.currentFile = file;
        const saved = loadProgress(`${state.currentMode}/${file}`);
        if (saved && saved.questionIndex > 0) {
            state.currentQuizData = saved.quizData;
            state.currentQuestionIndex = saved.questionIndex;
            state.score = saved.score;
            state.answeredLog = saved.answeredLog || [];
            showQuizScreen();
            updateLiveScore();
            renderQuestion();
            showToast(`Resuming from question ${state.currentQuestionIndex + 1}`);
        } else {
            await loadQuiz(file);
        }
    } else if (state.currentMode === 'topics' || state.currentMode === 'memory' || state.currentMode === 'mix') {
        const saved = loadProgress(`${state.currentMode}/mastery`);
        if (saved && saved.questionIndex > 0) {
            state.currentFile = null;
            state.currentQuizData = saved.quizData;
            state.currentQuestionIndex = saved.questionIndex;
            state.score = saved.score;
            state.answeredLog = saved.answeredLog || [];
            showQuizScreen();
            updateLiveScore();
            renderQuestion();
            showToast(`Resuming from question ${state.currentQuestionIndex + 1}`);
        }
    }
}

DOM.tryAgainBtn.addEventListener('click', () => {
    if (state.currentFile) {
        loadQuiz(state.currentFile);
    } else if (state.currentMode === 'mix') {
        showCountModal(async count => {
            const mixData = await buildMixQuiz(count);
            if (mixData) startQuiz(mixData);
        });
    } else {
        showCountModal(count => {
            const n = count === Infinity ? state.quizzes.length : count;
            const quizData = generateDynamicQuiz(state.currentMode, state.quizzes, n);
            startQuiz(quizData);
        });
    }
});

DOM.nextBtn.addEventListener('click', handleNext);
DOM.returnHomeBtn.addEventListener('click', returnToMenu);

init();
