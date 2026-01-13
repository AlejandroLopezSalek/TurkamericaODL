// ========================================
// GRAMATICA.JS - Funcionalidad específica de la página de gramática
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    inicializarPaginaGramatica();
});

function inicializarPaginaGramatica() {
    configurarEnlacesRecursos();
    inicializarModalExplicacion();
}

// ========================================
// EFECTOS DE ENLACES DE RECURSOS
// ========================================
function configurarEnlacesRecursos() {
    document.querySelectorAll('.resource-link').forEach(enlace => {
        enlace.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(5px)';
        });

        enlace.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });

        // Agregar seguimiento de clics
        enlace.addEventListener('click', function() {
            rastrearUsoRecurso(this.textContent);
        });
    });
}

function rastrearUsoRecurso(nombreRecurso) {
    try {
        const savedData = localStorage.getItem('usoRecursos');
        const uso = savedData ? JSON.parse(savedData) : {};
        
        uso[nombreRecurso] = (uso[nombreRecurso] || 0) + 1;
        uso.ultimoAcceso = new Date().toISOString();
        
        localStorage.setItem('usoRecursos', JSON.stringify(uso));
    } catch (error) {
        console.error('Error tracking resource usage:', error);
    }
}

// ========================================
// MODAL DE EXPLICACIÓN
// ========================================
function inicializarModalExplicacion() {
    const modal = document.getElementById('explanationModal');
    if (!modal) return;

    // Configurar funcionalidad de cierre
    window.closeModal = function() {
        modal.style.display = 'none';
    };

    // Cerrar al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            window.closeModal();
        }
    });

    // Cerrar con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            window.closeModal();
        }
    });
}

function mostrarExplicacionGramatica(tema, contenido) {
    const modal = document.getElementById('explanationModal');
    const elementoTitulo = document.getElementById('modalTitle');
    const elementoContenido = document.getElementById('modalContent');

    if (elementoTitulo) elementoTitulo.textContent = tema;
    if (elementoContenido) elementoContenido.innerHTML = contenido;

    modal.style.display = 'flex';
}

// ========================================
// UTILIDADES DE GRAMÁTICA
// ========================================
function obtenerConsejosGramatica() {
    try {
        const savedData = localStorage.getItem('consejosGramatica');
        return savedData ? JSON.parse(savedData) : [];
    } catch (error) {
        console.error('Error getting grammar tips:', error);
        return [];
    }
}

function guardarConsejoGramatica(consejo) {
    try {
        const consejos = obtenerConsejosGramatica();
        consejos.push({
            contenido: consejo,
            marca: new Date().toISOString(),
            id: Date.now().toString(36) + Math.random().toString(36).substr(2)
        });
        
        localStorage.setItem('consejosGramatica', JSON.stringify(consejos));
        console.log('Consejo guardado correctamente');
    } catch (error) {
        console.error('Error saving grammar tip:', error);
    }
}

function obtenerProgresoEstudio() {
    try {
        const savedData = localStorage.getItem('progresoGramatica');
        return savedData ? JSON.parse(savedData) : {
            temasCompletados: [],
            rachaActual: 0,
            tiempoTotalEstudio: 0
        };
    } catch (error) {
        console.error('Error getting study progress:', error);
        return {
            temasCompletados: [],
            rachaActual: 0,
            tiempoTotalEstudio: 0
        };
    }
}

function actualizarProgresoEstudio(tema) {
    try {
        const progreso = obtenerProgresoEstudio();
        
        if (!progreso.temasCompletados.includes(tema)) {
            progreso.temasCompletados.push(tema);
            progreso.rachaActual++;
            
            localStorage.setItem('progresoGramatica', JSON.stringify(progreso));
            console.log(`Tema "${tema}" completado`);
        }
    } catch (error) {
        console.error('Error updating study progress:', error);
    }
}

// EXPORTACIONES GLOBALES
window.utilidadesGramatica = {
    mostrarExplicacion: mostrarExplicacionGramatica,
    guardarConsejo: guardarConsejoGramatica,
    obtenerConsejos: obtenerConsejosGramatica,
    actualizarProgreso: actualizarProgresoEstudio,
    obtenerProgreso: obtenerProgresoEstudio
};

console.log('Página de gramática inicializada correctamente');