export function createId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
}

export function roundToNearestHundred(value) {
  return Math.round(value / 100) * 100;
}

export function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function getEmailDomain(emailAddress = "") {
  return emailAddress.trim().toLowerCase().split("@")[1] ?? "";
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getVehicleAgeFactor(manufactureYear) {
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - Number(manufactureYear);

  if (vehicleAge <= 2) {
    return 1.1;
  }

  if (vehicleAge <= 5) {
    return 1;
  }

  if (vehicleAge <= 8) {
    return 0.9;
  }

  return 0.8;
}

export function getSecondsBetween(start, end) {
  if (!start || !end) {
    return null;
  }

  return Math.max(0, Math.round((new Date(end) - new Date(start)) / 1000));
}

export function getFastestAndSlowestStep(stepDurations = {}) {
  const entries = Object.entries(stepDurations).filter(([, value]) => value > 0);

  if (!entries.length) {
    return {
      fastestStep: null,
      slowestStep: null,
    };
  }

  const [fastestStep] = [...entries].sort((a, b) => a[1] - b[1]);
  const [slowestStep] = [...entries].sort((a, b) => b[1] - a[1]);

  return {
    fastestStep,
    slowestStep,
  };
}
