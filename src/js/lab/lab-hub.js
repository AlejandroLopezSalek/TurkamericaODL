/**
 * LabHub - Experimental AI Tools Controller for Turkamerica
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
        const selectors = '.group[cursor-pointer], .group.cursor-pointer, [data-lab-tool]';
        document.querySelectorAll(selectors).forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.tagName === 'A') return;
                const dataTool = card.dataset.labTool;
                const titleElement = card.querySelector('h3');
                const title = titleElement ? titleElement.textContent : '';
                this.handleToolClick(title, dataTool);
            });
        });
    }

    handleToolClick(title, dataTool) {
        const path = window.location.pathname;
        let langPrefix = "";
        if (path.startsWith("/en/")) langPrefix = "/en";
        else if (path.startsWith("/pt/")) langPrefix = "/pt";

        // Access Control
        if (globalThis.AuthService && !globalThis.AuthService.isLoggedIn()) {
            const currentUrl = encodeURIComponent(globalThis.location.pathname);
            const msg = "LabCapi requiere registro para acceder a las herramientas experimentales.";
            if (globalThis.toastWarning) globalThis.toastWarning(msg, "Acceso Restringido"); else alert(msg);
            setTimeout(() => {
                globalThis.location.href = `${langPrefix}/login/?returnUrl=${currentUrl}`;
            }, 1000);
            return;
        }

        const tool = dataTool || title.toLowerCase();

        if (tool.includes("cadena") || tool.includes("adn")) {
            window.location.href = `${langPrefix}/ADN/`;
        } else if (tool.includes("examen") || tool.includes("ia")) {
            window.location.href = `${langPrefix}/Examenes/`;
        } else if (tool.includes("story") || tool.includes("historia")) {
            window.location.href = `${langPrefix}/StoryLab/`;
        } else if (tool.includes("análisis") || tool.includes("contexto") || tool.includes("analisis")) {
            window.location.href = `${langPrefix}/Analisis/`;
        } else {
            this.notifyComingSoon(title);
        }
    }

    notifyComingSoon(title) {
        const msg = `El módulo "${title}" estará disponible próximamente.`;
        if (globalThis.toastInfo) globalThis.toastInfo(msg, "Próximamente"); else alert(msg);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    globalThis.labHub = new LabHub();
});
