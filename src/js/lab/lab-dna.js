/**
 * LabDNA - Turkish Sentence/Suffix DNA Controller
 */

class LabDNA {
    constructor() {
        this.init();
    }

    init() {
        if (globalThis.AuthService && !globalThis.AuthService.isLoggedIn()) {
            const currentUrl = encodeURIComponent(globalThis.location.pathname);
            const msg = window.I18N?.messages?.login_required || "Debes iniciar sesión para acceder al bio-análisis.";
            this.notify(msg, "warning");
            const path = window.location.pathname;
            let langPrefix = "";
            if (path.startsWith("/en/")) langPrefix = "/en";
            else if (path.startsWith("/pt/")) langPrefix = "/pt";
            setTimeout(() => {
                globalThis.location.href = `${langPrefix}/login/?returnUrl=${currentUrl}`;
            }, 1500);
            return;
        }
        const btn = document.getElementById('run-dna-btn');
        if (btn) btn.onclick = () => this.runAnalysis();
    }

    async runAnalysis() {
        const text = document.getElementById('dna-input').value.trim();
        if (!text) {
            return this.notify(window.I18N?.messages?.error_input || "Por favor, ingresa una palabra o frase.", "warning");
        }

        this.setState('loading');

        try {
            const headers = globalThis.AuthService?.getAuthHeaders() || {};
            const response = await fetch(`/api/chat/lab/analyze-dna?text=${encodeURIComponent(text)}`, { headers });
            if (response.status === 401) {
                this.notify(window.I18N?.messages?.session_expired || "Tu sesión ha expirado. Inicia sesión de nuevo.", "error");
                const path = window.location.pathname;
                let langPrefix = "";
                if (path.startsWith("/en/")) langPrefix = "/en";
                else if (path.startsWith("/pt/")) langPrefix = "/pt";
                setTimeout(() => window.location.href = `${langPrefix}/login/`, 2000);
                return;
            }
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            this.renderResults(data);
        } catch (e) {
            console.error(e);
            this.notify(window.I18N?.messages?.error_gen || "Error en el análisis.", "error");
            this.setState('initial');
        }
    }

    renderResults(data) {
        this.setState('results');
        document.getElementById('res-meaning').textContent = data.overall_meaning;

        const container = document.getElementById('res-analysis');
        container.innerHTML = '';
        
        const template = document.getElementById('dna-card-template');

        // 1. Render Root
        if (data.root) {
            const rootClone = template.content.cloneNode(true);
            rootClone.querySelector('.char-display').textContent = data.root.text;
            rootClone.querySelector('.radical-label').textContent = window.I18N?.root_label || "Root: ";
            rootClone.querySelector('.radical-meaning').textContent = data.root.meaning;
            rootClone.querySelector('.explanation-text').textContent = "";
            container.appendChild(rootClone);
        }

        // 2. Render Suffixes
        (data.suffixes || []).forEach(item => {
            const clone = template.content.cloneNode(true);
            clone.querySelector('.char-display').textContent = item.text;
            clone.querySelector('.radical-label').textContent = window.I18N?.suffix_label || "Suffix: ";
            clone.querySelector('.radical-meaning').textContent = item.type;
            clone.querySelector('.explanation-text').textContent = item.meaning;
            container.appendChild(clone);
        });

        document.getElementById('dna-results').scrollIntoView({ behavior: 'smooth' });
    }

    setState(state) {
        document.getElementById('dna-loading').classList.add('hidden');
        document.getElementById('dna-results').classList.add('hidden');

        if (state === 'loading') document.getElementById('dna-loading').classList.remove('hidden');
        else if (state === 'results') document.getElementById('dna-results').classList.remove('hidden');
    }

    /**
     * Browser Native TTS playback
     */
    async playTTS(text) {
        if (!text) return;
        try {
            if (!('speechSynthesis' in window)) throw new Error('Not supported');
            window.speechSynthesis.cancel();
            const ut = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            const tr = voices.find(v => v.lang.includes('tr-TR')) || voices.find(v => v.lang.includes('tr'));
            if (tr) ut.voice = tr;
            ut.lang = 'tr-TR';
            ut.rate = 0.85;
            window.speechSynthesis.speak(ut);
        } catch (e) {
            console.warn('TTS failed:', e);
            new Audio(`/api/chat/tts?text=${encodeURIComponent(text)}`).play().catch(() => {});
        }
    }

    notify(msg, type) {
        if (globalThis.toast) globalThis.toast(msg, type); else alert(msg);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    globalThis.labDna = new LabDNA();
});
