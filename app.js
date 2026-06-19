document.addEventListener('DOMContentLoaded', () => {
    const DOM = {
        menuScreen: document.getElementById('menu-screen'),
        quizScreen: document.getElementById('quiz-screen'),
        resultScreen: document.getElementById('result-screen'),
        reviewScreen: document.getElementById('review-screen'),
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
        reviewBtn: document.getElementById('review-btn'),
        reviewBackBtn: document.getElementById('review-back-btn'),
        reviewList: document.getElementById('review-list'),
        shareBtn: document.getElementById('share-btn'),
        modeBtns: document.querySelectorAll('.mode-btn'),
        searchInput: document.getElementById('search-input'),
        resumeToast: document.getElementById('resume-toast'),
        resumeToastText: document.getElementById('resume-toast-text'),
        resumeDismiss: document.getElementById('resume-dismiss'),
        timerToggle: document.getElementById('timer-toggle'),
        timerBarContainer: document.getElementById('timer-bar-container'),
        timerBar: document.getElementById('timer-bar'),
        timerCount: document.getElementById('timer-count'),
        countModal: document.getElementById('count-modal'),
        countBtns: document.querySelectorAll('.count-btn'),
        countCancel: document.getElementById('count-cancel'),
        confettiCanvas: document.getElementById('confetti-canvas'),
    };

    // --- State ---
    let quizzes = [];
    let currentQuizData = null;
    let currentQuestionIndex = 0;
    let score = 0;
    let hasAnsweredCurrent = false;
    let currentMode = 'general';
    let currentFile = null;
    let answeredLog = [];
    let allMixQuestions = null;
    let pendingQuizCallback = null;

    let timerEnabled = false;
    let timerInterval = null;
    const TIMER_SECONDS = 30;
    let timerRemaining = 0;

    const MODE_LABELS = {
        general: 'General Quiz',
        bible: 'Bible Mastery',
        topics: 'Topics Mastery',
        memory: 'Memory Verses',
        mix: 'Mix Mode',
    };

    // --- Score history ---
    const SCORES_KEY = 'quiz_scores_v2';

    function getScoreHistory(id) {
        try {
            const all = JSON.parse(localStorage.getItem(SCORES_KEY) || '{}');
            return all[id] || [];
        } catch { return []; }
    }

    function saveScoreHistory(id, s, total) {
        try {
            const all = JSON.parse(localStorage.getItem(SCORES_KEY) || '{}');
            const hist = all[id] || [];
            hist.unshift({ score: s, total, ts: Date.now() });
            all[id] = hist.slice(0, 3);
            localStorage.setItem(SCORES_KEY, JSON.stringify(all));
        } catch {}
    }

    function getBestScore(id) {
        const hist = getScoreHistory(id);
        if (!hist.length) return null;
        return Math.max(...hist.map(h => h.score / h.total));
    }

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
            answeredLog,
        }));
    }

    function loadProgress(id) {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (!raw) return null;
            const saved = JSON.parse(raw);
            return saved.id === id ? saved : null;
        } catch { return null; }
    }

    function clearProgress() {
        localStorage.removeItem(SESSION_KEY);
    }

    // --- Timer ---
    function startTimer() {
        if (!timerEnabled) return;
        stopTimer();
        timerRemaining = TIMER_SECONDS;
        DOM.timerBarContainer.classList.remove('hidden');
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timerRemaining--;
            updateTimerDisplay();
            if (timerRemaining <= 0) {
                stopTimer();
                autoTimeout();
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    function updateTimerDisplay() {
        const pct = (timerRemaining / TIMER_SECONDS) * 100;
        DOM.timerBar.style.width = pct + '%';
        DOM.timerBar.classList.toggle('timer-warning', timerRemaining <= 10);
        DOM.timerCount.textContent = timerRemaining;
    }

    function autoTimeout() {
        if (hasAnsweredCurrent) return;
        hasAnsweredCurrent = true;
        const q = currentQuizData.questions[currentQuestionIndex];
        DOM.optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
            btn.disabled = true;
            const text = btn.querySelector('span:last-child').textContent;
            if (text === q.answer || text.startsWith(q.answer)) btn.classList.add('correct');
        });
        answeredLog.push({ question: q.question, userAnswer: '(time up)', correct: q.answer, isCorrect: false, explanation: q.explanation });
        showFeedback(false, `Time's up! ${q.explanation}`);
        updateLiveScore();
        DOM.nextBtn.disabled = false;
    }

    // --- Question count modal ---
    function showCountModal(callback) {
        pendingQuizCallback = callback;
        DOM.countModal.classList.remove('hidden');
    }

    function hideCountModal() {
        DOM.countModal.classList.add('hidden');
        pendingQuizCallback = null;
    }

    DOM.countBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.dataset.count;
            const count = val === 'all' ? Infinity : parseInt(val, 10);
            hideCountModal();
            if (pendingQuizCallback) pendingQuizCallback(count);
        });
    });

    DOM.countCancel.addEventListener('click', hideCountModal);

    DOM.countModal.addEventListener('click', (e) => {
        if (e.target === DOM.countModal) hideCountModal();
    });

    // --- Confetti ---
    function launchConfetti() {
        const canvas = DOM.confettiCanvas;
        canvas.classList.remove('hidden');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        const particles = Array.from({ length: 160 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 6 + 3,
            color: `hsl(${Math.random() * 360}, 80%, 60%)`,
            tilt: 0,
            tiltAngle: Math.random() * Math.PI * 2,
            tiltSpeed: Math.random() * 0.1 + 0.04,
            speed: Math.random() * 3 + 1,
        }));
        let frame = 0;
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.tiltAngle += p.tiltSpeed;
                p.y += p.speed;
                p.tilt = Math.sin(p.tiltAngle) * 12;
                ctx.beginPath();
                ctx.lineWidth = p.r;
                ctx.strokeStyle = p.color;
                ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
                ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
                ctx.stroke();
                if (p.y > canvas.height) {
                    p.y = -10;
                    p.x = Math.random() * canvas.width;
                }
            });
            frame++;
            if (frame < 200) requestAnimationFrame(draw);
            else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.classList.add('hidden');
            }
        }
        requestAnimationFrame(draw);
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

    // --- Toast ---
    let toastTimer = null;

    function showToast(text, duration = 4000) {
        DOM.resumeToastText.textContent = text;
        DOM.resumeToast.classList.remove('hidden');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => DOM.resumeToast.classList.add('hidden'), duration);
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
        DOM.reviewScreen.classList.add('hidden');
        DOM.quizScreen.classList.remove('hidden');
        updateBreadcrumb(true);
    }

    // --- Keyboard navigation ---
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

    // --- Init ---
    async function init() {
        DOM.timerToggle.addEventListener('click', () => {
            timerEnabled = !timerEnabled;
            DOM.timerToggle.textContent = `⏱ Timer: ${timerEnabled ? 'On' : 'Off'}`;
            DOM.timerToggle.classList.toggle('active', timerEnabled);
        });

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

        DOM.reviewBtn.addEventListener('click', showReviewScreen);
        DOM.reviewBackBtn.addEventListener('click', () => {
            DOM.reviewScreen.classList.add('hidden');
            DOM.resultScreen.classList.remove('hidden');
        });
        DOM.shareBtn.addEventListener('click', shareResult);

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
                answeredLog = saved.answeredLog || [];
                showQuizScreen();
                updateLiveScore();
                renderQuestion();
                showToast(`Resuming from question ${currentQuestionIndex + 1}`);
            } else {
                await loadQuiz(file);
            }
        } else if (currentMode === 'topics' || currentMode === 'memory' || currentMode === 'mix') {
            const saved = loadProgress(`${currentMode}/mastery`);
            if (saved && saved.questionIndex > 0) {
                currentFile = null;
                currentQuizData = saved.quizData;
                currentQuestionIndex = saved.questionIndex;
                score = saved.score;
                answeredLog = saved.answeredLog || [];
                showQuizScreen();
                updateLiveScore();
                renderQuestion();
                showToast(`Resuming from question ${currentQuestionIndex + 1}`);
            }
        }
    }

    function showMenuScreen() {
        stopTimer();
        DOM.quizScreen.classList.add('hidden');
        DOM.resultScreen.classList.add('hidden');
        DOM.reviewScreen.classList.add('hidden');
        DOM.menuScreen.classList.remove('hidden');
        DOM.timerBarContainer.classList.add('hidden');
        hideBreadcrumb();
    }

    async function loadQuizzesForMode(mode) {
        DOM.quizList.innerHTML = '<p style="padding:1rem;color:var(--text-muted)">Loading...</p>';

        if (mode === 'topics' || mode === 'memory') {
            try {
                const res = await fetch('topics_memory_data.json');
                if (!res.ok) throw new Error();
                quizzes = await res.json();
                renderMenu();
            } catch {
                DOM.quizList.innerHTML = '<p style="padding:1rem">Error loading mastery data.</p>';
            }
            return;
        }

        if (mode === 'mix') {
            quizzes = [];
            renderMenu();
            return;
        }

        const indexFile = mode === 'general' ? 'quiz_index.json' : 'bible_quiz_index.json';
        try {
            const res = await fetch(indexFile);
            if (!res.ok) throw new Error();
            quizzes = await res.json();
            renderMenu();
        } catch {
            DOM.quizList.innerHTML = '<p style="padding:1rem">Error loading quizzes.</p>';
        }
    }

    function renderScoreDots(id) {
        const hist = getScoreHistory(id);
        if (!hist.length) return '';
        const dots = hist.map(h => {
            const pct = h.score / h.total;
            const cls = pct >= 0.8 ? 'dot-good' : pct >= 0.5 ? 'dot-ok' : 'dot-bad';
            return `<span class="score-dot ${cls}" title="${h.score}/${h.total}"></span>`;
        }).join('');
        return `<div class="score-dots">${dots}</div>`;
    }

    function renderMenu(searchQuery = '') {
        DOM.quizList.innerHTML = '';

        if (currentMode === 'topics' || currentMode === 'memory') {
            DOM.searchInput.parentElement.style.display = 'none';
            const id = `${currentMode}/mastery`;
            const card = document.createElement('div');
            card.className = 'quiz-card';
            const subtitle = currentMode === 'memory'
                ? `Comprehensive test across all ${quizzes.length} weeks!`
                : `All ${quizzes.length} weeks in randomized order!`;
            card.innerHTML = `
                <div class="week-badge">Mastery Mode</div>
                <h3>${currentMode === 'topics' ? 'Topics Mastery' : 'Memory Verses Mastery'}</h3>
                <p>${subtitle}</p>
                ${renderScoreDots(id)}
            `;
            card.addEventListener('click', () => {
                currentFile = null;
                showCountModal(count => {
                    const n = count === Infinity ? quizzes.length : count;
                    const quizData = generateDynamicQuiz(currentMode, quizzes, n);
                    startQuiz(quizData);
                });
            });
            DOM.quizList.appendChild(card);
            return;
        }

        if (currentMode === 'mix') {
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
                currentFile = null;
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
        const filtered = quizzes.filter(q =>
            `week ${q.week} ${q.topic}`.toLowerCase().includes(searchQuery)
        );

        if (!filtered.length) {
            DOM.quizList.innerHTML = '<div class="no-results">No quizzes found matching your search.</div>';
            return;
        }

        filtered.forEach(quiz => {
            const id = `${currentMode}/${quiz.filename}`;
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

    function shuffleArray(array) {
        return array.slice().sort(() => Math.random() - 0.5);
    }

    // --- Mix mode: load and cache all general quiz files ---
    async function buildMixQuiz(count) {
        try {
            if (!allMixQuestions) {
                const idxRes = await fetch('quiz_index.json');
                if (!idxRes.ok) throw new Error('Index not found');
                const idx = await idxRes.json();
                const files = await Promise.all(
                    idx.map(q => fetch(`questions/${q.filename}`).then(r => r.json()).catch(() => null))
                );
                allMixQuestions = [];
                files.forEach(f => {
                    if (f && f.weeks && f.weeks[0]) {
                        allMixQuestions.push(...f.weeks[0].questions);
                    }
                });
            }
            const n = count === Infinity ? allMixQuestions.length : count;
            const picked = shuffleArray(allMixQuestions).slice(0, n);
            return { week_number: 'Mastery', topic: 'All Weeks Mix', questions: picked };
        } catch (e) {
            console.error(e);
            alert('Failed to load mix quiz.');
            return null;
        }
    }

    // --- Fill-in-blank question builder ---
    const STOP_WORDS = new Set(['which','shall','that','with','have','will','from','they','this','when','then','been','were','their','what','into','your','about','there','these','those','them','also','upon','unto','even','said','thou','thee','hath','doth']);

    function makeBlankQuestion(weekData, clean) {
        const verse = weekData.memory_verse_text;
        const words = verse.split(/\s+/);
        const candidates = words
            .map((w, i) => ({ raw: w, word: w.replace(/[^a-zA-Z]/g, ''), i }))
            .filter(({ word }) => word.length > 4 && !STOP_WORDS.has(word.toLowerCase()));
        if (!candidates.length) return null;
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        const blank = words.map((w, i) => i === pick.i ? '____' : w).join(' ');
        const answer = pick.word;
        const distractors = shuffleArray(
            clean
                .filter(x => x !== weekData)
                .flatMap(x =>
                    x.memory_verse_text.split(/\s+/)
                        .map(w => w.replace(/[^a-zA-Z]/g, ''))
                        .filter(w => w.length > 4 && !STOP_WORDS.has(w.toLowerCase()) && w.toLowerCase() !== answer.toLowerCase())
                )
        ).slice(0, 3);
        if (distractors.length < 3) return null;
        return {
            question: `Fill in the blank:\n"${blank}"\n(${weekData.memory_verse_ref})`,
            answer,
            options: shuffleArray([answer, ...distractors]),
            difficulty: 'Hard',
            explanation: `The full verse (${weekData.memory_verse_ref}): "${verse}"`,
        };
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
                const types = ['ref_to_text', 'text_to_ref', 'week_to_ref', 'fill_blank'];
                const type = types[Math.floor(Math.random() * types.length)];

                if (type === 'fill_blank') {
                    const q = makeBlankQuestion(weekData, clean);
                    if (q) { questions.push(q); return; }
                    // fallback to ref_to_text
                }

                if (type === 'ref_to_text' || type === 'fill_blank') {
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
            const res = await fetch(`${folder}${filename}`);
            if (!res.ok) throw new Error('Not found');
            const data = await res.json();
            if (data.weeks && data.weeks.length > 0) startQuiz(data.weeks[0]);
        } catch {
            alert('Failed to load quiz data.');
        }
    }

    function startQuiz(quizData) {
        currentQuizData = { ...quizData, questions: shuffleArray(quizData.questions) };
        currentQuestionIndex = 0;
        score = 0;
        answeredLog = [];
        setUrl(currentMode, currentFile);
        saveProgress();
        showQuizScreen();
        updateLiveScore();
        renderQuestion();
    }

    function renderQuestion() {
        hasAnsweredCurrent = false;
        stopTimer();
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

        startTimer();
    }

    function handleOptionClick(selectedBtn, selectedText, question) {
        if (hasAnsweredCurrent) return;
        hasAnsweredCurrent = true;
        stopTimer();

        const isCorrect = selectedText === question.answer || selectedText.startsWith(question.answer);

        DOM.optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
            btn.disabled = true;
            const text = btn.querySelector('span:last-child').textContent;
            if (text === question.answer || text.startsWith(question.answer)) btn.classList.add('correct');
        });

        if (isCorrect) {
            score++;
            selectedBtn.classList.add('correct');
        } else {
            selectedBtn.classList.add('wrong');
        }

        answeredLog.push({
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
        if (hasAnsweredCurrent) return;
        hasAnsweredCurrent = true;
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
            score++;
            showFeedback(true, question.explanation);
        } else {
            showFeedback(false, `Correct answer: ${question.answer}. ${question.explanation}`);
        }

        answeredLog.push({ question: question.question, userAnswer: answer, correct: question.answer, isCorrect, explanation: question.explanation });
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
        stopTimer();
        DOM.timerBarContainer.classList.add('hidden');
        setUrl(currentMode);

        const id = currentFile ? `${currentMode}/${currentFile}` : `${currentMode}/mastery`;
        saveScoreHistory(id, score, currentQuizData.questions.length);

        DOM.quizScreen.classList.add('hidden');
        DOM.resultScreen.classList.remove('hidden');
        updateBreadcrumb(false);

        const total = currentQuizData.questions.length;
        const percentage = score / total;

        DOM.finalScore.innerHTML = `${score} <small style="font-size:1rem;font-weight:400;opacity:0.6">/ ${total}</small>`;

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

    // --- Review screen ---
    function showReviewScreen() {
        DOM.resultScreen.classList.add('hidden');
        DOM.reviewScreen.classList.remove('hidden');
        DOM.reviewList.innerHTML = '';

        answeredLog.forEach((entry, i) => {
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

    // --- Share result ---
    async function shareResult() {
        const total = currentQuizData.questions.length;
        const text = `I scored ${score}/${total} on "${currentQuizData.topic}" — Sunday School Quiz!`;
        try {
            if (navigator.share) {
                await navigator.share({ title: 'Sunday School Quiz', text });
            } else {
                await navigator.clipboard.writeText(text);
                showToast('Result copied to clipboard!', 3000);
            }
        } catch {}
    }

    function returnToMenu() {
        clearProgress();
        stopTimer();
        setUrl(currentMode);
        currentFile = null;
        showMenuScreen();
        loadQuizzesForMode(currentMode);
    }

    DOM.tryAgainBtn.addEventListener('click', () => {
        if (currentFile) {
            loadQuiz(currentFile);
        } else if (currentMode === 'mix') {
            showCountModal(async count => {
                const mixData = await buildMixQuiz(count);
                if (mixData) startQuiz(mixData);
            });
        } else {
            showCountModal(count => {
                const n = count === Infinity ? quizzes.length : count;
                const quizData = generateDynamicQuiz(currentMode, quizzes, n);
                startQuiz(quizData);
            });
        }
    });

    DOM.nextBtn.addEventListener('click', handleNext);
    DOM.returnHomeBtn.addEventListener('click', returnToMenu);

    init();
});
