import { Link } from "react-router-dom";
import {
  ADDON_CATALOG,
  APP_COPY,
  CITY_OPTIONS,
  FUEL_OPTIONS,
  JOURNEY_STAGES,
  MANUFACTURE_YEARS,
  NCB_OPTIONS,
  NOMINEE_RELATIONSHIPS,
  PREVIOUS_INSURERS,
  VEHICLE_CATALOG,
} from "../data/options";
import useQuoteJourney from "../hooks/useQuoteJourney";
import { formatCurrencyINR } from "../utils/formatters";

const primaryButtonClassName =
  "inline-flex min-h-[54px] w-full items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClassName =
  "inline-flex min-h-[54px] w-full items-center justify-center rounded-full border border-mist bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-300 hover:bg-brand-50";

function StepHeader({ currentStage }) {
  if (!currentStage) {
    return null;
  }

  const currentIndex = JOURNEY_STAGES.findIndex((stage) => stage.id === currentStage);
  const stage = JOURNEY_STAGES[currentIndex];
  const nextLabel =
    JOURNEY_STAGES[currentIndex + 1]?.description ?? "Finish your application";

  return (
    <section className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
            Step {currentIndex + 1} of {JOURNEY_STAGES.length}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
            {stage.label}
          </h2>
        </div>
        <div className="rounded-2xl bg-cloud px-4 py-3 text-sm text-slate-600">
          <p className="font-semibold text-ink">Next</p>
          <p className="mt-1">{nextLabel}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-6 gap-2">
        {JOURNEY_STAGES.map((item, index) => (
          <div
            key={item.id}
            className={[
              "h-2 rounded-full transition",
              index <= currentIndex
                ? "bg-gradient-to-r from-brand-500 to-mint-400"
                : "bg-mist",
            ].join(" ")}
          />
        ))}
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
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/80 bg-white/94 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 shadow-[0_-14px_36px_rgba(18,48,58,0.10)] backdrop-blur-lg lg:static lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0 lg:shadow-none">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row">
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

function SectionHeader({ title, subtitle, eyebrow }) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-2 font-display text-[2rem] font-semibold leading-tight text-ink sm:text-[2.35rem]">
        {title}
      </h1>
      {subtitle ? <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

function TrustRow({ items }) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-mint-200 bg-mint-50 px-4 py-2 text-sm font-semibold text-mint-600"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function InfoBand({ title, body, tone = "brand" }) {
  const toneClasses = {
    brand: "border-brand-100 bg-brand-50/70 text-brand-700",
    mint: "border-mint-100 bg-mint-50 text-mint-600",
    cloud: "border-mist bg-cloud text-slate-600",
    amber: "border-amber-100 bg-amber-50 text-amber-600",
  };

  return (
    <div className={["rounded-[24px] border p-4", toneClasses[tone]].join(" ")}>
      <p className="text-sm font-semibold">{title}</p>
      {body ? <p className="mt-1 text-sm leading-6">{body}</p> : null}
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
        "min-h-[56px] w-full rounded-2xl border bg-white px-4 py-3 text-base text-ink outline-none transition placeholder:text-slate-400",
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
        "min-h-[56px] w-full rounded-2xl border bg-white px-4 py-3 text-base text-ink outline-none transition",
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

function ChoiceChips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const optionValue = typeof option === "string" ? option : option.label;
        const optionLabel = typeof option === "string" ? option : option.label;
        const selected = optionValue === value;

        return (
          <button
            key={optionValue}
            className={[
              "rounded-full border px-4 py-3 text-sm font-semibold transition",
              selected
                ? "border-brand-500 bg-brand-500 text-white shadow-glow"
                : "border-mist bg-white text-ink hover:border-brand-300 hover:bg-brand-50",
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

function OptionCard({ title, body, active, onClick, trailing }) {
  return (
    <button
      className={[
        "w-full rounded-[24px] border p-4 text-left transition",
        active
          ? "border-ink bg-ink text-white shadow-glow"
          : "border-mist bg-white text-ink hover:border-brand-300 hover:bg-brand-50",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold">{title}</p>
          <p className={["mt-2 text-sm leading-6", active ? "text-white/85" : "text-slate-600"].join(" ")}>
            {body}
          </p>
        </div>
        {trailing ? (
          <span
            className={[
              "rounded-full px-3 py-1 text-xs font-semibold",
              active ? "bg-white/15 text-white" : "bg-cloud text-slate-600",
            ].join(" ")}
          >
            {trailing}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function EstimatePlanCard({ title, body, price, tone = "default" }) {
  const toneClasses = {
    default: "border-mist bg-white",
    highlight: "border-brand-200 bg-brand-50/70",
    strong: "border-mint-200 bg-mint-50/70",
  };

  return (
    <div className={["rounded-[26px] border p-4", toneClasses[tone]].join(" ")}>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-ink">{price}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function QuoteChoiceCard({ quote, onSelect, recommendedLabel }) {
  return (
    <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{quote.insurer}</p>
          <h3 className="mt-2 font-display text-3xl font-semibold text-ink">
            {formatCurrencyINR(quote.finalPremium ?? quote.premium)}
          </h3>
          <p className="mt-1 text-sm text-slate-500">per year</p>
        </div>
        <div className="space-y-2 text-right">
          <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            {quote.tag}
          </span>
          {recommendedLabel ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-600">
              {recommendedLabel}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[20px] bg-cloud p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">IDV</p>
          <p className="mt-1 text-sm font-semibold text-ink">{formatCurrencyINR(quote.idv)}</p>
        </div>
        <div className="rounded-[20px] bg-cloud p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Claim support
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">{quote.claimSupport}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-ink">Included</p>
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

      <button className="mt-5 w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700" onClick={onSelect} type="button">
        Continue with {quote.insurer}
      </button>
    </div>
  );
}

function getRecommendedInsurer(policy, quotes) {
  if (!quotes.length) {
    return "";
  }

  if (policy.idvPreference === "Lowest price") {
    return quotes.reduce((lowest, current) =>
      current.finalPremium < lowest.finalPremium ? current : lowest,
    ).insurer;
  }

  if (policy.idvPreference === "Higher cover") {
    return quotes.reduce((highest, current) =>
      current.idv > highest.idv ? current : highest,
    ).insurer;
  }

  return quotes.find((quote) => quote.insurer === "ICICI Lombard")?.insurer ?? quotes[1]?.insurer ?? quotes[0].insurer;
}

export default function QuoteJourneyPage() {
  const journey = useQuoteJourney();
  const models = VEHICLE_CATALOG[journey.vehicle?.make] ?? [];
  const selectedModelDefinition = models.find((item) => item.model === journey.vehicle?.model);
  const selectedQuote = journey.exactQuotes.find((quote) => quote.insurer === journey.selectedPlan);
  const recommendedInsurer = getRecommendedInsurer(journey.policy, journey.exactQuotes);
  const selectedAddonTotal = ADDON_CATALOG.filter((addon) =>
    journey.selectedAddons.includes(addon.id),
  ).reduce((total, addon) => total + addon.price, 0);
  const entryScreen = journey.screen === "landing" || journey.screen === "registration";

  const renderEntry = () => (
    <section className="rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-panel sm:p-8">
      <SectionHeader
        eyebrow="Fast car insurance renewal"
        subtitle={APP_COPY.subtitle}
        title={APP_COPY.title}
      />

      <div className="mt-6">
        <TrustRow items={APP_COPY.trustSignals} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <InfoBand
            body="We use your vehicle number to prefill details and show a price range faster."
            title="Start with your vehicle number"
            tone="cloud"
          />

          <Field
            error={journey.registrationError}
            helper="Example: DL09CA1234"
            label="Vehicle registration number"
          >
            <TextInput
              autoFocus={!journey.progressStage}
              error={journey.registrationError}
              onChange={(event) => journey.setRegistrationNumber(event.target.value)}
              onFocus={journey.handleRegistrationFocus}
              placeholder="DL09CA1234"
              value={journey.registrationNumber}
            />
          </Field>

          {journey.loadingState.lookup ? (
            <InfoBand body="This usually takes a couple of seconds." title="Fetching vehicle details..." tone="brand" />
          ) : null}

          {journey.lookupError ? (
            <div className="rounded-[24px] border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-600">{journey.lookupError}</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button className={secondaryButtonClassName} onClick={journey.submitRegistration} type="button">
                  Try again
                </button>
                <button className={primaryButtonClassName} onClick={journey.handleManualEntry} type="button">
                  Enter vehicle manually
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[28px] bg-[linear-gradient(145deg,_rgba(37,136,164,0.10),_rgba(63,190,146,0.12))] p-5">
          <div className="rounded-[24px] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
              What happens next
            </p>
            <div className="mt-4 space-y-4">
              <div className="rounded-[20px] bg-cloud p-4">
                <p className="text-sm font-semibold text-ink">1. We prefill your vehicle</p>
                <p className="mt-1 text-sm text-slate-600">
                  Make, model, fuel type, year, and city when available.
                </p>
              </div>
              <div className="rounded-[20px] bg-cloud p-4">
                <p className="text-sm font-semibold text-ink">2. You answer four pricing questions</p>
                <p className="mt-1 text-sm text-slate-600">
                  Current policy expiry, NCB, claims, and vehicle value preference.
                </p>
              </div>
              <div className="rounded-[20px] bg-cloud p-4">
                <p className="text-sm font-semibold text-ink">3. You see your estimate first</p>
                <p className="mt-1 text-sm text-slate-600">
                  Phone and email are only needed if you want exact insurer prices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[24px] bg-cloud px-4 py-3 text-sm text-slate-600">
        Usually takes less than 60 seconds.
      </div>

      <div className="mt-6">
        <StickyActionBar
          disabled={journey.loadingState.lookup}
          loading={journey.loadingState.lookup}
          onPrimary={journey.submitRegistration}
          primaryLabel={APP_COPY.primaryCta}
        />
      </div>
    </section>
  );

  const renderVehicleConfirmation = () => (
    <section className="rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-panel sm:p-8">
      <SectionHeader
        eyebrow="Vehicle details"
        subtitle="Confirm these details so your estimate is based on the right car."
        title="Does this look correct?"
      />

      <div className="mt-6 space-y-5">
        {!journey.isEditingVehicle ? (
          <>
            <div className="rounded-[28px] bg-cloud p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Vehicle found</p>
                  <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
                    {journey.vehicle.make} {journey.vehicle.model} {journey.vehicle.variant}
                  </h2>
                </div>
                <span className="rounded-full bg-mint-50 px-3 py-2 text-xs font-semibold text-mint-600">
                  Ready for estimate
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ["Fuel type", journey.vehicle.fuelType],
                  ["Manufacture year", journey.vehicle.manufactureYear],
                  ["Registration city", journey.vehicle.cityOfRegistration],
                  ["RTO", journey.vehicle.rtoCode],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[20px] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <InfoBand
              body="You can edit the make, model, year, fuel type, or city if the lookup is not fully correct."
              title="Need to make a change?"
              tone="cloud"
            />
          </>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <div className="mt-6">
        <StickyActionBar
          onPrimary={journey.confirmVehicleDetails}
          onSecondary={!journey.isEditingVehicle ? journey.handleVehicleEdit : undefined}
          primaryLabel={journey.isEditingVehicle ? "Continue to policy details" : "Looks correct"}
          secondaryLabel={!journey.isEditingVehicle ? "Edit vehicle" : undefined}
        />
      </div>
    </section>
  );

  const renderPolicy = () => (
    <section className="rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-panel sm:p-8">
      <SectionHeader
        eyebrow="Pricing details"
        subtitle="These four answers shape your first estimate. You still do not need to share contact details."
        title="A few policy details for your estimate"
      />

      <div className="mt-6 space-y-8">
        <div className="space-y-3">
          <Field
            error={journey.policyErrors.previousPolicyExpiryDate}
            helper="If you are not sure, use the quick options below."
            label="When does your current policy expire?"
          >
            <TextInput
              error={journey.policyErrors.previousPolicyExpiryDate}
              onChange={(event) => {
                journey.setManualPolicyExpiryDate(event.target.value);
                journey.trackEvent("policy_expiry_selected", "policy", {
                  value: event.target.value,
                  preset: "manual_date",
                });
              }}
              type="date"
              value={journey.policy.previousPolicyExpiryDate ?? ""}
            />
          </Field>
          <ChoiceChips
            onChange={journey.selectPolicyExpiryPreset}
            options={journey.helpers.policyExpiryPresets}
            value={journey.policy.policyExpiryPreset}
          />
        </div>

        <div className="space-y-3">
          <Field
            error={journey.policyErrors.ncbPercentage}
            helper="This is the discount you get if you did not claim last year."
            label="No Claim Bonus"
          >
            <ChoiceChips
              onChange={(value) => {
                journey.updatePolicyField("ncbPercentage", value);
                journey.trackEvent("ncb_selected", "policy", { value });
              }}
              options={NCB_OPTIONS}
              value={journey.policy.ncbPercentage}
            />
          </Field>
        </div>

        <div className="space-y-3">
          <Field
            error={journey.policyErrors.claimsInLast3Years}
            helper="Claims can increase premium, so we use this to make the estimate more realistic."
            label="Claims in last 3 years"
          >
            <ChoiceChips
              onChange={(value) => {
                journey.updatePolicyField("claimsInLast3Years", value);
                journey.trackEvent("claims_selected", "policy", { value });
              }}
              options={journey.helpers.claimsOptions}
              value={journey.policy.claimsInLast3Years}
            />
          </Field>
        </div>

        <div className="space-y-3">
          <Field
            error={journey.policyErrors.idvPreference}
            helper="This affects price and the amount covered if the car is stolen or damaged badly."
            label="Vehicle value preference"
          >
            <div className="grid gap-3">
              {journey.helpers.idvOptions.map((option) => (
                <OptionCard
                  active={journey.policy.idvPreference === option.label}
                  body={option.helper}
                  key={option.label}
                  onClick={() => {
                    journey.updatePolicyField("idvPreference", option.label);
                    journey.trackEvent("idv_preference_selected", "policy", { value: option.label });
                  }}
                  title={option.label}
                />
              ))}
            </div>
          </Field>
        </div>
      </div>

      <div className="mt-6">
        <StickyActionBar
          disabled={journey.loadingState.estimate}
          loading={journey.loadingState.estimate}
          onPrimary={journey.submitPolicyDetails}
          primaryLabel="Show my estimate"
        />
      </div>
    </section>
  );

  const renderEstimate = () => (
    <section className="space-y-5">
      <div className="rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-panel sm:p-8">
        <SectionHeader
          eyebrow="Your estimate"
          subtitle="This price range is based on your vehicle, city, expiry timing, NCB, claims history, and value preference."
          title="Here’s your first price range"
        />

        <div className="mt-6 rounded-[30px] bg-[linear-gradient(135deg,_rgba(37,136,164,0.12),_rgba(63,190,146,0.18))] p-5">
          <div className="rounded-[24px] bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">Estimated annual premium</p>
                <h2 className="mt-2 font-display text-[2.8rem] font-semibold leading-none text-ink sm:text-[3.3rem]">
                  {formatCurrencyINR(journey.quoteEstimate.quoteRange.min)} -{" "}
                  {formatCurrencyINR(journey.quoteEstimate.quoteRange.max)}
                </h2>
              </div>
              <div className="rounded-full bg-mint-50 px-4 py-2 text-sm font-semibold text-mint-600">
                {journey.quoteEstimate.confidence} confidence
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <EstimatePlanCard
            body="Lowest estimated premium if keeping cover light."
            price={`${formatCurrencyINR(journey.quoteEstimate.quoteRange.min)}/year`}
            title="Budget plan"
          />
          <EstimatePlanCard
            body="A practical middle ground for price and cover."
            price={`${formatCurrencyINR(
              Math.round(
                (journey.quoteEstimate.quoteRange.min + journey.quoteEstimate.quoteRange.max) / 2,
              ),
            )}/year`}
            title="Balanced plan"
            tone="highlight"
          />
          <EstimatePlanCard
            body="Higher protection with a higher expected premium."
            price={`${formatCurrencyINR(journey.quoteEstimate.quoteRange.max)}/year`}
            title="Higher cover"
            tone="strong"
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
            <p>Vehicle value: {journey.policy.idvPreference}</p>
            <p className="mt-2 font-semibold text-ink">
              Base premium: {formatCurrencyINR(journey.quoteEstimate.breakdown.basePremium)}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <InfoBand
            body="Share your details only if you want exact insurer prices and discounts."
            title="You’ve seen the estimate first"
            tone="mint"
          />
        </div>
      </div>

      <StickyActionBar
        onPrimary={journey.unlockExactQuotes}
        onSecondary={journey.editQuoteInputs}
        primaryLabel="See exact insurer prices"
        secondaryLabel="Change my answers"
      />
    </section>
  );

  const renderPersonal = () => (
    <section className="rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-panel sm:p-8">
      <SectionHeader
        eyebrow="Exact insurer prices"
        subtitle="You’ve already seen your estimate. Share your details now to unlock exact prices and discounts."
        title="Unlock exact insurer prices"
      />

      <div className="mt-6 rounded-[24px] bg-cloud p-4 text-sm text-slate-600">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-ink">Your estimate</p>
          <p className="font-semibold text-ink">
            {formatCurrencyINR(journey.quoteEstimate.quoteRange.min)} -{" "}
            {formatCurrencyINR(journey.quoteEstimate.quoteRange.max)}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <Field
          error={journey.contactErrors.fullName}
          helper="Name used on your policy."
          label="Full name"
        >
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

        <InfoBand
          body="We use these details only to show insurer prices and help complete your policy."
          title="Privacy note"
          tone="cloud"
        />
      </div>

      <div className="mt-6">
        <StickyActionBar
          disabled={journey.loadingState.exactQuotes}
          loading={journey.loadingState.exactQuotes}
          onPrimary={journey.submitPersonalDetails}
          primaryLabel="Show exact quotes"
        />
      </div>
    </section>
  );

  const renderExactQuotes = () => (
    <section className="space-y-5">
      <div className="rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-panel sm:p-8">
        <SectionHeader
          eyebrow="Compare plans"
          subtitle="Choose the plan that feels right, then finish the last few purchase-only details."
          title="Choose your insurer plan"
        />

        {selectedAddonTotal ? (
          <div className="mt-6 rounded-[24px] bg-mint-50 p-4 text-sm text-mint-600">
            <p className="font-semibold">
              Selected add-ons add {formatCurrencyINR(selectedAddonTotal)} per year to each plan.
            </p>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {journey.exactQuotes.map((quote) => (
            <QuoteChoiceCard
              key={quote.insurer}
              onSelect={() => journey.selectPlan(quote.insurer)}
              quote={quote}
              recommendedLabel={recommendedInsurer === quote.insurer ? "Recommended" : ""}
            />
          ))}
        </div>
      </div>

      <div className="rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-panel sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
              Recommended add-ons
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
              Add protection only if it helps you
            </h2>
          </div>
          <div className="rounded-full bg-cloud px-4 py-2 text-sm font-semibold text-slate-600">
            Premium updates instantly
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {ADDON_CATALOG.map((addon) => {
            const selected = journey.selectedAddons.includes(addon.id);

            return (
              <button
                key={addon.id}
                className={[
                  "flex items-center justify-between gap-4 rounded-[24px] border p-4 text-left transition",
                  selected
                    ? "border-brand-400 bg-brand-50"
                    : "border-mist bg-white hover:border-brand-300 hover:bg-brand-50",
                ].join(" ")}
                onClick={() => journey.toggleAddon(addon.id)}
                type="button"
              >
                <div>
                  <p className="text-base font-semibold text-ink">{addon.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{addon.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">+ {formatCurrencyINR(addon.price)}</p>
                  <p className="mt-1 text-xs font-semibold text-brand-700">
                    {selected ? "Added" : "Add cover"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );

  const renderPurchase = () => (
    <section className="rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-panel sm:p-8">
      <SectionHeader
        eyebrow="Finish policy details"
        subtitle="These details are needed only to issue the policy. They were intentionally kept out of the earlier quote steps."
        title="Complete your policy"
      />

      {selectedQuote ? (
        <div className="mt-6 rounded-[24px] bg-cloud p-4 text-sm text-slate-600">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-ink">{selectedQuote.insurer}</p>
              <p className="mt-1">Selected premium {formatCurrencyINR(selectedQuote.finalPremium)}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink">
              {selectedQuote.tag}
            </span>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field error={journey.purchaseErrors.dateOfBirth} label="Date of birth">
          <TextInput
            error={journey.purchaseErrors.dateOfBirth}
            onChange={(event) => journey.updatePurchaseField("dateOfBirth", event.target.value)}
            type="date"
            value={journey.purchase.dateOfBirth ?? ""}
          />
        </Field>

        <Field error={journey.purchaseErrors.previousInsurerName} label="Previous insurer">
          <SelectInput
            error={journey.purchaseErrors.previousInsurerName}
            onChange={(event) => journey.updatePurchaseField("previousInsurerName", event.target.value)}
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
            onChange={(event) => journey.updatePurchaseField("nomineeRelationship", event.target.value)}
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

      <div className="mt-6">
        <StickyActionBar
          disabled={journey.loadingState.purchase}
          loading={journey.loadingState.purchase}
          onPrimary={journey.submitPurchaseDetails}
          primaryLabel="Complete application"
        />
      </div>
    </section>
  );

  const renderCompletion = () => (
    <section className="rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-panel sm:p-8">
      <SectionHeader
        eyebrow="Application received"
        subtitle="Your details are ready for the next verification step."
        title="Your quote journey is complete"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[24px] bg-cloud p-5">
          <p className="text-sm font-semibold text-slate-500">Chosen plan</p>
          <p className="mt-2 font-display text-2xl font-semibold text-ink">
            {journey.selectedPlan || "Plan selected"}
          </p>
          {selectedQuote ? (
            <p className="mt-2 text-sm text-slate-600">
              Final premium {formatCurrencyINR(selectedQuote.finalPremium)}
            </p>
          ) : null}
        </div>
        <div className="rounded-[24px] bg-cloud p-5">
          <p className="text-sm font-semibold text-slate-500">Estimate shown earlier</p>
          <p className="mt-2 font-display text-2xl font-semibold text-ink">
            {journey.quoteEstimate?.quoteRange
              ? `${formatCurrencyINR(journey.quoteEstimate.quoteRange.min)} - ${formatCurrencyINR(
                  journey.quoteEstimate.quoteRange.max,
                )}`
              : "Available"}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-[24px] bg-mint-50 p-4 text-sm text-mint-600">
        <p className="font-semibold">What happens next</p>
        <p className="mt-1">
          An insurer would normally verify these details and take you to payment next.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link className={primaryButtonClassName} reloadDocument to="/">
          Start another quote
        </Link>
      </div>
    </section>
  );

  const customerScreen = (() => {
    if (entryScreen) {
      return renderEntry();
    }

    if (journey.screen === "vehicleConfirmation") {
      return renderVehicleConfirmation();
    }

    if (journey.screen === "policy") {
      return renderPolicy();
    }

    if (journey.screen === "estimate") {
      return renderEstimate();
    }

    if (journey.screen === "personal") {
      return renderPersonal();
    }

    if (journey.screen === "exactQuotes") {
      return renderExactQuotes();
    }

    if (journey.screen === "purchase") {
      return renderPurchase();
    }

    return renderCompletion();
  })();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <StepHeader currentStage={journey.progressStage} />
      {customerScreen}
    </div>
  );
}
