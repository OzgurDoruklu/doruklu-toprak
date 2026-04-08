import { supabase, AppState } from './supabase-config.js';
import { ui } from './ui.js';
import { initGame } from './game.js';

export async function initAuth() {
    // Mevcut oturumu kontrol et
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        await handleLoginSuccess(session.user);
    } else {
        ui.showScreen('auth-screen');
    }

    // Dinleyicileri (event listeners) bağla
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('register-btn').addEventListener('click', handleRegister);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('toggle-auth-mode').addEventListener('click', toggleAuthMode);
}

let isLoginMode = true;

function toggleAuthMode(e) {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const toggleText = document.getElementById('toggle-auth-mode');
    const nameGroup = document.getElementById('name-group');

    if (isLoginMode) {
        title.textContent = 'Giriş Yap';
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'none';
        nameGroup.style.display = 'none';
        toggleText.innerHTML = 'Hesabınız yok mu? <span>Kayıt Olun</span>';
    } else {
        title.textContent = 'Kayıt Ol';
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'block';
        nameGroup.style.display = 'block';
        toggleText.innerHTML = 'Zaten hesabınız var mı? <span>Giriş Yapın</span>';
    }
}

async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    ui.setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    ui.setLoading(false);

    if (error) {
        ui.showError(error.message);
    } else {
        await handleLoginSuccess(data.user);
    }
}

async function handleRegister() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const displayName = document.getElementById('display-name').value;

    if (!displayName) {
        ui.showError('Lütfen adınızı girin.');
        return;
    }

    ui.setLoading(true);
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            data: {
                display_name: displayName,
                role: 'player'
            }
        }
    });
    ui.setLoading(false);

    if (error) {
        ui.showError(error.message);
    } else {
        ui.showSuccess('Kayıt başarılı! Giriş yapabilirsiniz.');
        toggleAuthMode({preventDefault: () => {}});
    }
}

async function handleLoginSuccess(user) {
    AppState.user = user;
    
    // Profili çek
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
    if (profile) {
        AppState.profile = profile;
        AppState.currentScore = profile.total_score || 0;
        document.getElementById('player-name').textContent = profile.display_name;
        document.getElementById('player-score').textContent = AppState.currentScore;
        
        // Oyunu başlat
        ui.showScreen('game-screen');
        initGame();
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    AppState.user = null;
    AppState.profile = null;
    ui.showScreen('auth-screen');
}
