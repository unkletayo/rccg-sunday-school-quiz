import { DOM, state, TIMER_SECONDS } from './state.js';

export function startTimer(onExpire) {
    if (!state.timerEnabled) return;
    stopTimer();
    state.timerRemaining = TIMER_SECONDS;
    DOM.timerBarContainer.classList.remove('hidden');
    updateTimerDisplay();
    state.timerInterval = setInterval(() => {
        state.timerRemaining--;
        updateTimerDisplay();
        if (state.timerRemaining <= 0) {
            stopTimer();
            onExpire();
        }
    }, 1000);
}

export function stopTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
}

export function updateTimerDisplay() {
    const pct = (state.timerRemaining / TIMER_SECONDS) * 100;
    DOM.timerBar.style.width = pct + '%';
    DOM.timerBar.classList.toggle('timer-warning', state.timerRemaining <= 10);
    DOM.timerCount.textContent = state.timerRemaining;
}
