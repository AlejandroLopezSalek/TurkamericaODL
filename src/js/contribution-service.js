// ========================================
// CONTRIBUTION SERVICE - API Handler
// ========================================

(function () {
    if (window.ContributionService) {
        console.warn('ContributionService already initialized');
        return;
    }

    class ContributionService {
        constructor() {
            this.API_URL = '/api/contributions';
            this.LESSONS_API_URL = '/api/lessons';
        }

        // ========================================
        // PUBLIC METHODS (Async)
        // ========================================

        async getPublishedLessons() {
            try {
                // First try to get from API (new system)
                const response = await fetch(this.LESSONS_API_URL);
                if (response.ok) {
                    return await response.json();
                }
                // Fallback to localStorage if API fails (or while migrating)
                console.warn('API failed, falling back to local storage for lessons');
                const localLessons = JSON.parse(localStorage.getItem('turkamerica_lessons') || '[]');
                return localLessons.filter(l => l.status === 'published');
            } catch (error) {
                console.error('Error fetching lessons:', error);
                return [];
            }
        }

        async getLessonById(id) { // ID can be string or _id
            try {
                const response = await fetch(`${this.LESSONS_API_URL}/${id}`);
                if (response.ok) return await response.json();
            } catch (e) { console.error(e); }

            // Fallback
            const lessons = JSON.parse(localStorage.getItem('turkamerica_lessons') || '[]');
            return lessons.find(l => l.id === id);
        }

        async getAllRequests() {
            try {
                const response = await fetch(this.API_URL);
                if (!response.ok) throw new Error('Failed to fetch requests');
                return await response.json();
            } catch (e) {
                console.error('Error getting requests', e);
                return [];
            }
        }

        async getPendingRequests() {
            // Can filter on server or client. Server has /pending endpoint.
            const response = await fetch(`${this.API_URL}/pending`);
            if (!response.ok) throw new Error('Failed to fetch pending requests');
            return await response.json();
        }

        async getRequestById(id) {
            // We can fetch all and find, or fetch single if endpoint exists.
            // Current backend doesn't have GET /:id for contributions, only for lessons.
            // So we fetch all (or filtered list) and find.
            // Optimization: Add GET /:id endpoint later. For now, fetch all is fine for small scale.
            const requests = await this.getAllRequests();
            return requests.find(r => r._id === id || r.id === id);
        }

        async getStats() {
            // We can create a specific stats endpoint, or just calculate from all requests.
            // For now, fetch all and calculate.
            const requests = await this.getAllRequests();
            return {
                total: requests.length,
                pending: requests.filter(r => r.status === 'pending').length,
                approved: requests.filter(r => r.status === 'approved').length,
                rejected: requests.filter(r => r.status === 'rejected').length,
                lessonEdits: requests.filter(r => r.status === 'pending' && r.type === 'lesson_edit').length,
                bookUploads: requests.filter(r => r.status === 'pending' && r.type === 'book_upload').length
            };
        }

        isAdmin() {
            // Check current user based on Auth Service (localStorage)
            // This remains client-side check for UI visibility, but backend protects endpoints.
            const user = JSON.parse(localStorage.getItem('currentUser'));
            return user && (user.role === 'admin' || user.username === 'admin' || user.email.includes('admin'));
        }

        // ========================================
        // SUBMISSION METHODS
        // ========================================

        async submitLessonEdit(data) {
            const user = JSON.parse(localStorage.getItem('currentUser'));
            const payload = {
                type: 'lesson_edit',
                title: data.lessonTitle,
                description: data.description,
                data: data,
                submittedBy: user ? { id: user.id || user._id, username: user.username, email: user.email } : null
            };

            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to submit request');
            return await response.json();
        }

        async submitBookUpload(data) {
            const user = JSON.parse(localStorage.getItem('currentUser'));
            const payload = {
                type: 'book_upload',
                title: data.title,
                description: data.description,
                data: data,
                submittedBy: user ? { id: user.id || user._id, username: user.username, email: user.email } : null
            };

            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to submit request');
            return await response.json();
        }

        // ========================================
        // ADMIN METHODS
        // ========================================

        async approveRequest(requestId, finalContent = null) {
            let body = { status: 'approved' };
            if (finalContent) {
                body.finalContent = finalContent;
            }

            const response = await fetch(`${this.API_URL}/${requestId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) throw new Error('Failed to approve request');

            // Safe JSON parsing
            const text = await response.text();
            return text ? JSON.parse(text) : { success: true };
        }

        async rejectRequest(requestId, reason) {
            const response = await fetch(`${this.API_URL}/${requestId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected', reason: reason })
            });

            if (!response.ok) throw new Error('Failed to reject request');
            const text = await response.text();
            return text ? JSON.parse(text) : { success: true };
        }

        async deleteRequest(requestId) {
            const response = await fetch(`${this.API_URL}/${requestId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete request');
            const text = await response.text();
            return text ? JSON.parse(text) : { success: true };
        }

        // Make deleteContribution available for community lessons
        async deleteContribution(id) {
            // Assuming the same endpoint works or there's a lessons endpoint
            const response = await fetch(`${this.LESSONS_API_URL}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete lesson');
            const text = await response.text();
            return text ? JSON.parse(text) : { success: true };
        }
    }

    window.ContributionService = new ContributionService();
    console.log('✅ Contribution Service API initialized');

})();
