/**
 * LabAnalysis - Sentence Analysis Controller
 */

class LabAnalysis {
    constructor() {
        this.init();
    }

    init() {
        document.getElementById('run-analysis-btn').onclick = () => this.runAnalysis();
    }

    async runAnalysis() {
        const text = document.getElementById('analysis-input').value.trim();
        if (!text) return this.notify("Ingresa una frase para analizar.", "warning");

        if (!this.checkLimit()) {
            return this.notify("Ya has realizado tu análisis detallado del día.", "warning");
        }

        this.setState('loading');

        try {
            const response = await fetch(`/api/chat/lab/analyze-dna?text=${encodeURIComponent(text)}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            this.renderResults(data);
            this.saveLimit();
        } catch (e) {
            this.notify("Error en el análisis: " + e.message, "error");
            this.setState('initial');
        }
    }

    renderResults(data) {
        this.setState('results');
        
        document.getElementById('res-meaning').textContent = data.overall_meaning;
        document.getElementById('res-culture').innerHTML = marked.parse(data.cultural_context || data.explanation || "No hay notas adicionales de contexto cultural para esta frase.");

        const breakdown = document.getElementById('res-breakdown');
        breakdown.innerHTML = '';
        
        const items = data.analysis || data.breakdown || [];
        const template = document.getElementById('word-item-template');

        items.forEach(item => {
            const clone = template.content.cloneNode(true);
            const template = document.getElementById('word-item-template');
            clone.querySelector('.text-3xl').textContent = item.text || item.char;
            clone.querySelector('.role-label').textContent = item.type || item.radical || 'Sintaxis';
            clone.querySelector('.meaning-text').textContent = item.meaning || item.explanation;
            clone.querySelector('.note-text').textContent = item.note || '';

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

    checkLimit() {
        return localStorage.getItem('last_analysis_date') !== new Date().toDateString();
    }

    saveLimit() {
        localStorage.setItem('last_analysis_date', new Date().toDateString());
    }

    notify(msg, type) {
        if (globalThis.toast) globalThis.toast(msg, type);
        else alert(msg);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    globalThis.labAnalysis = new LabAnalysis();
});
