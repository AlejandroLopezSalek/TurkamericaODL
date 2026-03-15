// ========================================
// GLOSARIO DE PALABRAS
// ========================================

(function () {
    'use strict';

    const LEVEL_COLORS = {
        A1: { bg: 'bg-green-500', text: 'A1 – Principiante' },
        A2: { bg: 'bg-emerald-500', text: 'A2 – Elemental' },
        B1: { bg: 'bg-blue-500', text: 'B1 – Intermedio' },
        B2: { bg: 'bg-indigo-500', text: 'B2 – Intermedio Alto' },
        C1: { bg: 'bg-purple-500', text: 'C1 – Avanzado' }
    };

    let pastWords = [];

    const getEl = (id) => document.getElementById(id);

    function escHtml(str) {
        return String(str ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;');
    }

    async function init() {
        const container = getEl('glossaryContainer');
        if (!container) return;

        try {
            const res = await fetch('/api/chat/past-words');
            if (!res.ok) throw new Error('Network response was not ok');
            pastWords = await res.json();

            renderGlossary(pastWords, container);
        } catch (err) {
            console.error('[Glossary] Error loading past words:', err);
            container.innerHTML = `
                <div class="text-center py-20 text-slate-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4 text-red-400"></i>
                    <p class="text-lg">Error al cargar el glosario. Por favor, intenta más tarde.</p>
                </div>
            `;
        }

        const modal = getEl('wordModal');
        if (modal) {
            document.body.appendChild(modal); // Move to body to ensure fixed positioning covers the whole screen
        }

        // Setup modal close
        getEl('closeWordBg')?.addEventListener('click', closeModal);
        getEl('closeWordBtn')?.addEventListener('click', closeModal);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    }

    function renderGlossary(words, container) {
        if (!words || words.length === 0) {
            container.innerHTML = '<p class="text-center text-slate-500 py-10">Aún no hay palabras en el glosario.</p>';
            return;
        }

        // Group by first letter
        const groups = {};
        words.forEach(w => {
            if (!w.word) return;
            const data = { ...w };
            if (!data.pronunciation) data.pronunciation = data.word;
            if (!data.tip) data.tip = "Practica esta palabra para mejorar tu vocabulario.";

            let firstLetter = data.word.trim().charAt(0).toUpperCase();
            if (!/[A-ZÇĞİÖŞÜ]/.test(firstLetter)) firstLetter = '#';

            if (!groups[firstLetter]) groups[firstLetter] = [];
            groups[firstLetter].push(data);
        });

        // Sort letters
        const sortedLetters = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'tr'));

        let html = '';

        sortedLetters.forEach(letter => {
            // Sort words within the letter alphabetically
            groups[letter].sort((a, b) => a.word.localeCompare(b.word, 'tr'));

            html += `
                <div class="mb-4">
                    <h3 class="text-3xl font-black text-slate-300 dark:text-slate-600 mb-6 flex items-center gap-4">
                        <span>${letter}</span>
                        <div class="h-px bg-slate-200 dark:bg-slate-700 flex-grow mt-2"></div>
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        ${groups[letter].map(w => {
                const lvl = LEVEL_COLORS[w.level] || LEVEL_COLORS['A1'];
                // Check if answered locally
                const storageKey = 'wod_answered_' + w.date;
                const isAnswered = localStorage.getItem(storageKey) === w.word;
                const checkIcon = isAnswered
                    ? '<div class="absolute -top-2 -right-2 bg-white dark:bg-slate-800 rounded-full shadow-sm p-1"><i class="fas fa-check-circle text-green-500 text-lg leading-none"></i></div>'
                    : '';

                return `
                                <div class="word-card cursor-pointer group bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all relative flex flex-col h-full" data-date="${escHtml(w.date)}">
                                    ${checkIcon}
                                    <div class="flex items-center gap-2 mb-3">
                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm ${lvl.bg}">${w.level || 'A1'}</span>
                                        <span class="text-xs text-slate-400 font-medium ml-auto flex items-center gap-1"><i class="fas fa-calendar-alt opacity-50"></i> ${new Date(w.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <h4 class="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mb-2 break-words" title="${escHtml(w.word)}">${escHtml(w.word)}</h4>
                                    
                                    <div class="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                        <p class="text-sm font-medium ${isAnswered ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 font-semibold'}" title="${escHtml(w.translation)}">${isAnswered ? escHtml(w.translation) : 'Falta completar'}</p>
                                    </div>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Attach clicks
        const handleCardClick = (e) => {
            const card = e.currentTarget;
            const date = card.dataset.date;
            const wordData = words.find(w => w.date === date);
            if (wordData) openWordModal(wordData);
        };

        container.querySelectorAll('.word-card').forEach(card => {
            card.addEventListener('click', handleCardClick);
        });
    }

    function openWordModal(data) {
        const modal = getEl('wordModal');
        const inner = getEl('modalWodInner');
        if (!modal || !inner) return;

        const lvl = LEVEL_COLORS[data.level] || LEVEL_COLORS['A1'];
        const storageKey = 'wod_answered_' + data.date;
        const localAnswered = localStorage.getItem(storageKey) === data.word;

        const lang = localStorage.getItem('language') || 'es';
        const isEn = lang === 'en';
        const isPt = lang === 'pt';

        let answerLabel = "¿Cómo se traduce?";
        let answerPlaceholder = "Traducción al español...";
        let verifyText = "Verificar";
        let completedText = "¡Ya has completado esta palabra!";
        let revealText = "Ver traducción";
        let translationLabel = "Traducción";

        if (isEn) {
            answerLabel = "How do you translate it?";
            answerPlaceholder = "English translation...";
            verifyText = "Verify";
            completedText = "You have already completed this word!";
            revealText = "View translation";
            translationLabel = "Translation";
        } else if (isPt) {
            answerLabel = "Como se traduz?";
            answerPlaceholder = "Tradução em português...";
            completedText = "Você já completou esta palavra!";
            revealText = "Ver tradução";
            translationLabel = "Tradução";
        }

        inner.innerHTML = `
            <!-- Header row -->
            <div class="flex flex-wrap items-center justify-between gap-2 mb-4 pr-6">
                <div class="flex items-center gap-2 text-white/80 text-xs sm:text-sm font-semibold uppercase tracking-wider">
                    <i class="fas fa-calendar text-yellow-300"></i> ${new Date(data.date).toLocaleDateString()}
                </div>
                <span class="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-bold text-white ${lvl.bg} shadow whitespace-nowrap">${lvl.text}</span>
            </div>

            <!-- Turkish word -->
            <div class="text-center mb-2 mt-4">
                <div class="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 leading-tight">${escHtml(data.word)}</div>
                <div class="text-white/70 text-sm font-medium"><i class="fas fa-volume-low mr-1"></i>${escHtml(data.pronunciation)}</div>
            </div>

            <!-- Example sentence -->
            <div class="bg-white/10 rounded-xl p-4 my-5 text-center shadow-inner">
                <p class="text-white/95 italic sm:text-base text-sm font-medium leading-relaxed">"${escHtml(data.example)}"</p>
                <p id="glosExampleTranslation" class="text-white/60 text-xs mt-2 transition-all duration-300 ${localAnswered ? '' : 'hidden'}">${escHtml(data.exampleTranslation)}</p>
            </div>

            <!-- Answer input zone -->
            <div id="glosAnswerZone" class="mb-4 ${localAnswered ? 'hidden' : ''}">
                <label class="block text-white/80 text-xs font-semibold uppercase tracking-wider mb-2 ml-1">
                    <i class="fas fa-pencil mr-1"></i>${answerLabel}
                </label>
                <div class="flex gap-2">
                    <input id="glosAnswerInput" type="text" placeholder="${answerPlaceholder}" class="flex-1 min-w-0 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all font-medium"/>
                    <button id="glosCheckBtn" class="shrink-0 px-4 py-3 bg-white text-blue-700 font-bold rounded-xl text-sm hover:bg-white/90 transition-all shadow-md hover:shadow-lg active:scale-95">
                        <span class="hidden sm:inline">${verifyText}</span>
                        <i class="fas fa-check sm:hidden"></i>
                    </button>
                </div>
            </div>

            <div id="glosFeedback" class="mt-4 ${localAnswered ? 'bg-green-500/20 border-green-400/30 text-green-50 block' : 'hidden'} rounded-xl px-4 py-3 text-sm font-medium transition-all border shadow-sm">
                ${localAnswered ? `<i class="fas fa-check-circle mr-2 text-green-300"></i>${completedText}` : ''}
            </div>

            <!-- Reveal buttons -->
            <div class="flex gap-3 mt-4">
                <button id="glosRevealBtn" class="flex-1 py-3 px-4 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2 shadow-sm ${localAnswered ? 'hidden' : ''}">
                    <i class="fas fa-eye"></i> ${revealText}
                </button>
                <button id="glosTipBtn" class="py-3 px-4 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2 shadow-sm">
                    <i class="fas fa-lightbulb"></i> Tip
                </button>
            </div>

            <!-- Translation -->
            <div id="glosTranslation" class="${localAnswered ? '' : 'hidden'} mt-5 text-center p-5 bg-white/10 rounded-2xl border border-white/20 transition-all shadow-inner backdrop-blur-sm">
                <div class="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">${translationLabel}</div>
                <div class="text-3xl font-black text-white px-2 leading-tight">${escHtml(data.translation)}</div>
            </div>

            <!-- Tip -->
            <div id="glosTip" class="hidden mt-4 p-4 bg-yellow-400/20 border border-yellow-300/40 rounded-xl text-yellow-50 text-sm leading-relaxed shadow-sm font-medium">
                <i class="fas fa-lightbulb text-yellow-300 mr-2 text-lg float-left"></i>
                <div class="pl-7">${escHtml(data.tip)}</div>
            </div>
        `;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';

        setTimeout(() => getEl('glosAnswerInput')?.focus(), 100);

        bindModalEvents(data, storageKey);
    }

    function bindModalEvents(data, storageKey) {
        let answered = localStorage.getItem(storageKey) === data.word;
        let attemptsLeft = 3;

        const lang = localStorage.getItem('language') || 'es';
        const isEn = lang === 'en';
        const isPt = lang === 'pt';

        const checkBtn = getEl('glosCheckBtn');
        const input = getEl('glosAnswerInput');
        const feedback = getEl('glosFeedback');
        const answerZone = getEl('glosAnswerZone');

        // Inject attempt counter badge
        if (answerZone && !answered) {
            let counterLabel = 'intentos restantes';
            if (isEn) counterLabel = 'attempts remaining';
            else if (isPt) counterLabel = 'tentativas restantes';

            const badge = document.createElement('div');
            badge.id = 'glosAttemptBadge';
            badge.className = 'mt-2 text-right text-xs font-semibold text-white/50 transition-all';
            badge.innerHTML = `<span id="glosAttemptCount">3</span> ${counterLabel}`;
            answerZone.appendChild(badge);
        }

        const updateCounter = () => {
            const countEl = getEl('glosAttemptCount');
            const badge = getEl('glosAttemptBadge');
            if (!countEl || !badge) return;
            countEl.textContent = attemptsLeft;
            if (attemptsLeft === 1) {
                badge.className = 'mt-2 text-right text-xs font-bold text-red-300 animate-pulse transition-all';
            } else if (attemptsLeft === 2) {
                badge.className = 'mt-2 text-right text-xs font-semibold text-yellow-300 transition-all';
            }
        };

        const revealAnswer = (isCorrect) => {
            answerZone?.classList.add('hidden');
            getEl('glosTranslation')?.classList.remove('hidden');
            getEl('glosExampleTranslation')?.classList.remove('hidden');
            getEl('glosRevealBtn')?.classList.add('hidden');
            answered = true;
            localStorage.setItem(storageKey, data.word);
            reRenderGlossary();

            if (!feedback) return;

            const lang = isEn ? 'en' : (isPt ? 'pt' : 'es');
            const msgs = {
                es: { success: '¡Correcto! 🎉 Bien hecho.', failure: 'Sin intentos. La traducción era:' },
                en: { success: 'Correct! 🎉 Well done.', failure: 'No attempts left. The translation was:' },
                pt: { success: 'Correto! 🎉 Muito bem.', failure: 'Sem tentativas. A tradução era:' }
            }[lang];

            feedback.className = `mt-4 rounded-xl px-4 py-3 text-sm font-medium transition-all shadow-sm block ${isCorrect ? 'bg-green-500/20 border-green-400/40 text-green-50' : 'bg-red-500/20 border-red-400/40 text-red-50'}`;
            
            if (isCorrect) {
                feedback.innerHTML = `<i class="fas fa-circle-check mr-2 text-green-300 text-lg align-text-bottom"></i> ${msgs.success}`;
            } else {
                feedback.innerHTML = `<i class="fas fa-circle-xmark mr-2 text-red-300 text-lg align-text-bottom"></i> ${msgs.failure} <strong class="text-white">${escHtml(data.translation)}</strong>`;
            }
        };

        const doCheck = () => {
            if (answered) return;
            const userAnswer = input?.value.trim();
            if (!userAnswer) return;

            const normalize = (s) => s.toLowerCase()
                .normalize('NFD').replaceAll(/[\u0300-\u036f]/gu, '')
                .replaceAll(/[^a-z0-9\s]/gu, '').trim();

            const isCorrect = normalize(userAnswer) === normalize(data.translation) ||
                (data.translation.split(/\s+/).length === 1 &&
                    normalize(userAnswer).length >= Math.ceil(normalize(data.translation).length * 0.9) &&
                    normalize(data.translation).startsWith(normalize(userAnswer)));

            if (isCorrect) {
                revealAnswer(true);
                return;
            }

            attemptsLeft--;
            updateCounter();

            if (attemptsLeft <= 0) {
                revealAnswer(false);
                return;
            }

            if (feedback) {
                const lang = isEn ? 'en' : (isPt ? 'pt' : 'es');
                const wrongMsgs = {
                    es: { retry: 'Incorrecto, ¡intenta de nuevo!', last: '⚠️ ¡Último intento!' },
                    en: { retry: 'Incorrect, try again!', last: '⚠️ Last attempt!' },
                    pt: { retry: 'Incorreto, tente novamente!', last: '⚠️ Última tentativa!' }
                }[lang];

                const wrongMsg = (attemptsLeft === 1) ? wrongMsgs.last : wrongMsgs.retry;
                feedback.className = 'mt-4 rounded-xl px-4 py-3 text-sm font-medium transition-all bg-red-500/20 border border-red-400/40 text-red-50 block shadow-sm';
                feedback.innerHTML = `<i class="fas fa-circle-xmark mr-2 text-red-300"></i> ${wrongMsg}`;
            }
            if (input) { input.value = ''; input.focus(); }
        };

        if (checkBtn && input) {
            checkBtn.addEventListener('click', doCheck);
            input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doCheck(); });
        }

        getEl('glosRevealBtn')?.addEventListener('click', () => {
            if (answered) return;
            revealAnswer(false);
            if (feedback) {
                feedback.className = 'mt-4 rounded-xl px-4 py-3 text-sm font-medium transition-all bg-white/10 border border-white/20 text-white/70 block shadow-sm';
                let msg = 'Traducción revelada.';
                if (isEn) msg = 'Translation revealed.';
                else if (isPt) msg = 'Tradução revelada.';
                feedback.innerHTML = `<i class="fas fa-eye mr-2"></i> ${msg}`;
            }
        });

        getEl('glosTipBtn')?.addEventListener('click', () => {
            getEl('glosTip')?.classList.toggle('hidden');
        });
    }

    function reRenderGlossary() {
        const container = getEl('glossaryContainer');
        if (container && pastWords.length > 0) {
            // Re-render in background to show checkmarks
            renderGlossary(pastWords, container);
        }
    }

    function closeModal() {
        const modal = getEl('wordModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = '';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
