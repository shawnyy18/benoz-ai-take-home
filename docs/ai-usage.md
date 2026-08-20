# Part 4 — AI Usage

## Tools and models

- **Codex** was the primary repository investigation and implementation tool. The exact model/version is not exposed in the native task export available to me, so I have not guessed it.
- **Claude — exact model/version not exposed in the export.** Claude was used for two independent read-only reviews: first after Parts 1–2, then after the Part 3 workshop.

## How I used AI

I used AI to inspect sources and code, generate and challenge options, implement the approved Part 2 design, write tests and documentation, and review architecture decisions. I made the final calls on what to accept, reject, narrow, or leave out—including approving the top-level validation-rule contract, restricting its scope, choosing which independent-review findings to apply, and accepting the commercial sacrifice in Decision 1.

| Stage | Primary AI | Purpose | Human decision |
|---|---|---|---|
| Repository audit | Codex | Inspect the exercise, starter, tests, and handover | Prioritized source-supported findings |
| Part 1 workshop/finalization | Codex | Challenge severity and false positives | Approved the final issue set and fix-first choice |
| Part 2 design | Codex | Compare validation contracts | Selected minimal definition-level binary rules |
| Part 2 implementation | Codex | Implement, test, and document the contract | Kept unrelated validator behavior out of scope |
| Independent review #1 | Claude | Challenge Parts 1–2 and README usability | Accepted, narrowed, or rejected each finding |
| Corrective pass | Codex | Apply approved review changes | Rejected Claude's proposed `rules: undefined` resolution |
| Part 3 workshop/finalization | Codex | Compare and document the three forced choices | Approved one coherent platform model and its sacrifices |
| Independent review #2 | Claude | Challenge Part 3 consistency and specificity | Accepted engine-version, governance, and rollout refinements |

## One suggestion I rejected

Claude Review #1 identified `{ fields, rules: undefined }` as an edge case and recommended documenting that it throws `TypeError`. I agreed that the behavior needed an explicit decision but rejected that resolution. JavaScript code can naturally copy `rules: definition.rules` from a parsed document where the property was absent, producing `undefined`. Treating that as malformed added surprise without protecting against a meaningful configuration error.

The implemented contract therefore treats explicit `undefined` like an omitted `rules` property, while `null`, objects, and strings still throw `TypeError`. Focused tests cover both sides of that boundary, and the linked Claude Review #1 export preserves the recommendation in its original context.

## Where AI helped least

AI helped least with ambiguous product and regulatory tradeoffs—especially what “infrastructure under the clinic's own control” is intended to mean and whether the forced single-platform choice should sacrifice Client A or Client C. Models could expose assumptions and trace technical and commercial consequences, but they could not determine the regulator's interpretation or Benoz's market priority. I therefore stated the control assumption explicitly, chose one model, and documented who that choice loses rather than presenting AI-generated certainty.

## Transcript exports

The following publication exports preserve the actual conversations in order, with only labeled local-path redactions where needed:

- [Codex session 1](./transcripts/codex-session-01.md)
- [Codex session 2](./transcripts/codex-session-02.md)
- [Codex session 3](./transcripts/codex-session-03.md)
- [Codex session 4](./transcripts/codex-session-04.md)
- [Claude Review #1](./transcripts/claude-review-01.md)
- [Claude Review #2](./transcripts/claude-review-02.md)

## What I left out / least confidence

I deliberately left out unrelated validator fixes such as stricter calendar-date and `Infinity` handling, a general expression engine, implementation of the proposed Part 3 infrastructure and scoring systems, and lower-confidence handover concerns that the supplied material did not prove. I am least confident about the exact operational and regulatory meaning of clinic-controlled infrastructure because the exercise states the requirement but not the regulator's precise boundary; I would confirm account ownership, operator access, backups, keys, and permitted telemetry before committing to that deployment model.
