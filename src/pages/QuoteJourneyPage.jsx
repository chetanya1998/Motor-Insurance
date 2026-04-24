import { Link } from "react-router-dom";
import {
  ADDON_CATALOG,
  APP_COPY,
  CITY_OPTIONS,
  FUEL_OPTIONS,
  JOURNEY_STAGES,
  MANUFACTURE_YEARS,
  NCB_OPTIONS,
  PREVIOUS_INSURERS,
  VEHICLE_CATALOG,
  NOMINEE_RELATIONSHIPS,
} from "../data/options";
import useQuoteJourney from "../hooks/useQuoteJourney";
import { formatCurrencyINR } from "../utils/formatters";

const primaryButtonClassName =
  "inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-ink px-5 py-3 font-semibold text-white shadow-glow transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClassName =
  "inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-mist bg-white px-5 py-3 font-semibold text-ink transition hover:border-brand-300 hover:bg-brand-50";

const stageValueCopy = {
  vehicle: {
    nextValue: "Next: we prefill your car details",
    timeLeft: "Usually less than 45 seconds left",
  },
  policy: {
    nextValue: "Next: your estimated price range",
    timeLeft: "Usually less than 30 seconds left",
  },
  estimate: {
    nextValue: "Next: exact insurer prices",
    timeLeft: "You have already unlocked an estimate",
  },
  contact: {
    nextValue: "Next: exact prices and discounts",
    timeLeft: "Usually less than 20 seconds left",
  },
  quotes: {
    nextValue: "Next: complete purchase-only details",
    timeLeft: "Only final policy details remain",
  },
  purchase: {
    nextValue: "Next: application complete",
    timeLeft: "Final step",
  },
};

function ProgressHeader({ currentStage }) {
  if (!currentStage) {
    return null;
  }

  const stageIndex = JOURNEY_STAGES.findIndex((stage) => stage.id === currentStage);
  const stageMeta = JOURNEY_STAGES[stageIndex];

  return (
    <section className="app-card animate-rise !p-4 sm:!p-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="soft-label">Step {stageIndex + 1} of {JOURNEY_STAGES.length}</p>
            <h2 className="mt-1 font-display text-xl font-semibold text-ink">
              {stageMeta.label}
            </h2>
          </div>
          <div className="rounded-full bg-brand-50 px-3 py-2 text-right text-xs font-semibold text-brand-700">
            <p>{stageValueCopy[currentStage].timeLeft}</p>
            <p className="text-[11px] text-slate-500">{stageValueCopy[currentStage].nextValue}</p>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {JOURNEY_STAGES.map((stage, index) => {
            const active = index <= stageIndex;

            return (
              <div
                key={stage.id}
                className={[
                  "h-2 rounded-full transition",
                  active ? "bg-gradient-to-r from-brand-500 to-mint-400" : "bg-mist",
                ].join(" ")}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StickyActionBar({
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  disabled = false,
  loading = false,
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/80 bg-white/90 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 shadow-[0_-12px_30px_rgba(18,48,58,0.08)] backdrop-blur-lg lg:static lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0 lg:shadow-none">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 lg:flex-row">
        {secondaryLabel ? (
          <button className={secondaryButtonClassName} onClick={onSecondary} type="button">
            {secondaryLabel}
          </button>
        ) : null}
        <button
          className={primaryButtonClassName}
          disabled={disabled || loading}
          onClick={onPrimary}
          type="button"
        >
          {loading ? "Please wait..." : primaryLabel}
        </button>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-5">
      {eyebrow ? <p className="soft-label">{eyebrow}</p> : null}
      <h1 className="mt-1 font-display text-[1.9rem] font-semibold leading-tight text-balance text-ink">
        {title}
      </h1>
      {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

function Field({ label, helper, error, children }) {
  return (
    <label className="block">
      <div className="mb-2">
        <p className="text-sm font-semibold text-ink">{label}</p>
        {helper ? <p className="mt-1 text-sm text-slate-500">{helper}</p> : null}
      </div>
      {children}
      {error ? <p className="mt-2 text-sm font-semibold text-rose-700">{error}</p> : null}
    </label>
  );
}

function TextInput(props) {
  const { error, ...rest } = props;

  return (
    <input
      className={[
        "min-h-[54px] w-full rounded-2xl border bg-white px-4 py-3 text-base text-ink outline-none transition placeholder:text-slate-400",
        error
          ? "border-rose-300 focus:border-rose-500"
          : "border-mist focus:border-brand-400",
      ].join(" ")}
      {...rest}
    />
  );
}

function SelectInput(props) {
  const { children, error, ...rest } = props;

  return (
    <select
      className={[
        "min-h-[54px] w-full rounded-2xl border bg-white px-4 py-3 text-base text-ink outline-none transition",
        error
          ? "border-rose-300 focus:border-rose-500"
          : "border-mist focus:border-brand-400",
      ].join(" ")}
      {...rest}
    >
      {children}
    </select>
  );
}

function ChipGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => {
        const optionValue = typeof option === "string" ? option : option.label;
        const optionLabel = typeof option === "string" ? option : option.label;

        return (
          <button
            key={optionValue}
            className={[
              "chip-option",
              value === optionValue ? "chip-option-active" : "",
            ].join(" ")}
            onClick={() => onChange(optionValue)}
            type="button"
          >
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}

function SummaryRail({ screen, vehicle, policy, quoteEstimate, exactQuotes, selectedPlan }) {
  const activeQuote = exactQuotes.find((quote) => quote.insurer === selectedPlan);

  return (
    <aside className="hidden lg:flex lg:flex-col lg:gap-5">
      <div className="app-card sticky top-24">
        <p className="soft-label">Why This Journey Works</p>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <li>Quote-critical fields come first, so users see value before contact friction.</li>
          <li>Vehicle lookup prefill reduces typing and speeds time-to-quote.</li>
          <li>Lead scoring and event tracking run quietly in the background.</li>
        </ul>

        <div className="mt-6 rounded-[24px] bg-cloud p-4">
          <p className="text-sm font-semibold text-ink">Live journey snapshot</p>
          <div className="mt-3 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span>Current screen</span>
              <span className="rounded-full bg-white px-3 py-1 font-semibold text-ink capitalize">
                {screen}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Vehicle</span>
              <span className="text-right font-semibold text-ink">
                {vehicle?.make ? `${vehicle.make} ${vehicle.model}` : "Waiting for lookup"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Cover preference</span>
              <span className="text-right font-semibold text-ink">
                {policy?.idvPreference || "Not selected"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Estimate</span>
              <span className="text-right font-semibold text-ink">
                {quoteEstimate?.quoteRange
                  ? `${formatCurrencyINR(quoteEstimate.quoteRange.min)} - ${formatCurrencyINR(
                      quoteEstimate.quoteRange.max,
                    )}`
                  : "Not generated"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Selected plan</span>
              <span className="text-right font-semibold text-ink">
                {activeQuote ? `${activeQuote.insurer} • ${formatCurrencyINR(activeQuote.finalPremium)}` : "None yet"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function EstimatePlanCard({ title, premium, description, emphasisClassName }) {
  return (
    <div className="rounded-[24px] border border-white/80 bg-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-ink">
            {formatCurrencyINR(premium)}/year
          </p>
        </div>
        <span className={["rounded-full px-3 py-1 text-xs font-semibold", emphasisClassName].join(" ")}>
          Estimate
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-600">{description}</p>
    </div>
  );
}

function QuoteCard({ quote, selected, onSelect }) {
  return (
    <div
      className={[
        "rounded-[26px] border bg-white p-5 shadow-panel transition",
        selected ? "border-brand-400 shadow-glow" : "border-white/80",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{quote.insurer}</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-ink">
            {formatCurrencyINR(quote.finalPremium ?? quote.premium)}/year
          </h3>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          {quote.tag}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
        <div className="rounded-2xl bg-cloud p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">IDV</p>
          <p className="mt-1 font-semibold text-ink">{formatCurrencyINR(quote.idv)}</p>
        </div>
        <div className="rounded-2xl bg-cloud p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Claim support
          </p>
          <p className="mt-1 font-semibold text-ink">{quote.claimSupport}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-ink">Included add-ons</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {quote.addons.map((addon) => (
            <span
              key={addon}
              className="rounded-full border border-mist bg-white px-3 py-1 text-xs font-semibold text-slate-600"
            >
              {addon}
            </span>
          ))}
        </div>
      </div>

      <button
        className="mt-5 inline-flex min-h-[50px] w-full items-center justify-center rounded-full bg-ink px-4 py-3 font-semibold text-white transition hover:bg-brand-700"
        onClick={onSelect}
        type="button"
      >
        {selected ? "Selected plan" : "Select plan"}
      </button>
    </div>
  );
}

function CompletionCard({ selectedPlan, quoteEstimate }) {
  return (
    <div className="app-card animate-rise">
      <SectionHeader
        eyebrow="Application complete"
        title="Your policy application is ready for insurer handoff"
        subtitle="Purchase-only details were collected at the end so quote discovery stayed fast and low-friction."
      />

      <div className="grid gap-4 rounded-[28px] bg-cloud p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">Chosen plan</p>
            <p className="mt-1 font-display text-xl font-semibold text-ink">
              {selectedPlan || "Plan selected"}
            </p>
          </div>
          <span className="rounded-full bg-mint-100 px-3 py-2 text-xs font-semibold text-mint-600">
            Ready for verification
          </span>
        </div>
        {quoteEstimate?.quoteRange ? (
          <div className="rounded-[24px] bg-white p-4">
            <p className="text-sm text-slate-500">Initial estimate shown before personal details</p>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">
              {formatCurrencyINR(quoteEstimate.quoteRange.min)} -{" "}
              {formatCurrencyINR(quoteEstimate.quoteRange.max)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link className={primaryButtonClassName} to="/admin">
          View admin dashboard
        </Link>
        <Link className={secondaryButtonClassName} reloadDocument to="/">
          Start another quote
        </Link>
      </div>
    </div>
  );
}

export default function QuoteJourneyPage() {
  const journey = useQuoteJourney();
  const models = VEHICLE_CATALOG[journey.vehicle?.make] ?? [];
  const selectedModelDefinition = models.find(
    (item) => item.model === journey.vehicle?.model,
  );

  const renderLanding = () => (
    <div className="app-card animate-rise">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="soft-label">Motor renewal in under 1 minute</p>
          <h1 className="mt-3 font-display text-[2.3rem] font-semibold leading-tight text-balance text-ink sm:text-[2.8rem]">
            {APP_COPY.title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            {APP_COPY.subtitle}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {APP_COPY.trustSignals.map((signal) => (
              <span
                key={signal}
                className="rounded-full border border-mint-200 bg-mint-50 px-4 py-2 text-sm font-semibold text-mint-600"
              >
                {signal}
              </span>
            ))}
          </div>

          <div className="mt-8 rounded-[28px] border border-brand-100 bg-brand-50/80 p-5">
            <p className="text-sm font-semibold text-brand-700">Why this feels faster</p>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
              <li>We ask for your vehicle number first and prefill whatever we can.</li>
              <li>You see an estimate before sharing mobile, email, DOB, or nominee details.</li>
              <li>Only pricing-critical questions appear before the quote range.</li>
            </ul>
          </div>
        </div>

        <div className="rounded-[32px] bg-[linear-gradient(145deg,_rgba(37,136,164,0.12),_rgba(63,190,146,0.14))] p-5">
          <div className="rounded-[28px] bg-white p-5 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">Expected output</p>
                <p className="mt-2 font-display text-3xl font-semibold text-ink">
                  Estimate in under 60 sec
                </p>
              </div>
              <div className="rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
                Mobile-first
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-[24px] bg-cloud p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Step 1
                </p>
                <p className="mt-2 text-base font-semibold text-ink">Vehicle lookup from registration number</p>
              </div>
              <div className="rounded-[24px] bg-cloud p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Step 2
                </p>
                <p className="mt-2 text-base font-semibold text-ink">Policy basics to calculate your estimate</p>
              </div>
              <div className="rounded-[24px] bg-cloud p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Step 3
                </p>
                <p className="mt-2 text-base font-semibold text-ink">Exact insurer quotes only after value is shown</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 hidden lg:block">
        <button className={primaryButtonClassName} onClick={() => journey.beginJourney("cta")} type="button">
          {APP_COPY.primaryCta}
        </button>
      </div>
      <StickyActionBar
        primaryLabel={APP_COPY.primaryCta}
        onPrimary={() => journey.beginJourney("cta")}
      />
    </div>
  );

  const renderRegistration = () => (
    <div className="app-card animate-rise pb-28 lg:pb-6">
      <SectionHeader
        eyebrow="Vehicle lookup"
        title="Enter your vehicle number"
        subtitle="We will use this to fetch your vehicle details and calculate a faster estimate."
      />

      <Field error={journey.registrationError} label="Vehicle registration number">
        <TextInput
          error={journey.registrationError}
          onChange={(event) => journey.setRegistrationNumber(event.target.value)}
          onFocus={journey.handleRegistrationFocus}
          placeholder="DL09CA1234"
          value={journey.registrationNumber}
        />
      </Field>

      <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-500">
        <span className="rounded-full bg-cloud px-3 py-2">DL 09 CA 1234</span>
        <span className="rounded-full bg-cloud px-3 py-2">MH12AB1234</span>
        <span className="rounded-full bg-cloud px-3 py-2">KA03MN4567</span>
      </div>

      {journey.loadingState.lookup ? (
        <div className="mt-6 rounded-[24px] bg-cloud p-5 text-sm font-semibold text-brand-700 animate-pulse-soft">
          Fetching vehicle details...
        </div>
      ) : null}

      {journey.lookupError ? (
        <div className="mt-6 rounded-[24px] border border-amber-100 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-600">{journey.lookupError}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button className={secondaryButtonClassName} onClick={journey.submitRegistration} type="button">
              Try again
            </button>
            <button className={primaryButtonClassName} onClick={journey.handleManualEntry} type="button">
              Enter manually
            </button>
          </div>
        </div>
      ) : null}

      <StickyActionBar
        disabled={journey.loadingState.lookup}
        loading={journey.loadingState.lookup}
        onPrimary={journey.submitRegistration}
        primaryLabel="Fetch vehicle details"
      />
    </div>
  );

  const renderVehicleConfirmation = () => (
    <div className="app-card animate-rise pb-28 lg:pb-6">
      <SectionHeader
        eyebrow="Vehicle confirmation"
        title="Confirm your vehicle details"
        subtitle="We use these details to make your estimate more accurate."
      />

      {!journey.isEditingVehicle ? (
        <div className="rounded-[28px] bg-cloud p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Vehicle</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
                {journey.vehicle.make} {journey.vehicle.model} {journey.vehicle.variant}
              </h2>
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
              Prefilled
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fuel</p>
              <p className="mt-1 font-semibold text-ink">{journey.vehicle.fuelType}</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Year</p>
              <p className="mt-1 font-semibold text-ink">{journey.vehicle.manufactureYear}</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Registration city
              </p>
              <p className="mt-1 font-semibold text-ink">{journey.vehicle.cityOfRegistration}</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">RTO</p>
              <p className="mt-1 font-semibold text-ink">{journey.vehicle.rtoCode}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <Field error={journey.vehicleErrors.make} label="Vehicle make">
            <SelectInput
              error={journey.vehicleErrors.make}
              onChange={(event) => journey.handleVehicleFieldChange("make", event.target.value)}
              value={journey.vehicle.make ?? ""}
            >
              <option value="">Select make</option>
              {Object.keys(VEHICLE_CATALOG).map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field error={journey.vehicleErrors.model} label="Vehicle model">
            <SelectInput
              error={journey.vehicleErrors.model}
              onChange={(event) => journey.handleVehicleFieldChange("model", event.target.value)}
              value={journey.vehicle.model ?? ""}
            >
              <option value="">Select model</option>
              {models.map((item) => (
                <option key={item.model} value={item.model}>
                  {item.model}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field error={journey.vehicleErrors.variant} label="Vehicle variant">
            <SelectInput
              error={journey.vehicleErrors.variant}
              onChange={(event) => journey.handleVehicleFieldChange("variant", event.target.value)}
              value={journey.vehicle.variant ?? ""}
            >
              <option value="">Select variant</option>
              {(selectedModelDefinition?.variants ?? []).map((variant) => (
                <option key={variant} value={variant}>
                  {variant}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field error={journey.vehicleErrors.manufactureYear} label="Manufacture year">
            <SelectInput
              error={journey.vehicleErrors.manufactureYear}
              onChange={(event) =>
                journey.handleVehicleFieldChange("manufactureYear", Number(event.target.value))
              }
              value={journey.vehicle.manufactureYear ?? ""}
            >
              <option value="">Select year</option>
              {MANUFACTURE_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field error={journey.vehicleErrors.fuelType} label="Fuel type">
            <SelectInput
              error={journey.vehicleErrors.fuelType}
              onChange={(event) => journey.handleVehicleFieldChange("fuelType", event.target.value)}
              value={journey.vehicle.fuelType ?? ""}
            >
              <option value="">Select fuel type</option>
              {(selectedModelDefinition?.fuelTypes ?? FUEL_OPTIONS).map((fuelType) => (
                <option key={fuelType} value={fuelType}>
                  {fuelType}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field error={journey.vehicleErrors.cityOfRegistration} label="City of registration">
            <SelectInput
              error={journey.vehicleErrors.cityOfRegistration}
              onChange={(event) =>
                journey.handleVehicleFieldChange("cityOfRegistration", event.target.value)
              }
              value={journey.vehicle.cityOfRegistration ?? ""}
            >
              <option value="">Select city</option>
              {CITY_OPTIONS.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      )}

      <StickyActionBar
        onPrimary={journey.confirmVehicleDetails}
        onSecondary={!journey.isEditingVehicle ? journey.handleVehicleEdit : undefined}
        primaryLabel={journey.isEditingVehicle ? "Continue" : "Looks correct"}
        secondaryLabel={!journey.isEditingVehicle ? "Edit details" : undefined}
      />
    </div>
  );

  const renderPolicy = () => (
    <div className="app-card animate-rise pb-28 lg:pb-6">
      <SectionHeader
        eyebrow="Current policy"
        title="Tell us about your current policy"
        subtitle="This helps us calculate a better renewal estimate."
      />

      <div className="space-y-6">
        <Field
          label="When does your current policy expire?"
          helper="If you are not sure, you can still continue."
        >
          <TextInput
            onChange={(event) => {
              journey.updatePolicyField("previousPolicyExpiryDate", event.target.value);
              journey.trackEvent("policy_expiry_selected", "policy", {
                value: event.target.value,
                preset: "manual_date",
              });
            }}
            type="date"
            value={journey.policy.previousPolicyExpiryDate ?? ""}
          />
          <div className="mt-3">
            <ChipGroup
              onChange={journey.selectPolicyExpiryPreset}
              options={journey.helpers.policyExpiryPresets}
              value={journey.policy.policyExpiryPreset}
            />
          </div>
        </Field>

        <Field
          error={journey.policyErrors.ncbPercentage}
          helper="Discount you get if you did not claim insurance last year."
          label="No Claim Bonus"
        >
          <ChipGroup
            onChange={(value) => {
              journey.updatePolicyField("ncbPercentage", value);
              journey.trackEvent?.("ncb_selected", "policy", { value });
            }}
            options={NCB_OPTIONS}
            value={journey.policy.ncbPercentage}
          />
        </Field>

        <Field
          error={journey.policyErrors.claimsInLast3Years}
          helper="Claims increase premium because claim frequency changes risk."
          label="Claims in last 3 years"
        >
          <ChipGroup
            onChange={(value) => {
              journey.updatePolicyField("claimsInLast3Years", value);
              journey.trackEvent?.("claims_selected", "policy", { value });
            }}
            options={journey.helpers.claimsOptions}
            value={journey.policy.claimsInLast3Years}
          />
        </Field>

        <Field
          error={journey.policyErrors.idvPreference}
          helper="Your vehicle value affects your insurance price and claim amount."
          label="Vehicle value preference"
        >
          <div className="grid gap-3">
            {journey.helpers.idvOptions.map((option) => {
              const active = journey.policy.idvPreference === option.label;

              return (
                <button
                  key={option.label}
                  className={[
                    "rounded-[24px] border p-4 text-left transition",
                    active
                      ? "border-brand-500 bg-brand-500 text-white shadow-glow"
                      : "border-mist bg-white hover:border-brand-300 hover:bg-brand-50",
                  ].join(" ")}
                  onClick={() => {
                    journey.updatePolicyField("idvPreference", option.label);
                    journey.trackEvent?.("idv_preference_selected", "policy", {
                      value: option.label,
                    });
                  }}
                  type="button"
                >
                  <p className="font-semibold">{option.label}</p>
                  <p className={["mt-2 text-sm", active ? "text-white/85" : "text-slate-600"].join(" ")}>
                    {option.helper}
                  </p>
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      <StickyActionBar
        disabled={journey.loadingState.estimate}
        loading={journey.loadingState.estimate}
        onPrimary={journey.submitPolicyDetails}
        primaryLabel="Show my estimate"
      />
    </div>
  );

  const renderEstimate = () => (
    <div className="space-y-5 pb-28 lg:pb-0">
      <div className="app-card animate-rise">
        <SectionHeader
          eyebrow="Estimated quote range"
          title="Your estimated quote range"
          subtitle="Based on your vehicle, registration city, policy expiry, NCB, claims history, and cover preference."
        />

        <div className="rounded-[32px] bg-[linear-gradient(145deg,_rgba(37,136,164,0.12),_rgba(63,190,146,0.2))] p-5">
          <div className="rounded-[28px] bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">Estimated annual premium</p>
                <h2 className="mt-2 font-display text-[2.5rem] font-semibold leading-none text-ink sm:text-[3rem]">
                  {formatCurrencyINR(journey.quoteEstimate.quoteRange.min)} -{" "}
                  {formatCurrencyINR(journey.quoteEstimate.quoteRange.max)}
                </h2>
              </div>
              <span className="rounded-full bg-mint-50 px-4 py-2 text-sm font-semibold text-mint-600">
                {journey.quoteEstimate.confidence} confidence
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <EstimatePlanCard
            description="Lowest estimated premium"
            emphasisClassName="bg-brand-50 text-brand-700"
            premium={journey.quoteEstimate.quoteRange.min}
            title="Budget plan"
          />
          <EstimatePlanCard
            description="Good price + useful coverage"
            emphasisClassName="bg-mint-50 text-mint-600"
            premium={Math.round(
              (journey.quoteEstimate.quoteRange.min + journey.quoteEstimate.quoteRange.max) / 2,
            )}
            title="Balanced plan"
          />
          <EstimatePlanCard
            description="Higher cover with add-ons"
            emphasisClassName="bg-amber-50 text-amber-600"
            premium={journey.quoteEstimate.quoteRange.max}
            title="Max cover"
          />
        </div>
      </div>

      <div className="app-card">
        <p className="soft-label">Breakdown</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[24px] bg-cloud p-4 text-sm text-slate-600">
            <p className="font-semibold text-ink">
              {journey.vehicle.make} {journey.vehicle.model} {journey.vehicle.variant}
            </p>
            <p className="mt-2">Fuel: {journey.vehicle.fuelType}</p>
            <p>Year: {journey.vehicle.manufactureYear}</p>
            <p>City: {journey.vehicle.cityOfRegistration}</p>
          </div>
          <div className="rounded-[24px] bg-cloud p-4 text-sm text-slate-600">
            <p>NCB: {journey.policy.ncbPercentage}</p>
            <p>Claims: {journey.policy.claimsInLast3Years}</p>
            <p>Cover: {journey.policy.idvPreference}</p>
            <p className="mt-2 font-semibold text-ink">
              Base premium: {formatCurrencyINR(journey.quoteEstimate.breakdown.basePremium)}
            </p>
          </div>
        </div>
      </div>

      <StickyActionBar
        onPrimary={journey.unlockExactQuotes}
        onSecondary={journey.editQuoteInputs}
        primaryLabel="Unlock exact quotes"
        secondaryLabel="Edit details"
      />
    </div>
  );

  const renderPersonal = () => (
    <div className="app-card animate-rise pb-28 lg:pb-6">
      <SectionHeader
        eyebrow="Unlock exact insurer prices"
        title="Unlock exact insurer prices"
        subtitle="Share your details to see exact quotes and available discounts."
      />

      <div className="space-y-5">
        <Field error={journey.contactErrors.fullName} label="Full name">
          <TextInput
            error={journey.contactErrors.fullName}
            onChange={(event) => journey.handleCustomerFieldChange("fullName", event.target.value)}
            onPaste={journey.recordPaste}
            placeholder="Rahul Sharma"
            value={journey.customer.fullName ?? ""}
          />
        </Field>

        <Field error={journey.contactErrors.mobileNumber} label="Mobile number">
          <TextInput
            error={journey.contactErrors.mobileNumber}
            inputMode="numeric"
            maxLength={10}
            onChange={(event) =>
              journey.handleCustomerFieldChange(
                "mobileNumber",
                event.target.value.replace(/[^\d]/g, ""),
              )
            }
            onPaste={journey.recordPaste}
            placeholder="9876543210"
            value={journey.customer.mobileNumber ?? ""}
          />
        </Field>

        <Field error={journey.contactErrors.emailAddress} label="Email address">
          <TextInput
            error={journey.contactErrors.emailAddress}
            onChange={(event) => journey.handleCustomerFieldChange("emailAddress", event.target.value)}
            onPaste={journey.recordPaste}
            placeholder="rahul@gmail.com"
            type="email"
            value={journey.customer.emailAddress ?? ""}
          />
        </Field>

        <div className="sr-only">
          <TextInput
            aria-hidden="true"
            onChange={(event) => journey.handleCustomerFieldChange("honeypot", event.target.value)}
            tabIndex={-1}
            value={journey.customer.honeypot ?? ""}
          />
        </div>

        <div className="rounded-[24px] bg-cloud p-4 text-sm text-slate-600">
          We use your details only to show insurance quotes and help with your policy.
        </div>
      </div>

      <StickyActionBar
        disabled={journey.loadingState.exactQuotes}
        loading={journey.loadingState.exactQuotes}
        onPrimary={journey.submitPersonalDetails}
        primaryLabel="Show exact quotes"
      />
    </div>
  );

  const renderExactQuotes = () => (
    <div className="space-y-5">
      <div className="app-card animate-rise">
        <SectionHeader
          eyebrow="Exact quotes"
          title="Exact quotes available for you"
          subtitle="Compare insurer prices, claim support, and add-ons before you continue."
        />

        <div className="grid gap-4 xl:grid-cols-3">
          {journey.exactQuotes.map((quote) => (
            <QuoteCard
              key={quote.insurer}
              onSelect={() => journey.selectPlan(quote.insurer)}
              quote={quote}
              selected={journey.selectedPlan === quote.insurer}
            />
          ))}
        </div>
      </div>

      <div className="app-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="soft-label">Recommended add-ons</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              Add protection only if it helps you
            </h2>
          </div>
          <div className="rounded-full bg-cloud px-4 py-2 text-sm font-semibold text-slate-600">
            Premium updates live
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {ADDON_CATALOG.map((addon) => {
            const selected = journey.selectedAddons.includes(addon.id);

            return (
              <button
                key={addon.id}
                className={[
                  "flex items-center justify-between gap-4 rounded-[24px] border p-4 text-left transition",
                  selected
                    ? "border-brand-500 bg-brand-50"
                    : "border-mist bg-white hover:border-brand-300 hover:bg-brand-50",
                ].join(" ")}
                onClick={() => journey.toggleAddon(addon.id)}
                type="button"
              >
                <div>
                  <p className="font-semibold text-ink">{addon.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{addon.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">+ {formatCurrencyINR(addon.price)}</p>
                  <p className="mt-1 text-xs font-semibold text-brand-700">
                    {selected ? "Added" : "Tap to add"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderPurchase = () => (
    <div className="app-card animate-rise pb-28 lg:pb-6">
      <SectionHeader
        eyebrow="Purchase-only details"
        title="Complete your policy details"
        subtitle="These are required for policy purchase and issuance, not for early quote discovery."
      />

      <div className="space-y-5">
        <Field error={journey.purchaseErrors.dateOfBirth} label="Date of birth">
          <TextInput
            error={journey.purchaseErrors.dateOfBirth}
            onChange={(event) => journey.updatePurchaseField("dateOfBirth", event.target.value)}
            type="date"
            value={journey.purchase.dateOfBirth ?? ""}
          />
        </Field>

        <Field error={journey.purchaseErrors.previousInsurerName} label="Previous insurer name">
          <SelectInput
            error={journey.purchaseErrors.previousInsurerName}
            onChange={(event) =>
              journey.updatePurchaseField("previousInsurerName", event.target.value)
            }
            value={journey.purchase.previousInsurerName ?? ""}
          >
            <option value="">Select previous insurer</option>
            {PREVIOUS_INSURERS.map((insurer) => (
              <option key={insurer} value={insurer}>
                {insurer}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field error={journey.purchaseErrors.nomineeName} label="Nominee name">
          <TextInput
            error={journey.purchaseErrors.nomineeName}
            onChange={(event) => journey.updatePurchaseField("nomineeName", event.target.value)}
            placeholder="Anjali Sharma"
            value={journey.purchase.nomineeName ?? ""}
          />
        </Field>

        <Field error={journey.purchaseErrors.nomineeRelationship} label="Nominee relationship">
          <SelectInput
            error={journey.purchaseErrors.nomineeRelationship}
            onChange={(event) =>
              journey.updatePurchaseField("nomineeRelationship", event.target.value)
            }
            value={journey.purchase.nomineeRelationship ?? ""}
          >
            <option value="">Select relationship</option>
            {NOMINEE_RELATIONSHIPS.map((relationship) => (
              <option key={relationship} value={relationship}>
                {relationship}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <StickyActionBar
        disabled={journey.loadingState.purchase}
        loading={journey.loadingState.purchase}
        onPrimary={journey.submitPurchaseDetails}
        primaryLabel="Complete application"
      />
    </div>
  );

  const customerScreens = {
    landing: renderLanding,
    registration: renderRegistration,
    vehicleConfirmation: renderVehicleConfirmation,
    policy: renderPolicy,
    estimate: renderEstimate,
    personal: renderPersonal,
    exactQuotes: renderExactQuotes,
    purchase: renderPurchase,
    complete: () => (
      <CompletionCard
        quoteEstimate={journey.quoteEstimate}
        selectedPlan={journey.selectedPlan}
      />
    ),
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <ProgressHeader currentStage={journey.progressStage} />
        {customerScreens[journey.screen]()}

        {journey.screen !== "complete" ? (
          <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 text-sm text-slate-500 shadow-panel">
            Usually takes less than 60 seconds. We ask only what is needed to calculate the next useful output.
          </div>
        ) : null}
      </div>

      <SummaryRail
        exactQuotes={journey.exactQuotes}
        policy={journey.policy}
        quoteEstimate={journey.quoteEstimate}
        screen={journey.screen}
        selectedPlan={journey.selectedPlan}
        vehicle={journey.vehicle}
      />
    </div>
  );
}
