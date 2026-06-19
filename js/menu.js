import { DOM, state } from './state.js';
import { getScoreHistory, getBestScore } from './storage.js';
import { showCountModal } from './ui.js';
import { shuffleArray, generateDynamicQuiz, buildMixQuiz } from './quiz-data.js';
import { startQuiz, loadQuiz } from './quiz-engine.js';

export function renderScoreDots(id) {
    const hist = getScoreHistory(id);
    if (!hist.length) return '';
    const dots = hist.map(h => {
        const pct = h.score / h.total;
        const cls = pct >= 0.8 ? 'dot-good' : pct >= 0.5 ? 'dot-ok' : 'dot-bad';
        return `<span class="score-dot ${cls}" title="${h.score}/${h.total}"></span>`;
    }).join('');
    return `<div class="score-dots">${dots}</div>`;
}

export function renderMenu(searchQuery = '') {
    DOM.quizList.innerHTML = '';

    if (state.currentMode === 'topics' || state.currentMode === 'memory') {
        DOM.searchInput.parentElement.style.display = 'none';
        const id = `${state.currentMode}/mastery`;
        const card = document.createElement('div');
        card.className = 'quiz-card';
        const subtitle = state.currentMode === 'memory'
            ? `Comprehensive test across all ${state.quizzes.length} weeks!`
            : `All ${state.quizzes.length} weeks in randomized order!`;
        card.innerHTML = `
            <div class="week-badge">Mastery Mode</div>
            <h3>${state.currentMode === 'topics' ? 'Topics Mastery' : 'Memory Verses Mastery'}</h3>
            <p>${subtitle}</p>
            ${renderScoreDots(id)}
        `;
        card.addEventListener('click', () => {
            state.currentFile = null;
            showCountModal(count => {
                const n = count === Infinity ? state.quizzes.length : count;
                const quizData = generateDynamicQuiz(state.currentMode, state.quizzes, n);
                startQuiz(quizData);
            });
        });
        DOM.quizList.appendChild(card);
        return;
    }

    if (state.currentMode === 'mix') {
        DOM.searchInput.parentElement.style.display = 'none';
        const id = 'mix/mastery';
        const card = document.createElement('div');
        card.className = 'quiz-card';
        card.innerHTML = `
            <div class="week-badge">Mix Mode</div>
            <h3>All Weeks Mixed</h3>
            <p>Random questions from every week in one quiz!</p>
            ${renderScoreDots(id)}
        `;
        card.addEventListener('click', () => {
            state.currentFile = null;
            showCountModal(async count => {
                DOM.quizList.innerHTML = '<p style="padding:1rem;color:var(--text-muted)">Loading all questions...</p>';
                const mixData = await buildMixQuiz(count);
                if (mixData) startQuiz(mixData);
                else renderMenu();
            });
        });
        DOM.quizList.appendChild(card);
        return;
    }

    DOM.searchInput.parentElement.style.display = 'block';
    const filtered = state.quizzes.filter(q =>
        `week ${q.week} ${q.topic}`.toLowerCase().includes(searchQuery)
    );

    if (!filtered.length) {
        DOM.quizList.innerHTML = '<div class="no-results">No quizzes found matching your search.</div>';
        return;
    }

    filtered.forEach(quiz => {
        const id = `${state.currentMode}/${quiz.filename}`;
        const best = getBestScore(id);
        const badge = best !== null && best >= 0.8 ? '<span class="completion-badge">✓</span>' : '';
        const card = document.createElement('div');
        card.className = 'quiz-card';
        card.innerHTML = `
            <div class="card-top">
                <div class="week-badge">Week ${quiz.week}</div>
                ${badge}
            </div>
            <h3>${quiz.topic}</h3>
            ${renderScoreDots(id)}
        `;
        card.addEventListener('click', () => loadQuiz(quiz.filename));
        DOM.quizList.appendChild(card);
    });
}

export async function loadQuizzesForMode(mode) {
    DOM.quizList.innerHTML = '<p style="padding:1rem;color:var(--text-muted)">Loading...</p>';

    if (mode === 'topics' || mode === 'memory') {
        try {
            const res = await fetch('topics_memory_data.json');
            if (!res.ok) throw new Error();
            state.quizzes = await res.json();
            renderMenu();
        } catch {
            DOM.quizList.innerHTML = '<p style="padding:1rem">Error loading mastery data.</p>';
        }
        return;
    }

    if (mode === 'mix') {
        state.quizzes = [];
        renderMenu();
        return;
    }

    const indexFile = mode === 'general' ? 'quiz_index.json' : 'bible_quiz_index.json';
    try {
        const res = await fetch(indexFile);
        if (!res.ok) throw new Error();
        state.quizzes = await res.json();
        renderMenu();
    } catch {
        DOM.quizList.innerHTML = '<p style="padding:1rem">Error loading quizzes.</p>';
    }
}
