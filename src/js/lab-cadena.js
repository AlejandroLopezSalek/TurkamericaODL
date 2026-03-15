/**
 * LabCadena - Suffix Chain Visualization Controller
 */

class LabCadena {
    constructor() {
        this.init();
    }

    init() {
        document.getElementById('analyze-chain-btn').onclick = () => this.runAnalysis();
        document.querySelectorAll('.example-card').forEach(card => {
            card.onclick = () => {
                document.getElementById('cadena-input').value = card.dataset.word;
                this.runAnalysis();
            };
        });
    }

    async runAnalysis() {
        const text = document.getElementById('cadena-input').value.trim();
        if (!text) return;

        const btn = document.getElementById('analyze-chain-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const response = await fetch(`/api/chat/lab/analyze-dna?text=${encodeURIComponent(text)}`);
            const data = await response.json();

            this.renderChain(data);
        } catch (e) {
            console.error(e);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-search"></i> <span class="hidden md:inline">ANALIZAR</span>';
        }
    }

    renderChain(data) {
        const container = document.getElementById('chain-container');
        container.innerHTML = '';

        // Add Root
        const rootText = data.root?.text || data.root || '...';
        container.appendChild(this.createNode(rootText, 'Raíz', true));

        // Add Suffixes
        if (data.suffixes) {
            data.suffixes.forEach(s => {
                container.appendChild(this.createConnector());
                container.appendChild(this.createNode(s.text, s.meaning));
            });
        }

        document.getElementById('res-meaning').textContent = data.overall_meaning;
        document.getElementById('chain-meaning').classList.remove('hidden');
    }

    createNode(text, label, isRoot = false) {
        const div = document.createElement('div');
        div.className = `chain-node ${isRoot ? 'root' : ''} group`;
        div.innerHTML = `${text} <span class="node-label animate-fadeIn">${label}</span>`;
        return div;
    }

    createConnector() {
        const div = document.createElement('div');
        div.className = 'text-slate-700 text-2xl mx-2 animate-fadeIn';
        div.innerHTML = '<i class="fas fa-link opacity-30"></i>';
        return div;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    globalThis.labCadena = new LabCadena();
});
