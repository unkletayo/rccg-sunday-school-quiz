import { state, SCORES_KEY, SESSION_KEY } from './state.js';

export function getScoreHistory(id) {
    try {
        const all = JSON.parse(localStorage.getItem(SCORES_KEY) || '{}');
        return all[id] || [];
    } catch { return []; }
}

export function saveScoreHistory(id, s, total) {
    try {
        const all = JSON.parse(localStorage.getItem(SCORES_KEY) || '{}');
        const hist = all[id] || [];
        hist.unshift({ score: s, total, ts: Date.now() });
        all[id] = hist.slice(0, 3);
        localStorage.setItem(SCORES_KEY, JSON.stringify(all));
    } catch {}
}

export function getBestScore(id) {
    const hist = getScoreHistory(id);
    if (!hist.length) return null;
    return Math.max(...hist.map(h => h.score / h.total));
}

export function setUrl(mode, file = null) {
    const params = new URLSearchParams({ mode });
    if (file) params.set('file', file);
    history.replaceState(null, '', '#' + params.toString());
}

export function getUrl() {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    return { mode: params.get('mode'), file: params.get('file') };
}

function sessionId() {
    return state.currentFile
        ? `${state.currentMode}/${state.currentFile}`
        : `${state.currentMode}/mastery`;
}

export function saveProgress() {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
        id: sessionId(),
        questionIndex: state.currentQuestionIndex,
        score: state.score,
        quizData: state.currentQuizData,
        answeredLog: state.answeredLog,
    }));
}

export function loadProgress(id) {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const saved = JSON.parse(raw);
        return saved.id === id ? saved : null;
    } catch { return null; }
}

export function clearProgress() {
    localStorage.removeItem(SESSION_KEY);
}
