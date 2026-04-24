import { buildFunnelMetrics, buildStepTimingRollup, getStageLabel } from "./analyticsApi";
import { createId, getFastestAndSlowestStep, getSecondsBetween } from "../utils/helpers";

function getSessionMetricSummary(session) {
  const timeToQuote = getSecondsBetween(
    session.timing?.journeyStartedAt,
    session.timing?.checkpoints?.quoteGeneratedAt,
  );
  const timeToContactSubmit = getSecondsBetween(
    session.timing?.journeyStartedAt,
    session.timing?.checkpoints?.contactSubmittedAt,
  );
  const totalCompletionTime = getSecondsBetween(
    session.timing?.journeyStartedAt,
    session.timing?.checkpoints?.completedAt,
  );
  const { fastestStep, slowestStep } = getFastestAndSlowestStep(session.timing?.stepDurations ?? {});

  return {
    timeToQuote,
    timeToContactSubmit,
    totalCompletionTime,
    fastestStep: fastestStep
      ? { id: fastestStep[0], label: getStageLabel(fastestStep[0]), duration: fastestStep[1] }
      : null,
    slowestStep: slowestStep
      ? { id: slowestStep[0], label: getStageLabel(slowestStep[0]), duration: slowestStep[1] }
      : null,
    hesitationStep: slowestStep
      ? { id: slowestStep[0], label: getStageLabel(slowestStep[0]), duration: slowestStep[1] }
      : null,
  };
}

export function upsertLead(store, session, payload) {
  const existingIndex = store.leads.findIndex((lead) => lead.sessionId === session.sessionId);
  const leadId = store.leads[existingIndex]?.leadId ?? session.leadId ?? createId("lead");
  const nextLead = {
    ...(store.leads[existingIndex] ?? {}),
    leadId,
    sessionId: session.sessionId,
    registrationNumber: session.registrationNumber,
    createdAt: store.leads[existingIndex]?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: payload.status ?? store.leads[existingIndex]?.status ?? "contact_submitted",
    vehicle: payload.vehicle,
    policy: payload.policy,
    customer: payload.customer,
    purchase: payload.purchase,
    quoteEstimate: payload.quoteEstimate,
    exactQuotes: payload.exactQuotes,
    selectedAddons: payload.selectedAddons ?? [],
    selectedPlan: payload.selectedPlan ?? null,
    score: payload.score ?? store.leads[existingIndex]?.score ?? null,
    timings: getSessionMetricSummary(session),
  };

  if (existingIndex === -1) {
    store.leads.push(nextLead);
  } else {
    store.leads[existingIndex] = nextLead;
  }

  session.leadId = leadId;

  return nextLead;
}

export function getDashboardSnapshot(store) {
  const sessions = [...store.sessions].sort(
    (left, right) => new Date(right.lastActivityAt) - new Date(left.lastActivityAt),
  );
  const leads = [...store.leads]
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
    .map((lead) => {
      const session = sessions.find((item) => item.sessionId === lead.sessionId);
      return {
        ...lead,
        metrics: session ? getSessionMetricSummary(session) : lead.timings,
        currentStage: session?.currentStage ?? "unknown",
        sessionStatus: session?.status ?? "unknown",
      };
    });

  const average = (values) => {
    const validValues = values.filter((value) => typeof value === "number");
    if (!validValues.length) {
      return 0;
    }
    return Math.round(validValues.reduce((total, value) => total + value, 0) / validValues.length);
  };

  const leadSessions = sessions.filter((session) => session.leadId);
  const riskDistribution = leads.reduce(
    (accumulator, lead) => {
      const riskLevel = lead.score?.riskLevel ?? "Unscored";
      accumulator[riskLevel] = (accumulator[riskLevel] ?? 0) + 1;
      return accumulator;
    },
    { Low: 0, Medium: 0, High: 0, Unscored: 0 },
  );
  const timingRollup = buildStepTimingRollup(sessions);

  return {
    sessions: sessions.map((session) => ({
      ...session,
      metrics: getSessionMetricSummary(session),
    })),
    leads,
    totals: {
      totalSessions: sessions.length,
      totalLeads: leads.length,
      completedApplications: sessions.filter((session) => session.status === "completed").length,
      abandonedSessions: sessions.filter((session) => session.status === "abandoned").length,
      averageTimeToQuote: average(leadSessions.map((session) => getSessionMetricSummary(session).timeToQuote)),
      averageTimeToContactSubmit: average(
        leadSessions.map((session) => getSessionMetricSummary(session).timeToContactSubmit),
      ),
      averageCompletionTime: average(
        sessions
          .filter((session) => session.status === "completed")
          .map((session) => getSessionMetricSummary(session).totalCompletionTime),
      ),
      contactConversionRate: sessions.length
        ? Math.round((leads.length / sessions.length) * 100)
        : 0,
      completionRate: sessions.length
        ? Math.round(
            (sessions.filter((session) => session.status === "completed").length / sessions.length) *
              100,
          )
        : 0,
    },
    funnel: buildFunnelMetrics(sessions, store.events),
    timingRollup,
    riskDistribution,
    latestEvents: [...store.events]
      .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
      .slice(0, 18),
  };
}
