/**
 * Meta WhatsApp Cloud API Webhook Handler
 * 
 * Handles:
 * - Webhook verification (for initial setup)
 * - Signature verification (x-hub-signature-256)
 * - Message parsing from Meta's webhook format
 * 
 * 100% FREE - No vendor lock-in!
 */

const crypto = require("crypto");

/**
 * Verify webhook signature from Meta
 * Uses HMAC SHA256 with x-hub-signature-256 header
 */
function verifySignature(body, signature, secret) {
  if (!secret) {
    console.warn("⚠️  WHATSAPP_WEBHOOK_SECRET not configured. Skipping signature verification.");
    return true;
  }

  if (!signature) {
    return false;
  }

  // Meta format: "sha256=<hash>"
  const expectedSignature = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Parse message from Meta's Cloud API webhook format
 * 
 * Webhook payload structure:
 * {
 *   "object": "whatsapp_business_account",
 *   "entry": [
 *     {
 *       "id": "123",
 *       "changes": [
 *         {
 *           "value": {
 *             "messaging_product": "whatsapp",
 *             "messages": [{
 *               "from": "1234567890",
 *               "id": "wamid...",
 *               "timestamp": "1234567890",
 *               "type": "text",
 *               "text": { "body": "Hello" }
 *             }],
 *             "contacts": [{
 *               "wa_id": "1234567890",
 *               "profile": { "name": "John" }
 *             }]
 *           }
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
function parseMetaMessage(payload) {
  try {
    if (!payload.entry || !Array.isArray(payload.entry) || payload.entry.length === 0) {
      return null;
    }

    const entry = payload.entry[0];
    if (!entry.changes || !Array.isArray(entry.changes) || entry.changes.length === 0) {
      return null;
    }

    const change = entry.changes[0];
    const value = change.value;

    // Handle message events
    if (value.messages && Array.isArray(value.messages) && value.messages.length > 0) {
      const message = value.messages[0];
      const contact = value.contacts?.[0];

      // Only handle text messages
      if (message.type === "text" && message.text?.body) {
        return {
          from: message.from,
          message: message.text.body,
          timestamp: message.timestamp,
          messageId: message.id,
          contactName: contact?.profile?.name || "User"
        };
      }
    }

    // Handle status updates (delivery, read, etc.)
    if (value.statuses && Array.isArray(value.statuses) && value.statuses.length > 0) {
      const status = value.statuses[0];
      return {
        type: "status",
        status: status.status, // sent, delivered, read, failed
        messageId: status.id,
        timestamp: status.timestamp,
        recipientId: status.recipient_id
      };
    }

    return null;
  } catch (error) {
    console.error("Error parsing Meta message:", error.message);
    return null;
  }
}

module.exports = {
  verifySignature,
  parseMetaMessage
};
