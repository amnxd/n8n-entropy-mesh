/**
 * Metrics & Monitoring System
 * 
 * Tracks:
 * - Request counts by type
 * - Quote parsing stats
 * - Response times
 * - Error rates
 * - Queue depth
 * 
 * Exports Prometheus metrics at /metrics endpoint
 */

let promClient;
let enabled = false;

function initMetrics() {
  try {
    promClient = require('prom-client');
    enabled = true;
    console.log('✅ Metrics initialized');
    return true;
  } catch (error) {
    console.warn('⚠️  Prometheus not available:', error.message);
    enabled = false;
    return false;
  }
}

// Counters
const requestCounter = new Map();
const quoteCounter = new Map();
const errorCounter = new Map();

// Histograms / Response times
const responseTimes = new Map();

/**
 * Track request creation
 */
function trackRequest(type, status = 'created') {
  const key = `${type}:${status}`;
  requestCounter.set(key, (requestCounter.get(key) || 0) + 1);
}

/**
 * Track quote received
 */
function trackQuote(type, isValid = true) {
  const key = `${type}:${isValid ? 'valid' : 'invalid'}`;
  quoteCounter.set(key, (quoteCounter.get(key) || 0) + 1);
}

/**
 * Track error
 */
function trackError(type, errorType = 'unknown') {
  const key = `${type}:${errorType}`;
  errorCounter.set(key, (errorCounter.get(key) || 0) + 1);
}

/**
 * Track response time
 */
function trackResponseTime(endpoint, durationMs) {
  if (!responseTimes.has(endpoint)) {
    responseTimes.set(endpoint, []);
  }
  responseTimes.get(endpoint).push(durationMs);
}

/**
 * Get metrics summary
 */
function getMetricsSummary() {
  const calculateStats = (values) => {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / sorted.length;
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    return { avg, p50, p95, p99, count: sorted.length };
  };

  return {
    requests: Object.fromEntries(requestCounter),
    quotes: Object.fromEntries(quoteCounter),
    errors: Object.fromEntries(errorCounter),
    responseTimes: Object.fromEntries(
      Array.from(responseTimes.entries()).map(([endpoint, times]) => [
        endpoint,
        calculateStats(times)
      ])
    ),
    timestamp: new Date().toISOString()
  };
}

/**
 * Reset metrics (for rotating daily stats)
 */
function resetMetrics() {
  requestCounter.clear();
  quoteCounter.clear();
  errorCounter.clear();
  responseTimes.clear();
  console.log('📊 Metrics reset');
}

/**
 * Export as JSON (for dashboards)
 */
function exportJSON() {
  return JSON.stringify(getMetricsSummary(), null, 2);
}

/**
 * Export as Prometheus format (if available)
 */
function exportPrometheus() {
  if (!enabled || !promClient) {
    return exportJSON();  // Fallback to JSON
  }

  const lines = [];
  
  // Requests
  for (const [key, value] of requestCounter.entries()) {
    const [type, status] = key.split(':');
    lines.push(`medsta_requests_total{type="${type}",status="${status}"} ${value}`);
  }
  
  // Quotes
  for (const [key, value] of quoteCounter.entries()) {
    const [type, validity] = key.split(':');
    lines.push(`medsta_quotes_total{type="${type}",validity="${validity}"} ${value}`);
  }
  
  // Errors
  for (const [key, value] of errorCounter.entries()) {
    const [type, errorType] = key.split(':');
    lines.push(`medsta_errors_total{type="${type}",error="${errorType}"} ${value}`);
  }

  // Response times
  for (const [endpoint, stats] of responseTimes.entries()) {
    if (stats.length > 0) {
      const sorted = [...stats].sort((a, b) => a - b);
      const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
      lines.push(`medsta_response_time_avg_ms{endpoint="${endpoint}"} ${avg.toFixed(2)}`);
      lines.push(`medsta_response_time_p95_ms{endpoint="${endpoint}"} ${sorted[Math.floor(sorted.length * 0.95)]}`);
    }
  }

  lines.push(`# Generated at ${new Date().toISOString()}`);
  return lines.join('\n');
}

/**
 * Log periodic stats (every N minutes)
 */
function startPeriodicLogging(intervalMinutes = 5) {
  const ms = intervalMinutes * 60 * 1000;
  
  setInterval(() => {
    const summary = getMetricsSummary();
    console.log('\n📊 === METRICS SUMMARY ===');
    console.log(JSON.stringify(summary, null, 2));
    console.log('========================\n');
  }, ms);

  console.log(`📊 Metrics logging enabled (every ${intervalMinutes} min)`);
}

module.exports = {
  initMetrics,
  trackRequest,
  trackQuote,
  trackError,
  trackResponseTime,
  getMetricsSummary,
  resetMetrics,
  exportJSON,
  exportPrometheus,
  startPeriodicLogging,
  isEnabled: () => enabled
};
