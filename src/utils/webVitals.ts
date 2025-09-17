import { onCLS, onFID, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

// Web Vitals monitoring configuration
interface WebVitalsConfig {
  analyticsId?: string;
  debug?: boolean;
  reportAllChanges?: boolean;
}

// Default configuration
const defaultConfig: WebVitalsConfig = {
  debug: import.meta.env.DEV,
  reportAllChanges: true,
};

// Metric reporting function
function sendToAnalytics(metric: Metric, config: WebVitalsConfig) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    url: window.location.href,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    connectionType: (navigator as any).connection?.effectiveType || 'unknown',
  });

  // Log in development mode
  if (config.debug) {
    console.log('Web Vitals Metric:', metric.name, metric.value, metric.rating);
  }

  // Send to analytics endpoint (to be implemented in Wave 1)
  if (config.analyticsId) {
    // This will be implemented when backend is available
    fetch('/api/v1/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    }).catch((error) => {
      if (config.debug) {
        console.error('Failed to send Web Vitals data:', error);
      }
    });
  }

  // Send to Google Analytics if available
  if (typeof (window as any).gtag !== 'undefined') {
    (window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.value),
      non_interaction: true,
      custom_map: {
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_rating: metric.rating,
      },
    });
  }
}

// Initialize Web Vitals monitoring
export function initWebVitals(config: WebVitalsConfig = {}) {
  const finalConfig = { ...defaultConfig, ...config };

  // Core Web Vitals
  onCLS((metric) => sendToAnalytics(metric, finalConfig));
  onFID((metric) => sendToAnalytics(metric, finalConfig));
  onFCP((metric) => sendToAnalytics(metric, finalConfig));
  onLCP((metric) => sendToAnalytics(metric, finalConfig));
  onTTFB((metric) => sendToAnalytics(metric, finalConfig));

  // Log initialization
  if (finalConfig.debug) {
    console.log('Web Vitals monitoring initialized', finalConfig);
  }
}

// Export metric collection functions for manual testing
export { onCLS, onFID, onFCP, onLCP, onTTFB };