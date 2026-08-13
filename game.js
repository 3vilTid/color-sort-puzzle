// ============================================
// COLOR SORT - MINIMAL WORKING VERSION
// ============================================

const state = {
    currentLevel: 1,
    maxLevel: 50,
    moves: 0,
    stars: 0,
    streak: 0,
    bestMoves: {},
    selectedTube: null,
    tubes: [],
    colors: ['#e94560', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#9b59b6'],
    skin: 'default',
    ownedSkins: ['default'],
    history: [],
    isLocked: false,
    levelData: null
};

// ===== LEVEL GENERATOR =====
function generateLevel(level) {
    const numColors = Math.min(2 + Math.floor(level / 4), 6);
    const tubesCount = numColors + 2;
    const ballsPerColor = 4;
    
    let pool = [];
    for (let i = 0; i < numColors; i++) {
        for (let j = 0; j < ballsPerColor; j++) {
            pool.push(i);
        }
    }
    
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    
    const tubes = [];
    for (let i = 0; i < tubesCount; i++) {
        const start = i * ballsPerColor;
        const end = Math.min(start + ballsPerColor, pool.length);
        tubes.push(pool.slice(start, end).filter(c => c !== undefined));
    }
    
    return { tubes, numColors, maxMoves: 30 + level * 2 };
}

// ===== RENDER =====
function renderGame() {
    const container = document.getElementById('gameContainer');
    if (!container) return;
    container.innerHTML = '';
    
    state.tubes.forEach((tube, index) => {
        const tubeEl = document.createElement('div');
        tubeEl.className = 'tube';
        if (state.selectedTube === index) tubeEl.classList.add('selected');
        
        tube.forEach((colorIndex) => {
            const ball = document.createElement('div');
            ball.className = 'ball';
            ball.style.background = state.colors[colorIndex % state.colors.length];
            tubeEl.appendChild(ball);
        });
        
        tubeEl.addEventListener('click', () => handleTubeClick(index));
        tubeEl.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleTubeClick(index);
        });
        
        container.appendChild(tubeEl);
    });
    
    updateUI();
}

// ===== GAME LOGIC =====
function handleTubeClick(index) {
    if (state.isLocked) return;
    if (!state.tubes[index]) return;
    
    if (state.selectedTube === null) {
        if (state.tubes[index].length === 0) return;
        state.selectedTube = index;
        renderGame();
        return;
    }
    
    tryMove(state.selectedTube, index);
}

function tryMove(from, to) {
    if (from === to) {
        state.selectedTube = null;
        renderGame();
        return;
    }
    
    const fromTube = state.tubes[from];
    const toTube = state.tubes[to];
    
    if (!fromTube || fromTube.length === 0 || toTube.length >= 4) {
        state.selectedTube = null;
        renderGame();
        return;
    }
    
    const topColor = fromTube[fromTube.length - 1];
    
    if (toTube.length > 0 && toTube[toTube.length - 1] !== topColor) {
        state.selectedTube = null;
        renderGame();
        return;
    }
    
    let count = 0;
    for (let i = fromTube.length - 1; i >= 0; i--) {
        if (fromTube[i] === topColor) count++;
        else break;
    }
    
    const space = 4 - toTube.length;
    const moveCount = Math.min(count, space);
    
    const moved = fromTube.splice(fromTube.length - moveCount, moveCount);
    toTube.push(...moved);
    
    state.moves++;
    state.selectedTube = null;
    state.history.push({ from, to });
    
    renderGame();
    checkWin();
}

function undoMove() {
    if (state.history.length === 0 || state.isLocked) return;
    const last = state.history.pop();
    const toTube = state.tubes[last.to];
    const fromTube = state.tubes[last.from];
    
    if (toTube.length > 0) {
        const removed = toTube.pop();
        if (removed !== undefined) fromTube.push(removed);
    }
    
    state.moves = Math.max(0, state.moves - 1);
    renderGame();
}

function resetLevel() {
    if (state.levelData) {
        state.tubes = state.levelData.tubes.map(t => [...t]);
        state.moves = 0;
        state.history = [];
        state.selectedTube = null;
        renderGame();
    }
}

function giveHint() {
    if (state.isLocked) return;
    for (let i = 0; i < state.tubes.length; i++) {
        for (let j = 0; j < state.tubes.length; j++) {
            if (i === j) continue;
            const from = state.tubes[i];
            const to = state.tubes[j];
            if (from.length === 0 || to.length >= 4) continue;
            const top = from[from.length - 1];
            if (to.length > 0 && to[to.length - 1] !== top) continue;
            
            const tubes = document.querySelectorAll('.tube');
            if (tubes[i]) {
                tubes[i].classList.add('hint');
                setTimeout(() => tubes[i]?.classList.remove('hint'), 1000);
            }
            return;
        }
    }
}

// ===== WIN DETECTION =====
function checkWin() {
    let win = true;
    let hasBalls = false;
    for (const tube of state.tubes) {
        if (tube.length === 0) continue;
        hasBalls = true;
        const first = tube[0];
        for (const color of tube) {
            if (color !== first) { win = false; break; }
        }
        if (!win) break;
    }
    
    if (win && hasBalls) {
        state.isLocked = true;
        if (!state.bestMoves[state.currentLevel] || state.moves < state.bestMoves[state.currentLevel]) {
            state.bestMoves[state.currentLevel] = state.moves;
        }
        state.streak++;
        state.stars += 5;
        saveProgress();
        setTimeout(showLevelComplete, 500);
    }
}

function showLevelComplete() {
    const modal = document.getElementById('levelComplete');
    document.getElementById('movesUsed').textContent = state.moves;
    document.getElementById('bestMoves').textContent = state.bestMoves[state.currentLevel] || '-';
    document.getElementById('resultStreak').textContent = state.streak;
    document.getElementById('menuStars').textContent = state.stars;
    document.getElementById('menuStreak').textContent = state.streak;
    document.getElementById('gameStreak').textContent = state.streak;
    
    // Show stars (always 3 for minimal version)
    document.querySelectorAll('.star').forEach(s => s.classList.add('active'));
    
    modal.classList.remove('hidden');
}

// ===== SAVE / LOAD =====
function saveProgress() {
    try {
        const data = {
            level: state.currentLevel,
            stars: state.stars,
            streak: state.streak,
            bestMoves: state.bestMoves,
            skin: state.skin,
            ownedSkins: state.ownedSkins
        };
        localStorage.setItem('colorSortProgress', JSON.stringify(data));
    } catch (e) {}
}

function loadProgress() {
    try {
        const raw = localStorage.getItem('colorSortProgress');
        if (!raw) return;
        const data = JSON.parse(raw);
        state.currentLevel = data.level || 1;
        state.stars = data.stars || 0;
        state.streak = data.streak || 0;
        state.bestMoves = data.bestMoves || {};
        state.skin = data.skin || 'default';
        state.ownedSkins = data.ownedSkins || ['default'];
        
        document.getElementById('menuLevel').textContent = state.currentLevel;
        document.getElementById('menuStars').textContent = state.stars;
        document.getElementById('menuStreak').textContent = state.streak;
        document.getElementById('gameStreak').textContent = state.streak;
        document.getElementById('shopStars').textContent = state.stars;
    } catch (e) {}
}

// ===== LEVEL MANAGEMENT =====
function loadLevel(level) {
    state.currentLevel = level;
    state.levelData = generateLevel(level);
    state.tubes = state.levelData.tubes.map(t => [...t]);
    state.moves = 0;
    state.history = [];
    state.selectedTube = null;
    state.isLocked = false;
    
    document.getElementById('levelDisplay').textContent = `Level ${level}`;
    document.getElementById('menuLevel').textContent = level;
    
    renderGame();
    hideAllModals();
    showScreen('game');
}

function nextLevel() {
    if (state.currentLevel < state.maxLevel) {
        loadLevel(state.currentLevel + 1);
    } else {
        alert('🎉 You completed all levels! More coming soon.');
        showScreen('menu');
        hideAllModals();
    }
}

// ===== SHOP =====
function buySkin(skin, cost) {
    if (state.ownedSkins.includes(skin)) {
        state.skin = skin;
        saveProgress();
        renderGame();
        updateShopUI();
        alert(`✨ ${skin} skin equipped!`);
        return;
    }
    if (state.stars >= cost) {
        state.stars -= cost;
        state.ownedSkins.push(skin);
        state.skin = skin;
        saveProgress();
        renderGame();
        updateShopUI();
        document.getElementById('menuStars').textContent = state.stars;
        document.getElementById('shopStars').textContent = state.stars;
        alert(`✨ ${skin} skin unlocked and equipped!`);
    } else {
        alert('⭐ Not enough stars! Keep playing to earn more.');
    }
}

function updateShopUI() {
    document.querySelectorAll('.shop-item').forEach(item => {
        const skin = item.dataset.skin;
        const btn = item.querySelector('.buyBtn');
        if (!btn) return;
        if (state.ownedSkins.includes(skin)) {
            btn.textContent = state.skin === skin ? '✓ Equipped' : 'Equip';
            btn.className = 'buyBtn' + (state.skin === skin ? ' equipped' : '');
        } else {
            const cost = parseInt(btn.textContent.match(/\d+/)?.[0] || 0);
            btn.textContent = `⭐ ${cost}`;
            btn.className = 'buyBtn';
        }
    });
}

// ===== LEVEL SELECT =====
function renderLevelGrid() {
    const grid = document.getElementById('levelGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 1; i <= state.maxLevel; i++) {
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        btn.textContent = i;
        
        if (i > state.currentLevel) btn.classList.add('locked');
        if (i < state.currentLevel) btn.classList.add('completed');
        if (i === state.currentLevel) btn.classList.add('current');
        if (state.bestMoves[i]) btn.textContent += ` ⭐`;
        
        btn.addEventListener('click', () => {
            if (i <= state.currentLevel) loadLevel(i);
        });
        grid.appendChild(btn);
    }
}

// ===== UI HELPERS =====
function updateUI() {
    document.getElementById('moveDisplay').textContent = `Moves: ${state.moves}`;
    document.getElementById('levelDisplay').textContent = `Level ${state.currentLevel}`;
    document.getElementById('gameStreak').textContent = state.streak;
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(id);
    if (screen) screen.classList.add('active');
}

function hideAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

// ============================================
// EVENT BINDING
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Game starting...');
    
    // Progress bar
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 100) { progress = 100; clearInterval(interval); }
        document.getElementById('progressFill').style.width = progress + '%';
    }, 100);
    
    loadProgress();
    
    // Menu buttons
    document.getElementById('playBtn').addEventListener('click', () => {
        loadLevel(state.currentLevel);
    });
    
    document.getElementById('levelsBtn').addEventListener('click', () => {
        renderLevelGrid();
        document.getElementById('levels').classList.remove('hidden');
    });
    
    document.getElementById('shopBtn').addEventListener('click', () => {
        document.getElementById('shopStars').textContent = state.stars;
        updateShopUI();
        document.getElementById('shop').classList.remove('hidden');
    });
    
    document.getElementById('leaderboardBtn').addEventListener('click', () => {
        document.getElementById('leaderboard').classList.remove('hidden');
    });
    
    document.getElementById('achievementsBtn').addEventListener('click', () => {
        document.getElementById('achievementsModal').classList.remove('hidden');
    });
    
    // Daily challenge (simplified)
    document.getElementById('dailyBtn').addEventListener('click', () => {
        document.getElementById('dailyModal').classList.remove('hidden');
    });
    
    document.getElementById('dailyPlayBtn').addEventListener('click', () => {
        loadLevel(1);
        hideAllModals();
    });
    
    // Game controls
    document.getElementById('menuBtn').addEventListener('click', () => {
        showScreen('menu');
        hideAllModals();
    });
    
    document.getElementById('undoBtn').addEventListener('click', undoMove);
    document.getElementById('resetBtn').addEventListener('click', resetLevel);
    document.getElementById('hintBtn').addEventListener('click', giveHint);
    document.getElementById('shuffleBtn').addEventListener('click', () => {
        if (!state.isLocked) {
            for (let i = 0; i < 3; i++) {
                const a = Math.floor(Math.random() * state.tubes.length);
                let b = Math.floor(Math.random() * state.tubes.length);
                while (b === a) b = Math.floor(Math.random() * state.tubes.length);
                const temp = state.tubes[a];
                state.tubes[a] = state.tubes[b];
                state.tubes[b] = temp;
            }
            renderGame();
        }
    });
    
    // Sound toggle
    document.getElementById('soundToggle').addEventListener('click', () => {
        state.soundEnabled = !state.soundEnabled;
        document.getElementById('soundToggle').textContent = state.soundEnabled ? '🔊' : '🔇';
    });
    
    // Level complete
    document.getElementById('nextBtn').addEventListener('click', nextLevel);
    document.getElementById('continueBtn').addEventListener('click', () => {
        hideAllModals();
        showScreen('menu');
    });
    
    document.getElementById('watchAdBtn').addEventListener('click', function() {
        state.stars += 10;
        document.getElementById('menuStars').textContent = state.stars;
        document.getElementById('shopStars').textContent = state.stars;
        saveProgress();
        alert('🎉 +10 bonus stars!');
        hideAllModals();
    });
    
    document.getElementById('shareBtn').addEventListener('click', function() {
        const text = `🎨 I completed level ${state.currentLevel} in ${state.moves} moves on Color Sort! Can you beat my score? 🏆`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                alert('📤 Score copied to clipboard! Share it with friends.');
            });
        } else {
            prompt('📤 Copy this text:', text);
        }
    });
    
    // Shop buy buttons
    document.querySelectorAll('.buyBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const skin = this.dataset.skin;
            const cost = parseInt(this.textContent.match(/\d+/)?.[0] || 0);
            buySkin(skin, cost);
        });
    });
    
    // Close buttons
    document.querySelectorAll('.closeBtn').forEach(btn => {
        btn.addEventListener('click', hideAllModals);
    });
    
    document.getElementById('refreshLeaderboard').addEventListener('click', () => {
        document.getElementById('leaderboardList').innerHTML = '<div class="lb-entry">🏆 You - Level ' + state.currentLevel + '</div>';
    });
    
    // Hide preloader and start
    setTimeout(() => {
        document.getElementById('preloader').classList.add('hidden');
        loadLevel(state.currentLevel);
        console.log('✅ Game ready!');
    }, 800);
});