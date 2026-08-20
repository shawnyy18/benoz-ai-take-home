# Codex main session — publication export 2 of 4

Source: native Codex task history for “Audit Benoz.AI starter repository”.

Scope: completed user and assistant conversation messages in chronological order. Internal reasoning summaries and tool-event metadata are not conversation messages and are not included.

Integrity: message text is preserved except for the labeled local-path redactions documented in the private redaction log.

## Turn 3

### User

# Files pasted by the user:

## "# Benoz.AI Take-Home — Phase 3: Finalize Part 1 Architecture Review Continue fr…": [REDACTED — local attachment path]/2137baee-db6b-4f8a-813f-5be38d6b71d0/pasted-text.txt

Pasted text contains the user's request.

## My request:

### Codex — commentary

I’ll read the pasted Phase 3 instructions directly, then follow them as the current request without restarting earlier analysis.

### Codex — commentary

I’ll now finalize the approved Part 1 artifact. I’m using the PDF review workflow to re-check the client requirements and severity definitions, then I’ll write the public review, correct the deadline chronology in the private worklog, add the four private interview-note entries, and run a focused evidence/word-count/change-scope review.

### Codex — commentary

The approved findings remain supported after source re-reading. I’m writing them with two deliberate limits: the clinic infrastructure finding will identify incompatibility without choosing Part 3’s isolation model, and the sensitive-field finding will criticize response projection—not RLS tenant isolation.

### Codex — commentary

The draft is in place. I’m now applying the requested self-review against evidence, failure mode, severity, proportionality, Part 3 scope, and confidence. I’ll revise once based on that review, then verify source hashes and report only the files actually changed.

### Codex — commentary

The self-review found one wording overreach: the handover explicitly proves a shared database/pool and no silo, but does not literally use the phrase “same infrastructure.” I revised that sentence to track the source exactly while retaining the incompatibility with the clinic-controlled requirement. The final review remains within the target length.

### Codex — final response

# Part 1 Created

Path: review/architecture-review.md [REDACTED — local file link]

The exercise source was rechecked before writing. :codex-file-citation{path="[REDACTED — local workspace path]/Benoz.AI - Take-Home Exercise.docx.pdf" purpose="source"}

# Final Word Count

840 words.

# Four Findings

1. **Critical:** Referral list responses can expose clinical notes to reception.
2. **Critical:** The shared deployment cannot meet Client C’s infrastructure-control requirement.
3. **Serious:** Inline notification delivery creates ambiguous failures and duplicate retries.
4. **Serious:** Outbox deduplication can suppress distinct status-change events.

# Fix First

Referral field-level visibility. It is a direct sensitive-data disclosure with a narrow fix required under any future isolation architecture.

# Intentional Omissions

Tenant-context injection/leak claims, Critical audit-log claims, scoring design, configuration versioning, noisy-neighbor scaling, and Part 3’s final isolation choice were intentionally excluded due to insufficient evidence, lower priority, or scope.

# Files Changed

- architecture-review.md [REDACTED — local file link]
- AI-WORKLOG.md [REDACTED — private local file link]
- INTERVIEW-NOTES.md [REDACTED — private local file link]

The worklog now records August 22 as the operative extended deadline. Employer-provided source, code, fixtures, and tests retained their original hashes. No tests were run because those files were untouched.

No Git repository exists, so no Git diff was available. Nothing was committed, pushed, published, or deployed.

# Any Remaining Concern

The review treats the handover snippets as representative, as instructed. If production has an unmentioned response serializer or unique event identifier, Findings 1 or 4 would need reassessment.

# Recommended Next Phase

**Part 2 — Cross-Field Validation API Design Workshop**

Not started.

## Turn 4

### User

# Benoz.AI Take-Home — Phase 4: Cross-Field Validation API Design Workshop

Continue from the completed work:

- Phase 1 — repository discovery;
- Phase 2 — architecture review workshop;
- Phase 3 — finalized Part 1 in `review/architecture-review.md`.

This phase focuses ONLY on **Part 2 design**.

Do NOT implement the feature yet.

Do NOT modify:

- `lib/validate.js`;
- existing tests;
- client fixtures;
- employer-provided source files.

Do NOT begin Part 3.

Do NOT invoke Claude yet.

Do NOT build the submission website.

The objective is to make the cross-field validation API contract precise enough that another engineer could implement and use it correctly from the README alone.

---

# PRIMARY REQUIREMENT

Benoz.AI asks us to extend the validation definition format so a relationship such as:

> project end date must not be before project start date

can be declared as **data rather than custom code**.

The library must remain client-agnostic.

The employer will later create a definition for an unseen client using only our documented format.

Therefore:

**The public API design is the most important part of this phase.**

We must decide the contract before implementing it.

---

# EXISTING SYSTEM CONSTRAINTS

Use the actual existing repository as the source of truth.

The current library is intentionally minimal:

```text
CommonJS JavaScript
Node built-in test runner
No external dependencies
validateRecord(definition, record)
=> {
     valid: boolean,
     errors: [
       {
         field,
         message
       }
     ]
   }
```

Existing field validation should remain conceptually intact.

Do not convert the project to TypeScript.

Do not introduce dependencies unless absolutely necessary.

Do not redesign the entire validation library.

Prefer a small extension that fits the existing style.

---

# STEP 1 — RE-READ THE PART 2 SOURCE

Before proposing designs, re-read:

- the official Part 2 instructions;
- the supplied README;
- `lib/validate.js`;
- `test/validate.test.js`;
- all three supplied client definitions.

Verify the current validation format and runtime behavior directly.

Do not rely only on Phase 1 notes.

---

# STEP 2 — IDENTIFY THE DESIGN DIMENSIONS

We need deliberate decisions for each of these.

## 1. Where cross-field rules live

Evaluate whether rules should live:

### Option A

At the top-level definition:

```json
{
  "fields": [...],
  "rules": [...]
}
```

### Option B

On the field that owns the error:

```json
{
  "name": "end_date",
  "cross_field": [...]
}
```

### Option C

Another minimal structure justified by the existing library.

Do not choose based on aesthetics.

Evaluate:

- clarity;
- extensibility;
- hidden-test usability;
- error ownership;
- implementation simplicity;
- client independence.

---

# STEP 3 — FIELD REFERENCE FORMAT

Decide how one field refers to another.

Possible examples:

```json
{
  "field": "project_end",
  "operator": "gte",
  "other_field": "project_start"
}
```

or:

```json
{
  "field": "project_end",
  "operator": ">=",
  "value": {
    "field": "project_start"
  }
}
```

or another design.

We do NOT need a generic expression language.

Evaluate:

- readability;
- JSON friendliness;
- ambiguity;
- future extensibility;
- documentation burden.

The hidden evaluator should be able to construct a valid rule without guessing.

---

# STEP 4 — SUPPORTED OPERATORS

Decide the smallest useful operator vocabulary.

At minimum the example requires ordering.

Possible operators include:

```text
eq
neq
gt
gte
lt
lte
```

But do not automatically support all six.

For every operator considered, ask:

> Does supporting this materially improve the abstraction without increasing ambiguity or implementation risk?

Consider whether equality and inequality are safe/general enough to include.

Avoid:

- arithmetic expressions;
- nested boolean logic;
- arbitrary JavaScript;
- custom user code;
- regex-like cross-field expressions;
- full rules-engine behavior.

We are not building a DSL.

---

# STEP 5 — TYPE COMPATIBILITY

Define precisely what values can be compared.

Existing field types include concepts such as:

```text
text
long_text
number
boolean
date
choice
multi_choice
file
```

Determine which cross-field comparisons should be supported.

For example:

### Number

```text
gt
gte
lt
lte
eq
neq
```

may make sense.

### Date

Ordering may make sense.

### Text / choice

Equality might make sense, but ordering may not.

### Boolean

Equality may make sense.

### Arrays/files

Possibly unsupported.

Do not expand scope just because JavaScript technically allows comparison.

Define semantic compatibility.

---

# STEP 6 — DATE COMPARISON

The existing date validator accepts strings formatted as:

```text
YYYY-MM-DD
```

Phase 1 found that the existing implementation has imperfect real-calendar validation.

Do NOT silently fix the existing date validator in this task.

For cross-field date comparison, determine how we should compare values that have already passed existing field validation.

Prefer behavior that remains consistent with existing expectations.

Document any limitation.

---

# STEP 7 — ERROR OWNERSHIP

Benoz.AI explicitly asks us to define which field receives the error.

Example:

```text
start_date = 2026-08-20
end_date   = 2026-08-10
```

Possible choices:

### A

Attach error to `end_date`.

### B

Attach error to both.

### C

Attach to the rule/object.

Because the current error format is:

```js
{
  field,
  message
}
```

a field must probably own the error.

Recommend the cleanest model.

Strongly consider making the field on the left-hand side / subject of the rule own the error.

But challenge that assumption before accepting it.

---

# STEP 8 — MISSING DEPENDENCIES

Define behavior when one field is absent.

Example:

```text
start_date = missing
end_date = present
```

Consider interaction with:

- required fields;
- optional fields;
- blank strings;
- null;
- undefined;
- empty arrays.

We should avoid producing confusing secondary errors.

Possible behavior:

> Skip a cross-field rule if either operand is absent. Presence/required validation remains the responsibility of the normal field validators.

Evaluate whether that is the best choice.

---

# STEP 9 — INVALID DEPENDENCIES

This is particularly important.

Example:

```text
start_date = "banana"
end_date   = "2026-08-20"
```

If `start_date` already fails its own date validation, should the cross-field rule also produce:

> end_date must be on or after start_date

Probably not.

Consider a two-phase design:

```text
Phase 1
field validation

Phase 2
cross-field validation only when all referenced operands passed field validation
```

Evaluate this explicitly.

Avoid cascading errors based on invalid values.

---

# STEP 10 — NONEXISTENT FIELD REFERENCE

Differentiate:

### User data problem

Referenced field exists in the definition but is absent from the submitted record.

versus:

### Configuration problem

Rule references a field that does not exist in `definition.fields`.

Determine whether the latter should:

- throw;
- return a validation error;
- silently skip;
- use another mechanism.

Strong preference: malformed definitions should fail clearly rather than silently behave differently.

But consider compatibility with the current library.

---

# STEP 11 — UNKNOWN OPERATOR

Same question.

Example:

```json
{
  "operator": "approximately_equal"
}
```

Should this be:

- configuration exception;
- normal record error;
- ignored?

Choose and document one behavior.

A hidden evaluator must not have to guess.

---

# STEP 12 — TYPE-INCOMPATIBLE RULES

Example:

```text
number field >= date field
```

or:

```text
file < boolean
```

Determine whether this is a malformed definition.

Avoid JavaScript implicit coercion.

We should prefer explicit semantic comparison.

---

# STEP 13 — ERROR MESSAGE DESIGN

Existing errors use:

```js
{
  field,
  message
}
```

Do not redesign the public error shape unnecessarily.

Design predictable messages.

For example:

```text
"Project end date must be on or after Project start date"
```

or a generic equivalent based on field labels.

Determine whether rules should allow:

```json
{
  "message": "End date must not be before start date"
}
```

Evaluate custom messages versus generated messages.

Questions:

- Does a custom message improve configurability?
- Does it complicate hidden-test expectations?
- Should it be optional?
- Should labels be used for generated messages?

---

# STEP 14 — MULTIPLE RULES

Determine behavior when a field participates in multiple rules.

Example:

```text
end_date >= start_date
end_date <= reporting_deadline
```

The design should support multiple rules without ambiguity.

Define rule execution order if relevant.

Do not build boolean expression grouping.

---

# STEP 15 — PROPOSE 3 DESIGNS

Present exactly THREE viable rule-format designs.

For each provide:

## Format

Example JSON.

## Strengths

## Weaknesses

## Hidden-test usability

## Implementation complexity

## Extensibility

## Why we might reject it

Do not make one obviously bad just to make the recommendation easy.

All three should be plausible.

---

# STEP 16 — RECOMMEND ONE DESIGN

After comparison, recommend exactly ONE.

Explain:

- why it best fits the current library;
- why it is easy to document;
- why the hidden evaluator can use it reliably;
- why it avoids overengineering;
- what it intentionally does not support.

Do not implement it yet.

---

# STEP 17 — DEFINE THE COMPLETE CONTRACT

For the recommended design, provide a proposed specification covering:

## Definition syntax

Exact JSON structure.

## Rule subject

Which field owns the rule.

## Field reference

How dependencies are referenced.

## Operators

Exact supported list.

## Type/operator compatibility

Prefer a clear table.

Example:

| Type   | eq | neq | gt | gte | lt | lte |
| ------ | -: | --: | -: | --: | -: | --: |
| number |  ✓ |   ✓ |  ✓ |   ✓ |  ✓ |   ✓ |
| date   |  ✓ |   ✓ |  ✓ |   ✓ |  ✓ |   ✓ |
| text   |  ✓ |   ✓ |  — |   — |  — |   — |

Only include actual recommended behavior.

## Missing value behavior

## Invalid dependency behavior

## Missing field-reference behavior

## Unknown operator behavior

## Type incompatibility behavior

## Error ownership

## Error message behavior

## Multiple-rule behavior

## Execution order

## Backward compatibility

## Explicitly unsupported behavior

---

# STEP 18 — TEST MATRIX

Design the tests we would write in the next phase.

Do NOT implement them yet.

Organize into:

## Happy paths

Examples:

- valid number comparison;
- valid date comparison;
- equality boundary.

## Validation failures

Examples:

- end date before start date;
- number violates threshold relationship.

## Missing values

## Invalid dependency

## Invalid rule configuration

## Type mismatch

## Multiple rules

## Backward compatibility

For each proposed test state:

```text
Scenario
Expected valid
Expected error field
Expected behavior
```

We do not need dozens of redundant tests.

Aim for strong coverage of semantics.

---

# STEP 19 — HIDDEN-TEST SIMULATION

Pretend you are a Benoz.AI evaluator who has never seen our implementation.

Using only the proposed documentation, write 2–3 example unseen definitions.

For example:

### Unknown Client X

```text
booking_end >= booking_start
```

### Unknown Client Y

```text
maximum_amount >= minimum_amount
```

Verify that the format is obvious without relying on knowledge of our code.

If you discover ambiguity, revise the proposed design before recommending it.

---

# STEP 20 — DON'T FIX UNRELATED VALIDATOR BEHAVIOR

Do not use this task to fix:

- impossible calendar dates;
- `Infinity`;
- duplicate multi-choice values;
- null definition handling;
- invalid regex behavior;
- unknown optional field behavior;
- unrelated error messages.

Those were discovered during Phase 1 but are outside the requested change.

Document boundaries where relevant.

---

# STEP 21 — AI WORKLOG

Update `private/AI-WORKLOG.md` only if this design workshop produces genuine:

- rejected designs;
- changed opinions;
- identified AI overengineering;
- unresolved uncertainty.

Do not manufacture disagreement.

This phase is likely to produce a useful genuine rejected suggestion because we are comparing API designs.

---

# OUTPUT

Return exactly:

# 1. Existing Constraints

# 2. Design Questions

Short summary of the important choices.

# 3. Option A

# 4. Option B

# 5. Option C

# 6. Comparison Table

# 7. Recommended Design

# 8. Complete Proposed Contract

# 9. Proposed Test Matrix

# 10. Hidden-Test Simulation

# 11. Explicit Non-Goals

# 12. Risks / Open Questions

# 13. AI Worklog Update

# 14. Recommended Next Phase

The next phase should be:

**Part 2 — Implement the Approved Cross-Field Validation Design**

But do NOT begin implementation automatically.

---

# STOP CONDITION

After completing the design workshop:

STOP.

Do not change:

- `lib/validate.js`;
- test files;
- README public documentation.

Do not implement anything.

Do not start Part 3.

Do not invoke Claude.

Wait for my approval.

### Codex — commentary

I’ll keep this as a contract workshop: three genuinely viable formats, one recommendation, exact configuration/error semantics, and a focused future test matrix. I’ll re-read the Part 2 brief, README, implementation, complete test file, and all client definitions now; only the ignored AI worklog may be updated afterward if the comparison produces a real rejected design.

### Codex — commentary

I’m also using the PDF review workflow for the official Part 2 wording, because the README and the exercise together define the hidden-test contract. This is read-only; no PDF or public documentation will be edited in this phase.

### Codex — commentary

The format comparison produced a genuine design rejection worth logging: field-attached rules make error ownership concise but scatter relationships through field definitions, while generic left/right operand objects add an unnecessary second way to declare error ownership and invite a future expression DSL. I’m recording the decision to prefer a flat top-level binary rule; no public README, code, tests, or fixtures are being changed.

### Codex — final response

# 1. Existing Constraints

The official Part 2 instructions, supplied README, implementation, complete test suite, and all three client definitions were re-read. :codex-file-citation{path="[REDACTED — local workspace path]/Benoz.AI - Take-Home Exercise.docx.pdf" purpose="source"}

The design must preserve:

- CommonJS JavaScript and Node 18+.
- No external dependencies.
- `validateRecord(definition, record)`.
- Record-validation output of `{ valid, errors: [{ field, message }] }`.
- Existing presence semantics:
  - absent: `undefined`, `null`, blank strings, empty arrays;
  - present: `false`, `0`, objects.
- Existing field validators and error behavior.
- Client-independent code.
- Existing definitions with no cross-field rules.

The untouched baseline remains 16 passing, 0 failing.

# 2. Design Questions

The important decisions are:

- Rules belong at definition level or inside individual fields.
- References must use exact field names without expression syntax.
- The operator vocabulary must be useful but bounded.
- Comparisons must be type-aware and must not use JavaScript coercion.
- The rule’s subject field should own its error.
- Missing operands should skip the relationship check.
- Invalid operands should not create cascading cross-field errors.
- Malformed rules are configuration failures, not user-record errors.
- Multiple rules should be independent and deterministic.
- Default messages should be predictable, with a small custom-message escape hatch.
- Existing unrelated validator limitations must remain untouched.

# 3. Option A

## Format

Flat definition-level binary rules:

```json
{
  "fields": [
    {
      "name": "project_start_date",
      "label": "Project start date",
      "type": "date",
      "required": true
    },
    {
      "name": "project_end_date",
      "label": "Project end date",
      "type": "date",
      "required": true
    }
  ],
  "rules": [
    {
      "field": "project_end_date",
      "operator": "gte",
      "other_field": "project_start_date"
    }
  ]
}
```

## Strengths

- Every relationship is visible in one definition-level list.
- Error ownership is explicit through `field`.
- The format maps directly to a binary comparison.
- Simple to validate before examining record values.
- Adds one optional top-level property without changing field definitions.
- Easy to document without introducing operand/expression concepts.

## Weaknesses

- Repeats the subject field name.
- Slightly more verbose than attaching a rule directly to the subject field.
- It is intentionally limited to two fields.

## Hidden-test usability

High. An evaluator needs only four documented keys: `field`, `operator`, `other_field`, and optional `message`.

## Implementation complexity

Low. Resolve two fields, verify compatibility, then evaluate in a second phase.

## Extensibility

Moderate and controlled. More binary operators can be added later without changing the shape, but compound expressions would require an explicit new design.

## Why we might reject it

If minimizing repetition were more important than central rule discovery, the field-attached format would be smaller.

# 4. Option B

## Format

Attach each rule to the field that owns the error:

```json
{
  "fields": [
    {
      "name": "project_start_date",
      "label": "Project start date",
      "type": "date",
      "required": true
    },
    {
      "name": "project_end_date",
      "label": "Project end date",
      "type": "date",
      "required": true,
      "rules": [
        {
          "operator": "gte",
          "other_field": "project_start_date"
        }
      ]
    }
  ]
}
```

## Strengths

- Error ownership is implicit and unambiguous.
- Avoids repeating the subject field name.
- Keeps rules near the field most likely to display the error.
- Runtime implementation remains small.

## Weaknesses

- Cross-field relationships are scattered through `fields`.
- Reviewing or validating the complete rule set requires scanning every field.
- A definition-level concern becomes mixed with per-field constraints.
- Future rules that do not naturally belong to one field would not fit cleanly.

## Hidden-test usability

High, provided the README clearly states that the containing field is the rule subject. However, evaluators must notice that rules are nested within fields rather than at definition level.

## Implementation complexity

Low, but the existing field loop would need to collect rules and defer them until all field validation is complete.

## Extensibility

Moderate. It extends field-owned relationships well but creates pressure to force future rule categories into individual fields.

## Why we might reject it

The smaller syntax is outweighed by distributing relationships across the field list and blending two validation phases in the definition format.

# 5. Option C

## Format

Definition-level rules with generic operand objects:

```json
{
  "fields": [
    {
      "name": "project_start_date",
      "label": "Project start date",
      "type": "date",
      "required": true
    },
    {
      "name": "project_end_date",
      "label": "Project end date",
      "type": "date",
      "required": true
    }
  ],
  "rules": [
    {
      "left": {
        "field": "project_end_date"
      },
      "operator": "gte",
      "right": {
        "field": "project_start_date"
      },
      "error_field": "project_end_date"
    }
  ]
}
```

## Strengths

- Makes both operands structurally explicit.
- Could later support literal operands without changing the outer shape.
- Symmetrical representation works for other binary relationships.
- Error ownership is separately configurable.

## Weaknesses

- More verbose for the required use case.
- `error_field` can contradict or be unrelated to `left.field`.
- Introduces operand terminology that the current library does not need.
- Encourages future literals, nesting, and expression-tree behavior.
- More configuration validation is required.

## Hidden-test usability

Good, but the evaluator must understand three concepts—operands, operator, and error target—rather than one subject/dependency relationship.

## Implementation complexity

Medium. Operand parsing and independent error-field validation add code without improving the requested comparison.

## Extensibility

High, but much of that extensibility points toward a rule DSL that is intentionally out of scope.

## Why we might reject it

It optimizes for hypothetical expression features rather than the current requirement and creates avoidable error-ownership ambiguity.

# 6. Comparison Table

| Dimension | Option A: flat top-level | Option B: field-attached | Option C: operand objects |
|---|---|---|---|
| Definition clarity | High | High locally; lower globally | Medium |
| Rule discoverability | High | Medium | High |
| Error ownership | Explicit subject | Implicit containing field | Separate property |
| Hidden-test usability | High | High | Good |
| Implementation complexity | Low | Low | Medium |
| Configuration validation | Straightforward | Distributed across fields | Most complex |
| Client independence | Yes | Yes | Yes |
| Multiple rules | Natural array order | Distributed arrays | Natural array order |
| Future binary operators | Easy | Easy | Easy |
| Pressure toward a DSL | Low | Low–medium | High |
| Fit with current library | Best | Good | Acceptable |
| Main cost | Repeats field name | Scatters relationships | Excess structure |

# 7. Recommended Design

I recommend **Option A: a flat top-level `rules` array**.

It fits the current definition-driven library without changing existing field objects. Each rule states:

- the subject field;
- the operator;
- the dependency field;
- optionally, a custom message.

The evaluator can construct an unseen definition without understanding implementation details or expression syntax. The shape makes error ownership explicit and allows the library to validate rule configuration before validating the record.

The design deliberately supports only binary field-to-field comparisons. It does not support constants, arithmetic, compound conditions, nested expressions, callbacks, or client-specific logic.

I recommend all six operators—`eq`, `neq`, `gt`, `gte`, `lt`, and `lte`—but only for semantically compatible types. This is still a small vocabulary:

- equality supports confirmation or matching fields;
- inequality supports explicitly distinct values;
- strict and inclusive ordering are both necessary for common ranges;
- type restrictions prevent JavaScript’s generic comparison behavior from becoming the contract.

# 8. Complete Proposed Contract

## Definition syntax

`rules` is an optional top-level array:

```json
{
  "fields": [
    {
      "name": "project_start_date",
      "label": "Project start date",
      "type": "date",
      "required": true
    },
    {
      "name": "project_end_date",
      "label": "Project end date",
      "type": "date",
      "required": true
    }
  ],
  "rules": [
    {
      "field": "project_end_date",
      "operator": "gte",
      "other_field": "project_start_date",
      "message": "Project end date must not be before project start date"
    }
  ]
}
```

Each rule has exactly these properties:

| Property | Required | Meaning |
|---|---:|---|
| `field` | Yes | Subject field being constrained and error owner |
| `operator` | Yes | Comparison operator |
| `other_field` | Yes | Field the subject is compared with |
| `message` | No | Non-empty custom error message used verbatim |

Unknown rule properties are configuration errors. Field references are case-sensitive and must exactly match field `name` values.

## Rule subject

For:

```json
{
  "field": "project_end_date",
  "operator": "gte",
  "other_field": "project_start_date"
}
```

the rule means:

```text
record.project_end_date >= record.project_start_date
```

`field` is always the left-hand operand, subject, and error owner.

## Field reference

Both `field` and `other_field` must:

- be non-empty strings;
- resolve to exactly one field in `definition.fields`;
- refer to different fields.

A missing or ambiguous reference is invalid configuration.

## Operators

The exact operator list is:

| Operator | Meaning |
|---|---|
| `eq` | subject equals dependency |
| `neq` | subject does not equal dependency |
| `gt` | subject is strictly greater/later |
| `gte` | subject is greater/later or equal |
| `lt` | subject is strictly less/earlier |
| `lte` | subject is less/earlier or equal |

Operator names are case-sensitive.

## Type/operator compatibility

Both referenced fields must have the same exact field type.

| Field type | `eq` | `neq` | `gt` | `gte` | `lt` | `lte` |
|---|---:|---:|---:|---:|---:|---:|
| `number` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `date` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `text` | ✓ | ✓ | — | — | — | — |
| `long_text` | ✓ | ✓ | — | — | — | — |
| `choice` | ✓ | ✓ | — | — | — | — |
| `boolean` | ✓ | ✓ | — | — | — | — |
| `multi_choice` | — | — | — | — | — | — |
| `file` | — | — | — | — | — | — |

There is no implicit coercion:

- number values compare numerically;
- text, long-text, and choice equality is exact and case-sensitive;
- Boolean equality is strict;
- cross-type comparisons are invalid configuration.

## Date comparison

A date rule runs only after both fields pass the existing date validator.

Because valid-format dates are fixed-width `YYYY-MM-DD` strings, ordering uses direct lexical comparison. This avoids timezone behavior and JavaScript date normalization.

The existing date validator’s imperfect calendar-date handling remains unchanged. Consequently, a value such as `2027-02-30` may still pass field validation and participate in lexical comparison. Fixing that is explicitly outside this change.

## Missing value behavior

If either operand is absent according to the existing `isPresent` semantics, the rule is skipped.

Examples:

- missing required dependency: normal required error only;
- missing optional dependency: no cross-field error;
- blank string, `null`, `undefined`, or empty array: treated as absent;
- `0` and `false`: present and eligible for comparison.

Cross-field rules do not make optional dependencies conditionally required.

## Invalid dependency behavior

Validation has two phases:

1. validate all fields using the existing validators;
2. evaluate cross-field rules.

A rule runs only if both operands:

- are present; and
- have no field-level validation errors.

If either field is invalid, the relationship rule is skipped. This prevents a malformed dependency from producing a secondary error on the subject.

Only field-level errors control this skip. A cross-field failure from an earlier rule does not prevent later rules from evaluating.

## Missing field-reference behavior

A rule that references a field not present in `definition.fields` is malformed configuration.

`validateRecord` throws a synchronous `TypeError` identifying the rule index and invalid reference. It does not return a normal record-validation error and does not silently skip the rule.

## Unknown operator behavior

An unknown operator is malformed configuration.

`validateRecord` throws `TypeError` before record validation, even when the corresponding record values are absent.

## Type incompatibility behavior

The following are malformed configuration and throw `TypeError`:

- different field types;
- ordering operators on text, long-text, choice, or Boolean fields;
- any operator on multi-choice or file fields;
- unsupported or unknown field types referenced by a rule.

Exception messages should identify `rules[index]` and the reason. Exact exception prose need not be part of the stable public API; the exception class and failure category are.

## Other malformed rule behavior

`TypeError` is also thrown when:

- `rules` exists but is not an array;
- a rule is not an object;
- required properties are missing or not non-empty strings;
- `message` exists but is not a non-empty string;
- a rule contains unknown properties;
- `field` and `other_field` are the same;
- a referenced field name is ambiguous because it occurs more than once.

Rule configuration is checked before record values, so malformed definitions fail consistently.

## Error ownership

A failed rule produces exactly one error attached to `rule.field`:

```js
{
  field: "project_end_date",
  message: "Project end date must be on or after Project start date"
}
```

Errors are not attached to both operands because the subject is the value the rule declares invalid. Attaching one error also avoids duplicate UI messages.

## Error message behavior

If `message` is present, it is returned verbatim. There is no placeholder interpolation.

Otherwise, labels use the existing fallback:

```text
field.label || field.name
```

Default templates are:

| Type/operator | Generated message |
|---|---|
| scalar `eq` | `<subject> must equal <dependency>` |
| scalar `neq` | `<subject> must not equal <dependency>` |
| number `gt` | `<subject> must be greater than <dependency>` |
| number `gte` | `<subject> must be greater than or equal to <dependency>` |
| number `lt` | `<subject> must be less than <dependency>` |
| number `lte` | `<subject> must be less than or equal to <dependency>` |
| date `eq` | `<subject> must be the same date as <dependency>` |
| date `neq` | `<subject> must not be the same date as <dependency>` |
| date `gt` | `<subject> must be after <dependency>` |
| date `gte` | `<subject> must be on or after <dependency>` |
| date `lt` | `<subject> must be before <dependency>` |
| date `lte` | `<subject> must be on or before <dependency>` |

“Scalar” here covers text, long-text, choice, Boolean, and equality comparisons for numbers.

## Multiple-rule behavior

A definition can contain any number of independent rules:

```json
{
  "rules": [
    {
      "field": "end_date",
      "operator": "gte",
      "other_field": "start_date"
    },
    {
      "field": "end_date",
      "operator": "lte",
      "other_field": "reporting_deadline"
    }
  ]
}
```

Rules execute in array order. Every eligible rule runs; there is no short-circuiting or Boolean grouping. Each failed rule appends one error, so a field may receive multiple cross-field errors.

## Execution and error order

1. Validate the rule configuration.
2. Run existing per-field validation in field order.
3. Record which fields have field-level errors.
4. Run eligible cross-field rules in `rules` order.
5. Append cross-field errors after all field-level errors.
6. Return `valid: errors.length === 0`.

## Backward compatibility

- Missing `definition.rules` means no cross-field validation.
- `rules: []` also means no cross-field validation.
- Existing definitions and records retain their current behavior.
- Existing field validators, exports, error shape, and field-error ordering remain unchanged.
- No dependency or TypeScript conversion is required.

## Explicitly unsupported behavior

- Literal operands or constants.
- Arithmetic or computed values.
- More than two operands per rule.
- AND/OR/NOT grouping.
- Conditional rules.
- Nested expressions.
- Cross-type coercion.
- Array or file comparison.
- Ordering strings alphabetically.
- Custom JavaScript or callbacks.
- Asynchronous validation.
- Custom message placeholders.
- Automatically making a dependency required.
- Correcting existing unrelated validator behavior.

# 9. Proposed Test Matrix

These tests are designs only; none have been implemented.

| Category | Scenario | Expected valid | Expected error field | Expected behavior |
|---|---|---:|---|---|
| Happy path | Date `end gte start`, end is later | `true` | — | No errors |
| Happy path | Date `end gte start`, dates equal | `true` | — | Inclusive boundary passes |
| Happy path | Table-driven number checks cover all six operators | Depends on case | Subject on failing cases | Numeric semantics, no coercion |
| Happy path | Text confirmation uses `eq` with exact matching strings | `true` | — | Equality comparison passes |
| Validation failure | End date is before start date | `false` | `end_date` | One generated date message |
| Validation failure | Maximum number is below minimum with custom message | `false` | `maximum` | Custom message returned verbatim |
| Missing value | Optional dependency is absent | `true` | — | Rule skipped |
| Missing value | Required dependency is absent | `false` | Dependency | Required error only; no subject error |
| Missing value | Required subject is blank | `false` | Subject | Required error only; rule skipped |
| Invalid operand | Dependency has malformed date text | `false` | Dependency | Existing date error only |
| Invalid operand | Subject contains a string instead of number | `false` | Subject | Existing number error only |
| Invalid configuration | Referenced field does not exist | N/A | N/A | Synchronous `TypeError` |
| Invalid configuration | Operator is unknown | N/A | N/A | Synchronous `TypeError` |
| Type mismatch | Number compared with date, or text uses `gte` | N/A | N/A | Synchronous `TypeError` |
| Invalid configuration | `rules` is not an array | N/A | N/A | Synchronous `TypeError` |
| Multiple rules | Two eligible rules on one subject both fail | `false` | Subject twice | Two errors in rule-array order |
| Backward compatibility | Existing Client A/B/C fixtures contain no `rules` | Existing results | Existing fields | All original 16 tests remain unchanged |

# 10. Hidden-Test Simulation

## Unknown Client X — Booking window

```json
{
  "fields": [
    {
      "name": "booking_start",
      "label": "Booking start",
      "type": "date",
      "required": true
    },
    {
      "name": "booking_end",
      "label": "Booking end",
      "type": "date",
      "required": true
    }
  ],
  "rules": [
    {
      "field": "booking_end",
      "operator": "gte",
      "other_field": "booking_start"
    }
  ]
}
```

Record:

```json
{
  "booking_start": "2026-10-20",
  "booking_end": "2026-10-18"
}
```

Expected error:

```json
{
  "field": "booking_end",
  "message": "Booking end must be on or after Booking start"
}
```

The syntax and error owner are determinable without implementation knowledge.

## Unknown Client Y — Capacity range

```json
{
  "fields": [
    {
      "name": "minimum_capacity",
      "label": "Minimum capacity",
      "type": "number",
      "required": true
    },
    {
      "name": "maximum_capacity",
      "label": "Maximum capacity",
      "type": "number",
      "required": true
    }
  ],
  "rules": [
    {
      "field": "maximum_capacity",
      "operator": "gte",
      "other_field": "minimum_capacity"
    }
  ]
}
```

A maximum of `100` and minimum of `100` passes. A maximum of `99` fails against `maximum_capacity`.

## Unknown Client Z — Contact confirmation

```json
{
  "fields": [
    {
      "name": "contact_email",
      "label": "Contact email",
      "type": "text",
      "required": true
    },
    {
      "name": "contact_email_confirmation",
      "label": "Contact email confirmation",
      "type": "text",
      "required": true
    }
  ],
  "rules": [
    {
      "field": "contact_email_confirmation",
      "operator": "eq",
      "other_field": "contact_email",
      "message": "Email confirmation must match the contact email"
    }
  ]
}
```

Different strings produce one error on `contact_email_confirmation` using the custom message verbatim.

These simulations did not expose an unresolved syntax ambiguity.

# 11. Explicit Non-Goals

This design does not:

- create a general-purpose rule engine;
- add an expression language;
- support arithmetic, constants, or computed fields;
- allow arbitrary JavaScript;
- add conditional or grouped rules;
- compare arrays or files;
- perform cross-type coercion;
- perform locale-aware or alphabetical text ordering;
- change the public record-error shape;
- convert the project to TypeScript;
- add dependencies;
- change client fixtures;
- fix impossible calendar dates;
- reject `Infinity`;
- deduplicate multi-choice values;
- change null-definition behavior;
- catch invalid regex configuration;
- change optional unknown-field behavior;
- revise unrelated messages or validators.

# 12. Risks / Open Questions

The design is complete enough to implement, but approval should explicitly confirm these tradeoffs:

- **Six operators:** All six form a coherent binary vocabulary, but the implementation could be narrowed to `eq`, `neq`, `gt`, `gte`, `lt`, and `lte` only as documented—no aliases such as `>=`.
- **Configuration exceptions:** Malformed rules throw `TypeError` rather than returning `{ valid: false }`. This cleanly separates developer configuration errors from user input errors but adds a documented throwing path.
- **Exact-type restriction:** `text` cannot be compared with `long_text`, even for equality. This sacrifices some flexibility to eliminate coercion and semantic guessing.
- **Strict rule keys:** Rejecting unknown properties catches typos but means future extensions must intentionally update the schema.
- **Date limitation:** Lexical comparison is deterministic, but it inherits the existing validator’s acceptance of some impossible calendar dates.
- **Generated-message stability:** Documenting exact templates makes hidden use predictable but turns those templates into public behavior.
- **Definition validation scope:** Only the new `rules` structure receives strict configuration validation. Existing malformed field-definition behavior remains unchanged.

# 13. AI Worklog Update

Updated only private/AI-WORKLOG.md [REDACTED — private local file link] with a genuine design decision:

- field-attached rules were rejected because relationships become distributed through the field list;
- generic operand objects were rejected because they add error-target ambiguity and encourage expression-language growth;
- the flat top-level binary format was selected provisionally;
- implementation remains subject to approval.

The README, validator, tests, package configuration, and client fixtures retained their original hashes. No Git repository exists.

# 14. Recommended Next Phase

**Part 2 — Implement the Approved Cross-Field Validation Design**

Implementation has not begun.


