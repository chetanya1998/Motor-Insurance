import { JOURNEY_STAGES } from "../data/options";
import { createId, getFastestAndSlowestStep, getSecondsBetween } from "../utils/helpers";

const stageLabelMap = JOURNEY_STAGES.reduce((accumulator, stage) => {
  accumulator[stage.id] = stage.label;
  return accumulator;
}, {});

export function buildTrackedEvent({
  session,
  leadId,
  eventName,
  stepName,
  metadata = {},
  timestamp = new Date().toISOString(),
}) {
  return {
    eventId: createId("event"),
    sessionId: session.sessionId,
    leadId: leadId ?? session.leadId ?? null,
    eventName,
    stepName,
    timestamp,
    timeSinceStart:
      getSecondsBetween(session.timing?.journeyStartedAt, timestamp) ?? 0,
    metadata,
  };
}

export function buildFunnelMetrics(sessions = [], events = []) {
  const eventsBySession = events.reduce((accumulator, event) => {
    if (!accumulator[event.sessionId]) {
      accumulator[event.sessionId] = new Set();
    }

    accumulator[event.sessionId].add(event.eventName);
    return accumulator;
  }, {});

  const stages = [
    { id: "landing", label: "Landing views" },
    { id: "started", label: "Started quote" },
    { id: "vehicle", label: "Vehicle completed" },
    { id: "policy", label: "Policy completed" },
    { id: "estimate", label: "Estimate viewed" },
    { id: "contact", label: "Contact submitted" },
    { id: "quotes", label: "Exact quotes viewed" },
    { id: "completed", label: "Applications completed" },
  ];

  const stageIndexBySession = sessions.map((session) => {
    const sessionEvents = eventsBySession[session.sessionId] ?? new Set();
    let stageIndex = 0;

    if (sessionEvents.has("quote_journey_started") || session.timing?.journeyStartedAt) {
      stageIndex = 1;
    }

    if (sessionEvents.has("vehicle_details_completed") || session.timing?.checkpoints?.vehicleConfirmedAt) {
      stageIndex = 2;
    }

    if (sessionEvents.has("policy_details_completed") || session.timing?.checkpoints?.policyCompletedAt) {
      stageIndex = 3;
    }

    if (sessionEvents.has("quote_range_viewed") || session.timing?.checkpoints?.quoteGeneratedAt) {
      stageIndex = 4;
    }

    if (sessionEvents.has("contact_details_submitted") || session.timing?.checkpoints?.contactSubmittedAt || session.leadId) {
      stageIndex = 5;
    }

    if (
      sessionEvents.has("exact_quotes_viewed") ||
      (session.data?.exactQuotes?.length ?? 0) > 0 ||
      session.currentStage === "quotes"
    ) {
      stageIndex = 6;
    }

    if (sessionEvents.has("form_completed") || session.status === "completed" || session.timing?.checkpoints?.completedAt) {
      stageIndex = 7;
    }

    return stageIndex;
  });

  return stages.map((step, index) => {
    const count = stageIndexBySession.filter((stageIndex) => stageIndex >= index).length;
    const previousCount =
      index === 0
        ? sessions.length
        : Math.max(
            stageIndexBySession.filter((stageIndex) => stageIndex >= index - 1).length,
            1,
          );
    const dropOff = index === 0 ? 0 : Math.max(previousCount - count, 0);

    return {
      ...step,
      count,
      conversionFromPrevious:
        index === 0 ? 100 : Math.round((count / previousCount) * 100),
      dropOff,
    };
  });
}

export function buildStepTimingRollup(sessions = []) {
  const totals = JOURNEY_STAGES.reduce((accumulator, stage) => {
    accumulator[stage.id] = { total: 0, count: 0 };
    return accumulator;
  }, {});

  sessions.forEach((session) => {
    Object.entries(session.timing?.stepDurations ?? {}).forEach(([stageId, duration]) => {
      if (!totals[stageId] || !duration) {
        return;
      }

      totals[stageId].total += duration;
      totals[stageId].count += 1;
    });
  });

  const averages = Object.entries(totals).reduce((accumulator, [stageId, value]) => {
    accumulator[stageId] = value.count ? Math.round(value.total / value.count) : 0;
    return accumulator;
  }, {});

  const { fastestStep, slowestStep } = getFastestAndSlowestStep(averages);

  return {
    averages,
    fastestStep: fastestStep
      ? { id: fastestStep[0], label: stageLabelMap[fastestStep[0]], duration: fastestStep[1] }
      : null,
    slowestStep: slowestStep
      ? { id: slowestStep[0], label: stageLabelMap[slowestStep[0]], duration: slowestStep[1] }
      : null,
  };
}

export function getStageLabel(stageId) {
  return stageLabelMap[stageId] ?? stageId;
}
