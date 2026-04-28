const { z } = require("zod");

const serviceMap = {
  "1": "MEDICINE",
  "2": "LAB",
  "3": "DOCTOR",
  "4": "PHYSIO",
  "5": "RADIOLOGY",
  "6": "SUPPORT"
};

const detailsSchemaByType = {
  MEDICINE: z.object({
    name: z.string().min(2),
    age: z.coerce.number().int().positive(),
    prescription: z.string().optional().default("Not provided"),
    medicine: z.string().min(2),
    dosagedays: z.string().min(1),
    address: z.string().min(5)
  }),
  LAB: z.object({
    name: z.string().min(2),
    age: z.coerce.number().int().positive(),
    testname: z.string().min(2),
    preferredtime: z.string().min(1),
    address: z.string().min(5)
  }),
  DOCTOR: z.object({
    name: z.string().min(2),
    age: z.coerce.number().int().positive(),
    symptoms: z.string().min(2),
    preferredtime: z.string().min(1)
  }),
  PHYSIO: z.object({
    name: z.string().min(2),
    age: z.coerce.number().int().positive(),
    problem: z.string().min(2),
    duration: z.string().min(1),
    address: z.string().min(5)
  }),
  RADIOLOGY: z.object({
    name: z.string().min(2),
    age: z.coerce.number().int().positive(),
    testname: z.string().min(2),
    prescription: z.string().optional().default("Not provided"),
    address: z.string().min(5)
  })
};

function parseServiceSelection(text) {
  const trimmed = String(text || "").trim();
  return serviceMap[trimmed] || null;
}

function parseKeyValueLines(rawText) {
  const lines = String(rawText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const obj = {};
  for (const line of lines) {
    const [rawKey, ...rest] = line.split(":");
    if (!rawKey || rest.length === 0) {
      continue;
    }
    const key = rawKey.replace(/\s+/g, "").toLowerCase();
    const value = rest.join(":").trim();
    obj[key] = value;
  }

  return obj;
}

function parseServiceDetails(serviceType, text) {
  const parsed = parseKeyValueLines(text);
  const schema = detailsSchemaByType[serviceType];
  if (!schema) {
    return { ok: false, error: "Unsupported service type." };
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      error: "Invalid details format. Please use the exact template with Key: Value lines."
    };
  }

  return { ok: true, data: result.data };
}

function parseProviderQuote(text) {
  const parsed = parseKeyValueLines(text);
  const schema = z.object({
    req_id: z.string().min(4),
    price: z.coerce.number().positive(),
    eta_min: z.coerce.number().int().positive(),
    image_url: z.string().url().optional(),
    provider_name: z.string().min(2)
  });

  const result = schema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      error: "Quote rejected. Use strict template: REQ_ID, PRICE, ETA_MIN, IMAGE_URL, PROVIDER_NAME."
    };
  }

  return {
    ok: true,
    data: {
      requestId: result.data.req_id.toUpperCase(),
      price: result.data.price,
      etaMinutes: result.data.eta_min,
      imageUrl: result.data.image_url || null,
      providerName: result.data.provider_name
    }
  };
}

module.exports = {
  parseServiceSelection,
  parseServiceDetails,
  parseProviderQuote
};
