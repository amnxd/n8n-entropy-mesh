function getWelcomeMenu() {
  return [
    "👋 Welcome to MEDSTA – Healthcare at Home",
    "",
    "No need to travel or wait at clinics, labs, or medical stores.",
    "",
    "We help you with:",
    "",
    "1️⃣ Order Medicines",
    "2️⃣ Book Lab Test at Home",
    "3️⃣ Doctor Consultation",
    "4️⃣ Physiotherapy",
    "5️⃣ Radiology (X-Ray, MRI, CT Scan)",
    "6️⃣ Talk to Support",
    "",
    "Reply with the number of the service you need."
  ].join("\n");
}

function getServicePrompt(serviceType) {
  const prompts = {
    MEDICINE: [
      "💊 Medicine Ordering",
      "",
      "Please share in this format:",
      "Name: ",
      "Age: ",
      "Prescription: ",
      "Medicine: ",
      "DosageDays: ",
      "Address: ",
      "",
      "⚡ Average delivery: 30–90 minutes",
      "💰 Up to 20–30% savings"
    ],
    LAB: [
      "🧪 Lab Test at Home",
      "",
      "Please share in this format:",
      "Name: ",
      "Age: ",
      "TestName: ",
      "PreferredTime: ",
      "Address: "
    ],
    DOCTOR: [
      "👨‍⚕️ Doctor Consultation",
      "",
      "Please share in this format:",
      "Name: ",
      "Age: ",
      "Symptoms: ",
      "PreferredTime: "
    ],
    PHYSIO: [
      "🦴 Physiotherapy at Home",
      "",
      "Please share in this format:",
      "Name: ",
      "Age: ",
      "Problem: ",
      "Duration: ",
      "Address: "
    ],
    RADIOLOGY: [
      "🩻 Radiology Services",
      "",
      "Please share in this format:",
      "Name: ",
      "Age: ",
      "TestName: ",
      "Prescription: ",
      "Address: "
    ]
  };

  return (prompts[serviceType] || ["Please share your details."]).join("\n");
}

function getProviderQuoteFormat() {
  return [
    "Reply in this format only:",
    "REQ_ID: MED-XXXX",
    "PRICE: 32",
    "ETA_MIN: 30",
    "IMAGE_URL: https://...",
    "PROVIDER_NAME: Your Name"
  ].join("\n");
}

module.exports = {
  getWelcomeMenu,
  getServicePrompt,
  getProviderQuoteFormat
};
