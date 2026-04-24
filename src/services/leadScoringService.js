import { DISPOSABLE_EMAIL_DOMAINS } from "../data/options";
import { clamp, getEmailDomain } from "../utils/helpers";
import { getConsistencyIssues, isValidIndianRegistration, normalizeRegistrationNumber } from "../utils/validation";

function getRiskLevel(score) {
  if (score >= 80) {
    return "Low";
  }

  if (score >= 50) {
    return "Medium";
  }

  return "High";
}

function getRecommendedAction(riskLevel) {
  if (riskLevel === "Low") {
    return "Send to insurer normally";
  }

  if (riskLevel === "Medium") {
    return "Ask OTP before exact quote or mark for review";
  }

  return "Do not send to carrier automatically. Require verification and mark as suspicious.";
}

export function scoreLead({ store, session, vehicle, policy, customer, purchase }) {
  let score = 100;
  const positiveSignals = [];
  const negativeSignals = [];
  const suspiciousSignals = [];
  const registrationNumber = normalizeRegistrationNumber(session?.registrationNumber);
  const emailDomain = getEmailDomain(customer?.emailAddress);
  const existingLeads = (store?.leads ?? []).filter((lead) => lead.sessionId !== session.sessionId);
  const duplicateMobile = existingLeads.filter(
    (lead) => lead.customer?.mobileNumber === customer?.mobileNumber,
  );
  const duplicateRegistrationDifferentMobile = existingLeads.filter(
    (lead) =>
      normalizeRegistrationNumber(lead.registrationNumber) === registrationNumber &&
      lead.customer?.mobileNumber &&
      lead.customer?.mobileNumber !== customer?.mobileNumber,
  );
  const consistencyIssues = getConsistencyIssues({ vehicle, policy, purchase });
  const timeToComplete =
    session?.timing?.checkpoints?.completedAt && session?.timing?.journeyStartedAt
      ? Math.round(
          (new Date(session.timing.checkpoints.completedAt) -
            new Date(session.timing.journeyStartedAt)) /
            1000,
        )
      : null;
  const uncertainFieldCount = [
    session?.vehicleLookupMode === "manual",
    policy?.ncbPercentage === "Not sure",
    policy?.policyExpiryPreset === "Not sure",
  ].filter(Boolean).length;

  const addPositive = (label) => positiveSignals.push(label);
  const addNegative = (label, penalty, markSuspicious = false) => {
    negativeSignals.push({ label, penalty });
    score -= penalty;

    if (markSuspicious) {
      suspiciousSignals.push(label);
    }
  };

  if (isValidIndianRegistration(registrationNumber)) {
    addPositive("Valid registration number format");
  } else {
    addNegative("Registration format invalid", 15);
  }

  if (session?.vehicleLookupStatus === "success") {
    addPositive("Vehicle lookup successful");
  }

  if ((session?.analytics?.vehicleEditCount ?? 0) <= 1) {
    addPositive("Vehicle details confirmed without many edits");
  }

  if (timeToComplete === null || timeToComplete >= 25) {
    addPositive("Normal completion time");
  } else {
    addNegative("Form completed too fast, under 25 seconds", 25, true);
  }

  if (/^[6-9]\d{9}$/.test(customer?.mobileNumber ?? "")) {
    addPositive("Valid mobile number");
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer?.emailAddress ?? "")) {
    addPositive("Valid email domain");
  }

  if (!duplicateMobile.length) {
    addPositive("No duplicate mobile detected");
  } else {
    addNegative("Same mobile number used multiple times", 20, true);
  }

  if (!duplicateRegistrationDifferentMobile.length) {
    addPositive("No duplicate registration number with different mobile");
  } else {
    addNegative("Same registration number used with multiple mobile numbers", 20, true);
  }

  if (!session?.analytics?.honeypotFilled) {
    addPositive("No hidden honeypot field filled");
  } else {
    addNegative("Hidden honeypot field filled", 30, true);
  }

  if (!consistencyIssues.length) {
    addPositive("Data consistency is strong");
  } else {
    addNegative("Inconsistent data combination", 15, true);
  }

  if (session?.vehicleLookupMode === "manual" && session?.vehicleLookupStatus === "failed") {
    addNegative("Registration manually overridden after lookup failure", 15);
  }

  if (DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain)) {
    addNegative("Disposable email domain used", 15, true);
  }

  if ((session?.analytics?.validationErrors ?? 0) > 4) {
    addNegative("More than 4 validation errors", 10);
  }

  if ((session?.analytics?.pasteCount ?? 0) > 4) {
    addNegative("Excessive copy-paste behavior", 10);
  }

  if (uncertainFieldCount >= 2) {
    addNegative('User selected "Not sure" for too many quote-critical fields', 10);
  }

  score = clamp(score, 0, 100);
  const riskLevel = getRiskLevel(score);

  return {
    score,
    riskLevel,
    positiveSignals,
    negativeSignals,
    suspiciousSignals,
    reasons: [
      ...positiveSignals,
      ...negativeSignals.map((item) => item.label),
    ],
    recommendedAction: getRecommendedAction(riskLevel),
    consistencyIssues,
  };
}
