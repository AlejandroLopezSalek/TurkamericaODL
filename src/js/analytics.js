// ================================
// ANALYTICS & TRACKING SYSTEM
// Privacy-first, lightweight analytics
// ================================

class AnalyticsSystem {
    constructor() {
        // Use crypto.randomUUID() for secure random ID generation (fixes SonarCloud security hotspot)
        this.sessionId = this.sessionId || `${Date.now()}_${crypto.randomUUID().substring(0, 9)}`;
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
            url: globalThis.location.href,
            path: globalThis.location.pathname,
            title: document.title,
            sessionId: this.sessionId
        };

        this.send(pageData);
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
        globalThis.addEventListener('error', (e) => {
            this.track('error', {
                message: e.message,
                filename: e.filename,
                line: e.lineno
            });
        });
    }

    // Send data to backend - DISABLED per user request (keeping data local/console only)
    send(data) {
        // Tracking disabled to prevent database clutter
        // "Smart Capi" tracking is handled separately in progress-tracker.js
    }
}

// Initialize
globalThis.AnalyticsSystem = new AnalyticsSystem();

// Simple global API
globalThis.analytics = {
    track: (name, props) => globalThis.AnalyticsSystem.track(name, props)
};
