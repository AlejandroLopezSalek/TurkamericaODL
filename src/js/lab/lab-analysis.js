/**
 * LabAnalysis - Turkish Sentence/Culture Analysis Controller
 */

class LabAnalysis {
    constructor() {
        this.init();
    }

    init() {
        const btn = document.getElementById('run-analysis-btn');
        if (btn) btn.onclick = () => this.runAnalysis();
    }

    async runAnalysis() {
        const text = document.getElementById('analysis-input').value.trim();
        if (!text) {
            return this.notify(window.I18N?.messages?.error_input || "Por favor, ingresa una frase para analizar.", "warning");
        }

        this.setState('loading');

        try {
            const headers = globalThis.AuthService?.getAuthHeaders() || {};
            // Using same endpoint as DNA but specifically for cultural context
            const response = await fetch(`/api/chat/lab/analyze-dna?text=${encodeURIComponent(text)}`, { headers });
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
        
        // Narrative description or cultural notes
        const cultureBox = document.getElementById('res-culture');
        if (cultureBox) {
            cultureBox.innerHTML = data.explanation || data.cultural_notes || "No hay notas adicionales.";
        }

        const breakdown = document.getElementById('res-breakdown');
        breakdown.innerHTML = '';
        const template = document.getElementById('word-item-template');

        (data.analysis || []).forEach(item => {
            const clone = template.content.cloneNode(true);
            const valEl = clone.querySelector('.word-val') || clone.querySelector('.text-3xl');
            if (valEl) valEl.textContent = item.part || item.char || item.text;
            
            const roleEl = clone.querySelector('.role-label');
            if (roleEl) roleEl.textContent = item.radical || item.type || 'Sintaxis';
            
            const meanEl = clone.querySelector('.meaning-text');
            if (meanEl) meanEl.textContent = item.explanation || item.meaning || item.sub_meaning;
            
            const noteEl = clone.querySelector('.note-text');
            if (noteEl) noteEl.textContent = item.note || '';
            
            breakdown.appendChild(clone);
        });

        document.getElementById('analysis-results').scrollIntoView({ behavior: 'smooth' });
    }

    setState(state) {
        document.getElementById('analysis-loading').classList.add('hidden');
        document.getElementById('analysis-results').classList.add('hidden');

        if (state === 'loading') document.getElementById('analysis-loading').classList.remove('hidden');
        else if (state === 'results') document.getElementById('analysis-results').classList.remove('hidden');
    }

    notify(msg, type) {
        if (globalThis.toast) globalThis.toast(msg, type); else alert(msg);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    globalThis.labAnalysis = new LabAnalysis();
});
