document.addEventListener('DOMContentLoaded', () => {
    const DOM = {
        menuScreen: document.getElementById('menu-screen'),
        quizScreen: document.getElementById('quiz-screen'),
        resultScreen: document.getElementById('result-screen'),
        quizList: document.getElementById('quiz-list'),
        backToMenuBtn: document.getElementById('back-to-menu-btn'),
        quizTitle: document.getElementById('quiz-title'),
        progressBar: document.getElementById('progress-bar'),
        questionCounter: document.getElementById('question-counter'),
        difficultyBadge: document.getElementById('difficulty-badge'),
        questionText: document.getElementById('question-text'),
        optionsContainer: document.getElementById('options-container'),
        feedbackContainer: document.getElementById('feedback-container'),
        feedbackTitle: document.getElementById('feedback-title'),
        feedbackExplanation: document.getElementById('feedback-explanation'),
        nextBtn: document.getElementById('next-btn'),
        finalScore: document.getElementById('final-score'),
        resultMessage: document.getElementById('result-message'),
        returnHomeBtn: document.getElementById('return-home-btn'),
        modeBtns: document.querySelectorAll('.mode-btn'),
        searchInput: document.getElementById('search-input')
    };

    let quizzes = [];
    let currentQuizData = null;
    let currentQuestionIndex = 0;
    let score = 0;
    let hasAnsweredCurrent = false;
    let currentMode = 'general';
    let currentFile = null;

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

    // --- Session helpers ---
    const SESSION_KEY = 'quiz_progress';

    function sessionId() {
        return currentFile ? `${currentMode}/${currentFile}` : `${currentMode}/mastery`;
    }

    function saveProgress() {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
            id: sessionId(),
            questionIndex: currentQuestionIndex,
            score,
            quizData: currentQuizData
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

    // --- Mode tab ---
    function activateModeTab(mode) {
        DOM.modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    }

    // --- Show quiz screen ---
    function showQuizScreen() {
        DOM.quizTitle.textContent = currentQuizData.week_number === 'Mastery'
            ? `${currentQuizData.topic} Mastery Quiz`
            : `Week ${currentQuizData.week_number}: ${currentQuizData.topic}`;
        DOM.menuScreen.classList.add('hidden');
        DOM.resultScreen.classList.add('hidden');
        DOM.quizScreen.classList.remove('hidden');
        DOM.backToMenuBtn.classList.remove('hidden');
    }

    // Initialize App
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
            });
        });

        DOM.searchInput.addEventListener('input', (e) => {
            renderMenu(e.target.value.toLowerCase());
        });

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
            if (saved) {
                currentQuizData = saved.quizData;
                currentQuestionIndex = saved.questionIndex;
                score = saved.score;
                showQuizScreen();
                renderQuestion();
            } else {
                await loadQuiz(file);
            }
        } else if (currentMode === 'topics' || currentMode === 'memory') {
            const saved = loadProgress(`${currentMode}/mastery`);
            if (saved) {
                currentFile = null;
                currentQuizData = saved.quizData;
                currentQuestionIndex = saved.questionIndex;
                score = saved.score;
                showQuizScreen();
                renderQuestion();
            }
        }
    }

    async function loadQuizzesForMode(mode) {
        DOM.quizList.innerHTML = '<p>Loading quizzes...</p>';

        if (mode === 'topics' || mode === 'memory') {
            try {
                const response = await fetch('topics_memory_data.json');
                if (!response.ok) throw new Error("Data not found");
                quizzes = await response.json();
                renderMenu();
            } catch (error) {
                console.error(error);
                DOM.quizList.innerHTML = '<p>Error loading mastery data. Please run the extraction script.</p>';
            }
            return;
        }

        const indexFile = mode === 'general' ? 'quiz_index.json' : 'bible_quiz_index.json';
        try {
            const response = await fetch(indexFile);
            if (!response.ok) throw new Error("Index file not found");
            quizzes = await response.json();
            renderMenu();
        } catch (error) {
            console.error('Failed to load quiz index:', error);
            DOM.quizList.innerHTML = '<p>Error loading quizzes.</p>';
        }
    }

    function renderMenu(searchQuery = '') {
        DOM.quizList.innerHTML = '';

        if (currentMode === 'topics' || currentMode === 'memory') {
            DOM.searchInput.parentElement.style.display = 'none';
            const card = document.createElement('div');
            card.className = 'quiz-card';

            const count = currentMode === 'memory' ? quizzes.length : 10;
            const subtitle = currentMode === 'memory'
                ? `Comprehensive test across all ${quizzes.length} weeks!`
                : `10 Random Questions drawn from all ${quizzes.length} weeks!`;

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
        const filteredQuizzes = quizzes.filter(quiz => {
            return `week ${quiz.week} ${quiz.topic}`.toLowerCase().includes(searchQuery);
        });

        if (filteredQuizzes.length === 0) {
            DOM.quizList.innerHTML = '<div class="no-results">No quizzes found matching your search.</div>';
            return;
        }

        filteredQuizzes.forEach(quiz => {
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

        const distractors = new Set();
        const prefix = hasNum ? hasNum + ' ' : '';

        distractors.add(`${prefix}${bookStr} ${chap + 1}:${verse}${extra}`);
        if (chap > 1) distractors.add(`${prefix}${bookStr} ${chap - 1}:${verse}${extra}`);
        if (chap > 2) distractors.add(`${prefix}${bookStr} ${chap - 2}:${verse}${extra}`);

        distractors.add(`${prefix}${bookStr} ${chap}:${verse + 1}${extra}`);
        if (verse > 1) distractors.add(`${prefix}${bookStr} ${chap}:${verse - 1}${extra}`);
        if (verse > 2) distractors.add(`${prefix}${bookStr} ${chap}:${verse - 2}${extra}`);

        if (hasNum) {
            const altNum = hasNum === '1' ? '2' : (hasNum === '2' ? '3' : '1');
            distractors.add(`${altNum} ${bookStr} ${chap}:${verse}${extra}`);
            const altNum2 = hasNum === '1' ? '3' : (hasNum === '2' ? '1' : '2');
            distractors.add(`${altNum2} ${bookStr} ${chap}:${verse}${extra}`);
        }

        return shuffleArray(Array.from(distractors).filter(r => r !== correctRef));
    }

    function generateDynamicQuiz(mode, data, count) {
        const questions = [];
        const numQuestions = Math.min(count, data.length);
        const selectedWeeks = shuffleArray(data).slice(0, numQuestions);

        selectedWeeks.forEach(weekData => {
            let options = [], questionText = '', answer = '', explanation = '';

            if (mode === 'topics') {
                const type = Math.random() > 0.5 ? 'topic_to_week' : 'week_to_topic';
                if (type === 'topic_to_week') {
                    questionText = `Which week has the topic: "${weekData.topic}"?`;
                    answer = `Week ${weekData.week}`;
                    explanation = `Week ${weekData.week} focuses on "${weekData.topic}".`;
                    const distractors = shuffleArray(data).filter(d => d.week !== weekData.week).slice(0, 3);
                    options = [answer, ...distractors.map(d => `Week ${d.week}`)];
                } else {
                    questionText = `What is the topic for Week ${weekData.week}?`;
                    answer = weekData.topic;
                    explanation = `The topic for Week ${weekData.week} is "${weekData.topic}".`;
                    const distractors = shuffleArray(data).filter(d => d.topic !== weekData.topic).slice(0, 3);
                    options = [answer, ...distractors.map(d => d.topic)];
                }
                questions.push({ question: questionText, answer, options: shuffleArray(options), difficulty: 'Medium', explanation });
            } else if (mode === 'memory') {
                const types = ['ref_to_text', 'text_to_ref', 'week_to_ref'];
                const type = types[Math.floor(Math.random() * types.length)];

                if (type === 'ref_to_text') {
                    questionText = `Which of these is the memory verse for ${weekData.memory_verse_ref}?`;
                    answer = weekData.memory_verse_text;
                    explanation = `The memory verse for Week ${weekData.week} is ${weekData.memory_verse_ref}: "${weekData.memory_verse_text}"`;
                    const distractors = shuffleArray(data).filter(d => d.memory_verse_text !== weekData.memory_verse_text).slice(0, 3);
                    options = [answer, ...distractors.map(d => d.memory_verse_text)];
                } else if (type === 'text_to_ref') {
                    questionText = `Which reference matches this memory verse: "${weekData.memory_verse_text}"?`;
                    answer = weekData.memory_verse_ref;
                    explanation = `The memory verse for Week ${weekData.week} is ${weekData.memory_verse_ref}.`;
                    let similarRefs = generateSimilarReferences(weekData.memory_verse_ref);
                    if (similarRefs.length < 3) {
                        const fallback = shuffleArray(data).filter(d => d.memory_verse_ref !== weekData.memory_verse_ref).map(d => d.memory_verse_ref);
                        similarRefs = similarRefs.concat(fallback);
                    }
                    options = [answer, ...similarRefs.slice(0, 3)];
                } else {
                    questionText = `What is the memory verse reference for Week ${weekData.week}?`;
                    answer = weekData.memory_verse_ref;
                    explanation = `Week ${weekData.week} memory verse is ${weekData.memory_verse_ref}.`;
                    let similarRefs = generateSimilarReferences(weekData.memory_verse_ref);
                    if (similarRefs.length < 3) {
                        const fallback = shuffleArray(data).filter(d => d.memory_verse_ref !== weekData.memory_verse_ref).map(d => d.memory_verse_ref);
                        similarRefs = similarRefs.concat(fallback);
                    }
                    options = [answer, ...similarRefs.slice(0, 3)];
                }
                questions.push({ question: questionText, answer, options: shuffleArray(options), difficulty: 'Hard', explanation });
            }
        });

        return {
            week_number: 'Mastery',
            topic: mode === 'topics' ? 'Topics' : 'Memory Verses',
            questions
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
        currentQuizData = quizData;
        currentQuestionIndex = 0;
        score = 0;
        setUrl(currentMode, currentFile);
        saveProgress();
        showQuizScreen();
        renderQuestion();
    }

    function renderQuestion() {
        hasAnsweredCurrent = false;
        const q = currentQuizData.questions[currentQuestionIndex];
        const total = currentQuizData.questions.length;

        DOM.questionCounter.textContent = `Question ${currentQuestionIndex + 1} of ${total}`;
        DOM.progressBar.style.width = `${(currentQuestionIndex / total) * 100}%`;

        DOM.difficultyBadge.textContent = q.difficulty;
        DOM.difficultyBadge.className = `difficulty-badge ${q.difficulty}`;

        DOM.questionText.innerHTML = q.question.replace(/\n/g, '<br>');
        DOM.optionsContainer.innerHTML = '';
        DOM.feedbackContainer.classList.add('hidden');
        DOM.nextBtn.disabled = true;
        DOM.nextBtn.textContent = (currentQuestionIndex === total - 1) ? 'Finish Quiz' : 'Next Question';

        if (q.options && q.options.length > 0) {
            q.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.textContent = opt;
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

        const isCorrect = selectedText.startsWith(question.answer) || selectedText === question.answer;

        DOM.optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
            btn.disabled = true;
            if (btn.textContent.startsWith(question.answer) || btn.textContent === question.answer) {
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
            showFeedback(false, `Correct answer was: ${question.answer}. \n${question.explanation}`);
        }

        DOM.nextBtn.disabled = false;
    }

    function showFeedback(isCorrect, explanation) {
        DOM.feedbackContainer.className = `feedback-panel ${isCorrect ? 'correct' : 'wrong'}`;
        DOM.feedbackTitle.textContent = isCorrect ? 'Correct!' : 'Incorrect';
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
        DOM.backToMenuBtn.classList.add('hidden');

        const total = currentQuizData.questions.length;
        DOM.finalScore.innerHTML = `${score} <small style="font-size:1rem;font-weight:normal;opacity:0.8">/ ${total}</small>`;

        const percentage = score / total;
        if (percentage === 1) {
            DOM.resultMessage.textContent = "Perfect Score! You mastered this week's lesson!";
        } else if (percentage >= 0.8) {
            DOM.resultMessage.textContent = "Excellent work! Very impressive knowledge.";
        } else if (percentage >= 0.5) {
            DOM.resultMessage.textContent = "Good job. A little more review and you'll be an expert.";
        } else {
            DOM.resultMessage.textContent = "Keep studying! Review the lesson and try again.";
        }
    }

    function returnToMenu() {
        setUrl(currentMode);
        DOM.quizScreen.classList.add('hidden');
        DOM.resultScreen.classList.add('hidden');
        DOM.menuScreen.classList.remove('hidden');
        DOM.backToMenuBtn.classList.add('hidden');
    }

    DOM.nextBtn.addEventListener('click', handleNext);
    DOM.returnHomeBtn.addEventListener('click', returnToMenu);
    DOM.backToMenuBtn.addEventListener('click', returnToMenu);

    init();
});
