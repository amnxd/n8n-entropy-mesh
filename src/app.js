const express = require("express");
const cors = require("cors");
const { verifySignature, parseMetaMessage } = require("./integrations/providerWebhook");

function createApp({ engine, config }) {
  const app = express();
  app.use(cors());
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf ? buf.toString("utf8") : "";
      }
    })
  );

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "medsta-whatsapp-automation" });
  });

  /**
   * Meta WhatsApp Cloud API Webhook
   * 
   * Handles:
   * 1. GET requests - webhook verification during setup
   * 2. POST requests - incoming messages
   * 
   * More info: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/setup
   */
  app.get("/webhook/whatsapp", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const expectedToken = config.whatsapp.webhook.verifyToken;

    // Meta sends this during webhook setup
    if (mode === "subscribe" && token === expectedToken) {
      console.log("✅ Webhook verified successfully");
      return res.status(200).send(challenge);
    }

    console.warn("⚠️  Webhook verification failed");
    return res.status(403).json({ ok: false, error: "Forbidden" });
  });

  app.post("/webhook/whatsapp", async (req, res) => {
    const signature = req.headers["x-hub-signature-256"] || "";
    const webhookSecret = config.whatsapp.webhook.webhookSecret;

    // Verify signature if secret is configured
    if (webhookSecret) {
      const isValid = verifySignature(req.rawBody, signature, webhookSecret);
      if (!isValid) {
        console.warn("❌ Invalid webhook signature");
        return res.status(401).json({ ok: false, error: "Invalid signature" });
      }
    }

    // Parse the incoming message
    const parsed = parseMetaMessage(req.body);
    
    // Ignore status updates (delivery, read, etc.)
    if (parsed && parsed.type === "status") {
      console.log(`📊 Message status: ${parsed.status} for message ${parsed.messageId}`);
      return res.status(200).json({ ok: true });
    }

    // Handle incoming text messages
    if (parsed && parsed.from && parsed.message) {
      const result = await engine.handleIncoming({
        from: parsed.from,
        text: parsed.message
      });
      return res.status(200).json({ ok: true, from: parsed.from, result });
    }

    // Acknowledge receipt even if we can't parse
    return res.status(200).json({ ok: true });
  });


  app.post("/admin/complete/:requestId", async (req, res) => {
    const request = await engine.completeRequest(req.params.requestId);
    if (!request) {
      return res.status(404).json({ ok: false, error: "request not found" });
    }

    return res.json({ ok: true, request });
  });

  app.get("/debug/requests", (_req, res) => {
    res.json({ ok: true, requests: engine.listRequests() });
  });

  return app;
}

module.exports = { createApp };
