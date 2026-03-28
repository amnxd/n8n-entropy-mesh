const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: Number(process.env.PORT || 8080),
  dbUrl: process.env.DATABASE_URL || "",
  enableDb: String(process.env.ENABLE_DB || "false").toLowerCase() === "true",
  quoteTimeoutSeconds: Number(process.env.QUOTE_TIMEOUT_SECONDS || 120),
  maxQuotesToShow: Number(process.env.MAX_QUOTES_TO_SHOW || 3),
  maxQuotesToWait: Number(process.env.MAX_QUOTES_TO_WAIT || 3),
  whatsapp: {
    mode: (process.env.WHATSAPP_MODE || "mock").toLowerCase(),
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
    timeoutMs: Number(process.env.WHATSAPP_TIMEOUT_MS || 10000),
    webhook: {
      verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "medsta_verify_token",
      webhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET || "",
      verifyEnabled: String(process.env.WHATSAPP_WEBHOOK_VERIFY || "false").toLowerCase() === "true"
    }
  },
  automation: {
    n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || "",
    n8nApiKey: process.env.N8N_API_KEY || "",
    n8nTimeoutMs: Number(process.env.N8N_TIMEOUT_MS || 5000)
  },
  scaling: {
    // Redis caching (optional)
    redisEnabled: String(process.env.REDIS_ENABLED || "false").toLowerCase() === "true",
    redisUrl: process.env.REDIS_URL || "",
    redisHost: process.env.REDIS_HOST || "localhost",
    redisPort: Number(process.env.REDIS_PORT || 6379),

    // Bull job queue (optional)
    queueEnabled: String(process.env.QUEUE_ENABLED || "false").toLowerCase() === "true",

    // Rate limiting
    rateLimitEnabled: String(process.env.RATE_LIMIT_ENABLED || "false").toLowerCase() === "true",
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000), // 1 minute
    rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100),

    // Monitoring & metrics
    metricsEnabled: String(process.env.METRICS_ENABLED || "true").toLowerCase() === "true",
    metricsLogInterval: Number(process.env.METRICS_LOG_INTERVAL || 0), // 0 = no periodic logging

    // Connection pool
    dbPoolMax: Number(process.env.DB_POOL_MAX || 30),
    dbPoolIdleTimeoutMs: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS || 30000),
    dbPoolConnectionTimeoutMs: Number(process.env.DB_POOL_CONNECTION_TIMEOUT_MS || 2000)
  }
};
