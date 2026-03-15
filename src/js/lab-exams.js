/**
 * LabExams - AI Exam Controller for LabCapi/LabPanda
 */

class LabExams {
    constructor() {
        this.currentExam = null;
        this.userAnswers = {};
        this.history = JSON.parse(localStorage.getItem('lab_exam_history') || '[]');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkInitialHistory();
    }

    setupEventListeners() {
        // Mode Toggle
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => {
                    b.classList.remove('border-blue-500', 'bg-blue-500/10', 'text-blue-600', 'dark:text-blue-400');
                    b.classList.add('bg-slate-100', 'dark:bg-white/5', 'text-slate-600', 'dark:text-slate-400', 'border-transparent');
                });
                btn.classList.add('border-blue-500', 'bg-blue-500/10', 'text-blue-600', 'dark:text-blue-400');
                btn.classList.remove('bg-slate-100', 'dark:bg-white/5', 'text-slate-600', 'dark:text-slate-400', 'border-transparent');
                
                if (btn.dataset.mode === 'custom') {
                    document.getElementById('level-container').classList.add('hidden');
                    document.getElementById('prompt-container').classList.remove('hidden');
                } else {
                    document.getElementById('level-container').classList.remove('hidden');
                    document.getElementById('prompt-container').classList.add('hidden');
                }
            });
        });

        // Level Select
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Generate Btn
        document.getElementById('generate-exam-btn').addEventListener('click', () => this.handleGenerate());
        
        // History Btn
        document.getElementById('view-history-btn').addEventListener('click', () => this.showHistory());
    }

    async handleGenerate() {
        if (!this.checkLimit()) {
             return this.notify("Ya has generado un examen hoy. Vuelve mañana para un nuevo reto.", "warning");
        }

        const modeBtn = document.querySelector('.mode-btn.border-blue-500');
        const mode = modeBtn ? modeBtn.dataset.mode : 'classic';
        const level = document.querySelector('.level-btn.active')?.dataset.level || 'A1';
        const prompt = document.getElementById('exam-prompt').value.trim();
        const isPublic = document.getElementById('public-toggle').checked;

        this.setState('loading');

        try {
            const payload = { 
                level, 
                mode, 
                prompt: mode === 'custom' ? prompt : null,
                is_public: isPublic
            };

            const response = await fetch('/api/chat/lab/generate-exam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            this.currentExam = data;
            this.userAnswers = {};
            this.renderExam();
            this.saveToHistory(data);
        } catch (e) {
            console.error(e);
            this.notify("Error al generar: " + e.message, "error");
            this.setState('initial');
        }
    }

    renderExam() {
        this.setState('exam');
        const container = document.getElementById('exam-content');
        container.innerHTML = `<h2 class="text-2xl font-black text-slate-900 dark:text-white mb-8">${this.currentExam.title}</h2>`;
        
        const template = document.getElementById('question-template');

        this.currentExam.questions.forEach((q, idx) => {
            const clone = template.content.cloneNode(true);
            clone.querySelector('.q-number').textContent = idx + 1;
            clone.querySelector('.q-text').textContent = q.question;
            
            const optionsBox = clone.querySelector('.q-options');
            const inputBox = clone.querySelector('.q-input-container');

            if (q.type === 'multiple_choice') {
                q.options.forEach(opt => {
                    const btn = document.createElement('button');
                    btn.className = 'opt-btn p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-left hover:bg-blue-500 hover:text-white transition-all text-sm';
                    btn.textContent = opt;
                    btn.onclick = () => {
                        optionsBox.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('bg-blue-600', 'text-white', 'border-blue-600'));
                        btn.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
                        this.userAnswers[q.id] = opt;
                    };
                    optionsBox.appendChild(btn);
                });
            } else {
                optionsBox.classList.add('hidden');
                inputBox.classList.remove('hidden');
                inputBox.querySelector('input').addEventListener('change', (e) => {
                    this.userAnswers[q.id] = e.target.value;
                });
            }

            container.appendChild(clone);
        });

        const submitBtn = document.createElement('button');
        submitBtn.className = 'mt-12 w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 hover:-translate-y-1 transition-all';
        submitBtn.textContent = 'FINALIZAR Y CALIFICAR';
        submitBtn.onclick = () => this.gradeExam();
        container.appendChild(submitBtn);

        container.scrollIntoView({ behavior: 'smooth' });
    }

    async gradeExam() {
        this.setState('loading');
        try {
            const response = await fetch('/api/chat/lab/grade-exam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answers: this.userAnswers,
                    original_exam: this.currentExam
                })
            });
            const data = await response.json();
            this.renderResults(data);
        } catch (e) {
            this.notify("Error al calificar.", "error");
            this.setState('exam');
        }
    }

    renderResults(data) {
        this.setState('results');
        const container = document.getElementById('results-content');
        
        let html = `
            <div class="space-y-8 animate-slideUp">
                <div class="flex items-center gap-8 bg-blue-500/10 p-8 rounded-3xl border border-blue-500/20">
                    <div class="relative w-32 h-32 shrink-0">
                        <svg class="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="60" stroke="currentColor" stroke-width="8" fill="transparent" class="text-blue-500/10"></circle>
                            <circle cx="64" cy="64" r="60" stroke="currentColor" stroke-width="8" fill="transparent" stroke-dasharray="377" stroke-dashoffset="${377 - (377 * data.score / 100)}" class="text-blue-500"></circle>
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center text-4xl font-black text-slate-900 dark:text-white">${data.score}%</div>
                    </div>
                    <div>
                        <h3 class="text-2xl font-black text-slate-900 dark:text-white mb-2">Resultado Final</h3>
                        <p class="text-slate-600 dark:text-slate-400">${data.score >= 80 ? '¡Excelente trabajo! Dominas estos conceptos.' : data.score >= 60 ? 'Buen intento, pero hay margen de mejora.' : 'Sigue practicando, Capi te ayudará.'}</p>
                    </div>
                </div>

                <div class="space-y-4">
                    <h4 class="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">Feedback Detallado</h4>
                    ${data.feedback.map(f => `
                        <div class="p-5 rounded-2xl bg-white dark:bg-slate-800 border-l-4 ${f.status === 'correct' ? 'border-emerald-500 bg-emerald-500/5' : 'border-red-500 bg-red-500/5'}">
                            <p class="text-sm font-bold ${f.status === 'correct' ? 'text-emerald-600' : 'text-red-600'} mb-1">${f.status === 'correct' ? 'CORRECTO' : 'ERROR'}</p>
                            <p class="text-slate-700 dark:text-slate-300 text-sm">${f.explanation}</p>
                        </div>
                    `).join('')}
                </div>

                <div class="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl">
                    <div class="flex items-center gap-4 mb-3">
                        <i class="fas fa-magic text-xl"></i>
                        <h5 class="font-bold">Consejo de Capi:</h5>
                    </div>
                    <p class="italic text-sm opacity-90">"${data.capi_advice || data.panda_advice || "Continúa con esta racha diaria para notar el progreso en el idioma."}"</p>
                </div>
                
                <button onclick="location.reload()" class="w-full py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 font-black text-slate-500 hover:text-slate-900 transition-all">VOLVER AL LABORATORIO</button>
            </div>
        `;
        container.innerHTML = html;
        container.scrollIntoView({ behavior: 'smooth' });
    }

    setState(state) {
        ['initial', 'loading', 'exam', 'results'].forEach(s => {
            document.getElementById(`${s}-state`)?.classList.add('hidden');
            document.getElementById(`${s}-content`)?.classList.add('hidden');
        });

        if (state === 'loading') document.getElementById('loading-state').classList.remove('hidden');
        else if (state === 'exam') document.getElementById('exam-content').classList.remove('hidden');
        else if (state === 'results') document.getElementById('results-content').classList.remove('hidden');
        else document.getElementById('initial-state').classList.remove('hidden');
    }

    saveToHistory(exam) {
        const entry = {
            id: Date.now(),
            date: new Date().toISOString(),
            title: exam.title,
            exam: exam
        };
        this.history.unshift(entry);
        localStorage.setItem('lab_exam_history', JSON.stringify(this.history.slice(0, 5)));
        localStorage.setItem('last_exam_date', new Date().toDateString());
    }

    checkLimit() {
        const lastDate = localStorage.getItem('last_exam_date');
        return lastDate !== new Date().toDateString();
    }

    checkInitialHistory() {
        // Show last exam if generated today
        const lastDate = localStorage.getItem('last_exam_date');
        if (lastDate === new Date().toDateString() && this.history.length > 0) {
            // Option to see results of the day
        }
    }

    showHistory() {
        if (this.history.length === 0) return this.notify("No tienes exámenes registrados aún.", "info");
        
        let html = `<div class="p-6 space-y-4">
            <h3 class="font-bold text-lg mb-4">Tus últimos exámenes</h3>`;
        
        this.history.forEach(h => {
            const date = new Date(h.date).toLocaleDateString();
            html += `<div class="p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex justify-between items-center">
                <div>
                    <div class="font-bold text-sm">${h.title}</div>
                    <div class="text-[10px] text-slate-500">${date}</div>
                </div>
                <button class="text-blue-500 font-bold text-xs">Ver Reto</button>
            </div>`;
        });
        html += `</div>`;
        
        // This would traditionally use a modal or replace workspace
        document.getElementById('exam-workspace').innerHTML = html;
    }

    notify(msg, type) {
        if (globalThis.toast) globalThis.toast(msg, type);
        else alert(msg);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.labExams = new LabExams();
});
