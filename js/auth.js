import { supabase, AppState } from 'https://cdn.doruklu.com/supabase-config.js';
import { ui } from './ui.js';
import { ui as globalUI } from 'https://cdn.doruklu.com/ui.js';
import { initSubdomainAuth } from 'https://cdn.doruklu.com/auth.js';
import { initGame } from './game.js';

export async function initAuth() {
    await initSubdomainAuth('toprak_game', (user, profile) => {
        // Login + yetki başarılı — oyun ekranını aç
        AppState.profile = profile;
        AppState.currentScore = profile.total_score || 0;
        
        document.getElementById('player-name').textContent = profile.display_name || user.email.split('@')[0];
        document.getElementById('player-score').textContent = AppState.currentScore;
        
        // Global Header
        // Rozet artık CDN auth.js tarafından, onSuccess'ten SONRA render ediliyor
        // (performGlobalLogout callback'iyle). Buradaki ikinci çağrı kaldırıldı —
        // yerel kopya çıkış sırasını yanlış yapıyordu (clearAllCaches, signOut'tan önce).
        globalUI.renderGlobalHeader("Oyunu");

        initGame(); // Bu fonksiyon artık Start Screen'i tetikliyor

    });
}
