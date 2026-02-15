// ========================================
// CONTRIBUTION SERVICE - API Handler
// ========================================

(function () {
    if (globalThis.ContributionService) {
        console.warn('ContributionService already initialized');
        return;
    }

    class ContributionService {
        API_URL = '/api/contributions';
        LESSONS_API_URL = '/api/lessons';


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
            // Validate token before making request
            if (!this.isTokenValid()) {
                this.handleAuthError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                throw new Error('Token expired or invalid');
            }

            const token = localStorage.getItem('authToken');
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            try {
                const response = await fetch(`${this.API_URL}/pending`, {
                    headers: headers
                });

                if (response.status === 401) {
                    this.handleAuthError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    throw new Error('Unauthorized - Token expired or invalid');
                }

                if (!response.ok) {
                    throw new Error(`Failed to fetch pending requests: ${response.status}`);
                }

                return await response.json();
            } catch (error) {
                // Re-throw authentication errors
                if (error.message.includes('Unauthorized') || error.message.includes('Token expired')) {
                    throw error;
                }

                console.error('Error fetching pending requests:', error);
                throw new Error('Failed to fetch pending requests');
            }
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

        /**
         * Validates if the current JWT token is still valid
         * @returns {boolean} True if token exists and hasn't expired
         */
        isTokenValid() {
            const token = localStorage.getItem('authToken');
            if (!token) return false;

            try {
                // Decode JWT payload (format: header.payload.signature)
                const parts = token.split('.');
                if (parts.length !== 3) return false;

                const payload = JSON.parse(atob(parts[1]));

                // Check if token has expiration claim
                if (!payload.exp) return false;

                // Convert exp (seconds) to milliseconds and compare with current time
                const expirationTime = payload.exp * 1000;
                const currentTime = Date.now();

                return currentTime < expirationTime;
            } catch (error) {
                console.error('Error validating token:', error);
                return false;
            }
        }

        /**
         * Handles authentication errors by clearing session and redirecting to login
         * @param {string} message - Optional error message to display
         */
        handleAuthError(message = 'Tu sesión ha expirado') {
            // Clear authentication data
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');

            // Redirect to login with expired flag
            const loginUrl = `/login/?expired=true&message=${encodeURIComponent(message)}`;
            globalThis.location.href = loginUrl;
        }


        // ========================================
        // SUBMISSION METHODS
        // ========================================

        async submitLessonEdit(data) {
            const user = JSON.parse(localStorage.getItem('currentUser'));
            const token = localStorage.getItem('authToken');

            const payload = {
                type: 'lesson_edit',
                title: data.lessonTitle,
                description: data.description,
                data: data,
                submittedBy: user ? { id: user.id || user._id, username: user.username, email: user.email } : null
            };

            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to submit request');
            return await response.json();
        }

        async submitBookUpload(data) {
            const user = JSON.parse(localStorage.getItem('currentUser'));
            const token = localStorage.getItem('authToken');

            const payload = {
                type: 'book_upload',
                title: data.title,
                description: data.description,
                data: data,
                submittedBy: user ? { id: user.id || user._id, username: user.username, email: user.email } : null
            };

            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to submit request');
            return await response.json();
        }

        // ========================================
        // ADMIN METHODS
        // ========================================

        async approveRequest(requestId, finalContent = null) {
            // Validate token before making request
            if (!this.isTokenValid()) {
                this.handleAuthError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                throw new Error('Token expired or invalid');
            }

            const token = localStorage.getItem('authToken');
            const body = { status: 'approved' };
            if (finalContent) {
                body.finalContent = finalContent;
            }

            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            try {
                const response = await fetch(`${this.API_URL}/${requestId}/status`, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(body)
                });

                if (response.status === 401) {
                    this.handleAuthError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    throw new Error('Unauthorized - Token expired or invalid');
                }

                if (!response.ok) {
                    throw new Error(`Failed to approve request: ${response.status}`);
                }

                // Safe JSON parsing
                const text = await response.text();
                return text ? JSON.parse(text) : { success: true };
            } catch (error) {
                // Re-throw authentication errors
                if (error.message.includes('Unauthorized') || error.message.includes('Token expired')) {
                    throw error;
                }

                console.error('Error approving request:', error);
                throw new Error('Failed to approve request');
            }
        }


        async rejectRequest(requestId, reason) {
            // Validate token before making request
            if (!this.isTokenValid()) {
                this.handleAuthError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                throw new Error('Token expired or invalid');
            }

            const token = localStorage.getItem('authToken');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            try {
                const response = await fetch(`${this.API_URL}/${requestId}/status`, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify({ status: 'rejected', reason: reason })
                });

                if (response.status === 401) {
                    this.handleAuthError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    throw new Error('Unauthorized - Token expired or invalid');
                }

                if (!response.ok) {
                    throw new Error(`Failed to reject request: ${response.status}`);
                }

                const text = await response.text();
                return text ? JSON.parse(text) : { success: true };
            } catch (error) {
                // Re-throw authentication errors
                if (error.message.includes('Unauthorized') || error.message.includes('Token expired')) {
                    throw error;
                }

                console.error('Error rejecting request:', error);
                throw new Error('Failed to reject request');
            }
        }


        async deleteRequest(requestId) {
            // Validate token before making request
            if (!this.isTokenValid()) {
                this.handleAuthError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                throw new Error('Token expired or invalid');
            }

            const token = localStorage.getItem('authToken');
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            try {
                const response = await fetch(`${this.API_URL}/${requestId}`, {
                    method: 'DELETE',
                    headers: headers
                });

                if (response.status === 401) {
                    this.handleAuthError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    throw new Error('Unauthorized - Token expired or invalid');
                }

                if (!response.ok) {
                    throw new Error(`Failed to delete request: ${response.status}`);
                }

                const text = await response.text();
                return text ? JSON.parse(text) : { success: true };
            } catch (error) {
                // Re-throw authentication errors
                if (error.message.includes('Unauthorized') || error.message.includes('Token expired')) {
                    throw error;
                }

                console.error('Error deleting request:', error);
                throw new Error('Failed to delete request');
            }
        }


        // Make deleteContribution available for community lessons
        async deleteContribution(id) {
            // Validate token before making request
            if (!this.isTokenValid()) {
                this.handleAuthError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                throw new Error('Token expired or invalid');
            }

            const token = localStorage.getItem('authToken');
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            try {
                // Assuming the same endpoint works or there's a lessons endpoint
                const response = await fetch(`${this.LESSONS_API_URL}/${id}`, {
                    method: 'DELETE',
                    headers: headers
                });

                if (response.status === 401) {
                    this.handleAuthError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    throw new Error('Unauthorized - Token expired or invalid');
                }

                if (!response.ok) {
                    throw new Error(`Failed to delete lesson: ${response.status}`);
                }

                const text = await response.text();
                return text ? JSON.parse(text) : { success: true };
            } catch (error) {
                // Re-throw authentication errors
                if (error.message.includes('Unauthorized') || error.message.includes('Token expired')) {
                    throw error;
                }

                console.error('Error deleting lesson:', error);
                throw new Error('Failed to delete lesson');
            }
        }

    }

    globalThis.ContributionService = new ContributionService();
    console.log('✅ Contribution Service API initialized');

})();
