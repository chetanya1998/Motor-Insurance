import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { STAGE_TO_SCREEN } from "../data/options";
import { buildTrackedEvent } from "../services/analyticsApi";
import { getDashboardSnapshot, upsertLead } from "../services/leadApi";
import { loadAppStore, resetAppStore, saveAppStore } from "../services/storage";
import { createId, getSecondsBetween } from "../utils/helpers";

const AppDataContext = createContext(null);

function createLiveSession(sessionId) {
  const timestamp = new Date().toISOString();

  return {
    sessionId,
    leadId: null,
    registrationNumber: "",
    createdAt: timestamp,
    lastActivityAt: timestamp,
    status: "browsing",
    currentScreen: "landing",
    currentStage: null,
    vehicleLookupMode: "lookup",
    vehicleLookupStatus: "idle",
    vehicleLookupConfidence: "low",
    data: {
      vehicle: {},
      policy: {},
      customer: {},
      purchase: {},
      quoteEstimate: null,
      exactQuotes: [],
      selectedAddons: [],
      selectedPlan: null,
    },
    analytics: {
      validationErrors: 0,
      pasteCount: 0,
      uncertainFields: [],
      vehicleEditCount: 0,
      honeypotFilled: false,
      startedFrom: null,
    },
    timing: {
      appLoadedAt: timestamp,
      journeyStartedAt: null,
      currentStageStartedAt: null,
      stepDurations: {
        vehicle: 0,
        policy: 0,
        estimate: 0,
        contact: 0,
        quotes: 0,
        purchase: 0,
      },
      checkpoints: {},
    },
  };
}

function finalizeCurrentStage(session, timestamp) {
  if (!session.currentStage || !session.timing.currentStageStartedAt) {
    return;
  }

  const elapsedSeconds = getSecondsBetween(session.timing.currentStageStartedAt, timestamp) ?? 0;
  session.timing.stepDurations[session.currentStage] =
    (session.timing.stepDurations[session.currentStage] ?? 0) + elapsedSeconds;
  session.timing.currentStageStartedAt = timestamp;
}

function transitionToScreen(session, screenId, timestamp) {
  const nextStage = STAGE_TO_SCREEN[screenId];

  if (nextStage && nextStage !== session.currentStage) {
    finalizeCurrentStage(session, timestamp);
    session.currentStage = nextStage;
    session.timing.currentStageStartedAt = timestamp;
  }

  session.currentScreen = screenId;
  session.lastActivityAt = timestamp;
}

function reconcileStaleSessions(store) {
  const now = Date.now();

  store.sessions.forEach((session) => {
    if (["completed", "abandoned"].includes(session.status)) {
      return;
    }

    if (now - new Date(session.lastActivityAt).getTime() < 30 * 60 * 1000) {
      return;
    }

    const timestamp = new Date().toISOString();
    finalizeCurrentStage(session, timestamp);
    session.status = "abandoned";
    session.lastActivityAt = timestamp;

    const alreadyTracked = store.events.some(
      (event) =>
        event.sessionId === session.sessionId && event.eventName === "form_abandoned",
    );

    if (!alreadyTracked) {
      store.events.push(
        buildTrackedEvent({
          session,
          leadId: session.leadId,
          eventName: "form_abandoned",
          stepName: session.currentScreen ?? session.currentStage ?? "journey",
          timestamp,
          metadata: { reason: "inactive_timeout" },
        }),
      );
    }
  });
}

export function AppDataProvider({ children }) {
  const [store, setStore] = useState(() => {
    const initialStore = loadAppStore();
    const nextStore = structuredClone(initialStore);
    reconcileStaleSessions(nextStore);
    saveAppStore(nextStore);
    return nextStore;
  });
  const [currentSessionId] = useState(() => createId("session_live"));
  const sessionBootstrapRef = useRef(false);
  const currentSessionRef = useRef(null);

  const mutateStore = useCallback((recipe) => {
    let nextSnapshot = null;

    setStore((previousStore) => {
      const draft = structuredClone(previousStore);
      nextSnapshot = recipe(draft) ?? draft;
      saveAppStore(nextSnapshot);
      return nextSnapshot;
    });

    return nextSnapshot;
  }, []);

  const currentSession = useMemo(
    () => store.sessions.find((session) => session.sessionId === currentSessionId) ?? null,
    [currentSessionId, store.sessions],
  );

  useEffect(() => {
    if (currentSession) {
      return;
    }

    mutateStore((draft) => {
      const hasCurrentSession = draft.sessions.some(
        (session) => session.sessionId === currentSessionId,
      );

      if (!hasCurrentSession) {
        draft.sessions.unshift(createLiveSession(currentSessionId));
      }

      return draft;
    });
  }, [currentSession, currentSessionId, mutateStore]);

  useEffect(() => {
    currentSessionRef.current = currentSession;
  }, [currentSession]);

  const patchCurrentSession = useCallback(
    (updater) => {
      mutateStore((draft) => {
        const session = draft.sessions.find((item) => item.sessionId === currentSessionId);
        if (!session) {
          return draft;
        }

        if (typeof updater === "function") {
          updater(session);
        } else {
          Object.assign(session, updater);
        }

        session.lastActivityAt = new Date().toISOString();
        return draft;
      });
    },
    [currentSessionId, mutateStore],
  );

  const trackEvent = useCallback(
    (eventName, stepName, metadata = {}, leadIdOverride) => {
      mutateStore((draft) => {
        const session = draft.sessions.find((item) => item.sessionId === currentSessionId);
        if (!session) {
          return draft;
        }

        const timestamp = new Date().toISOString();
        session.lastActivityAt = timestamp;

        if (eventName === "form_completed") {
          finalizeCurrentStage(session, timestamp);
          session.status = "completed";
          session.timing.checkpoints.completedAt = session.timing.checkpoints.completedAt ?? timestamp;
        }

        if (eventName === "form_abandoned" && session.status !== "completed") {
          finalizeCurrentStage(session, timestamp);
          session.status = "abandoned";
        }

        const event = buildTrackedEvent({
          session,
          leadId: leadIdOverride,
          eventName,
          stepName,
          timestamp,
          metadata,
        });

        draft.events.push(event);
        return draft;
      });
    },
    [currentSessionId, mutateStore],
  );

  const recordValidationError = useCallback(
    ({ eventName = "validation_error", stepName, field, message }) => {
      mutateStore((draft) => {
        const session = draft.sessions.find((item) => item.sessionId === currentSessionId);
        if (!session) {
          return draft;
        }

        session.analytics.validationErrors += 1;
        session.lastActivityAt = new Date().toISOString();
        const event = buildTrackedEvent({
          session,
          leadId: session.leadId,
          eventName,
          stepName,
          metadata: { field, message },
        });
        draft.events.push(event);
        return draft;
      });
    },
    [currentSessionId, mutateStore],
  );

  const recordPaste = useCallback(() => {
    patchCurrentSession((session) => {
      session.analytics.pasteCount += 1;
    });
  }, [patchCurrentSession]);

  const startJourney = useCallback(
    (source = "cta") => {
      let shouldTrackStart = false;

      mutateStore((draft) => {
        const session = draft.sessions.find((item) => item.sessionId === currentSessionId);
        if (!session) {
          return draft;
        }

        const timestamp = new Date().toISOString();
        session.status = "active";
        session.analytics.startedFrom = source;

        if (!session.timing.journeyStartedAt) {
          session.timing.journeyStartedAt = timestamp;
          session.timing.currentStageStartedAt = timestamp;
          session.currentStage = "vehicle";
          shouldTrackStart = true;
        }

        session.currentScreen = "registration";
        session.lastActivityAt = timestamp;
        return draft;
      });

      if (shouldTrackStart) {
        trackEvent("quote_journey_started", "registration", { source });
      }
    },
    [currentSessionId, mutateStore, trackEvent],
  );

  const setCurrentScreen = useCallback(
    (screenId) => {
      mutateStore((draft) => {
        const session = draft.sessions.find((item) => item.sessionId === currentSessionId);
        if (!session) {
          return draft;
        }

        transitionToScreen(session, screenId, new Date().toISOString());
        return draft;
      });
    },
    [currentSessionId, mutateStore],
  );

  const saveLeadRecord = useCallback(
    (payload) => {
      let lead = null;

      mutateStore((draft) => {
        const session = draft.sessions.find((item) => item.sessionId === currentSessionId);
        if (!session) {
          return draft;
        }

        session.data.vehicle = payload.vehicle ?? session.data.vehicle;
        session.data.policy = payload.policy ?? session.data.policy;
        session.data.customer = payload.customer ?? session.data.customer;
        session.data.purchase = payload.purchase ?? session.data.purchase;
        session.data.quoteEstimate = payload.quoteEstimate ?? session.data.quoteEstimate;
        session.data.exactQuotes = payload.exactQuotes ?? session.data.exactQuotes;
        session.data.selectedAddons = payload.selectedAddons ?? session.data.selectedAddons;
        session.data.selectedPlan = payload.selectedPlan ?? session.data.selectedPlan;
        session.lastActivityAt = new Date().toISOString();

        if (payload.status) {
          session.status = payload.status;
        }

        lead = upsertLead(draft, session, payload);
        return draft;
      });

      return lead;
    },
    [currentSessionId, mutateStore],
  );

  const resetDemoData = useCallback(() => {
    setStore(resetAppStore());
    sessionBootstrapRef.current = false;
  }, []);

  useEffect(() => {
    if (!currentSession || sessionBootstrapRef.current) {
      return;
    }

    const hasAlreadyTrackedLoad = store.events.some(
      (event) =>
        event.sessionId === currentSession.sessionId && event.eventName === "app_loaded",
    );

    if (hasAlreadyTrackedLoad) {
      sessionBootstrapRef.current = true;
      return;
    }

    sessionBootstrapRef.current = true;
    trackEvent("app_loaded", "landing");
    trackEvent("page_viewed", "landing");
  }, [currentSession, store.events, trackEvent]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const session = currentSessionRef.current;

      if (!session || ["completed", "abandoned"].includes(session.status)) {
        return;
      }

      const nextStore = structuredClone(loadAppStore());
      const targetSession = nextStore.sessions.find(
        (item) => item.sessionId === session.sessionId,
      );

      if (!targetSession || ["completed", "abandoned"].includes(targetSession.status)) {
        return;
      }

      const timestamp = new Date().toISOString();
      finalizeCurrentStage(targetSession, timestamp);
      targetSession.status = "abandoned";
      targetSession.lastActivityAt = timestamp;

      nextStore.events.push(
        buildTrackedEvent({
          session: targetSession,
          leadId: targetSession.leadId,
          eventName: "form_abandoned",
          stepName: targetSession.currentScreen ?? targetSession.currentStage ?? "journey",
          timestamp,
          metadata: { reason: "browser_exit" },
        }),
      );

      saveAppStore(nextStore);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const value = useMemo(
    () => ({
      store,
      dashboardSnapshot: getDashboardSnapshot(store),
      currentSession,
      currentSessionId,
      startJourney,
      setCurrentScreen,
      patchCurrentSession,
      trackEvent,
      recordValidationError,
      recordPaste,
      saveLeadRecord,
      resetDemoData,
    }),
    [
      currentSession,
      currentSessionId,
      patchCurrentSession,
      recordPaste,
      recordValidationError,
      resetDemoData,
      saveLeadRecord,
      setCurrentScreen,
      startJourney,
      store,
      trackEvent,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }

  return context;
}
