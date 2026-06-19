import { state } from './state.js';

export const STOP_WORDS = new Set(['which','shall','that','with','have','will','from','they','this','when','then','been','were','their','what','into','your','about','there','these','those','them','also','upon','unto','even','said','thou','thee','hath','doth']);

export function shuffleArray(array) {
    return array.slice().sort(() => Math.random() - 0.5);
}

export async function buildMixQuiz(count) {
    try {
        if (!state.allMixQuestions) {
            const idxRes = await fetch('quiz_index.json');
            if (!idxRes.ok) throw new Error('Index not found');
            const idx = await idxRes.json();
            const files = await Promise.all(
                idx.map(q => fetch(`questions/${q.filename}`).then(r => r.json()).catch(() => null))
            );
            state.allMixQuestions = [];
            files.forEach(f => {
                if (f && f.weeks && f.weeks[0]) {
                    state.allMixQuestions.push(...f.weeks[0].questions);
                }
            });
        }
        const n = count === Infinity ? state.allMixQuestions.length : count;
        const picked = shuffleArray(state.allMixQuestions).slice(0, n);
        return { week_number: 'Mastery', topic: 'All Weeks Mix', questions: picked };
    } catch (e) {
        console.error(e);
        alert('Failed to load mix quiz.');
        return null;
    }
}

export function makeBlankQuestion(weekData, clean) {
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

export function generateSimilarReferences(correctRef) {
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

export function generateDynamicQuiz(mode, data, count) {
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
