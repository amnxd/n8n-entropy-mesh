const { createApp } = require("./app");
const config = require("./config");
const store = require("./services/store");
const { WhatsAppGateway } = require("./integrations/whatsappGateway");
const { MedstaEngine } = require("./services/medstaEngine");
const { PostgresRepo } = require("./services/postgresRepo");

// Optional scaling services (graceful fallback if not installed)
let queue, cache, metrics;

function initOptionalServices() {
  // Initialize metrics (always available)
  try {
    metrics = require("./services/metrics");
    metrics.initMetrics();
  } catch (error) {
    metrics = null;
  }

  // Initialize optional cache (Redis)
  if (String(process.env.REDIS_ENABLED || "false").toLowerCase() === "true") {
    try {
      cache = require("./services/cache");
      cache.initRedis();
    } catch (error) {
      console.warn("Cache service failed to initialize:", error.message);
      cache = null;
    }
  }

  // Initialize optional queue (Bull + Redis)
  if (String(process.env.QUEUE_ENABLED || "false").toLowerCase() === "true") {
    try {
      queue = require("./services/requestQueue");
      queue.initQueue();
    } catch (error) {
      console.warn("Queue service failed to initialize:", error.message);
      queue = null;
    }
  }
}

async function bootstrap() {
  // Initialize scaling services
  initOptionalServices();

  const repo = new PostgresRepo({ 
    enabled: config.enableDb, 
    connectionString: config.dbUrl 
  });
  await repo.init();

  const gateway = new WhatsAppGateway(config.whatsapp);
  const engine = new MedstaEngine({ store, gateway, repo, config });

  // Inject optional services into engine if available
  if (metrics) {
    engine.metrics = metrics;
  }
  if (cache) {
    engine.cache = cache;
  }
  if (queue) {
    engine.queue = queue;
    // Start queue worker
    queue.startQueueWorker(async (requestId, userPhone, type, details) => {
      // Broadcast logic
      await engine.broadcastRequestToProviders({
        id: requestId,
        userPhone,
        type,
        details
      });
    });
  }

  const app = createApp({ engine, config });

  // Add metrics endpoint if enabled
  if (metrics) {
    app.get("/metrics", (_req, res) => {
      res.set("Content-Type", "application/json");
      res.json(metrics.getMetricsSummary());
    });

    app.get("/metrics/prometheus", (_req, res) => {
      res.set("Content-Type", "text/plain");
      res.send(metrics.exportPrometheus());
    });

    // Start periodic logging
    if (String(process.env.METRICS_LOG_INTERVAL || "").length > 0) {
      const intervalMin = Number(process.env.METRICS_LOG_INTERVAL || 5);
      metrics.startPeriodicLogging(intervalMin);
    }
  }

  // Add cache stats endpoint if enabled
  if (cache) {
    app.get("/cache/stats", async (_req, res) => {
      const stats = await cache.getStats();
      res.json({ ok: true, stats });
    });
  }

  // Add queue stats endpoint if enabled
  if (queue) {
    app.get("/queue/stats", async (_req, res) => {
      const stats = await queue.getQueueStats();
      res.json({ ok: true, stats });
    });
  }

  app.listen(config.port, () => {
    console.log(`🚀 MEDSTA automation server running on port ${config.port}`);
    if (metrics) console.log("📊 Metrics enabled - GET /metrics");
    if (cache) console.log("💾 Cache enabled - GET /cache/stats");
    if (queue) console.log("📦 Queue enabled - GET /queue/stats");
  });

  // Quote aggregation timeout job
  setInterval(async () => {
    try {
      await engine.processQuoteTimeouts();
    } catch (error) {
      console.error("quote timeout job failed", error);
    }
  }, 5000);

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    if (queue) await queue.drainQueue();
    if (cache) await cache.close();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
