import { useMemo, useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { getStageLabel } from "../services/analyticsApi";
import { formatCompactTime, formatCurrencyINR, formatDateDisplay } from "../utils/formatters";

function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="soft-label">Internal dashboard</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <div className="stat-card">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function StatusPill({ children, tone = "default" }) {
  const toneMap = {
    default: "bg-cloud text-slate-600",
    success: "bg-mint-50 text-mint-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-rose-50 text-rose-700",
    info: "bg-brand-50 text-brand-700",
  };

  return (
    <span className={["rounded-full px-3 py-1 text-xs font-semibold", toneMap[tone]].join(" ")}>
      {children}
    </span>
  );
}

function getStatusTone(record) {
  if (record.status === "completed") {
    return "success";
  }

  if (record.status === "abandoned") {
    return "danger";
  }

  if (record.leadId) {
    return "warning";
  }

  return "info";
}

export default function AdminDashboardPage() {
  const { dashboardSnapshot, resetDemoData, store } = useAppData();
  const [selectedSessionId, setSelectedSessionId] = useState(
    dashboardSnapshot.sessions[0]?.sessionId ?? null,
  );

  const records = useMemo(
    () =>
      dashboardSnapshot.sessions.map((session) => {
        const relatedLead = dashboardSnapshot.leads.find(
          (lead) => lead.sessionId === session.sessionId,
        );

        return {
          ...session,
          score: relatedLead?.score ?? null,
          customer: relatedLead?.customer ?? session.data.customer,
          vehicle: relatedLead?.vehicle ?? session.data.vehicle,
          policy: relatedLead?.policy ?? session.data.policy,
        };
      }),
    [dashboardSnapshot.leads, dashboardSnapshot.sessions],
  );

  const selectedRecord = records.find((record) => record.sessionId === selectedSessionId) ?? records[0];
  const selectedLead = dashboardSnapshot.leads.find(
    (lead) => lead.sessionId === selectedRecord?.sessionId,
  );
  const selectedEvents = [...store.events]
    .filter((event) => event.sessionId === selectedRecord?.sessionId)
    .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));

  return (
    <div className="space-y-6">
      <div className="app-card">
        <SectionTitle
          action={
            <button
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-mist bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-brand-300 hover:bg-brand-50"
              onClick={resetDemoData}
              type="button"
            >
              Reset seeded data
            </button>
          }
          subtitle="Inspect every session, score, event trail, timing checkpoint, and funnel drop-off. New form submissions from the quote app appear here immediately."
          title="Quote funnel instrumentation and lead quality"
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard
            helper="Includes seeded demo sessions plus new live activity"
            label="Total sessions"
            value={dashboardSnapshot.totals.totalSessions}
          />
          <StatCard
            helper="Lead created after contact details are submitted"
            label="Lead submissions"
            value={dashboardSnapshot.totals.totalLeads}
          />
          <StatCard
            helper="Average time from start to estimate"
            label="Avg time-to-quote"
            value={formatCompactTime(dashboardSnapshot.totals.averageTimeToQuote)}
          />
          <StatCard
            helper="Average time from start to contact submit"
            label="Avg contact submit"
            value={formatCompactTime(dashboardSnapshot.totals.averageTimeToContactSubmit)}
          />
          <StatCard
            helper="Sessions that reached final application"
            label="Completion rate"
            value={`${dashboardSnapshot.totals.completionRate}%`}
          />
          <StatCard
            helper="Sessions with a contactable lead"
            label="Contact conversion"
            value={`${dashboardSnapshot.totals.contactConversionRate}%`}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="app-card">
          <p className="soft-label">Funnel behavior</p>
          <div className="mt-5 grid gap-3">
            {dashboardSnapshot.funnel.map((step) => (
              <div key={step.id} className="rounded-[24px] bg-cloud p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{step.label}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {step.count} sessions · {step.conversionFromPrevious}% from previous step
                    </p>
                  </div>
                  <StatusPill tone={step.dropOff > 0 ? "warning" : "success"}>
                    Drop-off {step.dropOff}
                  </StatusPill>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-mint-400"
                    style={{ width: `${Math.max(step.conversionFromPrevious, 6)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="app-card">
            <p className="soft-label">Step timing rollup</p>
            <div className="mt-5 space-y-3">
              {Object.entries(dashboardSnapshot.timingRollup.averages).map(([stageId, duration]) => (
                <div key={stageId}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-ink">{getStageLabel(stageId)}</span>
                    <span className="text-slate-500">{formatCompactTime(duration)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-cloud">
                    <div
                      className="h-2 rounded-full bg-brand-500"
                      style={{ width: `${Math.max(duration * 2, 8)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] bg-cloud p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Fastest step
                </p>
                <p className="mt-2 font-semibold text-ink">
                  {dashboardSnapshot.timingRollup.fastestStep?.label ?? "Not enough data"}
                </p>
              </div>
              <div className="rounded-[24px] bg-cloud p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Slowest step
                </p>
                <p className="mt-2 font-semibold text-ink">
                  {dashboardSnapshot.timingRollup.slowestStep?.label ?? "Not enough data"}
                </p>
              </div>
            </div>
          </div>

          <div className="app-card">
            <p className="soft-label">Risk mix</p>
            <div className="mt-5 grid gap-3">
              {Object.entries(dashboardSnapshot.riskDistribution).map(([riskLevel, count]) => (
                <div key={riskLevel} className="flex items-center justify-between rounded-[24px] bg-cloud p-4">
                  <span className="font-semibold text-ink">{riskLevel}</span>
                  <StatusPill
                    tone={
                      riskLevel === "Low"
                        ? "success"
                        : riskLevel === "Medium"
                          ? "warning"
                          : riskLevel === "High"
                            ? "danger"
                            : "default"
                    }
                  >
                    {count} leads
                  </StatusPill>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="app-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="soft-label">Sessions and leads</p>
              <p className="mt-1 text-sm text-slate-500">Select a record to inspect behavior and score reasons.</p>
            </div>
            <StatusPill tone="info">{records.length} records</StatusPill>
          </div>

          <div className="mt-5 space-y-3">
            {records.map((record) => (
              <button
                key={record.sessionId}
                className={[
                  "w-full rounded-[24px] border p-4 text-left transition",
                  selectedRecord?.sessionId === record.sessionId
                    ? "border-brand-400 bg-brand-50 shadow-glow"
                    : "border-mist bg-white hover:border-brand-300 hover:bg-brand-50",
                ].join(" ")}
                onClick={() => setSelectedSessionId(record.sessionId)}
                type="button"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      {record.registrationNumber || "No registration yet"}
                    </p>
                    <p className="mt-1 font-semibold text-ink">
                      {record.vehicle?.make
                        ? `${record.vehicle.make} ${record.vehicle.model}`
                        : "Browsing session"}
                    </p>
                  </div>
                  <StatusPill tone={getStatusTone(record)}>{record.status}</StatusPill>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-500">
                  <div>
                    <p>Current stage</p>
                    <p className="mt-1 font-semibold text-ink">{getStageLabel(record.currentStage)}</p>
                  </div>
                  <div>
                    <p>Time-to-quote</p>
                    <p className="mt-1 font-semibold text-ink">
                      {formatCompactTime(record.metrics?.timeToQuote)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Last activity {formatDateDisplay(record.lastActivityAt)}
                  </p>
                  {record.score ? (
                    <StatusPill
                      tone={
                        record.score.riskLevel === "Low"
                          ? "success"
                          : record.score.riskLevel === "Medium"
                            ? "warning"
                            : "danger"
                      }
                    >
                      Score {record.score.score}
                    </StatusPill>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedRecord ? (
          <div className="space-y-6">
            <div className="app-card">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="soft-label">Selected record</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
                    {selectedRecord.registrationNumber || "Live browsing session"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Status: {selectedRecord.status} · Current stage: {getStageLabel(selectedRecord.currentStage)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone={getStatusTone(selectedRecord)}>{selectedRecord.status}</StatusPill>
                  {selectedLead?.selectedPlan ? (
                    <StatusPill tone="info">{selectedLead.selectedPlan}</StatusPill>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-[24px] bg-cloud p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Time-to-quote
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold text-ink">
                    {formatCompactTime(selectedRecord.metrics?.timeToQuote)}
                  </p>
                </div>
                <div className="rounded-[24px] bg-cloud p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Time-to-contact-submit
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold text-ink">
                    {formatCompactTime(selectedRecord.metrics?.timeToContactSubmit)}
                  </p>
                </div>
                <div className="rounded-[24px] bg-cloud p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Total completion time
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold text-ink">
                    {formatCompactTime(selectedRecord.metrics?.totalCompletionTime)}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[24px] border border-white/80 bg-white p-4 shadow-panel">
                  <p className="text-sm font-semibold text-slate-500">Fastest step</p>
                  <p className="mt-2 font-semibold text-ink">
                    {selectedRecord.metrics?.fastestStep?.label ?? "Not available"}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/80 bg-white p-4 shadow-panel">
                  <p className="text-sm font-semibold text-slate-500">Step where user hesitated most</p>
                  <p className="mt-2 font-semibold text-ink">
                    {selectedRecord.metrics?.hesitationStep?.label ?? "Not available"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-6">
                <div className="app-card">
                  <p className="soft-label">Lead quality score</p>
                  {selectedLead?.score ? (
                    <>
                      <div className="mt-4 flex items-start justify-between gap-4">
                        <div>
                          <p className="font-display text-5xl font-semibold text-ink">
                            {selectedLead.score.score}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">
                            Risk level: {selectedLead.score.riskLevel}
                          </p>
                        </div>
                        <StatusPill
                          tone={
                            selectedLead.score.riskLevel === "Low"
                              ? "success"
                              : selectedLead.score.riskLevel === "Medium"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {selectedLead.score.riskLevel} risk
                        </StatusPill>
                      </div>

                      <div className="mt-5 rounded-[24px] bg-cloud p-4">
                        <p className="text-sm font-semibold text-ink">Recommended action</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {selectedLead.score.recommendedAction}
                        </p>
                      </div>

                      <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-[24px] bg-white p-4 shadow-panel">
                          <p className="text-sm font-semibold text-mint-600">Positive signals</p>
                          <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            {(selectedLead.score.positiveSignals ?? []).map((signal) => (
                              <li key={signal}>• {signal}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-[24px] bg-white p-4 shadow-panel">
                          <p className="text-sm font-semibold text-rose-700">Negative signals</p>
                          <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            {(selectedLead.score.negativeSignals ?? []).map((signal) => (
                              <li key={signal.label ?? signal}>
                                • {signal.label ?? signal}
                                {signal.penalty ? ` (-${signal.penalty})` : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      Score is not available yet because this session has not created a lead.
                    </p>
                  )}
                </div>

                <div className="app-card">
                  <p className="soft-label">Submission snapshot</p>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[24px] bg-cloud p-4 text-sm text-slate-600">
                      <p className="font-semibold text-ink">Vehicle</p>
                      <p className="mt-2">
                        {selectedRecord.vehicle?.make
                          ? `${selectedRecord.vehicle.make} ${selectedRecord.vehicle.model} ${selectedRecord.vehicle.variant}`
                          : "Not available"}
                      </p>
                      <p>Fuel: {selectedRecord.vehicle?.fuelType || "Not available"}</p>
                      <p>Year: {selectedRecord.vehicle?.manufactureYear || "Not available"}</p>
                      <p>City: {selectedRecord.vehicle?.cityOfRegistration || "Not available"}</p>
                    </div>
                    <div className="rounded-[24px] bg-cloud p-4 text-sm text-slate-600">
                      <p className="font-semibold text-ink">Policy</p>
                      <p className="mt-2">Expiry: {formatDateDisplay(selectedRecord.policy?.previousPolicyExpiryDate)}</p>
                      <p>NCB: {selectedRecord.policy?.ncbPercentage || "Not selected"}</p>
                      <p>Claims: {selectedRecord.policy?.claimsInLast3Years || "Not selected"}</p>
                      <p>Cover: {selectedRecord.policy?.idvPreference || "Not selected"}</p>
                    </div>
                    <div className="rounded-[24px] bg-cloud p-4 text-sm text-slate-600">
                      <p className="font-semibold text-ink">Customer</p>
                      <p className="mt-2">{selectedLead?.customer?.fullName || "Not submitted"}</p>
                      <p>{selectedLead?.customer?.mobileNumber || "No mobile yet"}</p>
                      <p>{selectedLead?.customer?.emailAddress || "No email yet"}</p>
                    </div>
                    <div className="rounded-[24px] bg-cloud p-4 text-sm text-slate-600">
                      <p className="font-semibold text-ink">Purchase details</p>
                      <p className="mt-2">DOB: {formatDateDisplay(selectedLead?.purchase?.dateOfBirth)}</p>
                      <p>
                        Previous insurer: {selectedLead?.purchase?.previousInsurerName || "Not provided"}
                      </p>
                      <p>Nominee: {selectedLead?.purchase?.nomineeName || "Not provided"}</p>
                      <p>
                        Relationship: {selectedLead?.purchase?.nomineeRelationship || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {selectedLead?.exactQuotes?.length ? (
                    <div className="mt-5 rounded-[24px] bg-white p-4 shadow-panel">
                      <p className="text-sm font-semibold text-ink">Exact quote payload</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {selectedLead.exactQuotes.map((quote) => (
                          <div key={quote.insurer} className="rounded-[20px] bg-cloud p-3 text-sm text-slate-600">
                            <p className="font-semibold text-ink">{quote.insurer}</p>
                            <p className="mt-1">
                              Premium {formatCurrencyINR(quote.finalPremium ?? quote.premium)}
                            </p>
                            <p>IDV {formatCurrencyINR(quote.idv ?? 0)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-6">
                <div className="app-card">
                  <p className="soft-label">Step timings</p>
                  <div className="mt-5 space-y-3">
                    {Object.entries(selectedRecord.timing?.stepDurations ?? {}).map(([stageId, duration]) => (
                      <div key={stageId} className="rounded-[22px] bg-cloud p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-ink">{getStageLabel(stageId)}</p>
                          <p className="text-sm text-slate-500">{formatCompactTime(duration)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="app-card">
                  <p className="soft-label">Event timeline</p>
                  <div className="mt-5 space-y-3">
                    {selectedEvents.length ? (
                      selectedEvents.map((event) => (
                        <div key={event.eventId} className="rounded-[24px] bg-cloud p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-ink">{event.eventName}</p>
                              <p className="mt-1 text-sm text-slate-500">
                                Step: {event.stepName} · {formatCompactTime(event.timeSinceStart)}
                              </p>
                            </div>
                            <StatusPill tone="default">
                              {new Date(event.timestamp).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </StatusPill>
                          </div>

                          {Object.keys(event.metadata ?? {}).length ? (
                            <pre className="mt-3 overflow-x-auto rounded-[18px] bg-white p-3 text-xs leading-5 text-slate-600">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No events tracked for this session yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
