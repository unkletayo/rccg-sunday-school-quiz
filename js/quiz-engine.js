import { DOM, state } from './state.js';
import { saveProgress, setUrl } from './storage.js';
import { startTimer, stopTimer } from './timer.js';
import { showFeedback, updateLiveScore, showQuizScreen } from './ui.js';
import { showResults } from './results.js';
import { shuffleArray } from './quiz-data.js';

export function startQuiz(quizData) {
    state.currentQuizData = { ...quizData, questions: shuffleArray(quizData.questions) };
    state.currentQuestionIndex = 0;
    state.score = 0;
    state.answeredLog = [];
    setUrl(state.currentMode, state.currentFile);
    saveProgress();
    showQuizScreen();
    updateLiveScore();
    renderQuestion();
}

export async function loadQuiz(filename) {
    state.currentFile = filename;
    const folder = state.currentMode === 'general' ? 'questions/' : 'bible_questions/';
    try {
        const res = await fetch(`${folder}${filename}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        if (data.weeks && data.weeks.length > 0) startQuiz(data.weeks[0]);
    } catch {
        alert('Failed to load quiz data.');
    }
}

export function renderQuestion() {
    state.hasAnsweredCurrent = false;
    stopTimer();
    const q = state.currentQuizData.questions[state.currentQuestionIndex];
    const total = state.currentQuizData.questions.length;

    DOM.questionCounter.textContent = `Question ${state.currentQuestionIndex + 1} of ${total}`;
    DOM.progressBar.style.width = `${(state.currentQuestionIndex / total) * 100}%`;
    DOM.difficultyBadge.textContent = q.difficulty;
    DOM.difficultyBadge.className = `difficulty-badge week-badge ${q.difficulty}`;
    DOM.questionText.innerHTML = q.question.replace(/\n/g, '<br>');
    DOM.optionsContainer.innerHTML = '';
    DOM.feedbackContainer.classList.add('hidden');
    DOM.nextBtn.disabled = true;
    DOM.nextBtn.textContent = (state.currentQuestionIndex === total - 1) ? 'Finish Quiz' : 'Next Question';

    DOM.questionContainer.classList.remove('fade-in');
    void DOM.questionContainer.offsetWidth;
    DOM.questionContainer.classList.add('fade-in');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (q.options && q.options.length > 0) {
        q.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = `<span class="key-hint">${idx + 1}</span><span>${opt}</span>`;
            btn.addEventListener('click', () => handleOptionClick(btn, opt, q));
            DOM.optionsContainer.appendChild(btn);
        });
    } else {
        const input = document.createElement('textarea');
        input.className = 'input-field textarea-field';
        input.placeholder = 'Type your answer here...';
        input.rows = 3;
        const submitBtn = document.createElement('button');
        submitBtn.className = 'btn primary-btn';
        submitBtn.textContent = 'Submit Answer';
        submitBtn.style.alignSelf = 'flex-start';
        submitBtn.addEventListener('click', () => handleFreeTextSubmit(input.value, q, submitBtn));
        DOM.optionsContainer.appendChild(input);
        DOM.optionsContainer.appendChild(submitBtn);
    }

    startTimer(autoTimeout);
}

function autoTimeout() {
    if (state.hasAnsweredCurrent) return;
    state.hasAnsweredCurrent = true;
    const q = state.currentQuizData.questions[state.currentQuestionIndex];
    DOM.optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true;
        const text = btn.querySelector('span:last-child').textContent;
        if (text === q.answer || text.startsWith(q.answer)) btn.classList.add('correct');
    });
    state.answeredLog.push({ question: q.question, userAnswer: '(time up)', correct: q.answer, isCorrect: false, explanation: q.explanation });
    showFeedback(false, `Time's up! ${q.explanation}`);
    updateLiveScore();
    DOM.nextBtn.disabled = false;
}

function handleOptionClick(selectedBtn, selectedText, question) {
    if (state.hasAnsweredCurrent) return;
    state.hasAnsweredCurrent = true;
    stopTimer();

    const isCorrect = selectedText === question.answer || selectedText.startsWith(question.answer);

    DOM.optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true;
        const text = btn.querySelector('span:last-child').textContent;
        if (text === question.answer || text.startsWith(question.answer)) btn.classList.add('correct');
    });

    if (isCorrect) {
        state.score++;
        selectedBtn.classList.add('correct');
    } else {
        selectedBtn.classList.add('wrong');
    }

    state.answeredLog.push({
        question: question.question,
        userAnswer: selectedText,
        correct: question.answer,
        isCorrect,
        explanation: question.explanation,
    });

    showFeedback(isCorrect, question.explanation);
    updateLiveScore();
    DOM.nextBtn.disabled = false;
}

function handleFreeTextSubmit(answer, question, btn) {
    if (state.hasAnsweredCurrent) return;
    state.hasAnsweredCurrent = true;
    stopTimer();
    btn.disabled = true;

    const userAnswer = answer.toLowerCase().trim();
    let isCorrect = false;
    if (question.keywords) {
        let matches = 0;
        question.keywords.forEach(kw => { if (userAnswer.includes(kw.toLowerCase())) matches++; });
        isCorrect = matches >= Math.ceil(question.keywords.length / 2);
    } else if (question.answer) {
        isCorrect = userAnswer === question.answer.toLowerCase().trim();
    }

    if (isCorrect) {
        state.score++;
        showFeedback(true, question.explanation);
    } else {
        showFeedback(false, `Correct answer: ${question.answer}. ${question.explanation}`);
    }

    state.answeredLog.push({ question: question.question, userAnswer: answer, correct: question.answer, isCorrect, explanation: question.explanation });
    updateLiveScore();
    DOM.nextBtn.disabled = false;
}

export function handleNext() {
    state.currentQuestionIndex++;
    saveProgress();
    if (state.currentQuestionIndex < state.currentQuizData.questions.length) {
        renderQuestion();
    } else {
        stopTimer();
        showResults();
    }
}
