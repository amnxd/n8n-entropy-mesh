const { v4: uuidv4 } = require("uuid");

const prefixes = {
  MEDICINE: "MED",
  LAB: "LAB",
  DOCTOR: "DOC",
  PHYSIO: "PHY",
  RADIOLOGY: "RAD",
  SUPPORT: "SUP"
};

function createRequestId(type) {
  const prefix = prefixes[type] || "REQ";
  const token = uuidv4().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `${prefix}-${token}`;
}

module.exports = { createRequestId };
