// ========================================
// ADMIN CONTRIBUTIONS - Admin Dashboard Handler
// ========================================

let currentFilter = 'all';
let currentRequestId = null;
let confirmAction = null;

// Tailwind Classes Configuration
const TAB_ACTIVE_CLASSES = ['bg-indigo-600', 'text-white', 'shadow-md', 'shadow-indigo-500/20'];
const TAB_INACTIVE_CLASSES = ['text-slate-600', 'hover:bg-slate-100', 'dark:text-slate-400', 'dark:hover:bg-slate-800'];
const BADGE_ACTIVE_CLASSES = ['bg-white/20', 'text-white'];
const BADGE_INACTIVE_CLASSES = ['bg-slate-100', 'dark:bg-slate-700', 'text-slate-600', 'dark:text-slate-300'];

document.addEventListener('DOMContentLoaded', () => {
    // Only run on admin dashboard
    // Only run on admin dashboard
    const adminPage = document.getElementById('admin-dashboard-page');
    if (!adminPage) return;

    // Check admin access
    if (!window.ContributionService || !window.ContributionService.isAdmin()) {
        showToast('Acceso denegado. Solo administradores pueden acceder a esta página.', 'error');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
        return;
    }

    initAdminDashboard();
});

function initAdminDashboard() {
    // Load stats and requests
    loadStats();
    loadRequests();

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            handleTabClick(e.currentTarget);
        });
    });

    // Modal buttons
    document.getElementById('approveBtn')?.addEventListener('click', () => handleApprove(currentRequestId));
    document.getElementById('rejectBtn')?.addEventListener('click', () => handleReject(currentRequestId));
}

function handleTabClick(target) {
    // Reset all tabs
    document.querySelectorAll('.filter-tab').forEach(t => {
        t.classList.remove('active', ...TAB_ACTIVE_CLASSES);
        t.classList.add(...TAB_INACTIVE_CLASSES);

        const badge = t.querySelector('span');
        if (badge) {
            badge.classList.remove(...BADGE_ACTIVE_CLASSES);
            badge.classList.add(...BADGE_INACTIVE_CLASSES);
        }
    });

    // Set active tab
    target.classList.add('active', ...TAB_ACTIVE_CLASSES);
    target.classList.remove(...TAB_INACTIVE_CLASSES);

    const activeBadge = target.querySelector('span');
    if (activeBadge) {
        activeBadge.classList.remove(...BADGE_INACTIVE_CLASSES);
        activeBadge.classList.add(...BADGE_ACTIVE_CLASSES);
    }

    currentFilter = target.dataset.filter;
    loadRequests();
}

// ========================================
// LOAD DATA
// ========================================

async function loadStats() {
    try {
        const stats = await window.ContributionService.getStats();

        document.getElementById('statPending').textContent = stats.pending;
        document.getElementById('statApproved').textContent = stats.approved;
        document.getElementById('statRejected').textContent = stats.rejected;
        document.getElementById('statTotal').textContent = stats.total;

        document.getElementById('badgeAll').textContent = stats.pending;
        document.getElementById('badgeLessons').textContent = stats.lessonEdits;
        document.getElementById('badgeBooks').textContent = stats.bookUploads;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRequests() {
    const container = document.getElementById('requestsList');

    try {
        let requests = await window.ContributionService.getPendingRequests();

        // Apply filter
        if (currentFilter !== 'all') {
            requests = requests.filter(req => req.type === currentFilter);
        }

        if (requests.length === 0) {
            container.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    <div class="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-3xl mb-4">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3 class="text-xl font-bold text-slate-800 dark:text-white mb-2">¡Todo al día!</h3>
                    <p class="text-slate-500 dark:text-slate-400">No hay solicitudes pendientes de revisión</p>
                </div>
            `;
            return;
        }

        container.innerHTML = requests.map(request => `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden" data-id="${request.id}">
                <div class="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                    <div class="flex items-center gap-3">
                         <div class="w-10 h-10 rounded-xl flex items-center justify-center ${request.type === 'lesson_edit' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'}">
                             <i class="fas ${request.type === 'lesson_edit' ? 'fa-book-open' : 'fa-file-pdf'}"></i>
                         </div>
                         <span class="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                             ${request.type === 'lesson_edit' ? 'Edición de Lección' : 'Libro Compartido'}
                         </span>
                    </div>
                    <span class="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full">
                        ${formatDate(request.submittedAt)}
                    </span>
                </div>

                <h3 class="text-lg font-bold text-slate-800 dark:text-white mb-2 line-clamp-1">${request.title}</h3>
                <p class="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">${truncate(request.description, 150)}</p>

                <div class="flex items-center gap-4 mb-6 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                     <span class="flex items-center gap-2"><i class="fas fa-user text-indigo-500"></i> ${request.submittedBy?.username || 'Usuario Desconocido'}</span>
                     ${request.data.level ? `<span class="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-4"><i class="fas fa-layer-group text-purple-500"></i> ${request.data.level}</span>` : ''}
                </div>

                <div class="flex items-center justify-end gap-2 pt-2">
                    <button class="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2" onclick="viewRequest('${request._id}')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="w-9 h-9 flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 text-emerald-600 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 rounded-lg transition-colors" onclick="handleApprove('${request._id}')" title="Aprobar Rápido">
                         <i class="fas fa-check"></i>
                    </button>
                    <button class="w-9 h-9 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg transition-colors" onclick="handleReject('${request._id}')" title="Rechazar Rápido">
                         <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading requests:', error);
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center p-12 text-center text-red-500">
                <i class="fas fa-exclamation-triangle text-3xl mb-4"></i>
                <p>Error al cargar las solicitudes</p>
            </div>
        `;
    }
}

function handleDelete(id) {
    if (confirm('¿Estás seguro de que deseas eliminar esta solicitud permanentemente?')) {
        window.ContributionService.deleteRequest(id)
            .then(() => {
                showToast('Solicitud eliminada', 'success');
                loadStats();
                loadRequests();
            })
            .catch(err => {
                console.error(err);
                showToast('Error al eliminar', 'error');
            });
    }
}

// ========================================
// VIEW REQUEST DETAILS
// ========================================

async function viewRequest(id) {
    const request = await window.ContributionService.getRequestById(id);
    if (!request) return;

    currentRequestId = id;

    const modalBody = document.getElementById('modalBody');
    const modalTitle = document.getElementById('modalTitle');

    modalTitle.textContent = request.title;

    if (request.type === 'lesson_edit') {
        modalBody.innerHTML = `
            <div class="space-y-6">
                <div class="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h3 class="flex items-center gap-2 mb-4 text-slate-800 dark:text-white font-bold pb-2 border-b border-slate-200 dark:border-slate-700">
                        <i class="fas fa-info-circle text-indigo-500"></i> Información General
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div class="flex flex-col gap-1">
                            <strong class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Nivel</strong>
                            <span class="font-semibold text-slate-800 dark:text-white">${request.data.level}</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <strong class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">ID de Lección</strong>
                            <span class="font-semibold text-slate-800 dark:text-white">${request.data.lessonId || 'Nueva lección'}</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <strong class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Enviado por</strong>
                            <span class="font-semibold text-slate-800 dark:text-white">${request.submittedBy?.username || 'Usuario Desconocido'}</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <strong class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Fecha</strong>
                            <span class="font-semibold text-slate-800 dark:text-white">${formatDate(request.submittedAt)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h3 class="flex items-center gap-2 mb-4 text-slate-800 dark:text-white font-bold">
                        <i class="fas fa-align-left text-indigo-500"></i> Descripción
                    </h3>
                    <p class="text-slate-600 dark:text-slate-300 leading-relaxed">${request.description}</p>
                </div>
                
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="flex items-center gap-2 text-slate-800 dark:text-white font-bold">
                            <i class="fas fa-file-alt text-indigo-500"></i> Contenido
                        </h3>
                        <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center gap-2" id="toggleEditBtn" onclick="toggleAdminEditor()">
                            <i class="fas fa-edit"></i> Editar Contenido
                        </button>
                    </div>
                    
                    <!-- View Mode -->
                    <div id="contentPreview" class="prose dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 max-h-[500px] overflow-y-auto">
                        ${request.data.newContent ? sanitizeHtml(request.data.newContent) : '<p class="text-slate-400 italic">Sin contenido</p>'}
                    </div>
                    
                    <!-- Edit Mode -->
                    <div id="adminEditorContainer" style="display: none;" class="mt-4">
                        <div id="adminEditor" class="min-h-[400px]"></div>
                    </div>
                </div>
            </div>
        `;

        // Initialize editor but keep hidden
        if (typeof LessonEditor !== 'undefined') {
            window.adminEditorInstance = new LessonEditor('adminEditor');
            window.adminEditorInstance.setContent(request.data.newContent || '');
        } else {
            console.error('LessonEditor class not defined');
            document.getElementById('adminEditorContainer').innerHTML = '<p class="text-red-500">Editor no disponible</p>';
        }

    } else {
        modalBody.innerHTML = `
            <div class="space-y-6">
                <div class="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h3 class="flex items-center gap-2 mb-4 text-slate-800 dark:text-white font-bold pb-2 border-b border-slate-200 dark:border-slate-700">
                        <i class="fas fa-info-circle text-indigo-500"></i> Información del Libro
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div class="flex flex-col gap-1">
                            <strong class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Autor</strong>
                            <span class="font-semibold text-slate-800 dark:text-white">${request.data.author}</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <strong class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Nivel</strong>
                            <span class="font-semibold text-slate-800 dark:text-white">${request.data.level}</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <strong class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Categoría</strong>
                            <span class="font-semibold text-slate-800 dark:text-white">${request.data.category}</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <strong class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Idioma</strong>
                            <span class="font-semibold text-slate-800 dark:text-white">${request.data.language}</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <strong class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Formato</strong>
                            <span class="font-semibold text-slate-800 dark:text-white">${request.data.format}</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <strong class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Tamaño</strong>
                            <span class="font-semibold text-slate-800 dark:text-white">${request.data.fileSize}</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h3 class="flex items-center gap-2 mb-4 text-slate-800 dark:text-white font-bold">
                        <i class="fas fa-align-left text-indigo-500"></i> Descripción
                    </h3>
                    <p class="text-slate-600 dark:text-slate-300 leading-relaxed">${request.description}</p>
                </div>
                
                <div class="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                    <h3 class="flex items-center gap-2 mb-3 text-indigo-800 dark:text-indigo-300 font-bold">
                        <i class="fas fa-link"></i> Enlace al Archivo
                    </h3>
                    <a href="${request.data.fileUrl}" target="_blank" class="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 underline break-all">
                        <i class="fas fa-external-link-alt"></i> ${request.data.fileUrl}
                    </a>
                </div>
                
                <div class="flex items-center gap-3 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <div class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Enviado por</p>
                        <p class="font-semibold text-slate-800 dark:text-white">${request.submittedBy?.username || 'Usuario Desconocido'} <span class="text-slate-400 font-normal">(${request.submittedBy?.email || 'Sin email'})</span></p>
                    </div>
                </div>
            </div>
        `;
    }

    const modal = document.getElementById('requestModal');
    modal.classList.remove('hidden');
    // Simple fade in
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('.modal-content').classList.remove('scale-95');
        modal.querySelector('.modal-content').classList.add('scale-100');
    });
}

// ========================================
// HANDLE APPROVE/REJECT
// ========================================

function handleApprove(id) {
    currentRequestId = id;
    confirmAction = 'approve';

    document.getElementById('confirmTitle').textContent = 'Confirmar Aprobación';
    document.getElementById('confirmMessage').textContent = '¿Estás seguro de que quieres aprobar esta solicitud?';
    document.getElementById('reasonGroup').style.display = 'none';

    openConfirmModal();
}

function handleReject(id) {
    currentRequestId = id;
    confirmAction = 'reject';

    document.getElementById('confirmTitle').textContent = 'Confirmar Rechazo';
    document.getElementById('confirmMessage').textContent = '¿Estás seguro de que quieres rechazar esta solicitud?';
    document.getElementById('reasonGroup').style.display = 'block';

    openConfirmModal();
}

// Confirm button handler
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('confirmBtn')?.addEventListener('click', () => {
        if (confirmAction === 'approve') {
            approveRequest();
        } else if (confirmAction === 'reject') {
            rejectRequest();
        }
    });
});

async function approveRequest() {
    try {
        // Get edited content if in editor mode
        let finalContent = null;
        if (window.adminEditorInstance) {
            const editorContainer = document.getElementById('adminEditorContainer');
            if (editorContainer && editorContainer.style.display !== 'none') {
                finalContent = window.adminEditorInstance.getContent();
            }
        }

        await window.ContributionService.approveRequest(currentRequestId, finalContent);
        showToast('Solicitud aprobada correctamente', 'success');
        closeConfirmModal();
        closeModal();
        loadStats();
        loadRequests();
    } catch (error) {
        console.error('Error approving request:', error);
        showToast('Error al aprobar la solicitud', 'error');
    }
}

async function rejectRequest() {
    try {
        const reason = document.getElementById('rejectionReason').value;
        await window.ContributionService.rejectRequest(currentRequestId, reason);
        showToast('Solicitud rechazada', 'info');
        closeConfirmModal();
        closeModal();
        loadStats();
        loadRequests();
    } catch (error) {
        console.error('Error rejecting request:', error);
        showToast('Error al rechazar la solicitud', 'error');
    }
}

// ========================================
// MODAL CONTROLS
// ========================================

window.closeModal = function () {
    const modal = document.getElementById('requestModal');
    if (modal) {
        modal.classList.add('opacity-0');
        modal.querySelector('.modal-content').classList.remove('scale-100');
        modal.querySelector('.modal-content').classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
    currentRequestId = null;
    // Clear editor to prevent conflicts
    const editorContainer = document.getElementById('adminEditorContainer');
    if (editorContainer) {
        editorContainer.style.display = 'none';
        document.getElementById('contentPreview').style.display = 'block';
        document.getElementById('toggleEditBtn').innerHTML = '<i class="fas fa-edit"></i> Editar Contenido';
    }
};

function openConfirmModal() {
    const modal = document.getElementById('confirmModal');
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('.modal-content').classList.remove('scale-95');
        modal.querySelector('.modal-content').classList.add('scale-100');
    });
}

window.closeConfirmModal = function () {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.classList.add('opacity-0');
        modal.querySelector('.modal-content').classList.remove('scale-100');
        modal.querySelector('.modal-content').classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
    const reasonInput = document.getElementById('rejectionReason');
    if (reasonInput) reasonInput.value = '';
};

function toggleAdminEditor() {
    const preview = document.getElementById('contentPreview');
    const editor = document.getElementById('adminEditorContainer');
    const btn = document.getElementById('toggleEditBtn');

    if (editor.style.display === 'none') {
        preview.style.display = 'none';
        editor.style.display = 'block';
        btn.innerHTML = '<i class="fas fa-eye"></i> Ver Vista Previa';
        // Refresh editor layout if needed
        if (window.adminEditorInstance && window.adminEditorInstance.refresh) {
            window.adminEditorInstance.refresh();
        }
    } else {
        preview.style.display = 'block';
        editor.style.display = 'none';
        btn.innerHTML = '<i class="fas fa-edit"></i> Editar Contenido';
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function truncate(text, length) {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

function sanitizeHtml(html) {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.textContent = html; // Simple escape

    // Low-tech sanitizer:
    // 1. Create a template element
    const template = document.createElement('template');
    template.innerHTML = html;

    // 2. Remove script tags and event handlers
    const scripts = template.content.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    const allElements = template.content.querySelectorAll('*');
    allElements.forEach(el => {
        const attributes = el.attributes;
        for (let i = attributes.length - 1; i >= 0; i--) {
            if (attributes[i].name.startsWith('on') || attributes[i].value.startsWith('javascript:')) {
                el.removeAttribute(attributes[i].name);
            }
        }
    });

    return template.innerHTML;
}

function showToast(message, type = 'info') {
    if (window.ToastSystem) {
        window.ToastSystem.show({ message, type });
    } else if (window.ToastManager) {
        window.ToastManager.show(message, type);
    } else {
        // Tailwind toast fallback
        const div = document.createElement('div');
        const colors = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-emerald-500' : 'bg-slate-800';
        div.className = `fixed bottom-5 right-5 ${colors} text-white px-6 py-3 rounded-xl shadow-lg z-[100] flex items-center gap-3 animate-fade-in-up`;
        div.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i> ${message}`;
        document.body.appendChild(div);
        setTimeout(() => {
            div.style.transition = 'opacity 0.5s';
            div.style.opacity = '0';
            setTimeout(() => div.remove(), 500);
        }, 3000);
    }
}

console.log('✅ Admin Contributions loaded (Tailwind Version)');
