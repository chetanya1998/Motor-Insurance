import { createSeedStore } from "../data/seedData";

const STORAGE_KEY = "cover-compass-store-v1";

export function loadAppStore() {
  if (typeof window === "undefined") {
    return createSeedStore();
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    const seededStore = createSeedStore();
    saveAppStore(seededStore);
    return seededStore;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    const seededStore = createSeedStore();
    saveAppStore(seededStore);
    return seededStore;
  }
}

export function saveAppStore(store) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function resetAppStore() {
  const nextStore = createSeedStore();
  saveAppStore(nextStore);
  return nextStore;
}
