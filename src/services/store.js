const { USER_STATE } = require("../constants");

const requests = new Map();
const quotesByRequest = new Map();
const conversationByUser = new Map();

function getConversation(phone) {
  if (!conversationByUser.has(phone)) {
    conversationByUser.set(phone, {
      state: USER_STATE.NEW,
      selectedService: null,
      activeRequestId: null,
      quoteOptions: [],
      doctorOptions: []
    });
  }
  return conversationByUser.get(phone);
}

function resetConversation(phone) {
  conversationByUser.set(phone, {
    state: USER_STATE.AWAITING_SERVICE_SELECTION,
    selectedService: null,
    activeRequestId: null,
    quoteOptions: [],
    doctorOptions: []
  });
}

function saveRequest(request) {
  requests.set(request.id, request);
}

function getRequest(requestId) {
  return requests.get(requestId) || null;
}

function updateRequest(requestId, patch) {
  const existing = requests.get(requestId);
  if (!existing) {
    return null;
  }
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  requests.set(requestId, updated);
  return updated;
}

function addQuote(requestId, quote) {
  if (!quotesByRequest.has(requestId)) {
    quotesByRequest.set(requestId, []);
  }
  const current = quotesByRequest.get(requestId);

  const existingIndex = current.findIndex((item) => item.providerPhone === quote.providerPhone);
  if (existingIndex >= 0) {
    current[existingIndex] = quote;
    return;
  }

  current.push(quote);
}

function getQuotes(requestId) {
  return quotesByRequest.get(requestId) || [];
}

function listPendingQuoteRequests() {
  return [...requests.values()].filter((request) => request.status === "AWAITING_QUOTES");
}

function listRequests() {
  return [...requests.values()].map((request) => ({
    ...request,
    quotes: getQuotes(request.id)
  }));
}

module.exports = {
  getConversation,
  resetConversation,
  saveRequest,
  getRequest,
  updateRequest,
  addQuote,
  getQuotes,
  listPendingQuoteRequests,
  listRequests
};
