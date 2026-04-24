export const APP_COPY = {
  title: "Get your motor insurance estimate under 1 minute",
  subtitle:
    "Enter your vehicle number and see an estimated quote range before sharing personal details.",
  primaryCta: "Start quote",
  trustSignals: [
    "Free estimate",
    "Compare multiple insurers",
    "Personal details asked only after estimate",
  ],
};

export const JOURNEY_STAGES = [
  { id: "vehicle", label: "Vehicle", description: "Confirm your car details" },
  { id: "policy", label: "Current policy", description: "Share renewal basics" },
  { id: "estimate", label: "Estimate", description: "See your price range" },
  { id: "contact", label: "Contact", description: "Unlock exact insurer prices" },
  { id: "quotes", label: "Quotes", description: "Compare plans and add-ons" },
  { id: "purchase", label: "Purchase", description: "Finish policy details" },
];

export const STAGE_TO_SCREEN = {
  landing: null,
  registration: "vehicle",
  vehicleConfirmation: "vehicle",
  policy: "policy",
  estimate: "estimate",
  personal: "contact",
  exactQuotes: "quotes",
  purchase: "purchase",
  complete: "purchase",
};

export const CITY_OPTIONS = [
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Jaipur",
  "Lucknow",
  "Ahmedabad",
  "Chandigarh",
];

export const FUEL_OPTIONS = ["Petrol", "Diesel", "CNG", "EV"];

export const NCB_OPTIONS = ["0%", "20%", "25%", "35%", "45%", "50%", "Not sure"];

export const CLAIMS_OPTIONS = ["0", "1", "2", "3+"];

export const IDV_OPTIONS = [
  {
    label: "Lowest price",
    helper: "Lower premium and lower vehicle value.",
  },
  {
    label: "Balanced cover",
    helper: "A practical middle ground for price and claim value.",
  },
  {
    label: "Higher cover",
    helper: "Higher vehicle value may help at claim time.",
  },
];

export const POLICY_EXPIRY_PRESETS = [
  "Already expired",
  "Expires this month",
  "Expires next month",
  "Not sure",
];

export const PREVIOUS_INSURERS = [
  "HDFC Ergo",
  "ICICI Lombard",
  "Tata AIG",
  "Bajaj Allianz",
  "Reliance General",
  "New India Assurance",
  "Not sure",
];

export const NOMINEE_RELATIONSHIPS = [
  "Spouse",
  "Father",
  "Mother",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Other",
];

export const DISPOSABLE_EMAIL_DOMAINS = [
  "mailinator.com",
  "tempmail.com",
  "yopmail.com",
  "10minutemail.com",
  "guerrillamail.com",
];

export const MODEL_BASE_PREMIUMS = {
  "Maruti:Swift": { segment: "Premium hatchback", basePremium: 8000 },
  "Hyundai:Creta": { segment: "SUV", basePremium: 12000 },
  "Tata:Nexon": { segment: "SUV", basePremium: 12000 },
  "Honda:City": { segment: "Sedan", basePremium: 9500 },
  "Tata:Tiago": { segment: "Small hatchback", basePremium: 6000 },
};

export const DEFAULT_SEGMENT_PREMIUMS = {
  "Small hatchback": 6000,
  "Premium hatchback": 8000,
  Sedan: 9500,
  SUV: 12000,
  EV: 14000,
};

export const CITY_FACTORS = {
  Delhi: 1.1,
  Mumbai: 1.15,
  Bengaluru: 1.12,
  Pune: 1.08,
  Hyderabad: 1.07,
  Chennai: 1.06,
  Jaipur: 1.03,
  Lucknow: 1.03,
  Ahmedabad: 1.04,
  Chandigarh: 1.02,
};

export const FUEL_FACTORS = {
  Petrol: 1,
  Diesel: 1.08,
  CNG: 1.05,
  EV: 1.12,
};

export const NCB_DISCOUNTS = {
  "0%": 0,
  "20%": 0.2,
  "25%": 0.25,
  "35%": 0.35,
  "45%": 0.45,
  "50%": 0.5,
  "Not sure": 0,
};

export const CLAIMS_LOADING = {
  "0": 1,
  "1": 1.1,
  "2": 1.2,
  "3+": 1.35,
};

export const IDV_FACTORS = {
  "Lowest price": 0.9,
  "Balanced cover": 1,
  "Higher cover": 1.15,
};

export const ADDON_CATALOG = [
  {
    id: "zeroDep",
    name: "Zero Depreciation",
    description: "Get higher claim amount for replaced parts",
    price: 1400,
  },
  {
    id: "roadside",
    name: "Roadside Assistance",
    description: "Help if your vehicle breaks down",
    price: 350,
  },
  {
    id: "engineProtect",
    name: "Engine Protection",
    description: "Useful for water or oil damage",
    price: 950,
  },
  {
    id: "consumables",
    name: "Consumables Cover",
    description: "Covers small parts and consumables",
    price: 450,
  },
];

export const VEHICLE_CATALOG = {
  Maruti: [
    {
      model: "Swift",
      variants: ["LXi", "VXi", "ZXi"],
      segment: "Premium hatchback",
      fuelTypes: ["Petrol", "CNG"],
    },
    {
      model: "Baleno",
      variants: ["Sigma", "Delta", "Alpha"],
      segment: "Premium hatchback",
      fuelTypes: ["Petrol", "CNG"],
    },
  ],
  Hyundai: [
    {
      model: "Creta",
      variants: ["E", "S", "SX"],
      segment: "SUV",
      fuelTypes: ["Petrol", "Diesel"],
    },
    {
      model: "i20",
      variants: ["Magna", "Sportz", "Asta"],
      segment: "Premium hatchback",
      fuelTypes: ["Petrol", "Diesel"],
    },
  ],
  Tata: [
    {
      model: "Nexon",
      variants: ["Smart", "Pure", "Creative"],
      segment: "SUV",
      fuelTypes: ["Petrol", "Diesel", "EV"],
    },
    {
      model: "Tiago",
      variants: ["XE", "XT", "XZ+"],
      segment: "Small hatchback",
      fuelTypes: ["Petrol", "CNG", "EV"],
    },
  ],
  Mahindra: [
    {
      model: "XUV300",
      variants: ["W2", "W4", "W8"],
      segment: "SUV",
      fuelTypes: ["Petrol", "Diesel"],
    },
  ],
  Honda: [
    {
      model: "City",
      variants: ["V", "VX", "ZX"],
      segment: "Sedan",
      fuelTypes: ["Petrol"],
    },
    {
      model: "Amaze",
      variants: ["S", "VX", "ZX"],
      segment: "Sedan",
      fuelTypes: ["Petrol", "Diesel"],
    },
  ],
  Toyota: [
    {
      model: "Urban Cruiser",
      variants: ["Mid", "High"],
      segment: "SUV",
      fuelTypes: ["Petrol"],
    },
  ],
  Kia: [
    {
      model: "Seltos",
      variants: ["HTE", "HTK", "HTX"],
      segment: "SUV",
      fuelTypes: ["Petrol", "Diesel"],
    },
  ],
};

export const MANUFACTURE_YEARS = Array.from(
  { length: new Date().getFullYear() - 2004 },
  (_, index) => new Date().getFullYear() - index,
);
