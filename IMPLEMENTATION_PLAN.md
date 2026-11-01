# HomeOps Implementation Plan

## Goal

Launch a reliable, mobile-first managed cleaning service with a public landing page, client booking, worker workflows, and an internal operations console in one Next.js and TypeScript repository. Keep the first release small enough to operate safely in a limited area, then expand from real service and unit-economics data.

## Product decisions for the first release

- One Next.js application and one repository. Use the App Router, TypeScript, Tailwind CSS, and server-side Route Handlers/Server Actions for trusted business operations.
- Supabase provides PostgreSQL, Auth, and private Storage. PostgreSQL is authoritative for bookings, assignments, payments, and audit history.
- Launch residential cleaning only, with a short, standardized package catalogue and a single launch zone selected for worker density and dispatch capacity.
- Use manual-assisted dispatch from an admin board. Do not build automated optimization before the operation has enough reliable data.
- Start with one payment provider behind an internal adapter. Confirm its supported payment methods and settlement/refund/payout flows before committing to customer-facing promises.
- Use a responsive installable web app for workers. Do not make native mobile apps a launch dependency.
- Keep the product name “HomeOps” provisional until naming checks are complete.

## What is in the public MVP

1. **Landing and marketing:** value proposition, service packages, scope and exclusions, coverage checker, FAQs, safety/process explanation, contact/support route, and booking CTA. Include metadata, sitemap, robots rules, analytics events, and consent-aware tracking as required.
2. **Client account:** sign-up/sign-in, contact details, saved service addresses, and booking history.
3. **Catalogue and quote:** package and add-on selection, property details, zone eligibility, schedule, instructions, versioned quote, itemized total in kobo, cancellation terms, and price snapshot.
4. **Booking and payment:** create a pending booking, initialize payment server-side, verify signed provider webhooks idempotently, and show backend-confirmed payment state. A browser redirect never confirms payment.
5. **Operations/admin:** role-restricted dashboard, booking timeline, manual assignment/reassignment with reason, worker verification review, support/incident cases, package and zone configuration, and payout/ledger visibility.
6. **Worker portal/PWA:** onboarding status, availability and coverage, assignment offer/accept/decline, limited job details, checklist, clock-in/out, evidence upload, incident report, and earnings/payout status.
7. **Service completion:** auditable job events, private evidence storage with short-lived signed access, customer issue reporting, and human review before completion/payout eligibility according to policy.
8. **Operational foundation:** audit events, notification retry records, error monitoring, backups, environment separation, access controls, and a support/incident runbook.

## Explicitly deferred

Multiple launch cities, chefs, post-construction and commercial cleaning, recurring subscriptions, B2B account billing, marketplace browsing, direct negotiation, algorithmic dispatch optimization, multiple gateways, native apps, and broad analytics exports. Add these only after the initial zone meets operating and margin gates.

## One-app architecture

```text
Next.js App Router
  Public pages: /, /services, /coverage, /how-it-works, /help
  Client pages: /app/*
  Worker PWA: /worker/*
  Operations console: /ops/*
  Server-only domain modules and Route Handlers/Server Actions
      Supabase Auth + PostgreSQL + private Storage
      Payment provider + email/SMS provider
```

Keep domain logic in server-only modules (identity/access, catalogue/pricing, booking, dispatch, job execution, payments/ledger, payouts, support, notifications). UI code must not decide authoritative workflow state. Use Supabase Row Level Security as defense in depth, but also enforce role and resource ownership in server code. Never expose service-role credentials to the browser. Store money as integer kobo, use database constraints and transactions, and keep immutable ledger/audit records. Use private buckets and short-lived signed URLs for verification and job evidence.

Suggested project layout:

```text
app/                 routes, layouts, route handlers
components/          shared UI and form components
lib/auth/            session, role and access checks
lib/domain/           business rules and state transitions
lib/supabase/         browser-safe and server-only clients
lib/payments/         provider interface and webhook handling
lib/notifications/   delivery adapters and retry/outbox helpers
supabase/migrations/ schema, RLS policies, seed data
```

## Delivery sequence

### Phase 0 — Launch decisions and service design

Resolve these in parallel with the first scaffolding work: initial zone and capacity; exact packages, inclusions, exclusions, supply responsibility and duration; customer price and worker share; cancellation/no-show/late/rework/refund policy; payment and payout fund flow; worker engagement terms; verification evidence and retention rules; insurance and safety escalation; support hours and operational response targets. Validate legal, privacy, tax, worker, payment, insurance, and food-safety obligations with qualified Nigerian advisers where applicable.

**Exit:** the operator can explain exactly what is sold, who fulfils it, how exceptions are handled, and how money moves. Do not accept live payments until payment, cancellation, and refund rules are approved.

### Phase 1 — App foundation and landing page

- Initialize one Next.js App Router project with TypeScript, Tailwind, lint/format conventions, environment validation, and a shared responsive component system.
- Build the public landing page and supporting service/coverage/help pages using confirmed service facts; keep claims about vetting, insurance, guarantees, and availability factual.
- Set up Supabase development and staging projects, migrations, Auth, role model, RLS baseline, private storage buckets, and seed data.
- Add CI for type checking, linting, migration checks, and production builds; document local setup and deployment rollback.

**Exit:** public pages are deployable and searchable; staging app can authenticate test roles; schema is reproducible from migrations.

### Phase 2 — Catalogue, quote, booking, and client account

- Implement versioned service packages, add-ons, supported zones, durations, price rules, and terms.
- Build address management, booking form, server-calculated quote, booking creation, state transitions, and client booking history.
- Persist a price snapshot and package version with every booking; prevent client-supplied price values from becoming authoritative.
- Add ownership checks, rate limits, validation, idempotency for booking creation, and audit events for state changes.

**Exit:** a client can create and revisit a valid unpaid booking without duplicate records or price drift.

### Phase 3 — Payments and financial records

- Select and integrate one provider through a server-only adapter.
- Implement payment attempts, signed webhook verification, provider-event deduplication, idempotent ledger posting, refunds/adjustments, and reconciliation records.
- Build client payment states and an operations finance view; separate customer charge, provider fee, platform revenue, worker payable, refund, and adjustment entries.
- Use sandbox transactions and operational reconciliation before live keys.

**Exit:** repeated, delayed, invalid, and out-of-order provider events cannot duplicate or silently lose financial effects; refund and reconciliation procedures are documented.

### Phase 4 — Worker onboarding, dispatch, and job execution

- Build worker profile, coverage, skills, availability, onboarding checklist, and restricted verification-review workflow.
- Create an admin dispatch board with eligible-worker filters, assignment history, expiry/decline handling, and reasoned override.
- Add worker assignment acceptance, job details, server-validated clock-in, checklist, evidence upload, clock-out, and incident reporting.
- Make geofence thresholds configurable; record fresh location, accuracy, and decision. Provide a human exception path for poor GPS or incorrect address pins.
- Add private evidence access policies, upload validation, retry-safe uploads, and retention metadata.

**Exit:** only approved, trained, active workers can be assigned; job and override actions are traceable end to end; staff can manage no-acceptance and safety exceptions.

### Phase 5 — Support, notifications, payout operations, and pilot readiness

- Add booking-linked support cases, restricted safety incidents, status notifications, delivery retries, and an operator-visible event log.
- Add earnings statuses and payout batches linked to eligible ledger entries; require approved roles for financial actions and reconcile provider payout references.
- Add MFA for privileged staff, session revocation, audit review, backups/restore procedure, monitoring, alerting, and incident-response runbook.
- Conduct staging walkthroughs for booking, failed payment, duplicate webhook, no available worker, worker decline, late arrival, GPS exception, upload retry, complaint, refund, payout failure, and safety report.

**Exit:** operations can support a small pilot without relying on undocumented manual data changes; support, dispatch, refunds, and payout capacity are staffed.

### Phase 6 — Controlled pilot and public launch

- Start with a small trained worker cohort, limited service slots, and one zone. Keep dispatch human-assisted and review each completed job.
- Track fulfilment, time-to-assignment, late/no-show rates, complaint/rework rate, support response, worker acceptance/utilization, payment reconciliation, payout timeliness, repeat booking, and contribution margin.
- Fix operational bottlenecks and customer confusion before buying significant demand.
- Expand campaign spend and service capacity only when supply, support, quality, safety, and unit economics remain within agreed thresholds.

## Core data areas

Users and role memberships; client and worker profiles; verification cases/checks; service packages and versions; zones; addresses; bookings and line items; assignment attempts; job logs and evidence; payment attempts; append-only ledger transactions/entries; refunds/adjustments; payout batches/items; support cases/incidents; notifications/outbox; audit events. Separate worker verification status from availability/suspension. Do not model dispatch as a single worker ID on the booking or payments as a status field alone.

## Minimum state models

- **Booking:** draft → awaiting payment → confirmed → dispatching → assigned → en route → in progress → submitted for review → completed. Explicit terminal/exception states include payment failed, cancelled, disputed, refunded, and partially refunded.
- **Worker verification:** not started, submitted, in review, needs information, approved, rejected, expired. This is separate from active, unavailable, suspended, and offboarded operational states.
- **Payment/payout:** retain provider attempts and reconciliation outcomes; record refunds and reversals as new entries rather than deleting original financial history.

Every transition needs an authorized actor, allowed predecessor state, timestamp, idempotency behavior where relevant, and any financial effect.

## Suggested initial release gates

- Every launch package has approved scope, pricing, time estimate, and customer terms.
- Payment confirmation comes only from a verified provider event or provider-side status check.
- No unapproved worker can appear in dispatch candidates.
- Dispatch, job execution, evidence access, admin overrides, refunds, and payout approvals are audited.
- Staff can resolve exceptions without editing production rows directly.
- Test customers and workers complete the full flow on common mobile browsers and low-bandwidth connections.
- Restore, payment reconciliation, safety escalation, and customer support procedures have named owners.
- No public claim implies legal escrow, risk-free vetting, guaranteed availability, or insurance coverage beyond confirmed facts.

## Suggested delivery cadence

Plan in short weekly increments, with Phase 0 decisions running alongside Phase 1. A small experienced team may reach a controlled pilot in roughly 6–10 weeks after scope, access, provider onboarding, and content are ready; this is a planning estimate, not a guarantee. Payment-provider approval, legal review, and worker recruitment can extend the calendar independently of code. Keep pilot and public marketing gates separate so demand does not outrun service capacity.

## First backlog slice

1. Confirm the first service zone, 2–3 packages, policies, payment flow, and launch owner.
2. Scaffold Next.js, Tailwind, Supabase environments, migrations, and deployment pipeline.
3. Publish the landing page with validated copy and a waitlist/contact capture if booking operations are not yet ready.
4. Implement auth, role checks, catalogue, server quote, and unpaid booking.
5. Add payment webhooks and financial records, then client booking views.
6. Add operations dispatch and worker job flow.
7. Complete support, verification, payout, monitoring, and pilot rehearsal before opening live slots.

