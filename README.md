# Cover Compass Motor Insurance Prototype

Production-quality React + Tailwind prototype for a mobile-first motor insurance comparison journey.

The prototype is designed around one product principle:

> Ask only what is needed to calculate the next useful output.

It includes:

- A customer-facing quote journey optimized for fast time-to-quote
- Mock vehicle lookup and quote APIs
- Explainable quote estimate logic
- Invisible lead-quality scoring
- End-to-end event tracking with timings
- An internal admin dashboard for funnel, event, timing, and lead inspection
- GitHub Pages deployment via GitHub Actions

## Run locally

Install dependencies once:

```bash
npm install
```

Run the app:

```bash
npm start
```

Build for production:

```bash
npm run build
```

The app is available at:

- Quote journey: `/#/`
- Admin dashboard: `/#/admin`

## Hosting on GitHub Pages

This repo includes `.github/workflows/deploy.yml` for automatic deployment from `main`.

After pushing the code:

1. Open the repository on GitHub.
2. Go to `Settings` -> `Pages`.
3. Set the source to `GitHub Actions` if it is not already enabled.
4. Push to `main` and GitHub Actions will build and deploy `dist/`.

Expected URL:

```text
https://chetanya1998.github.io/Motor-Insurance/
```

The app uses:

- `HashRouter` so route navigation works on static hosting
- Vite `base` set to `/Motor-Insurance/` for GitHub Pages asset paths

## Product decisions built into the prototype

### Field sequencing

Before estimate:

- Vehicle registration number
- Vehicle confirmation or manual edit
- Previous policy expiry date
- No Claim Bonus
- Claims in last 3 years
- Vehicle value preference

After estimate:

- Full name
- Mobile number
- Email address

Purchase-only at the end:

- Date of birth
- Previous insurer
- Nominee name
- Nominee relationship

### Why the flow is structured this way

- Vehicle number is the fastest input with the highest prefill potential.
- The user sees an estimated quote range before sharing personal contact details.
- Purchase-only fields are intentionally delayed because they do not improve early pricing.
- The journey is mobile-first with large touch targets, clear cards, minimal copy, and sticky bottom CTAs.

## Mock API and service layer

The UI does not hardcode domain logic directly into components.

### Mocked services

- `src/services/vehicleApi.js`
  - Simulates `GET /api/vehicle-lookup`
  - Handles registration normalization, lookup success, failure, and manual fallback support
- `src/services/quoteApi.js`
  - Simulates `POST /api/quote-estimate`
  - Simulates `POST /api/exact-quotes`
  - Applies add-on pricing updates
- `src/services/leadScoringService.js`
  - Runs explainable lead-quality scoring
- `src/services/analyticsApi.js`
  - Creates normalized analytics events and funnel/timing rollups
- `src/services/leadApi.js`
  - Upserts lead records and builds dashboard snapshots
- `src/services/storage.js`
  - Persists seeded and live session data in local storage

## Quote estimate logic

Implemented in `src/services/quoteApi.js`.

Pricing inputs used before estimate:

- Vehicle make/model/variant
- Manufacture year
- Fuel type
- City of registration
- Policy expiry certainty
- NCB
- Claims history
- Vehicle value preference

Formula:

```text
estimatedPremium =
basePremium
* cityFactor
* fuelFactor
* vehicleAgeFactor
* idvFactor
* claimsLoadingFactor
* (1 - ncbDiscount)
```

Range logic:

- `min = estimatedPremium * 0.90`
- `max = estimatedPremium * 1.20`
- Rounded to nearest `₹100`

Confidence logic:

- `High`: successful lookup and all pricing inputs known
- `Medium`: manual entry or one uncertain field
- `Low`: multiple uncertain pricing inputs

## Lead-quality scoring logic

Implemented in `src/services/leadScoringService.js`.

The user never sees this score. The admin dashboard does.

Signals included:

- Registration format validity
- Vehicle lookup success or manual override after lookup failure
- Vehicle edit count
- Completion speed
- Mobile validity
- Email validity and disposable-domain detection
- Duplicate mobile detection
- Duplicate registration with different mobile detection
- Honeypot detection
- Validation error count
- Copy-paste behavior
- Internal data consistency checks
- Too many quote-critical `Not sure` answers

Risk bands:

- `80-100`: Low Risk
- `50-79`: Medium Risk
- `0-49`: High Risk

Recommended actions are generated for each lead and surfaced in the admin dashboard.

## Event tracking and timing logic

Each event includes:

```json
{
  "eventId": "unique id",
  "sessionId": "session id",
  "leadId": "lead id or null",
  "eventName": "quote_range_generated",
  "stepName": "estimate",
  "timestamp": "ISO timestamp",
  "timeSinceStart": 39,
  "metadata": {}
}
```

Tracked coverage includes:

- Global lifecycle
- Registration and vehicle lookup
- Vehicle confirmation/editing
- Policy details
- Estimate generation and viewing
- Contact submission
- Exact quote viewing and plan selection
- Add-on toggles and premium updates
- Purchase completion
- Lead score generation and suspicious signal detection
- Abandonment capture

Timing checkpoints shown in admin:

- Time-to-quote
- Time-to-contact-submit
- Total completion time
- Time spent per step
- Fastest step
- Slowest step
- Step where the user hesitated most

## Seed data and live updates

The dashboard starts with demo sessions and leads so a reviewer can inspect:

- Low-risk completed lead
- Medium-risk partially progressed lead
- High-risk suspicious lead
- Abandoned partial session

Any new lead created in the quote journey updates the admin dashboard immediately because both routes share the same in-browser store.

## Project structure

```text
src/
  context/
    AppDataContext.jsx
  data/
    options.js
    seedData.js
  hooks/
    useQuoteJourney.js
  pages/
    QuoteJourneyPage.jsx
    AdminDashboardPage.jsx
  services/
    analyticsApi.js
    leadApi.js
    leadScoringService.js
    quoteApi.js
    storage.js
    vehicleApi.js
  utils/
    formatters.js
    helpers.js
    validation.js
```

## Future improvements

- Replace local storage with real session, quote, and lead APIs
- Add OTP gating for medium-risk leads
- Add insurer-specific underwriting rules and quote explanations
- Add stronger abandonment recovery and session replay hooks
- Add dashboard filters by channel, city, and insurer
- Add test coverage for scoring and pricing logic
- Add server-backed admin authentication and audit trails
