// ========================================
// AD BANNER LOGIC
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initAdBanner();
});

const AD_COOLDOWN_HOURS = 24;
const AD_APPEAR_DELAY_MS = 5000; // 5 seconds
const AD_STORAGE_KEY = 'turkamerica_ad_dismissed';

function initAdBanner() {
    // Check if ad should be shown
    if (shouldShowAd()) {
        setTimeout(createAndShowBanner, AD_APPEAR_DELAY_MS);
    }
}

function shouldShowAd() {
    const dismissedAt = localStorage.getItem(AD_STORAGE_KEY);
    if (!dismissedAt) return true;

    const now = new Date().getTime();
    const dismissedTime = parseInt(dismissedAt, 10);
    const hoursSinceDismissal = (now - dismissedTime) / (1000 * 60 * 60);

    return hoursSinceDismissal > AD_COOLDOWN_HOURS;
}

function createAndShowBanner() {
    // Check if it already exists to avoid duplicates
    if (document.getElementById('adBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'adBanner';
    // Style: Fixed bottom-right (desktop) or bottom (mobile), z-index high
    banner.className = 'fixed bottom-4 right-4 left-4 md:left-auto md:w-80 bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 rounded-xl p-4 z-50 transform translate-y-10 opacity-0 transition-all duration-500 flex flex-col gap-3';

    // Banner Content
    banner.innerHTML = `
        <div class="flex items-start justify-between">
            <h4 class="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Patrocinado</h4>
            <button id="closeAdBtn" class="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                <i class="fas fa-times text-xs"></i>
            </button>
        </div>
        
        <!-- Ad Content Area -->
        <div class="w-full flex justify-center overflow-hidden">
            <!-- Google AdSense Unit -->
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-7159335195531967"
                 data-ad-slot="4494772953"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
            <script>
                 (adsbygoogle = window.adsbygoogle || []).push({});
            </script>
        </div>
    `;

    document.body.appendChild(banner);

    // Animate In
    // Small delay to allow DOM render before transition
    requestAnimationFrame(() => {
        banner.classList.remove('translate-y-10', 'opacity-0');
    });

    // Close Handler
    document.getElementById('closeAdBtn').onclick = (e) => {
        e.stopPropagation();
        dismissAd(banner);
    };
}

function dismissAd(banner) {
    // Animate Out
    banner.classList.add('translate-y-10', 'opacity-0');

    // Remove from DOM after animation
    setTimeout(() => {
        banner.remove();
    }, 500);

    // Save timestamp
    localStorage.setItem(AD_STORAGE_KEY, new Date().getTime().toString());
}
