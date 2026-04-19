import { supabase, AppState } from 'https://cdn.doruklu.com/supabase-config.js';
import { ui } from './ui.js';

let currentFlashcards = [];
let currentCardIndex = 0;

export async function initGame() {
    // 1. Önce Start Screen Ayarlarını Yap
    const playerName = AppState.profile?.display_name || 'Gezgin';
    const playerScore = AppState.profile?.total_score || 0;

    const welcomeEl = document.getElementById('welcome-name');
    const scoreEl = document.getElementById('start-score-val');
    const startBtn = document.getElementById('start-game-btn');

    if (welcomeEl) welcomeEl.textContent = playerName;
    if (scoreEl) scoreEl.textContent = playerScore;

    // 2. Start Screen'i Goster
    ui.showScreen('start-screen');

    // 3. Basla butonunu kur
    if (startBtn) {
        startBtn.onclick = async () => {
            ui.setLoading(true);
            try {
                await fetchFlashcards();
                if (currentFlashcards.length > 0) {
                    startSession();
                } else {
                    ui.showError("Henüz soru tanımlanmamış.");
                }
            } catch (err) {
                ui.showError("Sorular yüklenemedi!");
                console.error(err);
            } finally {
                ui.setLoading(false);
            }
        };
    }
}

async function fetchFlashcards() {
    const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    if (data) {
        // En yeni 15 soruyu al ve karıştır (randomize)
        currentFlashcards = data.slice(0, 15).sort(() => 0.5 - Math.random());
    }
}

function startSession() {
    AppState.sessionStart = new Date();
    AppState.questionsAnswered = [];
    AppState.correctCount = 0;
    AppState.incorrectCount = 0;
    AppState.currentScore = AppState.profile?.total_score || 0;

    ui.showScreen('game-screen');
    showCard(0);
}

function showCard(index) {
    if (index >= currentFlashcards.length) {
        endGame();
        return;
    }
    
    currentCardIndex = index;
    const card = currentFlashcards[index];
    const container = document.getElementById('card-container');
    
    let html = `
        <div class="app-card" style="width:100%; max-width:500px; text-align:center;">
            <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem; letter-spacing:1px;">SORU ${index + 1} / ${currentFlashcards.length}</div>
            <h2 style="margin:0 0 2rem 0; line-height:1.4; color:var(--text-main);">${card.content}</h2>
            <div style="display:grid; grid-template-columns:1fr; gap:12px; width:100%;">
    `;
        
    if (card.question_type === 'single_choice' && card.options) {
        card.options.forEach(opt => {
            html += `<button class="primary-btn" style="background:var(--glass-bg); color:var(--text-main); border:1px solid var(--glass-border); padding:1rem;" onclick="window.submitAnswer('${opt.replace(/'/g, "\\'")}')">${opt}</button>`;
        });
    } else if (card.question_type === 'multi_choice' && card.options) {
        card.options.forEach((opt, i) => {
            html += `
                <label style="display:flex; align-items:center; gap:12px; background:var(--glass-bg); padding:1rem; border-radius:12px; cursor:pointer; border:1px solid var(--glass-border);">
                    <input type="checkbox" value="${opt.replace(/'/g, "\\'")}" id="chk-${i}" style="width:20px; height:20px;">
                    <span style="color:var(--text-main); font-weight:500;">${opt}</span>
                </label>
            `;
        });
        html += `<button class="primary-btn" style="margin-top:10px;" onclick="window.submitMulti()">Seçimleri Onayla</button>`;
    } else if (card.question_type === 'free_text') {
        html += `
            <div class="input-group">
                <input type="text" id="free-text-input" placeholder="Cevabınızı buraya yazın..." style="text-align:center;">
            </div>
            <button class="primary-btn" onclick="window.submitFree()">Cevabı Gönder</button>
        `;
    }
    
    html += `</div></div>`;
    container.innerHTML = html;
}

window.submitAnswer = (answer) => checkAnswer(answer);

window.submitMulti = () => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    const answers = Array.from(checkboxes).map(cb => cb.value);
    if (answers.length === 0) { ui.showError("En az bir seçenek seçmelisin!"); return; }
    checkAnswer(answers);
};

window.submitFree = () => {
    const input = document.getElementById('free-text-input');
    if (!input.value.trim()) { ui.showError("Bir cevap yazmalısın!"); return; }
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
    AppState.questionsAnswered.push({ type: card.question_type, correct: isCorrect });
    
    ui.updateScore(AppState.currentScore, isCorrect);
    
    // DB Güncelleme
    supabase.from('profiles').update({ total_score: AppState.currentScore }).eq('id', AppState.user.id).then();
    
    const container = document.getElementById('card-container');
    container.innerHTML = `
        <div class="summary-card" style="padding:2rem; border-color: ${isCorrect ? 'var(--success)' : 'var(--danger)'}">
            <div style="font-size:3rem; margin-bottom:1rem;">${isCorrect ? '✨' : '❌'}</div>
            <h2 style="color:${isCorrect ? '#10b981' : '#ef4444'}; margin-bottom:1.5rem;">${isCorrect ? 'Harika! Doğru Cevap' : 'Hay aksi! Yanlış Cevap'}</h2>
            <button class="primary-btn" onclick="window.nextCard()">Sıradaki Soruya Geç</button>
        </div>
    `;
}

window.nextCard = () => showCard(currentCardIndex + 1);

async function endGame() {
    ui.setLoading(true);
    const sessionEnd = new Date();
    const diffSec = Math.round((sessionEnd - AppState.sessionStart) / 1000);
    
    const scoreDelta = (AppState.correctCount * 3) + (AppState.incorrectCount * -1);

    const sessionData = {
        player_id: AppState.user.id,
        duration_seconds: diffSec,
        questions_answered: AppState.questionsAnswered,
        total_questions: currentFlashcards.length,
        correct_count: AppState.correctCount,
        incorrect_count: AppState.incorrectCount,
        score_delta: scoreDelta
    };
    
    try {
        await supabase.from('game_sessions').insert(sessionData);
    } catch (e) {
        console.error("Session saving failed:", e);
    }
    
    ui.setLoading(false);
    ui.showScreen('result-screen');

    const container = document.getElementById('summary-container');
    container.innerHTML = `
        <h2 style="color:var(--text-secondary); text-transform:uppercase; letter-spacing:3px; font-size:0.9rem; margin-bottom:1rem;">Macera Tamamlandı</h2>
        <h1 class="hero-title">Oyun Özeti</h1>
        
        <div class="stat-grid">
            <div class="stat-item">
                <div style="font-size:0.7rem; color:var(--text-secondary);">DOĞRU</div>
                <div style="font-size:1.5rem; font-weight:700; color:#10b981;">${AppState.correctCount}</div>
            </div>
            <div class="stat-item">
                <div style="font-size:0.7rem; color:var(--text-secondary);">YANLIŞ</div>
                <div style="font-size:1.5rem; font-weight:700; color:#ef4444;">${AppState.incorrectCount}</div>
            </div>
            <div class="stat-item" style="grid-column: span 2;">
                <div style="font-size:0.7rem; color:var(--text-secondary);">KAZANILAN PUAN</div>
                <div style="font-size:1.8rem; font-weight:700; color:var(--primary);">${scoreDelta > 0 ? '+' : ''}${scoreDelta}</div>
            </div>
        </div>

        <button class="primary-btn" onclick="window.location.reload()" style="padding:1.2rem;">Yeni Bir Macera Başlat</button>
    `;
}
