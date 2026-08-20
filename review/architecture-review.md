# Part 1 — Architecture Handover Review

I reviewed the handover against the three live-client scenarios, prioritizing failures demonstrated by the described behavior over risks that are only possible. Five issues warrant action; several other choices are proportionate at the current scale.

## 1. Sensitive clinic fields can be returned to reception

**Severity: Critical**

The shared list handler selects every column and returns the result directly. Row-Level Security limits which tenant's rows a caller can access, but it does not control which fields within an authorized row are returned. Client C requires reception to see patient and appointment details but not clinical notes. As described, an authorized reception user listing referrals can therefore receive sensitive clinical information they are not permitted to view. This is Critical because it is a direct data disclosure, not merely missing defense in depth.

I would replace `SELECT *` responses with explicit server-side projections or serializers that apply role-aware field visibility, with sensitive fields denied by default. Tests should assert exact response shapes for reception and clinical roles. RLS should remain because tenant isolation and field authorization protect different boundaries.

## 2. The shared deployment conflicts with Client C's infrastructure requirement

**Severity: Critical**

All clients currently share one database and nothing is siloed, while Client C's regulator requires clinic-controlled infrastructure. Logical row isolation cannot meet an infrastructure-control requirement. Even moving the clinic to a database dedicated inside Benoz-controlled infrastructure would not necessarily transfer control to the clinic. The current deployment therefore creates stated regulatory exposure.

I would treat this deployment as unsupported for Client C until the Part 3 platform decision resolves the requirement. That decision and its commercial tradeoff do not belong in this review.

## 3. The audit log is not tenant-scoped

**Severity: Serious**

The centralized `audit_log` schema has actor, action, entity identifiers, and an optional JSON payload, but no `tenant_id`. The handover intentionally treats it as an administrative store outside the tenant-facing model. Consequently, a tenant-specific audit query or access policy cannot scope a log row directly; it must resolve each entity through operational tables. That is a concrete auditability and isolation gap for Client C, which expects audits. The handover does not establish what `payload` contains or any tenant-facing log read path, so I would not claim a proven data leak.

I would add and backfill `tenant_id`, apply explicit access policy, and define payload minimization/redaction rules. Audit writes should remain coupled to the business write. Migration and historical backfill are the main costs.

## 4. Inline notification delivery creates retry ambiguity

**Severity: Serious**

The create path performs the database insert, calls an external provider, and only then returns success. If the insert succeeds but the provider fails or times out, the record exists while the caller receives an error; retrying can duplicate the record or notification. The example also sends Client A's SMS on creation, although the requirement says to send it when the report becomes `Resolved`.

I would commit the record or status transition and its notification event atomically through the existing outbox, then return durable acceptance. Delivery should be asynchronous and observable. This changes the response from “message delivered” to “work accepted,” but removes the ambiguous partial success.

## 5. Outbox deduplication can suppress legitimate events

**Severity: Serious**

Consumers deduplicate on `(event_type, entity_id)`, while the example publishes `application.status_changed`. Two valid transitions for one application—such as `under_review` and later `approved`—share that key. The approval event can be mistaken for a retry and skipped, suppressing the required decision email.

I would give each logical outbox event a stable unique event ID and use it for delivery idempotency. External side effects may also need a business idempotency key. A unique event ID prevents distinct events from collapsing; it does not guarantee an external provider never duplicates an action.

## What looks suspicious but is reasonable

The RLS policy shows `USING` without an explicit `WITH CHECK`, but for an all-commands PostgreSQL policy an omitted `WITH CHECK` inherits the `USING` expression. That omission alone is not a write-isolation defect. I would still verify role ownership, policy coverage, tenant-context lifecycle, and integration tests rather than infer that the snippet proves the entire implementation safe.

JSONB for sparse custom fields is proportionate because all clients request frequent field changes and a fourth client's shape is unknown. Stable domain fields remain relational; frequently queried custom values may later need targeted indexes or promotion to columns.

The transactional outbox is also sound: committing the state change and event together prevents lost work across the database/broker boundary. The defects are its incomplete use and overly broad consumer key, not the pattern.

Finally, Client A's burst of about 4,000 reports in an afternoon does not by itself justify a distributed datastore or search service. PostgreSQL with appropriate indexes is a reasonable baseline until measurements or actual search requirements show otherwise.

## What I would fix first

I would fix referral field visibility first. It is a direct, repeatable disclosure of sensitive patient data, and the narrow server-side projection can be deployed immediately. It is required regardless of the eventual platform-isolation choice and need not wait for Part 3. The infrastructure conflict has broader strategic impact, and the audit-log gap requires schema migration, backfill, and a payload policy; both remain urgent, but neither should delay containing the active response-level exposure.
