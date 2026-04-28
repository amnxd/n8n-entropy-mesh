const { SERVICE_TYPES } = require("../constants");

const providers = [
  { phone: "919900000101", name: "Gupta Medicos", type: SERVICE_TYPES.MEDICINE },
  { phone: "919900000102", name: "LifeCare Pharmacy", type: SERVICE_TYPES.MEDICINE },
  { phone: "919900000103", name: "CityLab Diagnostics", type: SERVICE_TYPES.LAB },
  { phone: "919900000104", name: "HomePath Labs", type: SERVICE_TYPES.LAB },
  { phone: "919900000105", name: "CareMove Physio", type: SERVICE_TYPES.PHYSIO },
  { phone: "919900000106", name: "ActiveFlex Physio", type: SERVICE_TYPES.PHYSIO },
  { phone: "919900000107", name: "ScanPro Imaging", type: SERVICE_TYPES.RADIOLOGY },
  { phone: "919900000108", name: "Radiant Diagnostics", type: SERVICE_TYPES.RADIOLOGY }
];

const doctors = [
  { phone: "919911111001", name: "Dr. Amit Verma", specialty: "General Physician", experienceYears: 12, fee: 400 },
  { phone: "919911111002", name: "Dr. Neha Sharma", specialty: "Internal Medicine", experienceYears: 9, fee: 350 }
];

function getProvidersByType(type) {
  return providers.filter((provider) => provider.type === type);
}

function getProviderByPhone(phone) {
  return providers.find((provider) => provider.phone === phone) || null;
}

function getDoctorByPhone(phone) {
  return doctors.find((doctor) => doctor.phone === phone) || null;
}

module.exports = {
  providers,
  doctors,
  getProvidersByType,
  getProviderByPhone,
  getDoctorByPhone
};
