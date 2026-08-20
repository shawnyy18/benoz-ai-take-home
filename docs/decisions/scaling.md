# Decision 3 — What Breaks First

**Component:** the fleet migration and rollout executor—the system responsible for applying application releases, database schema migrations, and rollout state across customer-controlled deployments.

I am answering this against the platform topology chosen in Decision 1: at 300 clients there are 300 customer-controlled environments, not one 300-tenant database. The handover relies on an administrative PostgreSQL role for migrations and maintenance. Under the chosen model, Benoz cannot assume standing administrative access to every customer database; each environment can have different IAM, network paths, maintenance windows, and approval processes. Safe schema change execution therefore becomes a fleet coordination problem before aggregate database capacity becomes one.

The symptoms would be mixed application and schema versions, migrations that stall or partially apply, customers unable to receive critical patches, manual rollback or customer-DBA intervention, and failures reproducible only in particular installations. I would monitor fleet version distribution, rollout lead time and failure rate, migration and rollback failures, patch age, and manual interventions per release.

I would first inventory every deployed application/schema version and define supported compatibility windows. Then I would produce one immutable signed artifact, versioned deployment definitions, and idempotent migrations with preflight checks, explicit state, and tested recovery paths. Rollouts would be staged rather than simultaneous and executed by a local customer-approved runner, so the executor does not require standing database credentials.

A central control plane may receive only allow-listed operational metadata such as deployment identifier, artifact and schema versions, migration status, health status, and timestamp. It must not receive application records, clinical data, record identifiers, application logs or error payloads containing customer data, or business-event volumes. Egress remains customer-governed, and an installation must continue operating if telemetry is disconnected.

If the platform instead remained one shared Benoz-managed deployment, I would investigate the shared PostgreSQL connection pool first. That is a counterfactual, not a second answer.
