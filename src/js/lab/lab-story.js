/**
 * LabStory - Turkish AI Storytelling Controller (Synced with PandaLatam)
 */

class LabStory {
    storyHistory = [];
    currentChapterIndex = 0;
    isBookMode = false;
    showText = localStorage.getItem('story_show_text') !== 'false';
    currentDisplayMode = localStorage.getItem('story_display_mode') || 'full';

    constructor() {
        this.init();
    }

    async init() {
        document.getElementById('start-story-btn').onclick = () => this.startNewStory();
        
        // Close buttons (main and dropdown)
        const closeFn = () => this.clearSession();
        if (document.getElementById('close-story-btn')) document.getElementById('close-story-btn').onclick = closeFn;
        if (document.getElementById('close-story-btn-alt')) document.getElementById('close-story-btn-alt').onclick = closeFn;
        
        // Pagination
        document.getElementById('prev-chapter-btn').onclick = () => this.paginate(-1);
        document.getElementById('next-chapter-btn').onclick = () => this.paginate(1);

        // Toggle Text
        const toggleBtn = document.getElementById('toggle-text-btn');
        if (toggleBtn) {
            toggleBtn.onclick = () => this.toggleText();
            this.updateToggleBtnUI();
        }

        // Mode toggle listeners
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.onclick = () => this.setDisplayMode(btn.dataset.mode);
        });

        this.fetchHistory();
        this.checkActiveStory();
        this.setupGenreListener();
    }

    setupGenreListener() {
        const genreSelect = document.getElementById('story-genre');
        const customContainer = document.getElementById('custom-genre-container');
        if (!genreSelect || !customContainer) return;

        const handleGenreChange = (val) => {
            if (val === 'custom') {
                customContainer.classList.remove('hidden');
            } else {
                customContainer.classList.add('hidden');
            }
        };

        genreSelect.addEventListener('change', (e) => handleGenreChange(e.target.value));
        handleGenreChange(genreSelect.value);
    }

    async fetchHistory() {
        try {
            const headers = globalThis.AuthService?.getAuthHeaders() || {};
            const res = await fetch('/api/chat/lab/stories', { headers });
            const data = await res.json();
            if (Array.isArray(data)) {
                this.history = data;
                this.renderHistory();
            }
        } catch (e) {
            console.error("Error fetching history:", e);
        }
    }

    async checkActiveStory() {
        try {
            const headers = globalThis.AuthService?.getAuthHeaders() || {};
            const res = await fetch('/api/chat/lab/current-active-story', { headers });
            const data = await res.json();
            if (data.active) {
                this.currentStory = { id: data.story.id, title: data.story.title, level: data.story.level };
                this.isBookMode = false;
                this.renderChapter(data.story.current_chapter);
            }
        } catch (e) {
            console.error("Error resuming story:", e);
            this.setState('placeholder');
        }
    }

    async startNewStory() {
        const lastDate = localStorage.getItem('last_story_capi_date');
        if (lastDate === new Date().toDateString() && globalThis.AuthService?.getCurrentUser()?.role !== 'admin') {
            return this.notify(window.I18N?.limit_reached || "Solo puedes generar una historia al día. ¡Vuelve mañana!", "warning");
        }

        let genre = document.getElementById('story-genre').value;
        if (genre === 'custom') {
            const customValue = document.getElementById('custom-genre').value.trim();
            if (!customValue) return this.notify("Por favor, ingresa un género para tu historia.", "warning");
            genre = customValue;
        }
        const charName = document.getElementById('character-name').value.trim() || 'Un aventurero';
        const userPrompt = document.getElementById('story-prompt').value.trim();
        const level = document.getElementById('story-level').value;
        const isPublic = document.getElementById('story-public-toggle').checked;

        this.setState('loading');

        try {
            const headers = globalThis.AuthService?.getAuthHeaders() || { 'Content-Type': 'application/json' };
            const lang = document.documentElement.lang || 'es';
            const response = await fetch('/api/chat/lab/start-story', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ genre, charName, userPrompt, level, is_public: isPublic, lang })
            });

            const data = await response.json();
            this.currentStory = data;
            this.isBookMode = false;
            this.renderChapter(data.first_chapter);
            localStorage.setItem('last_story_capi_date', new Date().toDateString());
            this.fetchHistory(); 
        } catch (e) {
            console.error(e);
            this.notify("Error al iniciar historia. Verifica tu conexión.", "error");
            this.setState('placeholder');
        }
    }

    renderChapter(chapter) {
        if (!chapter) return;
        this.currentChapterData = chapter;
        this.setState('content');
        document.getElementById('story-controls').classList.remove('hidden');

        const pag = document.getElementById('story-pagination');
        if (this.isBookMode && this.storyHistory.length > 1) {
            pag.classList.remove('hidden');
            document.getElementById('chapter-number').innerText = `Página ${this.currentChapterIndex + 1} de ${this.storyHistory.length}`;
            document.getElementById('prev-chapter-btn').disabled = this.currentChapterIndex === 0;
            document.getElementById('next-chapter-btn').disabled = this.currentChapterIndex === this.storyHistory.length - 1;
        } else {
            pag.classList.add('hidden');
        }

        const narrativeContainer = document.getElementById('story-narrative');
        const chineseContainer = document.getElementById('story-chinese');
        const optionsContainer = document.getElementById('story-options');

        if (this.showText) {
            narrativeContainer.classList.remove('hidden');
            narrativeContainer.innerHTML = `<p class="mb-6 italic text-slate-500">${chapter.text}</p>`;
        } else {
            narrativeContainer.classList.add('hidden');
            narrativeContainer.innerHTML = '';
        }

        chineseContainer.innerHTML = '';
        if (chapter.segments && Array.isArray(chapter.segments)) {
            chapter.segments.forEach(seg => {
                chineseContainer.innerHTML += this.formatSegment(seg);
            });
        }
        
        optionsContainer.innerHTML = '';
        const isLastChapter = this.isBookMode ? (this.currentChapterIndex === this.storyHistory.length - 1) : true;
        
        if (isLastChapter && chapter.options && Array.isArray(chapter.options)) {
            chapter.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'story-option-btn text-slate-900 dark:text-white p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-left hover:bg-blue-600 hover:text-white transition-all font-bold';
                btn.innerHTML = `<span class="block text-[10px] uppercase opacity-50 mb-1">Opción</span> ${opt}`;
                btn.onclick = () => this.nextChapter(opt);
                optionsContainer.appendChild(btn);
            });
        }

        this.updateModeUI();
        document.getElementById('story-display').scrollIntoView({ behavior: 'smooth' });
    }

    formatSegment(seg) {
        const mode = this.currentDisplayMode;
        const ttsBtn = `<button onclick="globalThis.labStory.playTTS(this.closest('.segment-container').dataset.text)" class="ml-2 text-slate-300 hover:text-blue-500 transition-colors text-xs">
            <i class="fas fa-volume-up"></i>
        </button>`;

        if (mode === 'hz') {
            return `
                <div class="segment-container flex items-center group mb-2" data-text="${seg.hz}">
                    <div class="segment-box flex flex-col items-center">
                        <span class="pinyin-text text-[9px] md:text-[10px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-0.5">${seg.py}</span>
                        <span class="chinese-text text-2xl md:text-3xl font-black text-slate-800 dark:text-white border-b-2 border-dotted border-blue-200">${seg.hz}</span>
                    </div>
                    ${ttsBtn}
                </div>`;
        }
        if (mode === 'py') {
            return `
                <div class="segment-container flex items-center group mb-2" data-text="${seg.hz}">
                    <div class="segment-box flex flex-col items-center">
                        <span class="chinese-text text-[10px] md:text-sm text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity mb-0.5">${seg.hz}</span>
                        <span class="pinyin-text text-lg md:text-xl text-blue-600 font-black border-b border-blue-200">${seg.py}</span>
                    </div>
                    ${ttsBtn}
                </div>`;
        }
        return `
            <div class="segment-container inline-flex items-center group relative cursor-help border-b-2 border-dotted border-blue-400 pb-0.5 mr-4 mb-2" data-text="${seg.hz}">
                <ruby class="text-2xl md:text-3xl font-medium text-slate-900 dark:text-white">
                    ${seg.hz}
                    <rt class="text-[10px] md:text-xs text-blue-500 font-bold mb-1">${seg.py.trim()}</rt>
                </ruby>
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-xl shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50">
                    <div class="text-[9px] font-bold text-blue-600 mb-1 uppercase tracking-widest">${seg.tr}</div>
                    ${seg.note ? `<div class="text-[10px] text-slate-500 leading-tight">${seg.note}</div>` : ''}
                    <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-slate-800"></div>
                </div>
                ${ttsBtn}
            </div>`;
    }

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

    toggleText() {
        this.showText = !this.showText;
        localStorage.setItem('story_show_text', this.showText);
        this.updateToggleBtnUI();
        this.renderChapter(this.currentChapterData);
    }

    updateToggleBtnUI() {
        const btn = document.getElementById('toggle-text-btn');
        if (!btn) return;
        btn.innerHTML = this.showText ? 
            `<i class="fas fa-eye-slash mr-2"></i> ${window.I18N?.hide_text || 'Ocultar Texto'}` : 
            `<i class="fas fa-eye mr-2"></i> ${window.I18N?.show_text || 'Mostrar Texto'}`;
    }

    setDisplayMode(mode) {
        this.currentDisplayMode = mode;
        localStorage.setItem('story_display_mode', mode);
        this.renderChapter(this.currentChapterData);
    }

    updateModeUI() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            const isActive = btn.dataset.mode === this.currentDisplayMode;
            btn.className = `mode-btn px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${isActive ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`;
        });
    }

    async loadStory(storyId) {
        this.setState('loading');
        try {
            const headers = globalThis.AuthService?.getAuthHeaders() || {};
            const res = await fetch(`/api/chat/lab/story/${storyId}`, { headers });
            const data = await res.json();
            if (data.active) {
                this.currentStory = { id: data.story.id, title: data.story.title };
                this.storyHistory = data.story.history
                    .filter(h => h.role === 'assistant')
                    .map(h => h.content_data);
                this.isBookMode = true;
                this.currentChapterIndex = this.storyHistory.length - 1;
                this.renderChapter(this.storyHistory[this.currentChapterIndex]);
            } else {
                this.notify("No se pudo encontrar la historia.");
                this.setState('placeholder');
            }
        } catch (e) {
            this.setState('placeholder');
        }
    }

    paginate(dir) {
        const newIndex = this.currentChapterIndex + dir;
        if (newIndex >= 0 && newIndex < this.storyHistory.length) {
            this.currentChapterIndex = newIndex;
            this.renderChapter(this.storyHistory[this.currentChapterIndex]);
        }
    }

    async nextChapter(selectedOption) {
        this.setState('loading');
        try {
            const headers = globalThis.AuthService?.getAuthHeaders() || { 'Content-Type': 'application/json' };
            const lang = document.documentElement.lang || 'es';
            const response = await fetch('/api/chat/lab/continue-story', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ story_id: this.currentStory.id, option: selectedOption, lang })
            });

            const data = await response.json();
            if (response.status === 403) {
                this.notify(data.message || data.error, "info");
                this.setState('content');
                return;
            }
            this.renderChapter(data.next_chapter);
        } catch (e) {
            this.notify("Error al continuar.", "error");
            this.setState('content');
        }
    }

    async clearSession() {
        this.currentStory = null;
        this.currentChapterData = null;
        this.storyHistory = [];
        this.isBookMode = false;
        this.setState('placeholder');
        document.getElementById('story-controls').classList.add('hidden');
        try {
            const headers = globalThis.AuthService?.getAuthHeaders() || {};
            await fetch('/api/chat/lab/active-story', { method: 'DELETE', headers });
        } catch (e) {}
    }

    async deleteStoryFromHistory(storyId) {
        if (!confirm("¿Seguro que quieres eliminar esta historia?")) return;
        try {
            const headers = globalThis.AuthService?.getAuthHeaders() || {};
            const res = await fetch(`/api/chat/lab/story/${storyId}`, { method: 'DELETE', headers });
            const data = await res.json();
            if (data.success) {
                await this.fetchHistory();
                if (this.currentStory?.id === storyId) this.clearSession();
            }
        } catch (e) {}
    }

    setState(state) {
        ['placeholder', 'loading', 'content'].forEach(s => document.getElementById(`story-${s}`).classList.add('hidden'));
        document.getElementById(`story-${state}`).classList.remove('hidden');
    }

    renderHistory() {
        const list = document.getElementById('history-list');
        list.innerHTML = '';
        if (!this.history || this.history.length === 0) return;
        this.history.forEach(h => {
             const div = document.createElement('div');
             div.innerHTML = `
                <div class="flex justify-between items-center group/item p-2 hover:bg-blue-500/10 rounded-xl cursor-pointer">
                    <div>
                        <div class="font-bold text-xs truncate">${h.title}</div>
                        <div class="text-[9px] text-slate-500">${new Date(h.date).toLocaleDateString()}</div>
                    </div>
                </div>
            `;
             div.onclick = (e) => this.loadStory(h.id);
             list.appendChild(div);
        });
    }

    notify(msg, type = 'info') {
        if (globalThis.toast) globalThis.toast(msg, type); else alert(msg);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    globalThis.labStory = new LabStory();
});
