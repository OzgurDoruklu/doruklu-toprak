import { supabase, AppState } from 'https://cdn.doruklu.com/supabase-config.js';
import { ui } from './ui.js';

let currentFlashcards = [];
let currentCardIndex = 0;

export async function initGame() {
    AppState.sessionStart = new Date();
    AppState.questionsAnswered = [];
    AppState.correctCount = 0;
    AppState.incorrectCount = 0;
    
    ui.setLoading(true);
    await fetchFlashcards();
    ui.setLoading(false);
    
    if (currentFlashcards.length > 0) {
        showCard(0);
    } else {
        document.getElementById('card-container').innerHTML = '<p>Henüz sistemde soru bulunmuyor.</p>';
    }
}

async function fetchFlashcards() {
    const { data, error } = await supabase.from('flashcards').select('*');
    if (data) {
        currentFlashcards = data.sort(() => 0.5 - Math.random()).slice(0, 10);
    }
}

function showCard(index) {
    if (index >= currentFlashcards.length) {
        endGame();
        return;
    }
    
    currentCardIndex = index;
    const card = currentFlashcards[index];
    const container = document.getElementById('card-container');
    
    let html = `<div class="flashcard">
        <h3>Soru ${index + 1} / ${currentFlashcards.length}</h3>
        <p class="question-text">${card.content}</p>
        <div class="options-container">`;
        
    if (card.question_type === 'single_choice') {
        card.options.forEach(opt => {
            html += `<button class="option-btn" onclick="window.submitAnswer('${opt.replace(/'/g, "\\'")}')">${opt}</button>`;
        });
    } else if (card.question_type === 'multi_choice') {
        card.options.forEach((opt, i) => {
            html += `<label class="multi-opt"><input type="checkbox" value="${opt.replace(/'/g, "\\'")}" id="chk-${i}"> ${opt}</label>`;
        });
        html += `<button class="submit-btn" onclick="window.submitMulti()">Cevapla</button>`;
    } else if (card.question_type === 'free_text') {
        html += `<input type="text" id="free-text-input" placeholder="Cevabınızı yazın...">`;
        html += `<button class="submit-btn" onclick="window.submitFree()">Cevapla</button>`;
    }
    
    html += `</div></div>`;
    container.innerHTML = html;
}

window.submitAnswer = async (answer) => {
    checkAnswer(answer);
};

window.submitMulti = async () => {
    const checkboxes = document.querySelectorAll('.multi-opt input:checked');
    const answers = Array.from(checkboxes).map(cb => cb.value);
    checkAnswer(answers);
};

window.submitFree = async () => {
    const input = document.getElementById('free-text-input');
    checkAnswer(input.value.trim());
};

async function checkAnswer(userAnswer) {
    const card = currentFlashcards[currentCardIndex];
    let isCorrect = false;
    
    if (card.question_type === 'single_choice') {
        isCorrect = userAnswer === card.correct_answer;
    } else if (card.question_type === 'multi_choice') {
        const correctArr = Array.isArray(card.correct_answer) ? card.correct_answer : [];
        if (Array.isArray(userAnswer) && userAnswer.length === correctArr.length) {
            isCorrect = userAnswer.every(val => correctArr.includes(val));
        }
    } else if (card.question_type === 'free_text') {
        isCorrect = String(userAnswer).toLowerCase() === String(card.correct_answer).toLowerCase();
    }
    
    let delta = isCorrect ? 3 : -1;
    AppState.currentScore += delta;
    
    if(isCorrect) AppState.correctCount++; else AppState.incorrectCount++;
    AppState.questionsAnswered.push(card.question_type);
    
    ui.updateScore(AppState.currentScore, isCorrect);
    
    const dbUpdateObj = { total_score: AppState.currentScore };
    supabase.from('profiles').update(dbUpdateObj).eq('id', AppState.user.id).then();
    
    const container = document.getElementById('card-container');
    container.innerHTML = `<div class="feedback ${isCorrect ? 'correct' : 'wrong'}">
        <h2>${isCorrect ? 'Doğru! +3 Puan' : 'Yanlış! -1 Puan'}</h2>
        <button class="next-btn" onclick="window.nextCard()">Sıradaki Soru</button>
    </div>`;
}

window.nextCard = () => {
    showCard(currentCardIndex + 1);
};

async function endGame() {
    ui.setLoading(true);
    const sessionEnd = new Date();
    const diffSec = Math.round((sessionEnd - AppState.sessionStart) / 1000);
    
    const sessionData = {
        player_id: AppState.user.id,
        duration_seconds: diffSec,
        questions_answered: AppState.questionsAnswered,
        total_questions: currentFlashcards.length,
        correct_count: AppState.correctCount,
        incorrect_count: AppState.incorrectCount,
        score_delta: (AppState.correctCount * 3) + (AppState.incorrectCount * -1)
    };
    
    await supabase.from('game_sessions').insert(sessionData);
    ui.setLoading(false);
    
    document.getElementById('card-container').innerHTML = `
        <div class="session-result">
            <h2>Oyun Bitti!</h2>
            <p>Doğru: ${AppState.correctCount}</p>
            <p>Yanlış: ${AppState.incorrectCount}</p>
            <p>Kazanılan/Kaybedilen Toplam Puan: ${sessionData.score_delta}</p>
            <button class="refresh-btn" onclick="window.location.reload()">Tekrar Oyna</button>
        </div>`;
}
