// ================================
// CONFIGURACIÓN GLOBAL - TurkAmerica
// ================================

// Detectar entorno
const isDevelopment = globalThis.location.hostname === 'localhost' ||
  globalThis.location.hostname === '127.0.0.1';

// Configuración de API
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:3000',
    apiPath: '/api'
  },
  production: {
    baseURL: globalThis.location.origin,
    apiPath: '/api'
  }
};

// Seleccionar configuración según entorno
const currentConfig = isDevelopment ? API_CONFIG.development : API_CONFIG.production;

// Configuración global de la aplicación
globalThis.APP_CONFIG = {
  // API URLs
  API_BASE_URL: `${currentConfig.baseURL}${currentConfig.apiPath}`,
  BASE_URL: currentConfig.baseURL,

  // Configuración de autenticación
  AUTH: {
    TOKEN_KEY: 'authToken',
    USER_KEY: 'currentUser',
    TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
  },

  // Configuración de la aplicación
  APP: {
    NAME: 'TurkAmerica',
    VERSION: '1.0.0',
    ENVIRONMENT: isDevelopment ? 'development' : 'production',
    DEFAULT_LANGUAGE: 'es',
    SUPPORTED_LANGUAGES: ['es', 'en', 'tr'],
    LEVELS: ['A1', 'A2', 'B1', 'B2', 'C1']
  },

  // Configuración de almacenamiento
  STORAGE: {
    PREFIX: 'turkamerica_',
    KEYS: {
      THEME: 'darkMode',
      LANGUAGE: 'language',
      FONT_SIZE: 'fontSize',
      NOTIFICATIONS: 'notifications',
      SOUND: 'sound',
      COMPLETED_ACTIVITIES: 'completedActivities',
      GRAMMAR_TIPS: 'consejosGramatica',
      GRAMMAR_PROGRESS: 'progresoGramatica',
      THEME_USAGE: 'themeUsage'
    }
  },

  // Configuración de notificaciones
  NOTIFICATIONS: {
    DURATION: {
      SUCCESS: 3000,
      ERROR: 5000,
      INFO: 4000,
      WARNING: 4000
    }
  },

  // Endpoints de API
  ENDPOINTS: {
    // Auth
    AUTH_REGISTER: '/register',
    AUTH_LOGIN: '/login',
    AUTH_LOGOUT: '/logout',
    AUTH_VERIFY: '/verify',
    AUTH_PROFILE: '/profile',
    AUTH_STREAK: '/streak',
    AUTH_UPDATE_STREAK: '/update-streak',

    // Health
    HEALTH: '/health'
  },

  // Configuración de streak
  STREAK: {
    UPDATE_INTERVAL: 60000, // Verificar cada minuto
    MESSAGES: {
      0: { text: '¡Empieza tu racha hoy! Cada día cuenta.', icon: '✨' },
      1: { text: '¡Comenzaste una nueva racha! Sigue así mañana.', icon: '🎉' },
      7: { text: '¡Una semana completa! 🔥', icon: '⭐' },
      30: { text: '¡UN MES! Eres imparable! 🚀', icon: '🏆' },
      100: { text: '¡INCREÍBLE! Eres una leyenda del aprendizaje! 👑', icon: '💎' }
    }
  },

  // Validación
  VALIDATION: {
    USERNAME: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 20,
      PATTERN: /^[a-zA-Z0-9_]+$/
    },
    PASSWORD: {
      MIN_LENGTH: 6,
      MAX_LENGTH: 100
    },
    EMAIL: {
      PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    BIO: {
      MAX_LENGTH: 500
    }
  },

  // URLs de recursos externos
  EXTERNAL: {
    DONATION_URL: 'https://whydonate.com/fundraising/-apoya-mas-desarollos-para-nuestra-comunidad',
    SUPPORT_EMAIL: 'contact@turkamerica.com'
  },

  // Métodos helper
  getFullApiUrl(endpoint) {
    return `${this.API_BASE_URL}${endpoint}`;
  },

  getStorageKey(key) {
    return `${this.STORAGE.PREFIX}${key}`;
  },

  isProduction() {
    return this.APP.ENVIRONMENT === 'production';
  },

  isDevelopment() {
    return this.APP.ENVIRONMENT === 'development';
  }
};

// Suppress logs in production
if (!isDevelopment) {
  const noop = () => { };
  console.log = noop;
  console.info = noop;
  console.warn = noop;
  console.error = noop;
} else {
  // Log de configuración SOLO en desarrollo
  console.log('🔧 TurkAmerica Configuration:', {
    Environment: globalThis.APP_CONFIG.APP.ENVIRONMENT,
    API_URL: globalThis.APP_CONFIG.API_BASE_URL,
    Version: globalThis.APP_CONFIG.APP.VERSION
  });
}

// Hacer disponible globalmente
globalThis.API_BASE_URL = globalThis.APP_CONFIG.API_BASE_URL;