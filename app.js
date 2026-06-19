document.addEventListener('DOMContentLoaded', () => {
    const DOM = {
        menuScreen: document.getElementById('menu-screen'),
        quizScreen: document.getElementById('quiz-screen'),
        resultScreen: document.getElementById('result-screen'),
        quizList: document.getElementById('quiz-list'),
        breadcrumb: document.getElementById('breadcrumb'),
        breadcrumbHome: document.getElementById('breadcrumb-home'),
        breadcrumbMode: document.getElementById('breadcrumb-mode'),
        breadcrumbQuizSep: document.getElementById('breadcrumb-quiz-sep'),
        breadcrumbQuiz: document.getElementById('breadcrumb-quiz'),
        quizTitle: document.getElementById('quiz-title'),
        progressBar: document.getElementById('progress-bar'),
        questionCounter: document.getElementById('question-counter'),
        liveScore: document.getElementById('live-score'),
        difficultyBadge: document.getElementById('difficulty-badge'),
        questionContainer: document.getElementById('question-container'),
        questionText: document.getElementById('question-text'),
        optionsContainer: document.getElementById('options-container'),
        feedbackContainer: document.getElementById('feedback-container'),
        feedbackTitle: document.getElementById('feedback-title'),
        feedbackExplanation: document.getElementById('feedback-explanation'),
        nextBtn: document.getElementById('next-btn'),
        finalScore: document.getElementById('final-score'),
        resultIcon: document.getElementById('result-icon'),
        resultMessage: document.getElementById('result-message'),
        returnHomeBtn: document.getElementById('return-home-btn'),
        tryAgainBtn: document.getElementById('try-again-btn'),
        modeBtns: document.querySelectorAll('.mode-btn'),
        searchInput: document.getElementById('search-input'),
        resumeToast: document.getElementById('resume-toast'),
        resumeToastText: document.getElementById('resume-toast-text'),
        resumeDismiss: document.getElementById('resume-dismiss'),
    };

    let quizzes = [];
    let currentQuizData = null;
    let currentQuestionIndex = 0;
    let score = 0;
    let hasAnsweredCurrent = false;
    let currentMode = 'general';
    let currentFile = null;

    const MODE_LABELS = {
        general: 'General Quiz',
        bible: 'Bible Mastery',
        topics: 'Topics Mastery',
        memory: 'Memory Verses',
    };

    // --- URL helpers ---
    function setUrl(mode, file = null) {
        const params = new URLSearchParams({ mode });
        if (file) params.set('file', file);
        history.replaceState(null, '', '#' + params.toString());
    }

    function getUrl() {
        const hash = window.location.hash.slice(1);
        const params = new URLSearchParams(hash);
        return { mode: params.get('mode'), file: params.get('file') };
    }

    // --- localStorage progress ---
    const SESSION_KEY = 'quiz_progress';

    function sessionId() {
        return currentFile ? `${currentMode}/${currentFile}` : `${currentMode}/mastery`;
    }

    function saveProgress() {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
            id: sessionId(),
            questionIndex: currentQuestionIndex,
            score,
            quizData: currentQuizData,
        }));
    }

    function loadProgress(id) {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (!raw) return null;
            const saved = JSON.parse(raw);
            return saved.id === id ? saved : null;
        } catch {
            return null;
        }
    }

    function clearProgress() {
        localStorage.removeItem(SESSION_KEY);
    }

    // --- Breadcrumb ---
    function updateBreadcrumb(showQuiz = false) {
        const label = MODE_LABELS[currentMode] || currentMode;
        DOM.breadcrumbMode.textContent = label;

        if (showQuiz && currentQuizData) {
            const title = currentQuizData.week_number === 'Mastery'
                ? `${currentQuizData.topic} Mastery`
                : `Week ${currentQuizData.week_number}`;
            DOM.breadcrumbQuiz.textContent = title;
            DOM.breadcrumbQuizSep.style.display = '';
        } else {
            DOM.breadcrumbQuiz.textContent = '';
            DOM.breadcrumbQuizSep.style.display = 'none';
        }

        DOM.breadcrumb.classList.remove('hidden');
    }

    function hideBreadcrumb() {
        DOM.breadcrumb.classList.add('hidden');
    }

    // --- Mode tab ---
    function activateModeTab(mode) {
        DOM.modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    }

    // --- Resume toast ---
    let toastTimer = null;

    function showResumeToast(questionIndex) {
        DOM.resumeToastText.textContent = `Resuming from question ${questionIndex + 1}`;
        DOM.resumeToast.classList.remove('hidden');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => DOM.resumeToast.classList.add('hidden'), 4000);
    }

    DOM.resumeDismiss.addEventListener('click', () => {
        DOM.resumeToast.classList.add('hidden');
        clearTimeout(toastTimer);
    });

    // --- Live score ---
    function updateLiveScore() {
        DOM.liveScore.textContent = `${score} correct`;
    }

    // --- Show quiz screen ---
    function showQuizScreen() {
        const title = currentQuizData.week_number === 'Mastery'
            ? `${currentQuizData.topic} Mastery Quiz`
            : `Week ${currentQuizData.week_number}: ${currentQuizData.topic}`;
        DOM.quizTitle.textContent = title;
        DOM.menuScreen.classList.add('hidden');
        DOM.resultScreen.classList.add('hidden');
        DOM.quizScreen.classList.remove('hidden');
        updateBreadcrumb(true);
    }

    // --- Keyboard navigation ---
    document.addEventListener('keydown', (e) => {
        if (DOM.quizScreen.classList.contains('hidden')) return;

        const options = DOM.optionsContainer.querySelectorAll('.option-btn');
        if (e.key >= '1' && e.key <= '4') {
            const idx = parseInt(e.key, 10) - 1;
            if (options[idx] && !options[idx].disabled) {
                options[idx].click();
            }
        }
        if ((e.key === 'Enter' || e.key === ' ') && !DOM.nextBtn.disabled) {
            e.preventDefault();
            DOM.nextBtn.click();
        }
    });

    // --- Init ---
    async function init() {
        DOM.modeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                currentMode = mode;
                currentFile = null;
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

        const { mode, file } = getUrl();
        if (mode) {
            currentMode = mode;
            activateModeTab(mode);
        } else {
            setUrl(currentMode);
        }

        await loadQuizzesForMode(currentMode);

        if (file) {
            currentFile = file;
            const saved = loadProgress(`${currentMode}/${file}`);
            if (saved && saved.questionIndex > 0) {
                currentQuizData = saved.quizData;
                currentQuestionIndex = saved.questionIndex;
                score = saved.score;
                showQuizScreen();
                updateLiveScore();
                renderQuestion();
                showResumeToast(currentQuestionIndex);
            } else {
                await loadQuiz(file);
            }
        } else if (currentMode === 'topics' || currentMode === 'memory') {
            const saved = loadProgress(`${currentMode}/mastery`);
            if (saved && saved.questionIndex > 0) {
                currentFile = null;
                currentQuizData = saved.quizData;
                currentQuestionIndex = saved.questionIndex;
                score = saved.score;
                showQuizScreen();
                updateLiveScore();
                renderQuestion();
                showResumeToast(currentQuestionIndex);
            }
        }
    }

    function showMenuScreen() {
        DOM.quizScreen.classList.add('hidden');
        DOM.resultScreen.classList.add('hidden');
        DOM.menuScreen.classList.remove('hidden');
        hideBreadcrumb();
    }

    async function loadQuizzesForMode(mode) {
        DOM.quizList.innerHTML = '<p style="padding:1rem;color:var(--text-muted)">Loading quizzes...</p>';

        if (mode === 'topics' || mode === 'memory') {
            try {
                const response = await fetch('topics_memory_data.json');
                if (!response.ok) throw new Error('Data not found');
                quizzes = await response.json();
                renderMenu();
            } catch (error) {
                console.error(error);
                DOM.quizList.innerHTML = '<p style="padding:1rem">Error loading mastery data.</p>';
            }
            return;
        }

        const indexFile = mode === 'general' ? 'quiz_index.json' : 'bible_quiz_index.json';
        try {
            const response = await fetch(indexFile);
            if (!response.ok) throw new Error('Index file not found');
            quizzes = await response.json();
            renderMenu();
        } catch (error) {
            console.error('Failed to load quiz index:', error);
            DOM.quizList.innerHTML = '<p style="padding:1rem">Error loading quizzes.</p>';
        }
    }

    function renderMenu(searchQuery = '') {
        DOM.quizList.innerHTML = '';

        if (currentMode === 'topics' || currentMode === 'memory') {
            DOM.searchInput.parentElement.style.display = 'none';
            const card = document.createElement('div');
            card.className = 'quiz-card';

            const count = quizzes.length;
            const subtitle = currentMode === 'memory'
                ? `Comprehensive test across all ${quizzes.length} weeks!`
                : `All ${quizzes.length} weeks in randomized order!`;

            card.innerHTML = `
                <div class="week-badge">Mastery Mode</div>
                <h3>${currentMode === 'topics' ? 'Topics Mastery' : 'Memory Verses Mastery'}</h3>
                <p>${subtitle}</p>
            `;
            card.addEventListener('click', () => {
                currentFile = null;
                const quizData = generateDynamicQuiz(currentMode, quizzes, count);
                startQuiz(quizData);
            });
            DOM.quizList.appendChild(card);
            return;
        }

        DOM.searchInput.parentElement.style.display = 'block';
        const filtered = quizzes.filter(q =>
            `week ${q.week} ${q.topic}`.toLowerCase().includes(searchQuery)
        );

        if (filtered.length === 0) {
            DOM.quizList.innerHTML = '<div class="no-results">No quizzes found matching your search.</div>';
            return;
        }

        filtered.forEach(quiz => {
            const card = document.createElement('div');
            card.className = 'quiz-card';
            card.innerHTML = `
                <div class="week-badge">Week ${quiz.week}</div>
                <h3>${quiz.topic}</h3>
            `;
            card.addEventListener('click', () => loadQuiz(quiz.filename));
            DOM.quizList.appendChild(card);
        });
    }

    function shuffleArray(array) {
        return array.slice().sort(() => Math.random() - 0.5);
    }

    function generateSimilarReferences(correctRef) {
        const match = correctRef.match(/^(?:(\d)\s+)?([A-Za-z]+)\s+(\d+):(\d+)/);
        if (!match) return [];

        const hasNum = match[1];
        const bookStr = match[2];
        const chap = parseInt(match[3], 10);
        const verse = parseInt(match[4], 10);
        const extra = correctRef.substring(match[0].length);
        const prefix = hasNum ? hasNum + ' ' : '';
        const d = new Set();

        d.add(`${prefix}${bookStr} ${chap + 1}:${verse}${extra}`);
        if (chap > 1) d.add(`${prefix}${bookStr} ${chap - 1}:${verse}${extra}`);
        if (chap > 2) d.add(`${prefix}${bookStr} ${chap - 2}:${verse}${extra}`);
        d.add(`${prefix}${bookStr} ${chap}:${verse + 1}${extra}`);
        if (verse > 1) d.add(`${prefix}${bookStr} ${chap}:${verse - 1}${extra}`);
        if (verse > 2) d.add(`${prefix}${bookStr} ${chap}:${verse - 2}${extra}`);

        if (hasNum) {
            const a1 = hasNum === '1' ? '2' : (hasNum === '2' ? '3' : '1');
            const a2 = hasNum === '1' ? '3' : (hasNum === '2' ? '1' : '2');
            d.add(`${a1} ${bookStr} ${chap}:${verse}${extra}`);
            d.add(`${a2} ${bookStr} ${chap}:${verse}${extra}`);
        }

        return shuffleArray(Array.from(d).filter(r => r !== correctRef));
    }

    function generateDynamicQuiz(mode, data, count) {
        const questions = [];
        const clean = mode === 'memory'
            ? data.filter(d => d.memory_verse_text && d.memory_verse_ref &&
                !d.memory_verse_text.toLowerCase().includes('unknown') &&
                !d.memory_verse_ref.toLowerCase().includes('unknown'))
            : data;
        const selected = shuffleArray(clean).slice(0, Math.min(count, clean.length));

        selected.forEach(weekData => {
            let options = [], questionText = '', answer = '', explanation = '';

            if (mode === 'topics') {
                const type = Math.random() > 0.5 ? 'topic_to_week' : 'week_to_topic';
                if (type === 'topic_to_week') {
                    questionText = `Which week has the topic: "${weekData.topic}"?`;
                    answer = `Week ${weekData.week}`;
                    explanation = `Week ${weekData.week} focuses on "${weekData.topic}".`;
                    const d = shuffleArray(data).filter(x => x.week !== weekData.week).slice(0, 3);
                    options = shuffleArray([answer, ...d.map(x => `Week ${x.week}`)]);
                } else {
                    questionText = `What is the topic for Week ${weekData.week}?`;
                    answer = weekData.topic;
                    explanation = `The topic for Week ${weekData.week} is "${weekData.topic}".`;
                    const d = shuffleArray(data).filter(x => x.topic !== weekData.topic).slice(0, 3);
                    options = shuffleArray([answer, ...d.map(x => x.topic)]);
                }
                questions.push({ question: questionText, answer, options, difficulty: 'Medium', explanation });
            } else if (mode === 'memory') {
                const types = ['ref_to_text', 'text_to_ref', 'week_to_ref'];
                const type = types[Math.floor(Math.random() * types.length)];

                if (type === 'ref_to_text') {
                    questionText = `Which of these is the memory verse for ${weekData.memory_verse_ref}?`;
                    answer = weekData.memory_verse_text;
                    explanation = `Week ${weekData.week} — ${weekData.memory_verse_ref}: "${weekData.memory_verse_text}"`;
                    const d = shuffleArray(clean).filter(x => x.memory_verse_text !== weekData.memory_verse_text).slice(0, 3);
                    options = shuffleArray([answer, ...d.map(x => x.memory_verse_text)]);
                } else if (type === 'text_to_ref') {
                    questionText = `Which reference matches: "${weekData.memory_verse_text}"?`;
                    answer = weekData.memory_verse_ref;
                    explanation = `Week ${weekData.week} memory verse is ${weekData.memory_verse_ref}.`;
                    let refs = generateSimilarReferences(weekData.memory_verse_ref);
                    if (refs.length < 3) refs = refs.concat(shuffleArray(clean).filter(x => x.memory_verse_ref !== weekData.memory_verse_ref).map(x => x.memory_verse_ref));
                    options = shuffleArray([answer, ...refs.slice(0, 3)]);
                } else {
                    questionText = `What is the memory verse reference for Week ${weekData.week}?`;
                    answer = weekData.memory_verse_ref;
                    explanation = `Week ${weekData.week} memory verse is ${weekData.memory_verse_ref}.`;
                    let refs = generateSimilarReferences(weekData.memory_verse_ref);
                    if (refs.length < 3) refs = refs.concat(shuffleArray(clean).filter(x => x.memory_verse_ref !== weekData.memory_verse_ref).map(x => x.memory_verse_ref));
                    options = shuffleArray([answer, ...refs.slice(0, 3)]);
                }
                questions.push({ question: questionText, answer, options, difficulty: 'Hard', explanation });
            }
        });

        return {
            week_number: 'Mastery',
            topic: mode === 'topics' ? 'Topics' : 'Memory Verses',
            questions,
        };
    }

    async function loadQuiz(filename) {
        currentFile = filename;
        const folder = currentMode === 'general' ? 'questions/' : 'bible_questions/';
        try {
            const response = await fetch(`${folder}${filename}`);
            if (!response.ok) throw new Error('Not found');
            const data = await response.json();
            if (data.weeks && data.weeks.length > 0) {
                startQuiz(data.weeks[0]);
            }
        } catch (error) {
            console.error('Failed to load quiz:', error);
            alert('Failed to load quiz data.');
        }
    }

    function startQuiz(quizData) {
        currentQuizData = { ...quizData, questions: shuffleArray(quizData.questions) };
        currentQuestionIndex = 0;
        score = 0;
        setUrl(currentMode, currentFile);
        saveProgress();
        showQuizScreen();
        updateLiveScore();
        renderQuestion();
    }

    function renderQuestion() {
        hasAnsweredCurrent = false;
        const q = currentQuizData.questions[currentQuestionIndex];
        const total = currentQuizData.questions.length;

        DOM.questionCounter.textContent = `Question ${currentQuestionIndex + 1} of ${total}`;
        DOM.progressBar.style.width = `${(currentQuestionIndex / total) * 100}%`;
        DOM.difficultyBadge.textContent = q.difficulty;
        DOM.difficultyBadge.className = `difficulty-badge week-badge ${q.difficulty}`;
        DOM.questionText.innerHTML = q.question.replace(/\n/g, '<br>');
        DOM.optionsContainer.innerHTML = '';
        DOM.feedbackContainer.classList.add('hidden');
        DOM.nextBtn.disabled = true;
        DOM.nextBtn.textContent = (currentQuestionIndex === total - 1) ? 'Finish Quiz' : 'Next Question';

        // Fade animation
        DOM.questionContainer.classList.remove('fade-in');
        void DOM.questionContainer.offsetWidth;
        DOM.questionContainer.classList.add('fade-in');

        // Scroll to top on mobile
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
    }

    function handleOptionClick(selectedBtn, selectedText, question) {
        if (hasAnsweredCurrent) return;
        hasAnsweredCurrent = true;

        const isCorrect = selectedText === question.answer || selectedText.startsWith(question.answer);

        DOM.optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
            btn.disabled = true;
            const text = btn.querySelector('span:last-child').textContent;
            if (text === question.answer || text.startsWith(question.answer)) {
                btn.classList.add('correct');
            }
        });

        if (isCorrect) {
            score++;
            selectedBtn.classList.add('correct');
            showFeedback(true, question.explanation);
        } else {
            selectedBtn.classList.add('wrong');
            showFeedback(false, question.explanation);
        }

        updateLiveScore();
        DOM.nextBtn.disabled = false;
    }

    function handleFreeTextSubmit(answer, question, btn) {
        if (hasAnsweredCurrent) return;
        hasAnsweredCurrent = true;
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
            score++;
            showFeedback(true, question.explanation);
        } else {
            showFeedback(false, `Correct answer: ${question.answer}. ${question.explanation}`);
        }

        updateLiveScore();
        DOM.nextBtn.disabled = false;
    }

    function showFeedback(isCorrect, explanation) {
        DOM.feedbackContainer.className = `feedback-panel ${isCorrect ? 'correct' : 'wrong'}`;
        DOM.feedbackTitle.textContent = isCorrect ? '✓ Correct!' : '✗ Incorrect';
        DOM.feedbackExplanation.textContent = explanation;
        DOM.feedbackContainer.classList.remove('hidden');
    }

    function handleNext() {
        currentQuestionIndex++;
        saveProgress();
        if (currentQuestionIndex < currentQuizData.questions.length) {
            renderQuestion();
        } else {
            showResults();
        }
    }

    function showResults() {
        clearProgress();
        setUrl(currentMode);

        DOM.quizScreen.classList.add('hidden');
        DOM.resultScreen.classList.remove('hidden');
        updateBreadcrumb(false);

        const total = currentQuizData.questions.length;
        const percentage = score / total;

        DOM.finalScore.innerHTML = `${score} <small style="font-size:1rem;font-weight:400;opacity:0.6">/ ${total}</small>`;

        if (percentage === 1) {
            DOM.resultIcon.textContent = '🏆';
            DOM.resultMessage.textContent = "Perfect Score! You mastered this week's lesson!";
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

    function returnToMenu() {
        clearProgress();
        setUrl(currentMode);
        currentFile = null;
        showMenuScreen();
    }

    // Try Again — restart same quiz from scratch
    DOM.tryAgainBtn.addEventListener('click', () => {
        if (currentFile) {
            loadQuiz(currentFile);
        } else {
            // Mastery: regenerate
            const count = quizzes.length;
            const quizData = generateDynamicQuiz(currentMode, quizzes, count);
            startQuiz(quizData);
        }
    });

    DOM.nextBtn.addEventListener('click', handleNext);
    DOM.returnHomeBtn.addEventListener('click', returnToMenu);

    init();
});
