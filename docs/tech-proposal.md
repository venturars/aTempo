# aTempo — Technical Proposal

**Version 0.1 · Draft**

Proposal of tools and technologies for implementing the features described in the [Constitution document](../README.md). It is a starting point for discussion, not a final decision: the Constitution states that definitive technologies should be chosen after the functional PRD.

---

## 1. Base stack

| Layer                          | Recommendation                                        | Rationale / alternatives                                                                                                              |
| ------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Web frontends (admin + student) | **Next.js + TypeScript**, Tailwind + shadcn/ui        | One codebase for both web apps. Make the student portal a **PWA** (camera for QR, push notifications, no app store).                    |
| Teacher desktop app            | **Tauri** wrapping the same React components          | Lighter than Electron and reuses the web UI. If offline mode is not needed, it could start as a web app.                                |
| Backend API                    | **FastAPI (Python)**                                  | Best fit for the AI and prediction work. Alternative: NestJS (TypeScript) for a single language across the stack.                      |
| Database                       | **PostgreSQL** with Row-Level Security per organization | Tenant isolation enforced at the database level. **Supabase** bundles Postgres, auth, storage, realtime and pgvector to move fast.     |
| Authentication                 | Supabase Auth / Clerk / Auth0                         | Google and Microsoft SSO are key (schools already use them). SAML later for large organizations.                                       |
| SaaS billing                   | **Stripe Billing**                                    | Subscriptions, per-seat pricing and customer portal out of the box.                                                                     |
| Background jobs                | Redis + Celery (or arq)                               | Notifications, predictions, exports and integration webhooks.                                                                          |
| Realtime                       | WebSockets / Supabase Realtime                        | Live session view for the teacher (who has checked in, who is late).                                                                    |

## 2. Technologies by feature

### 2.1. Attendance check-in

Pending decision (Constitution §13). Candidate mechanisms:

- **Rotating QR code**: the teacher's screen shows a signed token that rotates every 10–30 s (TOTP-like), so a forwarded photo quickly becomes useless.
- **Periodic presence checks**: push notification asking the student to confirm mid-session. Covers the "entry, permanence and exit" requirement (§11).
- **Videoconference**:
  - Zoom: webhooks `participant_joined` / `participant_left`.
  - Microsoft Teams: attendance reports via Microsoft Graph.
  - Google Meet: conference records through the Meet REST API.
- Optional: geofencing or classroom Wi-Fi/BLE beacons — to be weighed carefully against privacy (GDPR).

### 2.2. AI chatbot with RAG

- **Claude API**: `claude-haiku-5-5` for high-volume, low-cost queries; `claude-sonnet-5-5` for complex ones.
- **pgvector** for documentation embeddings, with **mandatory organization and role filters** on every retrieval to prevent cross-tenant leaks.
- For personal data ("what's my attendance %?"), use **tool use** to call the aTempo API rather than indexing that data in the vector store: fresher answers and permissions stay enforced by the API.
- Feedback: 👍/👎 per answer, stored and analyzed with **Langfuse** (observability and evals).

### 2.3. Attendance predictions

- **Phase 1 — SQL rules**: e.g. "absent ≥ 3 of the last 5 sessions on this weekday". Explainable, consistent with human review (§9, §11).
- **Phase 2 — ML**: **scikit-learn / LightGBM** with simple features (weekday, time slot, recent streak, course), run as a nightly job.
- Every alert shows the *reason*, not just a score.

### 2.4. Audit and integrity ("blockchain")

Building a real blockchain is not recommended. Equivalent guarantees at a fraction of the cost:

- **Append-only audit table with a hash chain**: each row includes the hash of the previous one. Corrections are new entries, never edits.
- **Periodic anchoring** of the latest hash to **OpenTimestamps** (free, Bitcoin-backed) or an RFC 3161 timestamping authority.
- **Exports**: PDF generated with WeasyPrint or Playwright, including hash, version, generator ID and period (§11), plus a **QR code linking to a public verification page**.
- If advanced cryptographic certification is required: **PAdES** digital signature on the PDFs.

### 2.5. Notifications and integrations

- **Novu** (open source) to orchestrate one event across email, push, in-app and chat.
- Email: Resend or Postmark. Push: Web Push API or FCM.
- Chat: Slack Bolt, Telegram Bot API, discord.js.
- **Nango** to manage OAuth and token refresh across many integrations.

### 2.6. Gamification and Tempito

- **Rive** (or Lottie) for an animated pet whose state (energy, mood, evolution stage) is driven by data.
- Streaks, rewards and excused-absence rules are computed **server-side** to prevent client-side tampering.
- Leaderboards with Redis sorted sets.

### 2.7. Visual themes

- Design tokens as CSS variables, Tailwind `dark:` variants, and per-user preference stored in the profile.

## 3. Cross-cutting concerns

- **GDPR and EU hosting**: student data, potentially including minors. Use EU regions (Supabase EU, Fly.io Madrid/Frankfurt) and minimize data collection.
- **Observability**: Sentry for errors, PostHog for product analytics.
- **Tooling**: Turborepo monorepo, Docker, GitHub Actions for CI.

## 4. Suggested MVP order

1. Auth, multi-tenancy, courses and sessions.
2. QR check-in with audit log.
3. Dashboards and exports with integrity hash.
4. Notifications.
5. Rule-based predictions.
6. Chatbot.
7. Tempito, games and integrations.

### 4.1. Guiding principles

1. **Build what other features depend on first.**
2. **Deliver the core promise early:** verifiable attendance.
3. **Settle the riskiest open decisions while changes are still cheap.**
4. **Add the extras last.** The Constitution (§3) says chatbot, games and gamification must not get in the way of the main experience.

### 4.2. Justification

**1. Auth, multi-tenancy, courses and sessions**

- Everything else depends on these: check-in needs a session, a session needs a course, and a course belongs to an organization and its users.
- Multi-tenancy is the hardest thing to retrofit. Row-level security per organization, roles and permissions shape every table and query; adding them later is close to a rewrite.
- No user-visible value yet, so keep it small: a minimal admin to create courses and enroll people.

**2. QR check-in with audit log**

- This is the product's reason to exist (§2): replacing the manual roll call.
- It answers the biggest open question in §13, how attendance is captured. Testing QR with real classes early shows whether periodic checks or videoconference integrations are also needed.
- The audit log goes in **now, not later**. §11 requires every correction to record who, when and why. Starting the hash chain on day one means every record is covered, no legacy data needs migrating, and the data model is right from the start (corrections are new entries).

**3. Dashboards and exports with integrity hash**

- Steps 1–2 produce data; this step makes it useful to the paying customer: organization admins checking compliance, and certification.
- Steps 1–3 form a **sellable MVP**: "we take attendance faster, and you get reports you can prove". Enough for a first pilot with a real school.
- The compliance calculation (hours, sessions or both — pending in §13) is decided here, with real data.

**4. Notifications**

- They react to events created by earlier steps (late class start, student warning about lateness, excuse documents received). Without sessions and check-ins there is nothing to notify.
- They save daily effort for teachers and students and need no AI.
- They set up the job queue and delivery channels reused by steps 5–7 (prediction alerts, Tempito streaks, Slack/Telegram).

**5. Rule-based predictions**

- They need **weeks of attendance history**; shipped earlier, alerts would have nothing to go on.
- Starting with SQL rules keeps alerts explainable, as required by §9 and §11, and validates usefulness with the pilot before investing in ML.
- They live inside existing surfaces: the dashboards (step 3) and notifications (step 4).

**6. Chatbot**

- RAG needs content: product documentation (written as features stabilize) and real data to answer about.
- It is the riskiest feature for privacy: a retrieval mistake can leak data across organizations or roles, so it should come after permissions are proven in production.
- It has an ongoing per-use cost (LLM calls), better taken on once the business model is validated.

**7. Tempito, games and integrations**

- **Games**: their types are still undefined (§13).
- **Tempito**: its rules depend on how excused absences are handled, settled in steps 2–3. Building it earlier risks unfairly penalizing students (§8).
- **Integrations**: each platform is a separate project (OAuth, APIs, maintenance), and §7.1 already plans them as gradual.
- These features drive engagement and retention — the right focus once the core works.

### 4.3. Possible reorderings

- **Videoconference integration → step 2** if the first customers teach online: it becomes a core check-in mechanism, not an extra.
- **Basic Tempito → after step 3** if the pilot shows low voluntary check-in adoption: a simple streak counter is cheap motivation.
- **Notifications → alongside step 2**: the "I'll be late / I won't come" warning is part of the student Dashboard (§12), so a minimal email version can ship with check-in.

The fixed part of the sequence is **multi-tenancy → check-in + audit → evidence**. Everything after that is negotiable based on what the pilot shows.

## 5. Open technical decisions

- Backend language: Python (FastAPI) vs. full TypeScript (NestJS). It drives most other choices.
- Supabase (managed, faster start) vs. self-managed PostgreSQL and auth.
- Tauri desktop app vs. web-only teacher app for the MVP.
- Required certification level: auditable hash chain vs. PAdES digital signatures.
