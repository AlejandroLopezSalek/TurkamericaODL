// Simple Cookie Consent Logic
document.addEventListener('DOMContentLoaded', () => {
    const CONSENT_KEY = 'turkamerica_cookie_consent';

    // Check if user has already consented
    if (!localStorage.getItem(CONSENT_KEY)) {
        showCookieBanner();
    }

    function showCookieBanner() {
        if (document.getElementById('cookieConsentBanner')) return;

        const banner = document.createElement('div');
        banner.id = 'cookieConsentBanner';
        banner.className = 'fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 p-4 z-[9999] shadow-2xl transform translate-y-full transition-transform duration-500 will-change-transform';
        banner.innerHTML = `
            <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div class="text-slate-300 text-sm md:text-base text-center md:text-left">
                    <p>
                        Usamos cookies propias y de terceros para mejorar tu experiencia y mostrar anuncios personalizados. 
                        Al continuar navegando, aceptas nuestra <a href="/Privacy/" class="text-indigo-400 hover:text-indigo-300 underline">Política de Privacidad</a>.
                    </p>
                </div>
                <div class="flex gap-3">
                    <button id="acceptCookiesBtn" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors text-sm whitespace-nowrap">
                        Aceptar
                    </button>
                    <button id="closeCookieBtn" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-sm transition-colors">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        // Animate in - Double RAF or setTimeout ensures DOM paint first
        setTimeout(() => {
            banner.classList.remove('translate-y-full');
        }, 100);

        // Event Listeners
        document.getElementById('acceptCookiesBtn').addEventListener('click', () => {
            acceptCookies(banner);
        });

        document.getElementById('closeCookieBtn').addEventListener('click', () => {
            // Just close for this session, don't save consent
            banner.classList.add('translate-y-full');
            setTimeout(() => banner.remove(), 500);
        });
    }

    function acceptCookies(banner) {
        localStorage.setItem(CONSENT_KEY, 'true');
        banner.classList.add('translate-y-full');
        setTimeout(() => banner.remove(), 500);
    }
});
