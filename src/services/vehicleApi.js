import { CITY_OPTIONS, VEHICLE_CATALOG } from "../data/options";
import { delay } from "../utils/helpers";
import { isValidIndianRegistration, normalizeRegistrationNumber } from "../utils/validation";

const RTO_LOOKUP = {
  DL09: { city: "Delhi", rtoCode: "DL09" },
  MH01: { city: "Mumbai", rtoCode: "MH01" },
  MH12: { city: "Pune", rtoCode: "MH12" },
  KA03: { city: "Bengaluru", rtoCode: "KA03" },
  TS09: { city: "Hyderabad", rtoCode: "TS09" },
  TN07: { city: "Chennai", rtoCode: "TN07" },
  RJ14: { city: "Jaipur", rtoCode: "RJ14" },
  UP32: { city: "Lucknow", rtoCode: "UP32" },
  GJ01: { city: "Ahmedabad", rtoCode: "GJ01" },
  CH01: { city: "Chandigarh", rtoCode: "CH01" },
};

const KNOWN_VEHICLES = {
  DL09CA1234: {
    make: "Maruti",
    model: "Swift",
    variant: "VXi",
    manufactureYear: 2020,
    fuelType: "Petrol",
    cityOfRegistration: "Delhi",
    rtoCode: "DL09",
  },
  MH12AB1234: {
    make: "Hyundai",
    model: "Creta",
    variant: "SX",
    manufactureYear: 2022,
    fuelType: "Petrol",
    cityOfRegistration: "Pune",
    rtoCode: "MH12",
  },
  KA03MN4567: {
    make: "Tata",
    model: "Nexon",
    variant: "Creative",
    manufactureYear: 2021,
    fuelType: "Petrol",
    cityOfRegistration: "Bengaluru",
    rtoCode: "KA03",
  },
};

function getCatalogEntries() {
  return Object.entries(VEHICLE_CATALOG).flatMap(([make, models]) =>
    models.flatMap((vehicle) =>
      vehicle.variants.map((variant) => ({
        make,
        model: vehicle.model,
        variant,
        fuelType: vehicle.fuelTypes[0],
        segment: vehicle.segment,
      })),
    ),
  );
}

function hashRegistration(registrationNumber) {
  return registrationNumber.split("").reduce((total, character) => total + character.charCodeAt(0), 0);
}

function inferRtoDetails(normalizedRegistration) {
  const exactPrefix = normalizedRegistration.slice(0, 4);
  const statePrefix = normalizedRegistration.slice(0, 2);

  if (RTO_LOOKUP[exactPrefix]) {
    return RTO_LOOKUP[exactPrefix];
  }

  const fallbackMap = {
    DL: "Delhi",
    MH: "Mumbai",
    KA: "Bengaluru",
    TS: "Hyderabad",
    TN: "Chennai",
    RJ: "Jaipur",
    UP: "Lucknow",
    GJ: "Ahmedabad",
    CH: "Chandigarh",
  };

  return {
    city: fallbackMap[statePrefix] ?? CITY_OPTIONS[0],
    rtoCode: exactPrefix,
  };
}

export function buildManualVehicleStub(registrationNumber) {
  const normalizedRegistration = normalizeRegistrationNumber(registrationNumber);
  const { city, rtoCode } = inferRtoDetails(normalizedRegistration);

  return {
    make: "",
    model: "",
    variant: "",
    manufactureYear: new Date().getFullYear() - 3,
    fuelType: "Petrol",
    cityOfRegistration: city,
    rtoCode,
  };
}

export async function lookupVehicle(registrationNumber) {
  const normalizedRegistration = normalizeRegistrationNumber(registrationNumber);
  await delay(900);

  if (!isValidIndianRegistration(normalizedRegistration)) {
    return {
      success: false,
      message: "Vehicle details not found",
    };
  }

  if (normalizedRegistration.endsWith("0000")) {
    return {
      success: false,
      message: "Vehicle details not found",
    };
  }

  if (KNOWN_VEHICLES[normalizedRegistration]) {
    return {
      success: true,
      registrationNumber: normalizedRegistration,
      vehicle: KNOWN_VEHICLES[normalizedRegistration],
      confidence: "high",
    };
  }

  const pool = getCatalogEntries();
  const vehicleIndex = hashRegistration(normalizedRegistration) % pool.length;
  const yearOffset = hashRegistration(normalizedRegistration) % 7;
  const { city, rtoCode } = inferRtoDetails(normalizedRegistration);
  const vehicle = pool[vehicleIndex];

  return {
    success: true,
    registrationNumber: normalizedRegistration,
    vehicle: {
      ...vehicle,
      manufactureYear: new Date().getFullYear() - yearOffset,
      cityOfRegistration: city,
      rtoCode,
    },
    confidence: "medium",
  };
}
