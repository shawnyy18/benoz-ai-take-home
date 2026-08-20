# Decision 1 — Isolation

**My choice:** one dedicated deployment per client, installed in infrastructure controlled by that client. Every installation runs the same versioned product, configuration model, test suite, and release artifact. There is no separate pooled tier for cheaper customers.

I am assuming “under the clinic's own control” means the customer controls the cloud or environment account, IAM, databases and other data stores, backups, network policy, and operator access. Benoz receives only access the customer explicitly grants and governs. I would confirm that interpretation with the clinic and regulator before committing, but it is the basis for this architecture choice.

This is the only single model that satisfies Client C as stated. A shared Benoz platform fails even with strong RLS, and a Benoz-managed dedicated database is still not clinic-controlled. Separate deployments also contain data access, traffic bursts, and infrastructure failures within each customer's boundary.

The sacrifice is cost and onboarding speed. Resources and operational work cannot be pooled, creating a meaningful per-client floor for deployments, migrations, monitoring, backups, secrets, and support. A prepared environment might deploy quickly, but Benoz cannot guarantee same-day onboarding because the customer must first provide an approved account, IAM and access, and any required security or procurement approval. **Under this forced choice, I would lose Client A as described.** I would also lose other price-sensitive customers unable to provide or fund a dedicated environment.

This does not recreate separate client-specific systems: the code remains one product and client differences remain configuration. What multiplies is the number of installations, not the number of codebases. That moves substantial complexity into fleet operations, which is the scaling consequence addressed in Decision 3.
