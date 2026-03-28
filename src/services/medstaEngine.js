const { v4: uuidv4 } = require("uuid");
const { SERVICE_TYPES, REQUEST_STATUS, USER_STATE } = require("../constants");
const { createRequestId } = require("../utils/id");
const { parseServiceSelection, parseServiceDetails, parseProviderQuote } = require("../utils/parsers");
const { getWelcomeMenu, getServicePrompt, getProviderQuoteFormat } = require("../utils/messages");
const {
  getProvidersByType,
  getProviderByPhone,
  getDoctorByPhone,
  doctors
} = require("../data/providers");

class MedstaEngine {
  constructor({ store, gateway, repo, config }) {
    this.store = store;
    this.gateway = gateway;
    this.repo = repo;
    this.config = config;
  }

  async handleIncoming({ from, text }) {
    const normalizedText = String(text || "").trim();

    const provider = getProviderByPhone(from);
    const doctor = getDoctorByPhone(from);

    if (provider) {
      return this.handleProviderQuote(provider, normalizedText);
    }

    if (doctor) {
      return {
        role: "doctor",
        reply: "Doctor incoming replies are logged externally in this MVP."
      };
    }

    return this.handleUserMessage({ userPhone: from, text: normalizedText });
  }

  async handleUserMessage({ userPhone, text }) {
    const conversation = this.store.getConversation(userPhone);
    const lowered = text.toLowerCase();

    if (["/start", "start", "menu", "hi", "hello"].includes(lowered)) {
      this.store.resetConversation(userPhone);
      await this.gateway.sendMessage(userPhone, getWelcomeMenu());
      return { role: "user", reply: "Welcome menu sent." };
    }

    if (conversation.state === USER_STATE.AWAITING_SERVICE_SELECTION) {
      const serviceType = parseServiceSelection(text);
      if (!serviceType) {
        await this.gateway.sendMessage(userPhone, "Please reply with a valid number from 1 to 6.");
        return { role: "user", reply: "Invalid menu selection." };
      }

      if (serviceType === SERVICE_TYPES.SUPPORT) {
        await this.gateway.sendMessage(
          userPhone,
          "📞 Support team will contact you shortly. You can also reply with 1-5 for any service."
        );
        this.store.resetConversation(userPhone);
        return { role: "user", reply: "Support path completed." };
      }

      conversation.selectedService = serviceType;
      conversation.state = USER_STATE.AWAITING_SERVICE_DETAILS;
      await this.gateway.sendMessage(userPhone, getServicePrompt(serviceType));
      return { role: "user", reply: `Prompted for ${serviceType} details.` };
    }

    if (conversation.state === USER_STATE.AWAITING_SERVICE_DETAILS) {
      const result = parseServiceDetails(conversation.selectedService, text);
      if (!result.ok) {
        await this.gateway.sendMessage(userPhone, result.error);
        await this.gateway.sendMessage(userPhone, getServicePrompt(conversation.selectedService));
        return { role: "user", reply: "Details validation failed." };
      }

      const request = {
        id: createRequestId(conversation.selectedService),
        userPhone,
        type: conversation.selectedService,
        status:
          conversation.selectedService === SERVICE_TYPES.DOCTOR
            ? REQUEST_STATUS.AWAITING_USER_SELECTION
            : REQUEST_STATUS.AWAITING_QUOTES,
        details: result.data,
        selectedProviderPhone: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        quoteDeadlineAt: new Date(Date.now() + this.config.quoteTimeoutSeconds * 1000).toISOString()
      };

      this.store.saveRequest(request);
      await this.repo.saveRequest(request);

      conversation.activeRequestId = request.id;

      if (conversation.selectedService === SERVICE_TYPES.DOCTOR) {
        conversation.state = USER_STATE.AWAITING_DOCTOR_SELECTION;
        conversation.doctorOptions = doctors;
        await this.sendDoctorOptions(userPhone, doctors);
        return { role: "user", reply: `Doctor options sent for ${request.id}.` };
      }

      conversation.state = USER_STATE.IDLE;
      await this.broadcastRequestToProviders(request);
      await this.gateway.sendMessage(
        userPhone,
        `✅ Request received. Request ID: ${request.id}\nWe are collecting top quotes now.`
      );

      return { role: "user", reply: `Request ${request.id} broadcasted.` };
    }

    if (conversation.state === USER_STATE.AWAITING_QUOTE_SELECTION) {
      const option = Number(text.trim());
      if (!Number.isInteger(option) || option < 1 || option > conversation.quoteOptions.length) {
        await this.gateway.sendMessage(userPhone, "Please reply with a valid option number.");
        return { role: "user", reply: "Invalid quote option." };
      }

      const selectedQuote = conversation.quoteOptions[option - 1];
      const request = this.store.getRequest(conversation.activeRequestId);
      if (!request) {
        this.store.resetConversation(userPhone);
        await this.gateway.sendMessage(userPhone, "This request has expired. Please start again.");
        return { role: "user", reply: "Quote selection expired." };
      }

      const updated = this.store.updateRequest(request.id, {
        status: REQUEST_STATUS.LOCKED,
        selectedProviderPhone: selectedQuote.providerPhone
      });
      await this.repo.saveRequest(updated);

      await this.gateway.sendMessage(
        selectedQuote.providerPhone,
        [
          "✅ ORDER CONFIRMED",
          `Request ID: ${request.id}`,
          `Name: ${request.details.name}`,
          `Age: ${request.details.age}`,
          `Phone: ${request.userPhone}`,
          `Address: ${request.details.address || "Will be shared on call"}`
        ].join("\n")
      );

      await this.gateway.sendMessage(
        userPhone,
        `✅ ORDER CONFIRMED\nRequest ID: ${request.id}\nProvider: ${selectedQuote.providerName}`
      );

      this.store.resetConversation(userPhone);
      return { role: "user", reply: `Request ${request.id} locked.` };
    }

    if (conversation.state === USER_STATE.AWAITING_DOCTOR_SELECTION) {
      const option = Number(text.trim());
      if (!Number.isInteger(option) || option < 1 || option > conversation.doctorOptions.length) {
        await this.gateway.sendMessage(userPhone, "Please reply with a valid doctor option number.");
        return { role: "user", reply: "Invalid doctor option." };
      }

      const doctor = conversation.doctorOptions[option - 1];
      const request = this.store.getRequest(conversation.activeRequestId);
      if (!request) {
        this.store.resetConversation(userPhone);
        await this.gateway.sendMessage(userPhone, "This request has expired. Please start again.");
        return { role: "user", reply: "Doctor booking expired." };
      }

      const updated = this.store.updateRequest(request.id, {
        status: REQUEST_STATUS.LOCKED,
        selectedProviderPhone: doctor.phone
      });
      await this.repo.saveRequest(updated);

      await this.gateway.sendMessage(
        doctor.phone,
        [
          "New Patient",
          `Name: ${request.details.name}`,
          `Age: ${request.details.age}`,
          `Symptoms: ${request.details.symptoms}`,
          `Phone: ${request.userPhone}`
        ].join("\n")
      );

      await this.gateway.sendMessage(
        userPhone,
        `✅ Doctor consultation confirmed with ${doctor.name}. Request ID: ${request.id}`
      );

      this.store.resetConversation(userPhone);
      return { role: "user", reply: `Doctor booked for ${request.id}.` };
    }

    this.store.resetConversation(userPhone);
    await this.gateway.sendMessage(userPhone, getWelcomeMenu());
    return { role: "user", reply: "Conversation reset to menu." };
  }

  async handleProviderQuote(provider, text) {
    const parsed = parseProviderQuote(text);
    if (!parsed.ok) {
      await this.gateway.sendMessage(provider.phone, parsed.error);
      await this.gateway.sendMessage(provider.phone, getProviderQuoteFormat());
      return { role: "provider", reply: "Quote rejected." };
    }

    const request = this.store.getRequest(parsed.data.requestId);
    if (!request) {
      await this.gateway.sendMessage(provider.phone, "Unknown REQ_ID.");
      return { role: "provider", reply: "Unknown request id." };
    }

    if (provider.type !== request.type) {
      await this.gateway.sendMessage(provider.phone, "Request type mismatch for this provider.");
      return { role: "provider", reply: "Provider type mismatch." };
    }

    if (![REQUEST_STATUS.AWAITING_QUOTES, REQUEST_STATUS.AWAITING_USER_SELECTION].includes(request.status)) {
      await this.gateway.sendMessage(provider.phone, "Request is no longer accepting quotes.");
      return { role: "provider", reply: "Request closed." };
    }

    const quote = {
      id: uuidv4(),
      requestId: request.id,
      providerPhone: provider.phone,
      providerName: parsed.data.providerName,
      price: parsed.data.price,
      etaMinutes: parsed.data.etaMinutes,
      imageUrl: parsed.data.imageUrl,
      createdAt: new Date().toISOString()
    };

    this.store.addQuote(request.id, quote);
    await this.repo.saveQuote(quote);

    await this.gateway.sendMessage(provider.phone, `Quote received for ${request.id}.`);

    const quotes = this.rankQuotes(this.store.getQuotes(request.id));
    if (quotes.length >= this.config.maxQuotesToWait) {
      await this.sendAggregatedOptionsToUser(request.id);
      return { role: "provider", reply: "Quote accepted and aggregated." };
    }

    return { role: "provider", reply: "Quote accepted." };
  }

  rankQuotes(quotes) {
    return [...quotes].sort((a, b) => {
      if (a.price === b.price) {
        return a.etaMinutes - b.etaMinutes;
      }
      return a.price - b.price;
    });
  }

  async broadcastRequestToProviders(request) {
    const targets = getProvidersByType(request.type);

    for (const provider of targets) {
      const message = [
        `📢 MEDSTA REQUEST`,
        ``,
        `Request ID: ${request.id}`,
        `Age: ${request.details.age}`,
        `Requirement: ${this.buildRequirementText(request)}`,
        ``,
        getProviderQuoteFormat()
      ].join("\n");

      await this.gateway.sendMessage(provider.phone, message);
    }

    await this.triggerN8nWorkflow(request, targets);
  }

  async triggerN8nWorkflow(request, targets) {
    const webhookUrl = this.config.automation?.n8nWebhookUrl;
    if (!webhookUrl) {
      return;
    }

    try {
      const headers = { "Content-Type": "application/json" };
      if (this.config.automation?.n8nApiKey) {
        headers["x-medsta-automation-key"] = this.config.automation.n8nApiKey;
      }

      // Keep n8n routing names consistent while preserving original request type.
      const normalizedType = request.type === SERVICE_TYPES.PHYSIO ? "PHYSIOTHERAPY" : request.type;
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(this.config.automation?.n8nTimeoutMs || 5000),
        body: JSON.stringify({
          event: "request.created",
          request: {
            ...request,
            type: normalizedType,
            sourceType: request.type
          },
          targets,
          emittedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        console.warn(
          `n8n webhook returned non-2xx for ${request.id} (${request.type}): ${response.status} ${response.statusText}`
        );
        return;
      }

      console.log(
        `n8n workflow triggered for ${request.id} (${request.type}) -> ${targets.length} targets`
      );
    } catch (error) {
      console.warn(`n8n webhook call failed for ${request.id} (${request.type}):`, error.message);
    }
  }

  buildRequirementText(request) {
    if (request.type === SERVICE_TYPES.MEDICINE) {
      return `${request.details.medicine} (${request.details.dosagedays} days)`;
    }
    if (request.type === SERVICE_TYPES.LAB) {
      return `${request.details.testname} at ${request.details.preferredtime}`;
    }
    if (request.type === SERVICE_TYPES.PHYSIO) {
      return `${request.details.problem} (${request.details.duration})`;
    }
    if (request.type === SERVICE_TYPES.RADIOLOGY) {
      return `${request.details.testname}`;
    }
    return "Check request details";
  }

  async sendAggregatedOptionsToUser(requestId) {
    const request = this.store.getRequest(requestId);
    if (!request || request.status !== REQUEST_STATUS.AWAITING_QUOTES) {
      return;
    }

    const quotes = this.rankQuotes(this.store.getQuotes(requestId)).slice(0, this.config.maxQuotesToShow);
    if (quotes.length === 0) {
      return;
    }

    const optionsLines = ["💊 Available Options", ""];
    for (let i = 0; i < quotes.length; i += 1) {
      const quote = quotes[i];
      optionsLines.push(`${i + 1}️⃣ ${quote.providerName}`);
      optionsLines.push(`₹${quote.price} | ${quote.etaMinutes} mins`);
      optionsLines.push("");
    }
    optionsLines.push("Reply with option number to confirm.");

    await this.gateway.sendMessage(request.userPhone, optionsLines.join("\n"));

    this.store.updateRequest(requestId, { status: REQUEST_STATUS.AWAITING_USER_SELECTION });
    await this.repo.saveRequest(this.store.getRequest(requestId));

    const conversation = this.store.getConversation(request.userPhone);
    conversation.state = USER_STATE.AWAITING_QUOTE_SELECTION;
    conversation.activeRequestId = requestId;
    conversation.quoteOptions = quotes;
  }

  async sendDoctorOptions(userPhone, options) {
    const lines = ["👨‍⚕️ Available Doctors", ""];
    for (let i = 0; i < options.length; i += 1) {
      const doctor = options[i];
      lines.push(`${i + 1}️⃣ ${doctor.name}`);
      lines.push(`${doctor.experienceYears} yrs exp | ₹${doctor.fee}`);
      lines.push("");
    }
    lines.push("Reply with number to book.");

    await this.gateway.sendMessage(userPhone, lines.join("\n"));
  }

  async processQuoteTimeouts() {
    const pending = this.store.listPendingQuoteRequests();
    const now = Date.now();

    for (const request of pending) {
      const deadline = new Date(request.quoteDeadlineAt).getTime();
      if (now < deadline) {
        continue;
      }

      const quotes = this.store.getQuotes(request.id);
      if (quotes.length > 0) {
        await this.sendAggregatedOptionsToUser(request.id);
        continue;
      }

      await this.gateway.sendMessage(
        request.userPhone,
        `No providers responded yet for ${request.id}. We are escalating and will update you soon.`
      );
      this.store.updateRequest(request.id, { status: REQUEST_STATUS.CANCELLED });
      await this.repo.saveRequest(this.store.getRequest(request.id));
      this.store.resetConversation(request.userPhone);
    }
  }

  listRequests() {
    return this.store.listRequests();
  }

  async completeRequest(requestId) {
    const request = this.store.getRequest(requestId);
    if (!request) {
      return null;
    }

    const updated = this.store.updateRequest(requestId, { status: REQUEST_STATUS.COMPLETED });
    await this.repo.saveRequest(updated);

    await this.gateway.sendMessage(
      request.userPhone,
      "✅ Service Completed\nThank you for choosing MEDSTA.\nMessage us anytime for medicines, tests, or consultations."
    );

    return updated;
  }
}

module.exports = { MedstaEngine };
