// ========================================
// COMMUNITY LESSONS - BOOKS AND LESSONS DISPLAY
// ========================================

let currentLevel = 'all';

// Books data structure
const booksData = {
    'A1': [
        {
            title: 'İstanbul A1 Ders Kitabı',
            url: 'https://github.com/AlejandroLopezSalek/ODL_Turco-Standard/raw/main/A1.pdf',
            size: '~8 MB',
            pages: '104',
            description: 'Libro oficial de texto para nivel A1'
        }
    ],
    'A2': [
        {
            title: 'A2 Türkçe Kitabı',
            url: 'https://github.com/AlejandroLopezSalek/ODL_Turco-Standard/raw/main/A2.pdf',
            size: '~10 MB',
            pages: '120',
            description: 'Libro de texto para nivel A2'
        }
    ],
    'B1': [
        {
            title: 'B1 Ders Kitabı',
            url: 'https://github.com/AlejandroLopezSalek/ODL_Turco-Standard/raw/main/B1.pdf',
            size: '~12 MB',
            pages: '150',
            description: 'Libro de texto para nivel B1'
        }
    ],
    'B2': [
        {
            title: 'B2 Ders Kitabı',
            url: 'https://github.com/AlejandroLopezSalek/ODL_Turco-Standard/raw/main/B2.pdf',
            size: '~14 MB',
            pages: '160',
            description: 'Libro de texto para nivel B2'
        }
    ],
    'C1': [
        {
            title: 'C1 Ders Kitabı',
            url: 'https://github.com/AlejandroLopezSalek/ODL_Turco-Standard/raw/main/C1.pdf',
            size: '~15 MB',
            pages: '180',
            description: 'Libro de texto para nivel C1'
        }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    // Safety check for Service
    if (window.ContributionService) {
        loadInitialData();
        loadBooks();
    } else {
        // Retry once after short delay if script order was off
        setTimeout(() => {
            if (window.ContributionService) {
                loadInitialData();
                loadBooks();
            } else {
                console.error('ContributionService not available');
            }
        }, 500);
    }

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentLevel = e.target.dataset.level;

            // Reset search when changing level
            const searchInput = document.getElementById('communitySearch');
            if (searchInput) searchInput.value = '';

            // Update contribute button
            updateContributeButton();

            loadLessons();
            loadBooks();
        });
    });

    // Search functionality
    const searchInput = document.getElementById('communitySearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterContent(e.target.value);
        });
    }
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.relative.inline-block')) {
            document.querySelectorAll('.dropdown-menu-active').forEach(menu => {
                menu.classList.add('hidden');
                menu.classList.remove('dropdown-menu-active');
            });
        }
    });

    // Check for search param in URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam && searchInput) {
        searchInput.value = searchParam;
        // Small delay to ensure data is loaded
        setTimeout(() => {
            filterContent(searchParam);
        }, 600);
    }

    // Hoist Modal to Body to fix positioning issues (similar to levels)
    const modalToHoist = document.getElementById('lessonModal');
    if (modalToHoist && modalToHoist.parentElement !== document.body) {
        document.body.appendChild(modalToHoist);
        console.log('✅ Community Modal moved to body root for fixed positioning');
    }

    console.log('✅ Community JS loaded'); // Debug log
});

function filterContent(searchTerm = '') {
    searchTerm = searchTerm.toLowerCase();
    loadBooks(searchTerm);
    loadLessons(searchTerm);
}

function loadBooks(searchTerm = '') {
    const booksSection = document.getElementById('booksSection');
    const booksGrid = document.getElementById('booksGrid');

    // Only show books if a specific level is selected
    if (currentLevel === 'all') {
        booksSection.style.display = 'none';
        return;
    }

    let levelBooks = booksData[currentLevel] || [];

    // Filter by search term
    if (searchTerm) {
        levelBooks = levelBooks.filter(book =>
            book.title.toLowerCase().includes(searchTerm) ||
            book.description.toLowerCase().includes(searchTerm)
        );
    }

    if (levelBooks.length === 0) {
        booksSection.style.display = 'none';
        return;
    }

    booksSection.style.display = 'block';
    booksGrid.innerHTML = '';

    levelBooks.forEach(book => {
        const card = document.createElement('div');
        // Tailwind: bg-white p-6 rounded-xl shadow border, hover effects
        card.className = 'group bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-300 dark:hover:border-slate-600 h-full';

        const icon = document.createElement('div');
        // Tailwind icon container
        icon.className = 'w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-2 flex items-center justify-center text-blue-600 dark:text-blue-400 transition-transform group-hover:scale-110 duration-300';
        icon.innerHTML = '<i class="fas fa-file-pdf text-3xl"></i>';

        const title = document.createElement('h3');
        title.className = 'text-xl font-bold text-slate-800 dark:text-slate-100 m-0';
        title.textContent = book.title;

        const description = document.createElement('p');
        description.className = 'text-slate-600 dark:text-slate-400 text-sm leading-relaxed m-0 flex-grow';
        description.textContent = book.description;

        const meta = document.createElement('div');
        meta.className = 'flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wide mt-2';
        meta.innerHTML = `
            <span class="flex items-center gap-1"><i class="fas fa-file-alt"></i> ${book.pages} pág.</span>
            <span class="flex items-center gap-1"><i class="fas fa-hdd"></i> ${book.size}</span>
        `;

        const actions = document.createElement('div');
        actions.className = 'flex gap-3 w-full mt-4';

        const viewBtn = document.createElement('a');
        viewBtn.href = book.url;
        viewBtn.target = '_blank';
        viewBtn.className = 'flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600';
        viewBtn.innerHTML = '<i class="fas fa-eye"></i> Ver';

        const downloadBtn = document.createElement('a');
        downloadBtn.href = book.url;
        downloadBtn.download = '';
        downloadBtn.className = 'flex-1 py-2.5 px-4 rounded-md font-semibold text-sm flex items-center justify-center gap-2 transition-colors bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Descargar';

        actions.appendChild(viewBtn);
        actions.appendChild(downloadBtn);

        card.appendChild(icon);
        card.appendChild(title);
        card.appendChild(description);
        card.appendChild(meta);
        card.appendChild(actions);

        booksGrid.appendChild(card);
    });
}

// Cache for lessons to prevent flickering
let allLessons = [];

async function loadInitialData() {
    try {
        allLessons = await window.ContributionService.getPublishedLessons();
        loadLessons();
    } catch (e) {
        console.error('Error loading lessons:', e);
    }
}

// Modify loadLessons to use cache instead of fetching
async function loadLessons(searchTerm = '') {
    const container = document.getElementById('lessonsList');
    // Use cached lessons
    let lessons = [...allLessons];

    // Filter by source: ONLY show community lessons, except for admins who might want to see all or debug
    // Default behavior: Show only 'community' lessons
    lessons = lessons.filter(l => !l.source || l.source === 'community');

    // Filter by level
    if (currentLevel !== 'all') {
        lessons = lessons.filter(l => l.level === currentLevel);
    }

    // Filter by search term
    if (searchTerm) {
        lessons = lessons.filter(l =>
            l.title.toLowerCase().includes(searchTerm) ||
            l.description.toLowerCase().includes(searchTerm) ||
            l.author.toLowerCase().includes(searchTerm)
        );
    }

    // Sort by date (newest first)
    lessons.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    if (lessons.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'text-center py-20 text-slate-400 dark:text-slate-500';
        emptyState.innerHTML = `
            <i class="fas fa-book-open text-6xl mb-4 opacity-50"></i>
            <p class="text-xl">No hay lecciones encontradas</p>
        `;
        container.innerHTML = '';
        container.appendChild(emptyState);
        return;
    }

    container.innerHTML = '';

    // Show separator
    const separator = document.getElementById('lessonsSeparator');
    if (separator) separator.classList.remove('hidden');

    lessons.forEach(lesson => {
        const card = document.createElement('div');
        // Tailwind card
        card.className = 'group bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 dark:hover:border-blue-600/50 relative h-full';

        // Header with Type and Status
        const header = document.createElement('div');
        header.className = 'flex justify-between items-start';
        header.innerHTML = `
            <div class="flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-bold">
                <i class="fas fa-book-open"></i>
                <span>Lección ${lesson.level}</span>
            </div>
            <span class="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Publicada
            </span>
        `;

        const title = document.createElement('h3');
        title.className = 'text-xl font-bold text-slate-800 dark:text-slate-100 m-0 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors';
        title.textContent = lesson.title;

        const description = document.createElement('p');
        description.className = 'text-slate-600 dark:text-slate-400 text-base leading-relaxed m-0 line-clamp-2';
        description.textContent = lesson.description;

        const meta = document.createElement('div');
        meta.className = 'flex items-center justify-between pt-4 mt-auto border-t border-slate-100 dark:border-slate-700/50 text-sm text-slate-500 dark:text-slate-500';
        meta.innerHTML = `
            <span class="flex items-center gap-2"><i class="fas fa-user text-slate-400"></i> ${lesson.author}</span>
            <span class="flex items-center gap-2"><i class="fas fa-calendar text-slate-400"></i> ${formatDate(lesson.publishedAt)}</span>
        `;

        // Actions Container
        const actions = document.createElement('div');
        actions.className = 'flex gap-2 w-full mt-2';

        // 1. Primary Action: View Lesson (Always visible)
        const viewBtn = document.createElement('button');
        viewBtn.className = 'flex-grow py-2.5 px-4 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2';
        viewBtn.innerHTML = '<i class="fas fa-eye"></i> Ver Lección';
        viewBtn.onclick = () => viewLesson(lesson.id);
        actions.appendChild(viewBtn);

        // 2. Secondary Actions: Dropdown (More Options)
        const isAdmin = window.ContributionService && window.ContributionService.isAdmin();

        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'relative inline-block';

        const moreBtn = document.createElement('button');
        moreBtn.className = 'w-12 h-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex items-center justify-center';
        moreBtn.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
        moreBtn.setAttribute('aria-label', 'Más opciones');

        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-20 hidden overflow-hidden flex-col';

        moreBtn.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.dropdown-menu-active').forEach(menu => {
                if (menu !== dropdownMenu) menu.classList.add('hidden');
            });
            dropdownMenu.classList.toggle('hidden');
            dropdownMenu.classList.toggle('dropdown-menu-active');
        };

        const editBtn = document.createElement('button');
        editBtn.className = 'w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 transition-colors';
        editBtn.innerHTML = '<i class="fas fa-edit text-indigo-500"></i> Sugerir Edición';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            editPublishedLesson(lesson.id);
        };
        dropdownMenu.appendChild(editBtn);

        if (isAdmin) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteLesson(lesson.id);
            };
            dropdownMenu.appendChild(deleteBtn);
        }

        dropdownContainer.appendChild(moreBtn);
        dropdownContainer.appendChild(dropdownMenu);
        actions.appendChild(dropdownContainer);

        card.appendChild(header);
        card.appendChild(title);
        card.appendChild(description);
        card.appendChild(meta);
        card.appendChild(actions);

        container.appendChild(card);
    });
}

async function viewLesson(id) {
    const lesson = await window.ContributionService.getLessonById(id);
    if (!lesson) return;

    document.getElementById('lessonTitle').textContent = lesson.title;

    const lessonBody = document.getElementById('lessonBody');
    lessonBody.innerHTML = `
        <div class="mb-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                <i class="fas fa-info-circle"></i> Información
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                    <strong class="text-slate-700 dark:text-slate-300 block mb-1">Nivel:</strong>
                    <span class="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded font-semibold">${lesson.level}</span>
                </div>
                <div>
                    <strong class="text-slate-700 dark:text-slate-300 block mb-1">Autor:</strong>
                    <span class="text-slate-600 dark:text-slate-400">${lesson.author}</span>
                </div>
                <div>
                    <strong class="text-slate-700 dark:text-slate-300 block mb-1">Fecha:</strong>
                    <span class="text-slate-600 dark:text-slate-400">${formatDate(lesson.publishedAt)}</span>
                </div>
            </div>
        </div>
        <div>
            <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <i class="fas fa-book text-indigo-600 dark:text-indigo-400"></i> Contenido
            </h3>
            <div class="prose dark:prose-invert max-w-none lesson-content">
                ${lesson.content}
            </div>
        </div>
    `;

    // Inject Pronunciation Buttons
    if (window.PronunciationSystem) {
        setTimeout(() => {
            const contentDiv = document.querySelector('.lesson-content');
            if (contentDiv) window.PronunciationSystem.inject(contentDiv);
        }, 100);
    }

    const modal = document.getElementById('lessonModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function closeLessonModal() {
    const modal = document.getElementById('lessonModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
}

function editPublishedLesson(id) {
    window.location.href = `/Contribute/?editLesson=${id}`;
}

// Custom Delete Modal Logic
let lessonToDeleteId = null;

function deleteLesson(id) {
    lessonToDeleteId = id;
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.style.display = 'flex';
        // Setup confirm button
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        confirmBtn.onclick = confirmDeleteLesson;
    } else {
        // Fallback if modal missing
        if (confirm('¿Confirmar eliminación?')) {
            performDelete(id);
        }
    }
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) modal.style.display = 'none';
    lessonToDeleteId = null;
}

async function confirmDeleteLesson() {
    if (!lessonToDeleteId) return;
    performDelete(lessonToDeleteId);
    closeDeleteModal();
}

async function performDelete(id) {
    try {
        await window.ContributionService.deleteContribution(id);
        if (window.toastSuccess) {
            window.toastSuccess('Lección eliminada correctamente', 'Éxito', 3000);
        } else {
            alert('Lección eliminada');
        }
        // Reload
        setTimeout(() => loadLessons(document.getElementById('communitySearch')?.value || ''), 500);
    } catch (e) {
        if (window.toastError) {
            window.toastError('Error al eliminar: ' + e.message, 'Error', 4000);
        } else {
            alert('Error al eliminar: ' + e.message);
        }
    }
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

function updateContributeButton() {
    const contributeBtn = document.getElementById('communityCreateBtn');
    if (!contributeBtn) return;

    if (currentLevel === 'all') {
        // No level selected, just go to contribute page
        contributeBtn.href = '/Contribute/';
    } else {
        // Pass the selected level as a parameter
        contributeBtn.href = `/Contribute/?level=${currentLevel}`;
    }
}

console.log('✅ Community Lessons JS loaded');