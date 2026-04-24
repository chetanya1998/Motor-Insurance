import { useMemo, useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { ADDON_CATALOG } from "../data/options";
import { getStageLabel } from "../services/analyticsApi";
import { formatCompactTime, formatCurrencyINR, formatDateDisplay } from "../utils/formatters";

const SCREEN_LABELS = {
  landing: "Landing",
  registration: "Vehicle number",
  vehicleConfirmation: "Vehicle details",
  policy: "Policy details",
  estimate: "Estimate",
  personal: "Contact details",
  exactQuotes: "Exact quotes",
  purchase: "Purchase details",
  complete: "Complete",
};

const EVENT_LABELS = {
  app_loaded: "App loaded",
  page_viewed: "Landing viewed",
  quote_journey_started: "Quote journey started",
  form_abandoned: "Journey abandoned",
  form_completed: "Application completed",
  registration_field_started: "Vehicle number field focused",
  registration_entered: "Vehicle number entered",
  registration_validation_error: "Vehicle number validation issue",
  validation_error: "Validation issue",
  vehicle_lookup_started: "Vehicle lookup started",
  vehicle_lookup_success: "Vehicle lookup succeeded",
  vehicle_lookup_failed: "Vehicle lookup failed",
  vehicle_manual_entry_selected: "Manual vehicle entry chosen",
  vehicle_details_prefilled: "Vehicle details prefilled",
  vehicle_details_confirmed: "Vehicle details confirmed",
  vehicle_details_edited: "Vehicle details edited",
  vehicle_details_completed: "Vehicle step completed",
  policy_details_started: "Policy step started",
  policy_expiry_selected: "Policy expiry selected",
  ncb_selected: "No Claim Bonus selected",
  claims_selected: "Claims history selected",
  idv_preference_selected: "Vehicle value preference selected",
  policy_details_completed: "Policy step completed",
  quote_estimate_requested: "Estimate requested",
  quote_range_generated: "Estimate generated",
  quote_range_viewed: "Estimate viewed",
  quote_breakdown_viewed: "Estimate breakdown viewed",
  unlock_exact_quotes_clicked: "Unlock exact quotes clicked",
  quote_details_edited: "Estimate inputs edited",
  personal_details_started: "Contact step started",
  full_name_entered: "Full name entered",
  mobile_entered: "Mobile number entered",
  email_entered: "Email entered",
  contact_validation_error: "Contact details validation issue",
  contact_details_submitted: "Contact details submitted",
  exact_quotes_requested: "Exact quotes requested",
  exact_quotes_viewed: "Exact quotes viewed",
  insurer_card_viewed: "Insurer card viewed",
  insurer_plan_selected: "Plan selected",
  addon_selected: "Add-on selected",
  addon_removed: "Add-on removed",
  final_premium_updated: "Final premium updated",
  purchase_details_started: "Purchase step started",
  dob_entered: "Date of birth entered",
  previous_insurer_selected: "Previous insurer selected",
  nominee_details_entered: "Nominee details entered",
  purchase_application_completed: "Purchase details submitted",
  lead_quality_score_generated: "Lead quality score generated",
  suspicious_signal_detected: "Suspicious signal detected",
};

const FIELD_LABELS = {
  registrationNumber: "Vehicle number",
  previousPolicyExpiryDate: "Policy expiry",
  ncbPercentage: "No Claim Bonus",
  claimsInLast3Years: "Claims in last 3 years",
  idvPreference: "Vehicle value preference",
  fullName: "Full name",
  mobileNumber: "Mobile number",
  emailAddress: "Email address",
  dateOfBirth: "Date of birth",
  previousInsurerName: "Previous insurer",
  nomineeName: "Nominee name",
  nomineeRelationship: "Nominee relationship",
};

const UNCERTAIN_FIELD_LABELS = {
  ncb: "NCB not sure",
  policyExpiry: "Policy expiry not sure",
};

const ADDON_NAME_MAP = ADDON_CATALOG.reduce((accumulator, addon) => {
  accumulator[addon.id] = addon.name;
  return accumulator;
}, {});

function humanizeToken(value = "") {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function humanizeScreen(stepName) {
  return SCREEN_LABELS[stepName] ?? getStageLabel(stepName) ?? humanizeToken(stepName);
}

function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatList(value = []) {
  if (!value.length) {
    return "None";
  }

  return value.join(", ");
}

function getStatusTone(record) {
  if (record.status === "completed") {
    return "success";
  }

  if (record.status === "abandoned") {
    return "danger";
  }

  if (["contact_submitted", "quote_ready", "plan_selected"].includes(record.status)) {
    return "warning";
  }

  if (["active", "browsing"].includes(record.status)) {
    return "info";
  }

  return "default";
}

function getRiskTone(riskLevel) {
  if (riskLevel === "Low") {
    return "success";
  }

  if (riskLevel === "Medium") {
    return "warning";
  }

  if (riskLevel === "High") {
    return "danger";
  }

  return "default";
}

function getEventSummary(event) {
  const metadata = event.metadata ?? {};

  switch (event.eventName) {
    case "registration_entered":
    case "vehicle_lookup_started":
      return metadata.registrationNumber
        ? `Vehicle number ${metadata.registrationNumber}`
        : null;
    case "registration_validation_error":
    case "contact_validation_error":
    case "validation_error":
      return metadata.message
        ? `${FIELD_LABELS[metadata.field] ?? humanizeToken(metadata.field)}: ${metadata.message}`
        : null;
    case "vehicle_lookup_success":
      return metadata.confidence ? `${humanizeToken(metadata.confidence)} confidence match` : null;
    case "vehicle_lookup_failed":
      return metadata.message ?? "Vehicle lookup failed";
    case "vehicle_details_prefilled":
      return metadata.make && metadata.model
        ? `${metadata.make} ${metadata.model} was prefilled`
        : null;
    case "policy_expiry_selected":
      if (metadata.preset === "manual_date" && metadata.value) {
        return `Manual expiry date ${formatDateDisplay(metadata.value)}`;
      }
      return metadata.preset ?? (metadata.value ? formatDateDisplay(metadata.value) : null);
    case "ncb_selected":
      return metadata.value ? `NCB ${metadata.value}` : null;
    case "claims_selected":
      return metadata.value ? `${metadata.value} claims selected` : null;
    case "idv_preference_selected":
      return metadata.value ?? null;
    case "quote_range_generated":
      return typeof metadata.min === "number" && typeof metadata.max === "number"
        ? `${formatCurrencyINR(metadata.min)} to ${formatCurrencyINR(metadata.max)}`
        : null;
    case "lead_quality_score_generated":
      return metadata.score
        ? `Score ${metadata.score} · ${metadata.riskLevel ?? "Unrated"} risk`
        : null;
    case "suspicious_signal_detected":
      return Array.isArray(metadata.signals) ? metadata.signals.join(", ") : null;
    case "insurer_card_viewed":
    case "insurer_plan_selected":
      return metadata.insurer ?? null;
    case "addon_selected":
    case "addon_removed":
      return metadata.addonId ? ADDON_NAME_MAP[metadata.addonId] ?? metadata.addonId : null;
    case "final_premium_updated":
      return typeof metadata.addonCount === "number"
        ? `${metadata.addonCount} add-ons selected`
        : null;
    case "form_abandoned":
      return metadata.reason ? humanizeToken(metadata.reason) : null;
    default:
      if (metadata.value) {
        return String(metadata.value);
      }
      if (metadata.preset) {
        return String(metadata.preset);
      }
      return null;
  }
}

function TonePill({ children, tone = "default" }) {
  const toneMap = {
    default: "bg-cloud text-slate-600",
    success: "bg-mint-50 text-mint-600",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-rose-50 text-rose-700",
    info: "bg-brand-50 text-brand-700",
  };

  return (
    <span className={["inline-flex rounded-full px-3 py-1 text-xs font-semibold", toneMap[tone]].join(" ")}>
      {children}
    </span>
  );
}

function StatCard({ label, value, helper, tone = "default" }) {
  const valueToneMap = {
    default: "text-ink",
    success: "text-mint-600",
    warning: "text-amber-700",
    danger: "text-rose-700",
    info: "text-brand-700",
  };

  return (
    <div className="rounded-[24px] border border-white/80 bg-white/90 p-5 shadow-panel">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className={["mt-3 font-display text-3xl font-semibold", valueToneMap[tone]].join(" ")}>
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>
    </div>
  );
}

function Panel({ eyebrow, title, subtitle, action, children }) {
  return (
    <section className="app-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow ? <p className="soft-label">{eyebrow}</p> : null}
          {title ? <h2 className="mt-2 font-display text-2xl font-semibold text-ink">{title}</h2> : null}
          {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className={title || eyebrow || subtitle || action ? "mt-5" : ""}>{children}</div>
    </section>
  );
}

function FunnelRow({ step, totalSessions }) {
  const totalShare = totalSessions ? Math.round((step.count / totalSessions) * 100) : 0;

  return (
    <div className="rounded-[24px] border border-white/80 bg-white p-4 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-ink">{step.label}</p>
          <p className="mt-1 text-sm text-slate-500">
            {step.count} sessions · {totalShare}% of all sessions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {step.id !== "landing" ? (
            <TonePill tone={step.dropOff > 0 ? "warning" : "success"}>
              {step.conversionFromPrevious}% from previous
            </TonePill>
          ) : null}
          <TonePill tone={step.dropOff > 0 ? "warning" : "default"}>Drop-off {step.dropOff}</TonePill>
        </div>
      </div>
      <div className="mt-4 h-2 rounded-full bg-cloud">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-mint-400"
          style={{ width: `${Math.max(totalShare, step.count ? 8 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function InfoCard({ title, items }) {
  return (
    <div className="rounded-[24px] border border-white/80 bg-white p-4 shadow-panel">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <dl className="mt-4 space-y-3">
        {items.map(([label, value]) => (
          <div className="flex items-start justify-between gap-4 text-sm" key={label}>
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SignalList({ title, tone, items, emptyText }) {
  const headerToneMap = {
    positive: "text-mint-600",
    negative: "text-rose-700",
  };

  return (
    <div className="rounded-[24px] border border-white/80 bg-white p-4 shadow-panel">
      <p className={["text-sm font-semibold", headerToneMap[tone]].join(" ")}>{title}</p>
      {items?.length ? (
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          {items.map((item) => {
            const label = typeof item === "string" ? item : item.label;
            const penalty = typeof item === "object" && item.penalty ? ` (-${item.penalty})` : "";

            return (
              <li className="flex items-start gap-3" key={`${title}-${label}`}>
                <span
                  className={[
                    "mt-2 h-2 w-2 rounded-full",
                    tone === "positive" ? "bg-mint-400" : "bg-rose-400",
                  ].join(" ")}
                />
                <span>
                  {label}
                  {penalty}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">{emptyText}</p>
      )}
    </div>
  );
}

function EventItem({ event }) {
  const summary = getEventSummary(event);

  return (
    <div className="rounded-[24px] border border-white/80 bg-white p-4 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-ink">
            {EVENT_LABELS[event.eventName] ?? humanizeToken(event.eventName)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {humanizeScreen(event.stepName)} · {formatCompactTime(event.timeSinceStart)}
          </p>
        </div>
        <TonePill>{formatDateTime(event.timestamp)}</TonePill>
      </div>

      {summary ? <p className="mt-3 text-sm leading-6 text-slate-600">{summary}</p> : null}
    </div>
  );
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
          lead: relatedLead ?? null,
          score: relatedLead?.score ?? null,
          customer: relatedLead?.customer ?? session.data.customer,
          vehicle: relatedLead?.vehicle ?? session.data.vehicle,
          policy: relatedLead?.policy ?? session.data.policy,
          purchase: relatedLead?.purchase ?? session.data.purchase,
          exactQuotes: relatedLead?.exactQuotes ?? session.data.exactQuotes,
          selectedAddons: relatedLead?.selectedAddons ?? session.data.selectedAddons,
          selectedPlan: relatedLead?.selectedPlan ?? session.data.selectedPlan,
        };
      }),
    [dashboardSnapshot.leads, dashboardSnapshot.sessions],
  );

  const selectedRecord = records.find((record) => record.sessionId === selectedSessionId) ?? records[0];
  const selectedLead = selectedRecord?.lead ?? null;
  const selectedEvents = useMemo(
    () =>
      [...store.events]
        .filter((event) => event.sessionId === selectedRecord?.sessionId)
        .sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp)),
    [selectedRecord?.sessionId, store.events],
  );

  const totalSessions = dashboardSnapshot.totals.totalSessions;
  const estimateStep = dashboardSnapshot.funnel.find((step) => step.id === "estimate");
  const biggestDropOff = [...dashboardSnapshot.funnel]
    .filter((step) => step.id !== "landing")
    .sort((left, right) => right.dropOff - left.dropOff)[0];
  const reviewNeededCount = dashboardSnapshot.leads.filter((lead) =>
    ["Medium", "High"].includes(lead.score?.riskLevel),
  ).length;

  return (
    <div className="space-y-6">
      <Panel
        action={
          <button
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-mist bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-brand-300 hover:bg-brand-50"
            onClick={resetDemoData}
            type="button"
          >
            Reset seeded data
          </button>
        }
        subtitle="Review live sessions, lead quality, funnel friction, and event trails. New quote submissions from the customer journey appear here automatically."
        title="Quote funnel and lead quality"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            helper="Seeded sample activity plus every new browser session"
            label="Total sessions"
            value={dashboardSnapshot.totals.totalSessions}
          />
          <StatCard
            helper="Users who reached the estimate before sharing contact details"
            label="Estimate reached"
            tone="info"
            value={estimateStep?.count ?? 0}
          />
          <StatCard
            helper="Leads created after contact details were submitted"
            label="Lead submissions"
            tone="info"
            value={dashboardSnapshot.totals.totalLeads}
          />
          <StatCard
            helper="Sessions that finished the full purchase-detail flow"
            label="Applications completed"
            tone="success"
            value={dashboardSnapshot.totals.completedApplications}
          />
          <StatCard
            helper="Average time from journey start to quote range"
            label="Avg time-to-quote"
            value={formatCompactTime(dashboardSnapshot.totals.averageTimeToQuote)}
          />
          <StatCard
            helper="Medium and high risk leads that deserve extra review"
            label="Needs review"
            tone={reviewNeededCount ? "warning" : "success"}
            value={reviewNeededCount}
          />
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_380px]">
        <Panel
          eyebrow="Funnel"
          subtitle={
            biggestDropOff
              ? `Largest drop-off is after ${biggestDropOff.label.toLowerCase()}.`
              : "Track where users stop moving through the journey."
          }
          title="Conversion by stage"
        >
          <div className="space-y-3">
            {dashboardSnapshot.funnel.map((step) => (
              <FunnelRow key={step.id} step={step} totalSessions={totalSessions} />
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel eyebrow="Risk mix" title="Lead quality distribution">
            <div className="space-y-3">
              {Object.entries(dashboardSnapshot.riskDistribution).map(([riskLevel, count]) => (
                <div
                  className="flex items-center justify-between rounded-[22px] bg-cloud p-4"
                  key={riskLevel}
                >
                  <span className="font-semibold text-ink">{riskLevel}</span>
                  <TonePill tone={getRiskTone(riskLevel)}>{count} leads</TonePill>
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Timing rollup" title="Average step times">
            <div className="space-y-4">
              {Object.entries(dashboardSnapshot.timingRollup.averages).map(([stageId, duration]) => (
                <div key={stageId}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-ink">{getStageLabel(stageId)}</span>
                    <span className="text-slate-500">{formatCompactTime(duration)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-cloud">
                    <div
                      className="h-2 rounded-full bg-brand-500"
                      style={{ width: `${Math.max(duration * 2, duration ? 10 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoCard
                items={[["Average", formatCompactTime(dashboardSnapshot.timingRollup.fastestStep?.duration)]]}
                title={`Fastest step: ${dashboardSnapshot.timingRollup.fastestStep?.label ?? "Not available"}`}
              />
              <InfoCard
                items={[["Average", formatCompactTime(dashboardSnapshot.timingRollup.slowestStep?.duration)]]}
                title={`Slowest step: ${dashboardSnapshot.timingRollup.slowestStep?.label ?? "Not available"}`}
              />
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Panel
          eyebrow="Lead queue"
          subtitle="Select any session to inspect timings, quality, and event flow."
          title="Sessions and submissions"
        >
          <div className="space-y-3">
            {records.map((record) => (
              <button
                className={[
                  "w-full rounded-[24px] border p-4 text-left transition",
                  selectedRecord?.sessionId === record.sessionId
                    ? "border-brand-400 bg-brand-50 shadow-glow"
                    : "border-mist bg-white hover:border-brand-300 hover:bg-brand-50",
                ].join(" ")}
                key={record.sessionId}
                onClick={() => setSelectedSessionId(record.sessionId)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      {record.registrationNumber || "New browsing session"}
                    </p>
                    <p className="mt-1 font-semibold text-ink">
                      {record.vehicle?.make
                        ? `${record.vehicle.make} ${record.vehicle.model}`
                        : "Vehicle not confirmed yet"}
                    </p>
                  </div>
                  <TonePill tone={getStatusTone(record)}>
                    {humanizeToken(record.status)}
                  </TonePill>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Current stage</p>
                    <p className="mt-1 font-semibold text-ink">
                      {record.currentStage ? getStageLabel(record.currentStage) : "Not started"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Time-to-quote</p>
                    <p className="mt-1 font-semibold text-ink">
                      {formatCompactTime(record.metrics?.timeToQuote)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {record.score ? (
                    <TonePill tone={getRiskTone(record.score.riskLevel)}>
                      Score {record.score.score} · {record.score.riskLevel}
                    </TonePill>
                  ) : null}
                  <TonePill>{formatDateTime(record.lastActivityAt)}</TonePill>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        {selectedRecord ? (
          <div className="space-y-6">
            <Panel
              action={
                <div className="flex flex-wrap gap-2">
                  <TonePill tone={getStatusTone(selectedRecord)}>
                    {humanizeToken(selectedRecord.status)}
                  </TonePill>
                  {selectedRecord.score ? (
                    <TonePill tone={getRiskTone(selectedRecord.score.riskLevel)}>
                      {selectedRecord.score.riskLevel} risk
                    </TonePill>
                  ) : null}
                </div>
              }
              eyebrow="Selected record"
              subtitle={`Last activity ${formatDateTime(selectedRecord.lastActivityAt)}`}
              title={selectedRecord.registrationNumber || "Live browsing session"}
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  helper="Latest stage reached in this session"
                  label="Current stage"
                  value={
                    selectedRecord.currentStage
                      ? getStageLabel(selectedRecord.currentStage)
                      : "Not started"
                  }
                />
                <StatCard
                  helper="From first interaction to estimate range"
                  label="Time-to-quote"
                  value={formatCompactTime(selectedRecord.metrics?.timeToQuote)}
                />
                <StatCard
                  helper="From first interaction to contact submission"
                  label="Time-to-contact"
                  value={formatCompactTime(selectedRecord.metrics?.timeToContactSubmit)}
                />
                <StatCard
                  helper="From first interaction to final completion"
                  label="Total completion time"
                  value={formatCompactTime(selectedRecord.metrics?.totalCompletionTime)}
                />
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <InfoCard
                  items={[
                    [
                      "Fastest step",
                      selectedRecord.metrics?.fastestStep?.label ?? "Not available",
                    ],
                    [
                      "User hesitated most",
                      selectedRecord.metrics?.hesitationStep?.label ?? "Not available",
                    ],
                    ["Selected plan", selectedRecord.selectedPlan || "Not selected"],
                    ["Lead created", selectedLead ? "Yes" : "No"],
                  ]}
                  title="Journey summary"
                />
                <InfoCard
                  items={[
                    ["Validation errors", selectedRecord.analytics?.validationErrors ?? 0],
                    ["Paste count", selectedRecord.analytics?.pasteCount ?? 0],
                    ["Vehicle edits", selectedRecord.analytics?.vehicleEditCount ?? 0],
                    [
                      "Uncertain answers",
                      formatList(
                        (selectedRecord.analytics?.uncertainFields ?? []).map(
                          (field) => UNCERTAIN_FIELD_LABELS[field] ?? humanizeToken(field),
                        ),
                      ),
                    ],
                  ]}
                  title="Session behavior"
                />
              </div>
            </Panel>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <Panel eyebrow="Lead quality" title="Scoring breakdown">
                {selectedLead?.score ? (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-display text-5xl font-semibold text-ink">
                          {selectedLead.score.score}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          Recommended action: {selectedLead.score.recommendedAction}
                        </p>
                      </div>
                      <TonePill tone={getRiskTone(selectedLead.score.riskLevel)}>
                        {selectedLead.score.riskLevel} risk
                      </TonePill>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <SignalList
                        emptyText="No strong positive signals recorded yet."
                        items={selectedLead.score.positiveSignals}
                        title="Positive signals"
                        tone="positive"
                      />
                      <SignalList
                        emptyText="No negative signals recorded."
                        items={selectedLead.score.negativeSignals}
                        title="Negative signals"
                        tone="negative"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-slate-500">
                    This session has not created a lead yet, so there is no lead quality score to review.
                  </p>
                )}
              </Panel>

              <Panel eyebrow="Submission details" title="Captured data">
                <div className="grid gap-4 lg:grid-cols-2">
                  <InfoCard
                    items={[
                      [
                        "Vehicle",
                        selectedRecord.vehicle?.make
                          ? `${selectedRecord.vehicle.make} ${selectedRecord.vehicle.model} ${selectedRecord.vehicle.variant}`
                          : "Not provided",
                      ],
                      ["Fuel", selectedRecord.vehicle?.fuelType || "Not provided"],
                      ["Year", selectedRecord.vehicle?.manufactureYear || "Not provided"],
                      ["City", selectedRecord.vehicle?.cityOfRegistration || "Not provided"],
                      ["RTO", selectedRecord.vehicle?.rtoCode || "Not provided"],
                    ]}
                    title="Vehicle"
                  />
                  <InfoCard
                    items={[
                      [
                        "Expiry",
                        selectedRecord.policy?.policyExpiryPreset === "Not sure"
                          ? "Not sure"
                          : formatDateDisplay(selectedRecord.policy?.previousPolicyExpiryDate),
                      ],
                      ["NCB", selectedRecord.policy?.ncbPercentage || "Not selected"],
                      [
                        "Claims",
                        selectedRecord.policy?.claimsInLast3Years || "Not selected",
                      ],
                      ["Cover preference", selectedRecord.policy?.idvPreference || "Not selected"],
                    ]}
                    title="Policy"
                  />
                  <InfoCard
                    items={[
                      ["Name", selectedRecord.customer?.fullName || "Not submitted"],
                      ["Mobile", selectedRecord.customer?.mobileNumber || "Not submitted"],
                      ["Email", selectedRecord.customer?.emailAddress || "Not submitted"],
                      ["Lead status", selectedLead ? humanizeToken(selectedLead.status) : "No lead"],
                    ]}
                    title="Customer"
                  />
                  <InfoCard
                    items={[
                      ["Date of birth", formatDateDisplay(selectedRecord.purchase?.dateOfBirth)],
                      [
                        "Previous insurer",
                        selectedRecord.purchase?.previousInsurerName || "Not provided",
                      ],
                      ["Nominee", selectedRecord.purchase?.nomineeName || "Not provided"],
                      [
                        "Relationship",
                        selectedRecord.purchase?.nomineeRelationship || "Not provided",
                      ],
                    ]}
                    title="Purchase"
                  />
                </div>

                {selectedRecord.exactQuotes?.length ? (
                  <div className="mt-5 grid gap-3 lg:grid-cols-3">
                    {selectedRecord.exactQuotes.map((quote) => (
                      <div
                        className="rounded-[22px] border border-white/80 bg-white p-4 shadow-panel"
                        key={quote.insurer}
                      >
                        <p className="font-semibold text-ink">{quote.insurer}</p>
                        <p className="mt-2 text-sm text-slate-500">
                          Premium {formatCurrencyINR(quote.finalPremium ?? quote.premium)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          IDV {quote.idv ? formatCurrencyINR(quote.idv) : "Not available"}
                        </p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                          {quote.tag}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {selectedRecord.selectedAddons?.length ? (
                  <div className="mt-5 rounded-[22px] bg-cloud p-4 text-sm text-slate-600">
                    <p className="font-semibold text-ink">Selected add-ons</p>
                    <p className="mt-2">
                      {selectedRecord.selectedAddons
                        .map((addonId) => ADDON_NAME_MAP[addonId] ?? addonId)
                        .join(", ")}
                    </p>
                  </div>
                ) : null}
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
              <Panel eyebrow="Step timings" title="Time spent in each stage">
                <div className="space-y-3">
                  {Object.entries(selectedRecord.timing?.stepDurations ?? {}).map(([stageId, duration]) => (
                    <div className="rounded-[22px] bg-cloud p-4" key={stageId}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-ink">{getStageLabel(stageId)}</p>
                        <p className="text-sm text-slate-500">{formatCompactTime(duration)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel
                eyebrow="Recent events"
                subtitle="Chronological journey trail for the selected session."
                title={`Event timeline (${selectedEvents.length})`}
              >
                {selectedEvents.length ? (
                  <div className="space-y-3">
                    {selectedEvents.map((event) => (
                      <EventItem event={event} key={event.eventId} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No events tracked for this session yet.</p>
                )}
              </Panel>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
