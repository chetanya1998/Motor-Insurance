import {
  DISPOSABLE_EMAIL_DOMAINS,
  FUEL_OPTIONS,
  MANUFACTURE_YEARS,
} from "../data/options";
import { getEmailDomain } from "./helpers";

export function normalizeRegistrationNumber(value = "") {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidIndianRegistration(value = "") {
  const normalized = normalizeRegistrationNumber(value);
  return /^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4}$/.test(normalized);
}

export function validateRegistration(value) {
  const normalized = normalizeRegistrationNumber(value);

  if (!normalized) {
    return "Enter your vehicle number";
  }

  if (!isValidIndianRegistration(normalized)) {
    return "Enter a valid registration number like DL09CA1234";
  }

  return "";
}

export function validateVehicleDetails(vehicle) {
  const errors = {};
  const requiredFields = [
    "make",
    "model",
    "variant",
    "manufactureYear",
    "fuelType",
    "cityOfRegistration",
  ];

  requiredFields.forEach((field) => {
    if (!vehicle?.[field]) {
      errors[field] = "Required";
    }
  });

  if (
    vehicle?.fuelType &&
    !FUEL_OPTIONS.includes(vehicle.fuelType)
  ) {
    errors.fuelType = "Select a valid fuel type";
  }

  if (
    vehicle?.manufactureYear &&
    !MANUFACTURE_YEARS.includes(Number(vehicle.manufactureYear))
  ) {
    errors.manufactureYear = "Select a valid manufacture year";
  }

  return errors;
}

export function validatePolicyDetails(policy) {
  const errors = {};

  if (!policy?.previousPolicyExpiryDate && policy?.policyExpiryPreset !== "Not sure") {
    errors.previousPolicyExpiryDate = "Select when your current policy expires";
  }

  if (!policy?.ncbPercentage) {
    errors.ncbPercentage = "Select No Claim Bonus";
  }

  if (!policy?.claimsInLast3Years) {
    errors.claimsInLast3Years = "Select claims history";
  }

  if (!policy?.idvPreference) {
    errors.idvPreference = "Choose a vehicle value preference";
  }

  return errors;
}

export function validateContactDetails(customer) {
  const errors = {};
  const name = customer?.fullName?.trim() ?? "";
  const mobile = customer?.mobileNumber?.trim() ?? "";
  const email = customer?.emailAddress?.trim() ?? "";

  if (!name) {
    errors.fullName = "Enter your full name";
  } else if (name.length < 2) {
    errors.fullName = "Name is too short";
  } else if (!/^[A-Za-z][A-Za-z\s'.-]*$/.test(name)) {
    errors.fullName = "Use letters only";
  }

  if (!mobile) {
    errors.mobileNumber = "Enter your mobile number";
  } else if (!/^[6-9]\d{9}$/.test(mobile)) {
    errors.mobileNumber = "Enter a valid 10-digit Indian mobile number";
  }

  if (!email) {
    errors.emailAddress = "Enter your email address";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.emailAddress = "Enter a valid email address";
  } else if (DISPOSABLE_EMAIL_DOMAINS.includes(getEmailDomain(email))) {
    errors.emailAddress = "Disposable email addresses are not supported";
  }

  return errors;
}

export function validatePurchaseDetails(purchase) {
  const errors = {};

  if (!purchase?.dateOfBirth) {
    errors.dateOfBirth = "Enter date of birth";
  }

  if (!purchase?.previousInsurerName) {
    errors.previousInsurerName = "Select previous insurer";
  }

  if (!purchase?.nomineeName?.trim()) {
    errors.nomineeName = "Enter nominee name";
  }

  if (!purchase?.nomineeRelationship) {
    errors.nomineeRelationship = "Select nominee relationship";
  }

  return errors;
}

export function getConsistencyIssues({ vehicle, policy, purchase }) {
  const issues = [];
  const currentYear = new Date().getFullYear();

  if (Number(vehicle?.manufactureYear) > currentYear) {
    issues.push("Manufacture year is in the future");
  }

  if (vehicle?.fuelType === "EV" && ["Petrol", "Diesel", "CNG"].includes(vehicle?.secondaryFuelType)) {
    issues.push("EV selected with incompatible fuel data");
  }

  if (vehicle?.model === "Tiago" && vehicle?.fuelType === "Diesel") {
    issues.push("Tiago is not available in diesel for this prototype catalog");
  }

  if (vehicle?.fuelType === "EV" && vehicle?.model === "City") {
    issues.push("Selected fuel type is inconsistent with the chosen model");
  }

  if (
    policy?.previousPolicyExpiryDate &&
    Math.abs(new Date(policy.previousPolicyExpiryDate) - new Date()) >
      1000 * 60 * 60 * 24 * 365 * 5
  ) {
    issues.push("Policy expiry date looks unrealistic");
  }

  if (
    purchase?.dateOfBirth &&
    new Date(purchase.dateOfBirth) > new Date()
  ) {
    issues.push("Date of birth is in the future");
  }

  return issues;
}
