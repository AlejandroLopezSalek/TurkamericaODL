// ========================================
// CONTRIBUTE.JS - Contribution Form Handler with Visual Editor
// ========================================

let lessonEditor;

// Extract URL parameter handling to reduce cognitive complexity
async function handleUrlParameters(urlParams) {
    const editLessonId = urlParams.get('edit') || urlParams.get('editLesson');
    const topic = urlParams.get('topic');
    const level = urlParams.get('level');

    if (editLessonId) {
        selectContributionType('lesson');
        try {
            await editLesson(editLessonId);
        } catch (error) {
            console.error(error);
            if (globalThis.toastError) globalThis.toastError('Error al iniciar edición');
        }
    } else if (topic && level) {
        selectContributionType('lesson');
        fetchExistingLesson(topic, level);
    } else if (level) {
        selectContributionType('lesson');
        const levelSelect = document.getElementById('lessonLevel');
        if (levelSelect) {
            levelSelect.value = level;
            showToast(`Creando lección para Nivel ${level}`, 'info');
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(globalThis.location.search);
    const mode = urlParams.get('mode');

    if (mode === 'edit') {
        document.body.classList.add('compact-mode');
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) pageTitle.textContent = 'Editar Lección';
    }

    initContributionPage();

    // Ensure forms are hidden initially
    const lessonForm = document.getElementById('lessonEditForm');
    const bookForm = document.getElementById('bookUploadForm');
    if (lessonForm) lessonForm.style.display = 'none';
    if (bookForm) bookForm.style.display = 'none';

    // Auto-select based on URL
    if (urlParams.has('editLesson') || urlParams.has('level')) {
        selectContributionType('lesson');
    } else {
        showSelection();
    }

    // Handle URL parameters
    await handleUrlParameters(urlParams);
});

// ========================================
// UI NAVIGATION (SELECTION CARDS)
// ========================================

globalThis.selectContributionType = function (type) {
    const selectionContainer = document.getElementById('selectionContainer');
    if (selectionContainer) selectionContainer.style.display = 'none';

    // Hide all forms first
    document.querySelectorAll('.contribution-form').forEach(f => f.style.display = 'none');

    if (type === 'lesson') {
        const form = document.getElementById('lessonEditForm');
        if (form) {
            form.style.display = 'block';
            setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
        }
    } else if (type === 'book') {
        const form = document.getElementById('bookUploadForm');
        if (form) {
            form.style.display = 'block';
            setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
        }
    }
};

globalThis.showSelection = function () {
    // Hide forms - using generic class and explicit IDs for safety
    document.querySelectorAll('.contribution-form').forEach(f => f.style.display = 'none');

    const lessonForm = document.getElementById('lessonEditForm');
    const bookForm = document.getElementById('bookUploadForm');
    if (lessonForm) lessonForm.style.display = 'none';
    if (bookForm) bookForm.style.display = 'none';

    // Show selection
    const selectionContainer = document.getElementById('selectionContainer');
    if (selectionContainer) selectionContainer.style.display = 'block';

    // Clear URL params if any
    if (globalThis.history.pushState) {
        const cleanUrl = globalThis.location.protocol + "//" + globalThis.location.host + globalThis.location.pathname;
        globalThis.history.pushState({ path: cleanUrl }, '', cleanUrl);
    }
};

async function fetchExistingLesson(topic, level) {
    try {
        const response = await fetch(`/data/${level.toLowerCase()}_lessons.json`);
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        const lesson = data[topic];

        if (lesson) {
            // Scroll to form if element exists
            const typesSection = document.querySelector('.contribution-types');
            if (typesSection) {
                typesSection.scrollIntoView({ behavior: 'smooth' });
            }

            // Switch to lesson form
            const lessonTypeBtn = document.getElementById('lessonTypeBtn');
            if (lessonTypeBtn) lessonTypeBtn.click();

            // Fill form with lesson data
            document.getElementById('lessonTitle').value = `Edición: ${lesson.title}`;
            document.getElementById('lessonLevel').value = level;
            document.getElementById('lessonDescription').value = `Propuesta de edición para: ${lesson.title}`;

            // Load lesson content into editor
            if (lessonEditor) {
                lessonEditor.setContent(lesson.content || '');
            }

            showToast(`Editando lección: ${lesson.title}`, 'info');
        } else {
            showToast('Lección no encontrada', 'error');
        }
    } catch (error) {
        console.error('Error fetching lesson:', error);
        showToast('Error al cargar la lección original', 'error');
    }
}

function initContributionPage() {
    // Initialize visual editor
    if (typeof LessonEditor === 'undefined') {
        console.error('LessonEditor class not found');
        return;
    }
    lessonEditor = new LessonEditor('lessonContentEditor');

    // Type selection
    const lessonTypeBtn = document.getElementById('lessonTypeBtn');
    const bookTypeBtn = document.getElementById('bookTypeBtn');
    const lessonForm = document.getElementById('lessonEditForm');
    const bookForm = document.getElementById('bookUploadForm');

    lessonTypeBtn?.addEventListener('click', () => {
        lessonTypeBtn.classList.add('active');
        bookTypeBtn.classList.remove('active');
        lessonForm.classList.add('active');
        bookForm.classList.remove('active');
    });

    bookTypeBtn?.addEventListener('click', () => {
        bookTypeBtn.classList.add('active');
        lessonTypeBtn.classList.remove('active');
        bookForm.classList.add('active');
        lessonForm.classList.remove('active');
    });

    // Form submissions
    lessonForm?.addEventListener('submit', handleLessonSubmit);
    bookForm?.addEventListener('submit', handleBookSubmit);

    // Load user's contributions
    loadMyContributions();
}

// ========================================
// LESSON CREATION FORM (SIMPLIFIED)
// ========================================

async function handleLessonSubmit(e) {
    e.preventDefault();

    const lessonContent = lessonEditor ? lessonEditor.getContent() : '';

    if (!lessonContent || lessonContent.trim() === '') {
        showToast('Por favor añade contenido a la lección', 'error');
        return;
    }

    const form = e.target;
    const editingLessonId = form.dataset.editingLessonId;

    // DETECT SOURCE: Check if this is a nivel edit or community contribution
    // Two scenarios for nivel edits:
    // 1. Editing static lesson (has 'topic' param)
    // 2. Creating new lesson from Nivel page (has 'level' param set by updateContributeButton in niveles.njk)
    const urlParams = new URLSearchParams(globalThis.location.search);
    const hasTopic = urlParams.has('topic');
    const levelParam = urlParams.get('level');
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1'];
    const isFromNivelesPage = hasTopic || (levelParam && validLevels.includes(levelParam.toUpperCase()));

    const lessonSource = isFromNivelesPage ? 'nivel-edit' : 'community';

    const lessonData = {
        lessonTitle: document.getElementById('lessonTitle').value,
        level: document.getElementById('lessonLevel').value,
        description: document.getElementById('lessonDescription').value,
        newContent: lessonContent,
        lessonId: editingLessonId || null, // If editing, include original lesson ID
        source: lessonSource // Mark as 'nivel-edit' or 'community' based on origin
    };

    try {
        await globalThis.ContributionService.submitLessonEdit(lessonData);

        const message = editingLessonId
            ? '¡Propuesta de edición enviada! Será revisada por un administrador.'
            : '¡Lección enviada con éxito! Será revisada por un administrador.';

        showToast(message, 'success');

        // Reset form
        e.target.reset();
        delete form.dataset.editingLessonId;
        if (lessonEditor) {
            lessonEditor.clear();
            lessonEditor.setContent('<h2>Título de la Sección</h2><p>Escribe aquí el contenido de tu lección...</p>');
        }

        // Clear URL parameter
        globalThis.history.replaceState({}, '', '/Contribute/');

        // Reload contributions list
        loadMyContributions();

    } catch (error) {
        console.error('Error submitting lesson:', error);
        showToast('Error al enviar la lección. Inténtalo de nuevo.', 'error');
    }
}

// ========================================
// EDIT EXISTING LESSON
// ========================================

async function editLesson(lessonId) {
    let lesson = await globalThis.ContributionService.getLessonById(lessonId);

    // Fallback: Try finding it in the full list if getById fails or returns null
    if (!lesson) {
        try {
            const lessons = await globalThis.ContributionService.getPublishedLessons();
            lesson = lessons.find(l => l.id == lessonId || l._id == lessonId);
        } catch (e) { console.error(e); }
    }

    if (!lesson) {
        showToast('Lección no encontrada para editar', 'error');
        return;
    }

    // Scroll to form
    const typesSection = document.querySelector('.contribution-types');
    if (typesSection) {
        typesSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Switch to lesson form
    const lessonBtn = document.getElementById('lessonTypeBtn');
    if (lessonBtn) lessonBtn.click();

    // Fill form with lesson data
    document.getElementById('lessonTitle').value = `Edición: ${lesson.title}`;
    document.getElementById('lessonLevel').value = lesson.level;
    document.getElementById('lessonDescription').value = `Propuesta de edición para: ${lesson.description}`;

    // Load lesson content into editor
    if (lessonEditor) {
        lessonEditor.setContent(lesson.content || '');
    }

    // Store original lesson ID for reference
    const form = document.getElementById('lessonEditForm');
    form.dataset.editingLessonId = lesson.id || lesson._id;

    showToast('Edita la lección y envía tu propuesta', 'info');
}

// Make globally available
globalThis.editLesson = editLesson;

// ========================================
// BOOK UPLOAD FORM
// ========================================

async function handleBookSubmit(e) {
    e.preventDefault();

    const bookData = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        level: document.getElementById('bookLevel').value,
        category: document.getElementById('bookCategory').value,
        fileUrl: document.getElementById('bookUrl').value,
        format: document.getElementById('bookFormat').value,
        fileSize: document.getElementById('bookSize').value || 'Desconocido',
        description: document.getElementById('bookDescription').value,
        language: document.getElementById('bookLanguage').value
    };

    // Validate URL
    try {
        new URL(bookData.fileUrl);
    } catch {
        showToast('Por favor ingresa una URL válida', 'error');
        return;
    }

    try {
        await globalThis.ContributionService.submitBookUpload(bookData);

        showToast('¡Libro compartido con éxito! Será revisado por un administrador.', 'success');

        // Reset form
        e.target.reset();

        // Reload contributions list
        loadMyContributions();

    } catch (error) {
        console.error('Error submitting book:', error);
        showToast('Error al compartir el libro. Inténtalo de nuevo.', 'error');
    }
}

// ========================================
// MY CONTRIBUTIONS
// ========================================

async function loadMyContributions() {
    const container = document.getElementById('myContributionsList');
    if (!container) return;

    try {
        // Fetch all requests from the service
        let requests = [];
        if (globalThis.ContributionService && typeof globalThis.ContributionService.getAllRequests === 'function') {
            requests = await globalThis.ContributionService.getAllRequests();
        }

        if (!Array.isArray(requests)) requests = [];

        // Filter by current user
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            requests = requests.filter(req =>
                req.submittedBy && (req.submittedBy.id === currentUser.id || req.submittedBy.username === currentUser.username)
            );
        } else {
            requests = [];
        }

        if (requests.length === 0) {
            container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <i class="fas fa-inbox text-4xl mb-3"></i>
                <p>No has enviado ninguna contribución todavía</p>
            </div>
        `;
            return;
        }

        container.innerHTML = requests.map(request => {
            const statusColors = {
                'pending': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
                'approved': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
                'rejected': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
            };
            const statusClass = statusColors[request.status] || 'bg-slate-100 text-slate-700';

            return `
            <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg text-sm">
                        <i class="fas ${request.type === 'lesson_edit' ? 'fa-book-open' : 'fa-file-pdf'}"></i>
                        <span>${request.type === 'lesson_edit' ? 'Lección' : 'Libro'}</span>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusClass}">
                        ${getStatusText(request.status)}
                    </span>
                </div>
                <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">${request.title}</h3>
                <p class="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">${request.description}</p>
                <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div class="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
                        <span><i class="fas fa-calendar mr-1"></i> ${formatDate(request.submittedAt)}</span>
                        ${request.data.level ? `<span><i class="fas fa-layer-group mr-1"></i> ${request.data.level}</span>` : ''}
                    </div>
                    <button onclick="deleteContribution('${request.id || request._id}')" 
                            class="p-2 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors" 
                            title="Eliminar del historial">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `}).join('');

    } catch (error) {
        console.error('Error loading contributions:', error);
        container.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error al cargar tus contribuciones</p>
        </div>
    `;
    }
}

// ========================================
// DELETE CONTRIBUTION
// ========================================
async function deleteContribution(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta contribución de tu historial?')) return;

    try {
        await globalThis.ContributionService.deleteRequest(id);
        showToast('Contribución eliminada', 'success');
        loadMyContributions();
    } catch (error) {
        console.error('Error removing contribution:', error);
        showToast('Error al eliminar', 'error');
    }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendiente',
        'approved': 'Aprobado',
        'rejected': 'Rechazado'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showToast(message, type = 'info') {
    if (globalThis.ToastSystem) {
        globalThis.ToastSystem.show({ message, type });
    } else if (globalThis.ToastManager) {
        globalThis.ToastManager.show(message, type);
    } else {
        console.log(`Toast (${type}): ${message}`);
        // Fallback custom toast if system not ready
        const div = document.createElement('div');
        div.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#333;color:white;padding:15px;border-radius:5px;z-index:9999;box-shadow:0 4px 6px rgba(0,0,0,0.1);animation:fadeIn 0.3s;';
        div.textContent = message;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }
}

console.log('✅ Contribute.js loaded with visual editor');
