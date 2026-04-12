export const ui = {
    showScreen: (screenId) => {
        const screens = ['auth-screen', 'game-screen', 'result-screen'];
        screens.forEach(s => {
            document.getElementById(s).style.display = s === screenId ? 'flex' : 'none';
        });
    },
    
    showError: (msg) => {
        const el = document.getElementById('alert-box');
        el.className = 'alert error show';
        el.textContent = msg;
        setTimeout(() => el.classList.remove('show'), 3000);
    },

    showSuccess: (msg) => {
        const el = document.getElementById('alert-box');
        el.className = 'alert success show';
        el.textContent = msg;
        setTimeout(() => el.classList.remove('show'), 3000);
    },

    setLoading: (isLoading) => {
        const spinner = document.getElementById('loading-spinner');
        if (isLoading) {
            spinner.style.display = 'flex';
        } else {
            spinner.style.display = 'none';
        }
    },
    
    updateScore: (score, isAdd) => {
        const el = document.getElementById('player-score');
        el.textContent = score;
        
        // Puan animasyonu
        const anim = document.createElement('div');
        anim.className = `score-anim ${isAdd ? 'add' : 'sub'}`;
        anim.textContent = isAdd ? '+3' : '-1';
        el.parentElement.appendChild(anim);
        
        setTimeout(() => anim.remove(), 1000);
    }
};

window.ui = ui;
