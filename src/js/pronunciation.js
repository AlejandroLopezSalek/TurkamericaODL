// ==========================================
// PRONUNCIATION SYSTEM (TEXT-TO-SPEECH)
// Adds "Listen" buttons to Turkish text
// ==========================================

class PronunciationSystem {
    constructor() {
        this.synth = globalThis.speechSynthesis;
        this.voice = null;
        this.lang = 'tr-TR'; // Turkish
        this.init();
    }

    init() {
        // Load voices
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.setVoice();
        }
        this.setVoice();

        // Expose global instance
        globalThis.pronounce = (text) => this.speak(text);
    }

    setVoice() {
        const voices = this.synth.getVoices();
        // Try to find a Turkish voice
        this.voice = voices.find(v => v.lang.includes('tr')) || voices.find(v => v.lang.includes('en')); // Fallback
    }

    speak(text) {
        if (this.synth.speaking) {
            this.synth.cancel();
        }

        if (text === '') return;

        const utterThis = new SpeechSynthesisUtterance(text);

        // Prefer Turkish voice, silent fallback if none (or default)
        if (this.voice) {
            utterThis.voice = this.voice;
        }

        utterThis.lang = 'tr-TR';
        utterThis.rate = 0.8; // Slower for better clarity
        utterThis.pitch = 1;

        this.synth.speak(utterThis);
    }

    // Main function to inject buttons into a container
    scanAndInject(container) {
        this.inject(container);
    }

    inject(container) {
        if (!container) return;

        // 1. SMART TABLE DETECTION
        const tables = container.querySelectorAll('table');
        tables.forEach(table => {
            const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim().toLowerCase());
            let targetIndices = [];

            // Check for EXPLICIT Turkish columns
            headers.forEach((h, index) => {
                if (['turco', 'palabra', 'ejemplo', 'locativo', 'dativo', 'acusativo', 'forma', 'sufijo', 'afirmativo', 'negativo', 'pregunta'].some(k => h.includes(k))) {
                    // Check if it's NOT explicitly Spanish
                    if (!['traducción', 'español', 'significado'].some(k => h.includes(k))) {
                        targetIndices.push(index);
                    }
                }
            });

            // FALLBACK: If we couldn't find specific columns, but the table also doesn't have "Traducción" headers
            // (e.g. Conjugation tables usually have Pronombre | Afirmativo | Negativo -> All contain Turkish except Pronombre/Traducción)
            if (targetIndices.length === 0) {
                // assume all columns are potentially Turkish unless they match blacklist
                headers.forEach((h, index) => {
                    if (!['traducción', 'español', 'significado', 'descripción', 'pronombre'].some(k => h.includes(k))) {
                        targetIndices.push(index);
                    }
                });
            }

            // PASS 1: Inject into targeted columns (Force Context)
            if (targetIndices.length > 0) {
                const rows = table.querySelectorAll('tr');
                rows.forEach((row, rIndex) => {
                    if (rIndex === 0) return; // Skip header
                    const cells = row.querySelectorAll('td');
                    cells.forEach((cell, cIndex) => {
                        if (targetIndices.includes(cIndex)) {
                            // Try to inject. Force context means "This cell should be Turkish".
                            // We only skip if it explicitly looks like spanish (accents/stop words).
                            this.injectIntoElement(cell, true);
                        }
                    });
                });
            } else {
                // If we really can't tell, treat it as generic content
                this.injectIntoElement(table);
            }
        });

        // 2. STANDARD DETECTION for other elements
        const contentNodes = container.querySelectorAll('p, li, div, span, h1, h2, h3, h4, h5, h6');
        contentNodes.forEach(node => {
            // Skip if inside a table we already processed (optimization)
            if (node.closest('table')) return;
            this.injectIntoElement(node);
        });
    }

    injectIntoElement(element, forceTurkishContext = false) {
        // Find explicit targets or bold tags
        const targets = element.querySelectorAll('.pronounce-me, strong, b');

        // If we found bold tags, process them
        targets.forEach(el => {
            // FORCE injection if it has the explicit class
            if (el.classList.contains('pronounce-me')) {
                this.injectButton(el, el.textContent.trim(), 'append');
                return;
            }
            this.processTarget(el, forceTurkishContext);
        });

        // If forceTurkishContext is true (e.g. Table Cell in a "Turkish" column),
        // AND there were no bold tags inside, we should try to pronounce the whole text.
        if (forceTurkishContext && targets.length === 0) {
            const text = element.textContent.trim();
            // Basic sanity check to avoid empty/symbols
            if (text.length > 1 && /[a-zA-ZğüşöçİĞÜŞÖÇ]/.test(text)) {
                // Even in forced context, run strict spanish check just in case
                if (!this.looksLikeSpanish(text)) {
                    this.injectButton(element, text, 'prepend');
                }
            }
        }
    }

    processTarget(el, forceTurkishContext) {
        if (el.querySelector('.pronounce-btn')) return;

        const text = el.textContent.trim();
        // Skip short/empty
        if (text.length < 2) return;

        // If explicit class, skip strict checks
        if (el.classList.contains('pronounce-me')) {
            this.injectButton(el, text);
            return;
        }

        // --- FILTERS ---
        // 1. Accent Check (Definitive Spanish)
        if (/[áéíóúÁÉÍÓÚÑñ¿¡]/.test(text)) return;

        // 2. Keyword Check (Grammar terms)
        if (this.isSpanishKeyword(text)) return;

        // 3. Sentence Check (Stop words like 'de', 'el', 'mientras')
        if (this.looksLikeSpanishSentence(text)) return;

        // 4. Header Check
        if (text.endsWith(':')) return;

        // If we survived filters, inject!
        this.injectButton(el, text);
    }

    injectButton(targetEl, text, position = 'append') {
        // Prevent dupes on direct parent
        if (position === 'append') {
            const next = targetEl.nextSibling;
            if (next?.classList?.contains('pronounce-btn')) return;
        } else {
            const prev = targetEl.previousSibling;
            if (prev?.classList?.contains('pronounce-btn')) return;
        }

        const btn = this.createButton(text);

        if (position === 'append') {
            // If inserting after a bold tag, ensure we don't break layout too much
            if (targetEl.nextSibling) {
                targetEl.parentNode.insertBefore(btn, targetEl.nextSibling);
            } else {
                targetEl.parentNode.appendChild(btn);
            }
        } else {
            targetEl.insertBefore(btn, targetEl.firstChild);
        }
    }

    createButton(text) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pronounce-btn inline-flex items-center justify-center w-6 h-6 ml-1.5 align-middle text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-full transition-colors cursor-pointer opacity-70 hover:opacity-100 select-none';
        btn.setAttribute('aria-label', `Escuchar pronunciación de ${text}`);
        btn.title = "Escuchar pronunciación";
        btn.innerHTML = '<i class="fas fa-volume-high text-xs"></i>';

        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            btn.classList.add('text-indigo-700', 'scale-110');
            setTimeout(() => btn.classList.remove('text-indigo-700', 'scale-110'), 500);
            this.speak(text);
        };
        return btn;
    }

    isSpanishKeyword(text) {
        const lower = text.toLowerCase();
        // Exact matches or Starts With for headers
        const exactWords = [
            'vocal', 'consonante', 'forma', 'uso', 'sufijo', 'raíz', 'origen',
            'palabra', 'sujeto', 'verbo', 'objeto', 'partícula', 'armonía',
            'locativo', 'dativo', 'ablativo', 'acusativo', 'genitivo', 'negativo',
            'positivo', 'interrogativo', 'afirmativo', 'plural', 'singular',
            'pronunciación', 'traducción', 'ejemplo', 'reglas', 'nota', 'consejo',
            'importante', 'atención', 'excepción', 'resumen', 'final', 'letra',
            'sonido', 'nombre', 'cerca', 'lejos', 'aquí', 'allí', 'personal',
            'estado', 'tiempo', 'mientras', 'cuando', 'donde'
        ];

        // Check exact match
        if (exactWords.includes(lower)) return true;
        // Check if starts with keyword + colon (Header style)
        if (exactWords.some(w => lower.startsWith(w + ':'))) return true;

        return false;
    }

    looksLikeSpanish(text) {
        if (/[áéíóúÁÉÍÓÚÑñ¿¡]/.test(text)) return true;
        if (this.isSpanishKeyword(text)) return true;
        if (this.looksLikeSpanishSentence(text)) return true;
        return false;
    }

    looksLikeSpanishSentence(text) {
        // Stop words that indicate Spanish sentence structure
        // Since Turkish is agglutinative, it rarely has short isolated words like 'de', 'el', 'la'.
        const spanishStopWords = [' el ', ' la ', ' los ', ' las ', ' un ', ' una ', ' con ', ' para ', ' por ', ' que ', ' de ', ' en ', ' y ', ' es ', ' son ', ' se ', ' lo ', ' mientras ', ' cuando ', ' donde '];

        // Add padding to text for exact match checking
        const padded = ' ' + text.toLowerCase() + ' ';
        return spanishStopWords.some(w => padded.includes(w));
    }

    looksLikeTurkish(text) {
        // Has Turkish chars?
        return /[ışğüöçİŞĞÜÖÇ]/.test(text);
    }
}

// Initialize
globalThis.PronunciationSystem = new PronunciationSystem();
