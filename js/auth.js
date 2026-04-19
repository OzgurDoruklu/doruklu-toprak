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
        
        // Global Header & Badge (manageCallback yok)
        globalUI.renderGlobalHeader("Oyunu");
        globalUI.renderUserBadge(user, profile, async () => {
            const { clearAllCaches } = await import('https://cdn.doruklu.com/auth.js');
            await clearAllCaches();
            await supabase.auth.signOut();
            window.location.href = 'https://doruklu.com/?logout=true';
        });

        initGame(); // Bu fonksiyon artık Start Screen'i tetikliyor

    });
}
