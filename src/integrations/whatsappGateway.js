/**
 * WhatsApp Cloud API Gateway (Meta's Official Free API)
 * 
 * 100% FREE - No per-message costs!
 * 
 * Setup:
 * 1. Create Meta Business Account at business.facebook.com
 * 2. Create WhatsApp Business App (free)
 * 3. Add phone number (free)
 * 4. Get Phone Number ID and Access Token
 * 5. Set WHATSAPP_MODE=cloud and add credentials to .env
 * 
 * Features:
 * - Mock mode for local testing (no API calls)
 * - Cloud API mode for production (free forever with Meta)
 * - No vendor lock-in, hardcoded, no per-message billing
 */

function normalizePhone(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

class WhatsAppGateway {
  constructor(config = {}) {
    this.mode = String(config.mode || "mock").toLowerCase();
    this.phoneNumberId = config.phoneNumberId || "";
    this.accessToken = config.accessToken || "";
    this.apiVersion = config.apiVersion || "v18.0";
    this.timeoutMs = Number(config.timeoutMs || 10000);

    if (this.mode === "cloud" && (!this.phoneNumberId || !this.accessToken)) {
      console.warn(
        "⚠️  WHATSAPP_MODE=cloud but missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN. " +
        "Falling back to mock mode for development."
      );
      this.mode = "mock";
    }
  }

  async sendMessage(to, text) {
    if (this.mode === "mock") {
      console.log(`📱 MOCK WHATSAPP -> ${to}\n${text}\n`);
      return { to, text, delivered: true, mode: "mock" };
    }

    if (this.mode === "cloud") {
      return this.sendViaCloudApi(to, text);
    }

    throw new Error(`Unsupported WHATSAPP_MODE: ${this.mode}`);
  }

  /**
   * Send message via Meta's WhatsApp Cloud API (completely FREE)
   * Reference: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
   */
  async sendViaCloudApi(to, text) {
    const url = `https://graph.instagram.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    const normalizedPhone = normalizePhone(to);

    const payload = {
      messaging_product: "whatsapp",
      to: normalizedPhone,
      type: "text",
      text: {
        body: text
      }
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      const responseText = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      if (!response.ok) {
        const errorMsg =
          responseData?.error?.message || 
          responseData?.message || 
          `HTTP ${response.status}`;
        
        return {
          to,
          text,
          delivered: false,
          mode: "cloud",
          statusCode: response.status,
          error: errorMsg
        };
      }

      return {
        to,
        text,
        delivered: true,
        mode: "cloud",
        messageId: responseData.messages?.[0]?.id,
        cloudApiResponse: responseData
      };
    } catch (error) {
      return {
        to,
        text,
        delivered: false,
        mode: "cloud",
        error: error.message
      };
    }
  }
}

module.exports = { WhatsAppGateway };
