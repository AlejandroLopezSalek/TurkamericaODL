/**
 * LabStory - AI Storytelling Controller for LabCapi/LabPanda
 */

class LabStory {
    currentStory = null;
    currentChapter = 0;
    history = JSON.parse(localStorage.getItem('lab_story_history') || '[]');

    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderHistory();
    }

    setupEventListeners() {
        document.getElementById('start-story-btn').onclick = () => this.startNewStory();
    }

    async startNewStory() {
        if (!this.checkLimit()) {
            return this.notify("Solo puedes generar una historia al día. ¡Vuelve mañana!", "warning");
        }

        const genre = document.getElementById('story-genre').value;
        const charName = document.getElementById('character-name').value.trim() || 'Un aventurero';
        const isPublic = document.getElementById('story-public-toggle').checked;

        this.setState('loading');

        try {
            const response = await fetch('/api/chat/lab/start-story', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ genre, charName, isPublic })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            this.currentStory = data;
            this.currentChapter = 1;
            this.renderChapter(data.first_chapter);
            this.saveToHistory(data);
        } catch (e) {
            console.error(e);
            this.notify("Fallo al iniciar historia: " + e.message, "error");
            this.setState('placeholder');
        }
    }

    renderChapter(chapter) {
        this.setState('content');
        const textContainer = document.getElementById('story-text');
        const optionsContainer = document.getElementById('story-options');

        // Typing effect simulation or direct injection
        textContainer.innerHTML = `<div class="animate-fadeIn">${marked.parse(chapter.text)}</div>`;
        
        optionsContainer.innerHTML = '';
        chapter.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'story-option-btn text-slate-900 dark:text-white';
            btn.innerHTML = `<span class="block text-[10px] uppercase opacity-50 mb-1">Opción</span> ${opt}`;
            btn.onclick = () => this.nextChapter(opt);
            optionsContainer.appendChild(btn);
        });

        document.getElementById('story-display').scrollIntoView({ behavior: 'smooth' });
    }

    async nextChapter(selectedOption) {
        this.setState('loading');
        try {
            const response = await fetch('/api/chat/lab/continue-story', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    story_id: this.currentStory.id,
                    option: selectedOption,
                    chapter_index: this.currentChapter
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            this.currentChapter++;
            this.renderChapter(data.next_chapter);
        } catch (e) {
            console.error(e);
            this.notify("Error al continuar.", "error");
            this.setState('content');
        }
    }

    setState(state) {
        document.getElementById('story-placeholder').classList.add('hidden');
        document.getElementById('story-loading').classList.add('hidden');
        document.getElementById('story-content').classList.add('hidden');

        if (state === 'loading') document.getElementById('story-loading').classList.remove('hidden');
        else if (state === 'content') document.getElementById('story-content').classList.remove('hidden');
        else document.getElementById('story-placeholder').classList.remove('hidden');
    }

    saveToHistory(story) {
        const entry = {
            id: story.id,
            date: new Date().toISOString(),
            title: story.title || 'Nueva Historia',
            genre: story.genre
        };
        this.history.unshift(entry);
        localStorage.setItem('lab_story_history', JSON.stringify(this.history.slice(0, 5)));
        localStorage.setItem('last_story_date', new Date().toDateString());
        this.renderHistory();
    }

    checkLimit() {
        const lastDate = localStorage.getItem('last_story_date');
        return lastDate !== new Date().toDateString();
    }

    renderHistory() {
        const list = document.getElementById('history-list');
        if (this.history.length === 0) return;

        list.innerHTML = '';
        this.history.forEach(h => {
             const div = document.createElement('div');
             div.className = 'p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 cursor-pointer hover:bg-emerald-500/10 transition-all';
             div.innerHTML = `
                <div class="font-bold text-xs text-slate-800 dark:text-white truncate">${h.title}</div>
                <div class="text-[9px] text-slate-500">${new Date(h.date).toLocaleDateString()} • ${h.genre}</div>
             `;
             list.appendChild(div);
        });
    }

    notify(msg, type) {
        if (globalThis.toast) globalThis.toast(msg, type);
        else alert(msg);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    globalThis.labStory = new LabStory();
});
