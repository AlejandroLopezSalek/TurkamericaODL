/**
 * LabHub - Experimental AI Tools Controller
 * Handles redirects to dedicated Lab modules
 */

class LabHub {
    constructor() {
        this.init();
    }

    init() {
        console.log("LabHub: Initializing simplified navigation...");
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Universal click handler for cards
        // Uses both the attribute and the class for compatibility with existing HTML
        const selectors = '.group[cursor-pointer], .group.cursor-pointer, [data-lab-tool]';
        document.querySelectorAll(selectors).forEach(card => {
            card.addEventListener('click', (e) => {
                // Prevent interference from nested links if any
                if (e.target.tagName === 'A') return;
                
                const titleElement = card.querySelector('h3');
                const title = titleElement ? titleElement.textContent : '';
                this.handleToolClick(title, card.dataset.labTool);
            });
        });
    }

    handleToolClick(title, dataTool) {
        // Access Control: Check if user is logged in
        if (globalThis.AuthService && !globalThis.AuthService.isLoggedIn()) {
            const currentUrl = encodeURIComponent(globalThis.location.pathname);
            const msg = "LabPanda requiere registro para acceder a las herramientas experimentales.";
            
            if (globalThis.toastWarning) {
                globalThis.toastWarning(msg, "Acceso Restringido");
            } else {
                alert(msg);
            }
            
            setTimeout(() => {
                globalThis.location.href = `/login/?returnUrl=${currentUrl}`;
            }, 1500);
            return;
        }

        // Priority for data-lab-tool attribute, fallback to title matching
        const tool = dataTool || title.toLowerCase();

        if (tool.includes("sufijo") || tool.includes("cadena") || tool === "cadena") {
            window.location.href = "/Cadena/";
        } else if (tool.includes("examen") || tool.includes("ia") || tool === "examen") {
            window.location.href = "/Examenes/";
        } else if (tool.includes("story") || tool.includes("historia")) {
            window.location.href = "/StoryLab/";
        } else if (tool.includes("análisis") || tool.includes("contexto") || tool.includes("frase") || tool === "analisis") {
            window.location.href = "/Analisis/";
        } else if (tool.includes("espejo") || tool.includes("fonético")) {
            this.notifyComingSoon(title);
        } else if (tool.includes("universo") || tool.includes("semántico")) {
            this.notifyComingSoon(title);
        } else {
            console.warn(`No route defined for tool: ${title}`);
        }
    }

    notifyComingSoon(title) {
        const msg = `El módulo "${title}" estará disponible próximamente en fase Beta.`;
        if (globalThis.toastInfo) {
            globalThis.toastInfo(msg, "Lanzamiento Próximo");
        } else {
            alert(msg);
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    globalThis.labHub = new LabHub();
});
