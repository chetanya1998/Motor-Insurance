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
  const countByEvent = (eventName) =>
    new Set(events.filter((event) => event.eventName === eventName).map((event) => event.sessionId))
      .size;

  const totalSessions = sessions.length;

  const steps = [
    {
      id: "landing",
      label: "Landing views",
      count: totalSessions,
    },
    {
      id: "started",
      label: "Started quote",
      count: countByEvent("quote_journey_started"),
    },
    {
      id: "vehicle",
      label: "Vehicle completed",
      count: countByEvent("vehicle_details_completed"),
    },
    {
      id: "policy",
      label: "Policy completed",
      count: countByEvent("policy_details_completed"),
    },
    {
      id: "estimate",
      label: "Estimate viewed",
      count: countByEvent("quote_range_viewed"),
    },
    {
      id: "contact",
      label: "Contact submitted",
      count: countByEvent("contact_details_submitted"),
    },
    {
      id: "quotes",
      label: "Exact quotes viewed",
      count: countByEvent("exact_quotes_viewed"),
    },
    {
      id: "completed",
      label: "Applications completed",
      count: countByEvent("form_completed"),
    },
  ];

  return steps.map((step, index) => {
    const previousCount = index === 0 ? totalSessions : steps[index - 1].count || 1;
    const dropOff = index === 0 ? 0 : Math.max(previousCount - step.count, 0);

    return {
      ...step,
      conversionFromPrevious:
        index === 0 ? 100 : Math.round((step.count / previousCount) * 100),
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
