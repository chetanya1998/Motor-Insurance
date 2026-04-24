import { useEffect, useMemo, useRef, useState } from "react";
import {
  CLAIMS_OPTIONS,
  IDV_OPTIONS,
  POLICY_EXPIRY_PRESETS,
  STAGE_TO_SCREEN,
} from "../data/options";
import { useAppData } from "../context/AppDataContext";
import { applyAddonsToQuotes, getExactQuotes, getQuoteEstimate } from "../services/quoteApi";
import { scoreLead } from "../services/leadScoringService";
import { buildManualVehicleStub, lookupVehicle } from "../services/vehicleApi";
import {
  validateContactDetails,
  validatePolicyDetails,
  validatePurchaseDetails,
  validateRegistration,
  validateVehicleDetails,
  normalizeRegistrationNumber,
} from "../utils/validation";

function getDatePresetValue(preset) {
  const today = new Date();

  if (preset === "Already expired") {
    today.setDate(today.getDate() - 2);
    return today.toISOString().slice(0, 10);
  }

  if (preset === "Expires this month") {
    const date = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return date.toISOString().slice(0, 10);
  }

  if (preset === "Expires next month") {
    const date = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    return date.toISOString().slice(0, 10);
  }

  return "";
}

export default function useQuoteJourney() {
  const {
    currentSession,
    patchCurrentSession,
    recordPaste,
    recordValidationError,
    saveLeadRecord,
    setCurrentScreen,
    startJourney,
    store,
    trackEvent,
  } = useAppData();

  const [screen, setScreen] = useState(currentSession?.currentScreen ?? "landing");
  const [registrationNumber, setRegistrationNumber] = useState(
    currentSession?.registrationNumber ?? "",
  );
  const [registrationError, setRegistrationError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [vehicle, setVehicle] = useState(currentSession?.data?.vehicle ?? {});
  const [vehicleErrors, setVehicleErrors] = useState({});
  const [policy, setPolicy] = useState(
    currentSession?.data?.policy ?? {
      previousPolicyExpiryDate: "",
      policyExpiryPreset: "",
      ncbPercentage: "",
      claimsInLast3Years: "",
      idvPreference: "",
    },
  );
  const [policyErrors, setPolicyErrors] = useState({});
  const [quoteEstimate, setQuoteEstimate] = useState(currentSession?.data?.quoteEstimate ?? null);
  const [customer, setCustomer] = useState(
    currentSession?.data?.customer ?? {
      fullName: "",
      mobileNumber: "",
      emailAddress: "",
      honeypot: "",
    },
  );
  const [contactErrors, setContactErrors] = useState({});
  const [exactQuotes, setExactQuotes] = useState(currentSession?.data?.exactQuotes ?? []);
  const [selectedAddons, setSelectedAddons] = useState(
    currentSession?.data?.selectedAddons ?? [],
  );
  const [selectedPlan, setSelectedPlan] = useState(
    currentSession?.data?.selectedPlan ?? null,
  );
  const [purchase, setPurchase] = useState(
    currentSession?.data?.purchase ?? {
      dateOfBirth: "",
      previousInsurerName: "",
      nomineeName: "",
      nomineeRelationship: "",
    },
  );
  const [purchaseErrors, setPurchaseErrors] = useState({});
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [isManualFlow, setIsManualFlow] = useState(
    currentSession?.vehicleLookupMode === "manual",
  );
  const [loadingState, setLoadingState] = useState({
    lookup: false,
    estimate: false,
    exactQuotes: false,
    purchase: false,
  });
  const trackedEventsRef = useRef(new Set());

  useEffect(() => {
    patchCurrentSession((session) => {
      session.registrationNumber = normalizeRegistrationNumber(registrationNumber);
      session.vehicleLookupMode = isManualFlow ? "manual" : session.vehicleLookupMode;
      session.analytics.uncertainFields = [
        policy.ncbPercentage === "Not sure" ? "ncb" : null,
        policy.policyExpiryPreset === "Not sure" ? "policyExpiry" : null,
      ].filter(Boolean);
      session.analytics.honeypotFilled = Boolean(customer.honeypot?.trim());
      session.data.vehicle = vehicle;
      session.data.policy = policy;
      session.data.customer = customer;
      session.data.purchase = purchase;
      session.data.quoteEstimate = quoteEstimate;
      session.data.exactQuotes = exactQuotes;
      session.data.selectedAddons = selectedAddons;
      session.data.selectedPlan = selectedPlan;
    });
  }, [
    customer,
    exactQuotes,
    isManualFlow,
    patchCurrentSession,
    policy,
    purchase,
    quoteEstimate,
    registrationNumber,
    selectedAddons,
    selectedPlan,
    vehicle,
  ]);

  useEffect(() => {
    const stepEventMap = {
      policy: "policy_details_started",
      estimate: "quote_range_viewed",
      personal: "personal_details_started",
      exactQuotes: "exact_quotes_viewed",
      purchase: "purchase_details_started",
    };

    if (!stepEventMap[screen]) {
      return;
    }

    const eventKey = `${screen}:${stepEventMap[screen]}`;
    if (trackedEventsRef.current.has(eventKey)) {
      return;
    }

    trackedEventsRef.current.add(eventKey);
    trackEvent(stepEventMap[screen], screen);

    if (screen === "estimate") {
      trackEvent("quote_breakdown_viewed", screen);
    }

    if (screen === "exactQuotes" && exactQuotes.length) {
      exactQuotes.forEach((quote) => {
        trackEvent("insurer_card_viewed", screen, { insurer: quote.insurer });
      });
    }
  }, [exactQuotes, screen, trackEvent]);

  const progressStage = STAGE_TO_SCREEN[screen] ?? null;

  const displayedQuotes = useMemo(
    () => applyAddonsToQuotes(exactQuotes, selectedAddons),
    [exactQuotes, selectedAddons],
  );

  function goToScreen(nextScreen) {
    setScreen(nextScreen);
    setCurrentScreen(nextScreen);
  }

  function beginJourney(source = "cta") {
    startJourney(source);
    goToScreen("registration");
  }

  function handleRegistrationFocus() {
    if (!currentSession?.timing?.journeyStartedAt) {
      beginJourney("input_focus");
    }

    if (!trackedEventsRef.current.has("registration_field_started")) {
      trackedEventsRef.current.add("registration_field_started");
      trackEvent("registration_field_started", "registration");
    }
  }

  async function submitRegistration() {
    const error = validateRegistration(registrationNumber);
    setRegistrationError(error);
    setLookupError("");

    if (error) {
      recordValidationError({
        eventName: "registration_validation_error",
        stepName: "registration",
        field: "registrationNumber",
        message: error,
      });
      return;
    }

    const normalizedRegistration = normalizeRegistrationNumber(registrationNumber);
    trackEvent("registration_entered", "registration", {
      registrationNumber: normalizedRegistration,
    });
    trackEvent("vehicle_lookup_started", "registration", {
      registrationNumber: normalizedRegistration,
    });

    patchCurrentSession((session) => {
      session.registrationNumber = normalizedRegistration;
      session.vehicleLookupStatus = "loading";
    });

    setLoadingState((previousState) => ({ ...previousState, lookup: true }));
    const response = await lookupVehicle(normalizedRegistration);
    setLoadingState((previousState) => ({ ...previousState, lookup: false }));

    if (!response.success) {
      setLookupError("We could not fetch your vehicle details. You can enter them manually.");
      patchCurrentSession((session) => {
        session.vehicleLookupStatus = "failed";
        session.vehicleLookupConfidence = "low";
      });
      trackEvent("vehicle_lookup_failed", "registration", {
        message: response.message,
      });
      return;
    }

    setVehicle(response.vehicle);
    setIsManualFlow(false);
    setIsEditingVehicle(false);
    patchCurrentSession((session) => {
      session.vehicleLookupStatus = "success";
      session.vehicleLookupMode = "lookup";
      session.vehicleLookupConfidence = response.confidence;
      session.timing.checkpoints.vehicleLookupAt = new Date().toISOString();
      session.data.vehicle = response.vehicle;
    });
    trackEvent("vehicle_lookup_success", "registration", {
      confidence: response.confidence,
    });
    trackEvent("vehicle_details_prefilled", "vehicleConfirmation", {
      make: response.vehicle.make,
      model: response.vehicle.model,
    });
    goToScreen("vehicleConfirmation");
  }

  function handleManualEntry() {
    const stub = buildManualVehicleStub(registrationNumber);
    setVehicle((previousVehicle) => ({
      ...stub,
      ...previousVehicle,
    }));
    setIsManualFlow(true);
    setIsEditingVehicle(true);
    patchCurrentSession((session) => {
      session.vehicleLookupMode = "manual";
      session.vehicleLookupStatus = "failed";
      session.vehicleLookupConfidence = "low";
    });
    trackEvent("vehicle_manual_entry_selected", "registration");
    goToScreen("vehicleConfirmation");
  }

  function handleVehicleFieldChange(field, value) {
    setVehicle((previousVehicle) => {
      const nextVehicle = { ...previousVehicle, [field]: value };

      if (field === "make") {
        nextVehicle.model = "";
        nextVehicle.variant = "";
      }

      if (field === "model") {
        nextVehicle.variant = "";
      }

      return nextVehicle;
    });
  }

  function handleVehicleEdit() {
    setIsEditingVehicle(true);
    patchCurrentSession((session) => {
      session.analytics.vehicleEditCount += 1;
    });
    trackEvent("vehicle_details_edited", "vehicleConfirmation");
  }

  function confirmVehicleDetails() {
    if (isEditingVehicle || isManualFlow) {
      const errors = validateVehicleDetails(vehicle);
      setVehicleErrors(errors);

      if (Object.keys(errors).length) {
        Object.entries(errors).forEach(([field, message]) => {
          recordValidationError({
            stepName: "vehicleConfirmation",
            field,
            message,
          });
        });
        return;
      }
    }

    if (!isEditingVehicle) {
      trackEvent("vehicle_details_confirmed", "vehicleConfirmation");
    }

    patchCurrentSession((session) => {
      session.data.vehicle = vehicle;
      session.timing.checkpoints.vehicleConfirmedAt = new Date().toISOString();
    });
    trackEvent("vehicle_details_completed", "vehicleConfirmation");
    setVehicleErrors({});
    goToScreen("policy");
  }

  function updatePolicyField(field, value) {
    setPolicy((previousPolicy) => ({ ...previousPolicy, [field]: value }));
  }

  function selectPolicyExpiryPreset(preset) {
    setPolicy((previousPolicy) => ({
      ...previousPolicy,
      policyExpiryPreset: preset,
      previousPolicyExpiryDate: preset === "Not sure" ? "" : getDatePresetValue(preset),
    }));
    trackEvent("policy_expiry_selected", "policy", { preset });
  }

  async function submitPolicyDetails() {
    const errors = validatePolicyDetails(policy);
    setPolicyErrors(errors);

    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([field, message]) => {
        recordValidationError({
          stepName: "policy",
          field,
          message,
        });
      });
      return;
    }

    trackEvent("policy_details_completed", "policy");
    trackEvent("quote_estimate_requested", "policy");
    setLoadingState((previousState) => ({ ...previousState, estimate: true }));

    const response = await getQuoteEstimate({
      vehicle,
      policy,
      vehicleLookupMode: isManualFlow ? "manual" : currentSession?.vehicleLookupMode,
      lookupConfidence: currentSession?.vehicleLookupConfidence,
    });

    setLoadingState((previousState) => ({ ...previousState, estimate: false }));
    setQuoteEstimate(response);
    patchCurrentSession((session) => {
      session.data.quoteEstimate = response;
      session.timing.checkpoints.policyCompletedAt = new Date().toISOString();
      session.timing.checkpoints.quoteGeneratedAt = new Date().toISOString();
    });
    trackEvent("quote_range_generated", "estimate", {
      min: response.quoteRange.min,
      max: response.quoteRange.max,
      confidence: response.confidence,
    });
    goToScreen("estimate");
  }

  async function unlockExactQuotes() {
    trackEvent("unlock_exact_quotes_clicked", "estimate");
    goToScreen("personal");
  }

  function editQuoteInputs() {
    trackEvent("quote_details_edited", "estimate");
    goToScreen("policy");
  }

  function handleCustomerFieldChange(field, value) {
    setCustomer((previousCustomer) => ({ ...previousCustomer, [field]: value }));

    if (!value) {
      return;
    }

    const eventMap = {
      fullName: "full_name_entered",
      mobileNumber: "mobile_entered",
      emailAddress: "email_entered",
    };

    const eventName = eventMap[field];
    if (eventName && !trackedEventsRef.current.has(eventName)) {
      trackedEventsRef.current.add(eventName);
      trackEvent(eventName, "personal");
    }
  }

  async function submitPersonalDetails() {
    const errors = validateContactDetails(customer);
    setContactErrors(errors);

    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([field, message]) => {
        recordValidationError({
          eventName: "contact_validation_error",
          stepName: "personal",
          field,
          message,
        });
      });
      return;
    }

    setLoadingState((previousState) => ({ ...previousState, exactQuotes: true }));
    patchCurrentSession((session) => {
      session.analytics.honeypotFilled = Boolean(customer.honeypot?.trim());
      session.timing.checkpoints.contactSubmittedAt = new Date().toISOString();
    });

    const scoringResult = scoreLead({
      store,
      session: {
        ...currentSession,
        registrationNumber: normalizeRegistrationNumber(registrationNumber),
        vehicleLookupMode: isManualFlow ? "manual" : currentSession?.vehicleLookupMode,
        vehicleLookupStatus: currentSession?.vehicleLookupStatus,
        analytics: {
          ...currentSession?.analytics,
          honeypotFilled: Boolean(customer.honeypot?.trim()),
        },
      },
      vehicle,
      policy,
      customer,
      purchase,
    });

    const lead = saveLeadRecord({
      status: "contact_submitted",
      vehicle,
      policy,
      customer: {
        fullName: customer.fullName.trim(),
        mobileNumber: customer.mobileNumber.trim(),
        emailAddress: customer.emailAddress.trim(),
      },
      purchase,
      quoteEstimate,
      exactQuotes: [],
      selectedAddons,
      selectedPlan,
      score: scoringResult,
    });

    trackEvent("contact_details_submitted", "personal", {}, lead?.leadId);
    trackEvent("lead_quality_score_generated", "personal", {
      score: scoringResult.score,
      riskLevel: scoringResult.riskLevel,
    }, lead?.leadId);

    if (scoringResult.suspiciousSignals?.length) {
      trackEvent(
        "suspicious_signal_detected",
        "personal",
        { signals: scoringResult.suspiciousSignals },
        lead?.leadId,
      );
    }

    trackEvent("exact_quotes_requested", "personal", {}, lead?.leadId);

    const response = await getExactQuotes({
      vehicle,
      policy,
      customer,
      quoteEstimate,
    });

    setLoadingState((previousState) => ({ ...previousState, exactQuotes: false }));
    setExactQuotes(response.quotes);
    saveLeadRecord({
      status: "quote_ready",
      vehicle,
      policy,
      customer: {
        fullName: customer.fullName.trim(),
        mobileNumber: customer.mobileNumber.trim(),
        emailAddress: customer.emailAddress.trim(),
      },
      purchase,
      quoteEstimate,
      exactQuotes: response.quotes,
      selectedAddons,
      selectedPlan,
      score: scoringResult,
    });
    trackedEventsRef.current.add("exactQuotes:exact_quotes_viewed");
    trackEvent("exact_quotes_viewed", "exactQuotes", {}, lead?.leadId);
    goToScreen("exactQuotes");
  }

  function toggleAddon(addonId) {
    setSelectedAddons((previousAddons) => {
      const alreadySelected = previousAddons.includes(addonId);
      const nextAddons = alreadySelected
        ? previousAddons.filter((item) => item !== addonId)
        : [...previousAddons, addonId];

      trackEvent(alreadySelected ? "addon_removed" : "addon_selected", "exactQuotes", {
        addonId,
      });
      trackEvent("final_premium_updated", "exactQuotes", {
        addonCount: nextAddons.length,
      });

      saveLeadRecord({
        status: "quote_ready",
        vehicle,
        policy,
        customer: {
          fullName: customer.fullName.trim(),
          mobileNumber: customer.mobileNumber.trim(),
          emailAddress: customer.emailAddress.trim(),
        },
        purchase,
        quoteEstimate,
        exactQuotes,
        selectedAddons: nextAddons,
        selectedPlan,
      });

      return nextAddons;
    });
  }

  function selectPlan(insurer) {
    setSelectedPlan(insurer);
    saveLeadRecord({
      status: "plan_selected",
      vehicle,
      policy,
      customer: {
        fullName: customer.fullName.trim(),
        mobileNumber: customer.mobileNumber.trim(),
        emailAddress: customer.emailAddress.trim(),
      },
      purchase,
      quoteEstimate,
      exactQuotes,
      selectedAddons,
      selectedPlan: insurer,
    });
    trackEvent("insurer_plan_selected", "exactQuotes", { insurer });
    goToScreen("purchase");
  }

  function updatePurchaseField(field, value) {
    setPurchase((previousPurchase) => ({ ...previousPurchase, [field]: value }));

    if (!value) {
      return;
    }

    if (field === "dateOfBirth" && !trackedEventsRef.current.has("dob_entered")) {
      trackedEventsRef.current.add("dob_entered");
      trackEvent("dob_entered", "purchase");
    }

    if (
      field === "previousInsurerName" &&
      !trackedEventsRef.current.has("previous_insurer_selected")
    ) {
      trackedEventsRef.current.add("previous_insurer_selected");
      trackEvent("previous_insurer_selected", "purchase");
    }

    if (
      ["nomineeName", "nomineeRelationship"].includes(field) &&
      !trackedEventsRef.current.has("nominee_details_entered")
    ) {
      trackedEventsRef.current.add("nominee_details_entered");
      trackEvent("nominee_details_entered", "purchase");
    }
  }

  async function submitPurchaseDetails() {
    const errors = validatePurchaseDetails(purchase);
    setPurchaseErrors(errors);

    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([field, message]) => {
        recordValidationError({
          stepName: "purchase",
          field,
          message,
        });
      });
      return;
    }

    setLoadingState((previousState) => ({ ...previousState, purchase: true }));

    patchCurrentSession((session) => {
      session.timing.checkpoints.completedAt = new Date().toISOString();
      session.status = "completed";
    });

    const finalScore = scoreLead({
      store,
      session: {
        ...currentSession,
        registrationNumber: normalizeRegistrationNumber(registrationNumber),
        timing: {
          ...currentSession?.timing,
          checkpoints: {
            ...currentSession?.timing?.checkpoints,
            completedAt: new Date().toISOString(),
          },
        },
      },
      vehicle,
      policy,
      customer,
      purchase,
    });

    const lead = saveLeadRecord({
      status: "completed",
      vehicle,
      policy,
      customer: {
        fullName: customer.fullName.trim(),
        mobileNumber: customer.mobileNumber.trim(),
        emailAddress: customer.emailAddress.trim(),
      },
      purchase,
      quoteEstimate,
      exactQuotes: displayedQuotes,
      selectedAddons,
      selectedPlan,
      score: finalScore,
    });

    trackEvent("purchase_application_completed", "purchase", {}, lead?.leadId);
    trackEvent("form_completed", "purchase", {}, lead?.leadId);
    setLoadingState((previousState) => ({ ...previousState, purchase: false }));
    goToScreen("complete");
  }

  return {
    screen,
    progressStage,
    registrationNumber,
    registrationError,
    lookupError,
    vehicle,
    vehicleErrors,
    policy,
    policyErrors,
    quoteEstimate,
    customer,
    contactErrors,
    exactQuotes: displayedQuotes,
    selectedAddons,
    selectedPlan,
    purchase,
    purchaseErrors,
    isEditingVehicle,
    isManualFlow,
    loadingState,
    beginJourney,
    handleRegistrationFocus,
    setRegistrationNumber,
    submitRegistration,
    handleManualEntry,
    handleVehicleFieldChange,
    handleVehicleEdit,
    confirmVehicleDetails,
    updatePolicyField,
    selectPolicyExpiryPreset,
    submitPolicyDetails,
    unlockExactQuotes,
    editQuoteInputs,
    handleCustomerFieldChange,
    submitPersonalDetails,
    toggleAddon,
    selectPlan,
    updatePurchaseField,
    submitPurchaseDetails,
    recordPaste,
    setIsEditingVehicle,
    setScreen: goToScreen,
    helpers: {
      claimsOptions: CLAIMS_OPTIONS,
      idvOptions: IDV_OPTIONS,
      policyExpiryPresets: POLICY_EXPIRY_PRESETS,
    },
    trackEvent,
  };
}
