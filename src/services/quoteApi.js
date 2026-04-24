import {
  ADDON_CATALOG,
  CITY_FACTORS,
  CLAIMS_LOADING,
  DEFAULT_SEGMENT_PREMIUMS,
  FUEL_FACTORS,
  IDV_FACTORS,
  MODEL_BASE_PREMIUMS,
  NCB_DISCOUNTS,
  VEHICLE_CATALOG,
} from "../data/options";
import { delay, getVehicleAgeFactor, roundToNearestHundred } from "../utils/helpers";

function getVehicleSegment(make, model, fuelType) {
  if (fuelType === "EV") {
    return "EV";
  }

  const models = VEHICLE_CATALOG[make] ?? [];
  const selectedModel = models.find((item) => item.model === model);

  return selectedModel?.segment ?? "Premium hatchback";
}

function getBasePremium(vehicle) {
  const key = `${vehicle.make}:${vehicle.model}`;
  const mapped = MODEL_BASE_PREMIUMS[key];

  if (mapped) {
    return mapped.basePremium;
  }

  const segment = getVehicleSegment(vehicle.make, vehicle.model, vehicle.fuelType);
  return DEFAULT_SEGMENT_PREMIUMS[segment] ?? 8000;
}

function getQuoteConfidence({ lookupConfidence, vehicleLookupMode, policy }) {
  const uncertainFields = [
    vehicleLookupMode === "manual",
    lookupConfidence !== "high",
    policy?.ncbPercentage === "Not sure",
    policy?.policyExpiryPreset === "Not sure",
  ].filter(Boolean).length;

  if (uncertainFields >= 2) {
    return "Low";
  }

  if (uncertainFields === 1) {
    return "Medium";
  }

  return "High";
}

function estimateVehicleIdv(vehicle) {
  const baseBySegment = {
    "Small hatchback": 360000,
    "Premium hatchback": 450000,
    Sedan: 700000,
    SUV: 980000,
    EV: 1200000,
  };

  const segment = getVehicleSegment(vehicle.make, vehicle.model, vehicle.fuelType);
  const depreciationFactor = Math.max(
    0.48,
    1 - (new Date().getFullYear() - Number(vehicle.manufactureYear)) * 0.07,
  );

  return roundToNearestHundred((baseBySegment[segment] ?? 450000) * depreciationFactor);
}

export async function getQuoteEstimate({ vehicle, policy, vehicleLookupMode, lookupConfidence }) {
  await delay(850);

  const basePremium = getBasePremium(vehicle);
  const cityFactor = CITY_FACTORS[vehicle.cityOfRegistration] ?? 1.03;
  const fuelFactor = FUEL_FACTORS[vehicle.fuelType] ?? 1;
  const vehicleAgeFactor = getVehicleAgeFactor(vehicle.manufactureYear);
  const ncbDiscount = NCB_DISCOUNTS[policy.ncbPercentage] ?? 0;
  const claimsLoadingFactor = CLAIMS_LOADING[policy.claimsInLast3Years] ?? 1;
  const idvFactor = IDV_FACTORS[policy.idvPreference] ?? 1;

  const estimatedPremium =
    basePremium *
    cityFactor *
    fuelFactor *
    vehicleAgeFactor *
    idvFactor *
    claimsLoadingFactor *
    (1 - ncbDiscount);

  return {
    success: true,
    quoteRange: {
      min: roundToNearestHundred(estimatedPremium * 0.9),
      max: roundToNearestHundred(estimatedPremium * 1.2),
    },
    confidence: getQuoteConfidence({
      lookupConfidence,
      vehicleLookupMode,
      policy,
    }),
    breakdown: {
      basePremium,
      cityFactor,
      vehicleAgeFactor,
      fuelFactor,
      ncbDiscount,
      claimsLoading: claimsLoadingFactor - 1,
      idvAdjustment: idvFactor,
    },
  };
}

export async function getExactQuotes({ vehicle, policy, customer, quoteEstimate }) {
  await delay(1000);

  const baseReference =
    quoteEstimate?.breakdown?.basePremium ??
    ((quoteEstimate?.quoteRange?.min ?? 7600) + (quoteEstimate?.quoteRange?.max ?? 9400)) / 2;
  const idvBase = estimateVehicleIdv(vehicle);
  const customerBoost = customer?.emailAddress?.includes("gmail.com") ? 0 : 100;
  const idvAdjustment = policy?.idvPreference === "Higher cover" ? 30000 : policy?.idvPreference === "Lowest price" ? -15000 : 0;

  return {
    success: true,
    quotes: [
      {
        insurer: "HDFC Ergo",
        premium: roundToNearestHundred(baseReference * 0.98 + customerBoost),
        tag: "Lowest price",
        idv: idvBase + idvAdjustment - 10000,
        claimSupport: "Good",
        addons: ["Roadside Assistance"],
      },
      {
        insurer: "ICICI Lombard",
        premium: roundToNearestHundred(baseReference * 1.05 + customerBoost),
        tag: "Balanced cover",
        idv: idvBase + idvAdjustment + 10000,
        claimSupport: "Very Good",
        addons: ["Roadside Assistance", "Consumables Cover"],
      },
      {
        insurer: "Tata AIG",
        premium: roundToNearestHundred(baseReference * 1.13 + customerBoost),
        tag: "Strong claim support",
        idv: idvBase + idvAdjustment + 30000,
        claimSupport: "Excellent",
        addons: ["Zero Depreciation", "Roadside Assistance"],
      },
    ],
  };
}

export function getAddonCatalog() {
  return ADDON_CATALOG;
}

export function applyAddonsToQuotes(quotes = [], selectedAddonIds = []) {
  const addonTotal = ADDON_CATALOG.filter((addon) => selectedAddonIds.includes(addon.id)).reduce(
    (total, addon) => total + addon.price,
    0,
  );

  return quotes.map((quote) => ({
    ...quote,
    finalPremium: quote.premium + addonTotal,
  }));
}
