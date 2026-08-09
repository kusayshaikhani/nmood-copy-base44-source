// RM-003 Environment-aware configuration. Auto-selects development / staging /
// production and exposes per-environment API config, feature-flag defaults,
// log level, analytics keys, push config, and subscription config. Each
// environment maintains independent configuration.
const ENVIRONMENTS = ['development', 'staging', 'production'];

function detectEnvironment() {
  const explicit = import.meta.env?.VITE_APP_ENV;
  if (explicit && ENVIRONMENTS.includes(explicit)) return explicit;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (/stage|staging/i.test(host)) return 'staging';
    if (/(^localhost$|127\.0\.0\.1|\.local$)/i.test(host)) return 'development';
  }
  return import.meta.env?.MODE === 'development' ? 'development' : 'production';
}

export const ENVIRONMENT = detectEnvironment();
export const IS_DEV = ENVIRONMENT === 'development';
export const IS_STAGING = ENVIRONMENT === 'staging';
export const IS_PROD = ENVIRONMENT === 'production';

const ENV_CONFIGS = {
  development: {
    api: { logLevel: 'debug', enableAnalytics: false, analyticsKey: '' },
    featureFlagDefaults: {
      ai_recommendations: true, business_communities: true, sponsored_experiences: false,
      premium_experiments: true, upcoming_features: true,
    },
    push: { enabled: false, key: '' },
    subscription: { sandbox: true, validateReceipts: false },
  },
  staging: {
    api: {
      logLevel: 'info', enableAnalytics: true,
      analyticsKey: import.meta.env?.VITE_ANALYTICS_KEY_STAGING || '',
    },
    featureFlagDefaults: {
      ai_recommendations: true, business_communities: false, sponsored_experiences: false,
      premium_experiments: true, upcoming_features: false,
    },
    push: { enabled: true, key: import.meta.env?.VITE_PUSH_KEY_STAGING || '' },
    subscription: { sandbox: true, validateReceipts: true },
  },
  production: {
    api: {
      logLevel: 'warn', enableAnalytics: true,
      analyticsKey: import.meta.env?.VITE_ANALYTICS_KEY || '',
    },
    featureFlagDefaults: {
      ai_recommendations: true, business_communities: false, sponsored_experiences: false,
      premium_experiments: false, upcoming_features: false,
    },
    push: { enabled: true, key: import.meta.env?.VITE_PUSH_KEY || '' },
    subscription: { sandbox: false, validateReceipts: true },
  },
};

export const ENV_CONFIG = ENV_CONFIGS[ENVIRONMENT];
export const LOG_LEVEL = ENV_CONFIG.api.logLevel;