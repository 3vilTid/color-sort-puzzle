// ============================================
// MONETIZATION - Premium
// ============================================

function showRewardedAd(callback) {
    console.log('📺 Showing rewarded ad...');
    // Show ad UI
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.9);
        display: flex; flex-direction: column; justify-content: center;
        align-items: center; z-index: 9999; color: white;
        font-size: 1.5rem; gap: 20px;
    `;
    overlay.innerHTML = `
        <span style="font-size:3rem;">📺</span>
        <span>Watch ad for rewards...</span>
        <div style="width:200px;height:4px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;">
            <div id="adProgress" style="height:100%;width:0%;background:#e94560;transition:width 0.1s;"></div>
        </div>
        <button id="skipAdBtn" style="padding:10px 30px;background:#2d2d44;border:none;color:#fff;border-radius:12px;font-size:1rem;cursor:pointer;">✕ Skip</button>
    `;
    document.body.appendChild(overlay);
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 2;
        const el = document.getElementById('adProgress');
        if (el) el.style.width = Math.min(progress, 100) + '%';
        if (progress >= 100) {
            clearInterval(interval);
            overlay.innerHTML = '✅ Ad complete! Claim your reward.';
            setTimeout(() => {
                overlay.remove();
                if (callback) callback();
            }, 500);
        }
    }, 50);
    
    document.getElementById('skipAdBtn')?.addEventListener('click', () => {
        clearInterval(interval);
        overlay.remove();
        if (callback) callback();
    });
}

function showInterstitialAd() {
    console.log('📺 Interstitial ad shown');
}

window.showRewardedAd = showRewardedAd;
window.showInterstitialAd = showInterstitialAd;