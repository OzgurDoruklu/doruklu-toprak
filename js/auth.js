import { supabase, AppState } from 'https://cdn.doruklu.com/supabase-config.js';
import { ui } from './ui.js';
import { initGame } from './game.js';

export async function initAuth() {
    ui.setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        await handleLoginSuccess(session.user);
    } else {
        window.location.href = 'https://doruklu.com/?redirect_to=' + encodeURIComponent(window.location.href);
    }
}

async function handleLoginSuccess(user) {
    AppState.user = user;
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
    if (profile) {
        const perms = profile.permissions || {};
        const hasAccess = profile.role === 'super_admin' || perms['toprak_game'] === true;
        
        if (!hasAccess) {
             document.body.innerHTML = `
                <div style="color:white; text-align:center; padding:50px; font-family:'Outfit'">
                    <h2 style="color:#f87171">Yetkiniz Reddedildi</h2>
                    <p>Bu bilgi kartı oyununa girmek için hesabınızın izni yok. Yöneticiden yetki talep edebilirsiniz.</p>
                    <a href="https://doruklu.com" style="color:#0ea5e9; text-decoration:none; padding:10px; background:rgba(255,255,255,0.1); border-radius:10px; display:inline-block; margin-top:20px;">Merkezi Sisteme Dön</a>
                </div>`;
             return;
        }

        AppState.profile = profile;
        AppState.currentScore = profile.total_score || 0;
        
        document.getElementById('player-name').textContent = profile.display_name || user.email;
        document.getElementById('player-score').textContent = AppState.currentScore;
        
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = 'https://doruklu.com';
        });

        ui.showScreen('game-screen');
        ui.setLoading(false);
        initGame();
    } else {
        ui.setLoading(false);
        ui.showError("Profil bulunamadı.");
    }
}
