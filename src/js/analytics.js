// ================================
// ANALYTICS & TRACKING SYSTEM
// Privacy-first, lightweight analytics
// ================================

class AnalyticsSystem {
    constructor() {
        this.sessionId = this.sessionId || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.init();
    }

    init() {
        this.trackPageView();
        this.setupErrorTracking();
    }

    // Track page view
    trackPageView() {
        const pageData = {
            type: 'pageview',
            timestamp: Date.now(),
            url: window.location.href,
            path: window.location.pathname,
            title: document.title,
            sessionId: this.sessionId
        };

        this.send(pageData);

        if (window.APP_CONFIG?.isDevelopment()) {
            // console.log('📊 Page View:', pageData.path);
        }
    }

    // Track custom event
    track(eventName, properties = {}) {
        const event = {
            type: 'event',
            name: eventName,
            properties: properties,
            timestamp: Date.now(),
            sessionId: this.sessionId
        };

        this.send(event);
    }

    // Setup essential error tracking
    setupErrorTracking() {
        window.addEventListener('error', (e) => {
            this.track('error', {
                message: e.message,
                filename: e.filename,
                line: e.lineno
            });
        });
    }

    // Send data to backend - DISABLED per user request (keeping data local/console only)
    send(data) {
        // const endpoint = '/api/analytics'; 
        // Logic removed to prevent database clutter. 
        // "Smart Capi" tracking is handled separately in progress-tracker.js
        if (window.APP_CONFIG?.isDevelopment()) {
            // console.log('📊 Analytics Event (Not sent to server):', data);
        }
    }
}

// Initialize
window.AnalyticsSystem = new AnalyticsSystem();

// Simple global API
window.analytics = {
    track: (name, props) => window.AnalyticsSystem.track(name, props)
};

