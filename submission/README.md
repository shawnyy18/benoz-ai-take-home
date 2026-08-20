# Starter package — Platform Foundation take-home

This is the material referenced in Parts 1 and 2 of the exercise brief.

```
review/
  handover-architecture.md   <- Part 1: the contractor's handover notes
lib/
  validate.js                <- the validation library (Part 2 starting point)
clients/
  client-a-city-maintenance.json
  client-b-grant-foundation.json
  client-c-clinic.json       <- field definitions for the three live clients
test/
  validate.test.js           <- the existing passing test suite
  cross-field-validation.test.js <- focused tests for Part 2
package.json
```

## Running it

Node 18+, no dependencies to install.

```
npm test
```

That runs every `test/*.test.js` file with Node's built-in test runner. The test script was widened from the original single-file command only so `npm test` discovers both the original and new test files; no test framework or dependency was added.

## What's here

`lib/validate.js` exports `validateRecord(definition, record)`. A **definition** is a list of field descriptions (name, label, type, required, options for choice-like fields, and a `constraints` object); a **record** is the plain object of submitted values. It returns `{ valid, errors }`, where `errors` is a list of `{ field, message }`.

Supported field types today: `text`, `long_text`, `number`, `boolean`, `date` (`YYYY-MM-DD`), `choice`, `multi_choice`, `file`. Supported constraints vary by type: `min_length`/`max_length`/`pattern` for text, `min`/`max` for numbers, `min_selected`/`max_selected` for multi-choice, `accepted` (a list of extensions) for files. Look at `clients/*.json` for real examples of all of these in use, and `test/validate.test.js` for what each one rejects.

The three client definition files are the actual field lists for the three clients described in the brief (Client A / City maintenance, Client B / Grant-making foundation, Client C / Private clinic) — field names match what the brief describes. They're here so you have real, non-trivial definitions to test against rather than inventing your own.

The original library validated each field in isolation. It now also supports the small, declarative cross-field comparison format documented below, so relationships such as "the project end date must not be before the project start date" remain definition data rather than client-specific code.

## Cross-field validation

Definitions may declare binary field-to-field comparisons in an optional top-level `rules` array. A rule is configuration: it names two defined fields and the relationship that their submitted values must satisfy. The library remains client-agnostic and does not execute custom code from definitions.

Definitions without `rules`, with `rules: undefined`, or with `rules: []` retain the original per-field behavior. Explicit `undefined` is treated like omission for JavaScript callers that copy an absent JSON property.

### Rule format

Each rule has three required properties and one optional property:

| Property | Required | Meaning |
|---|---:|---|
| `field` | Yes | Left-hand operand, constrained subject, and error owner |
| `operator` | Yes | One of `eq`, `neq`, `gt`, `gte`, `lt`, or `lte` |
| `other_field` | Yes | Right-hand operand/dependency |
| `message` | No | Non-empty custom error message returned verbatim |

No other rule properties are supported. Property names, operator names, and field references are case-sensitive. Symbolic aliases such as `>=`, `<=`, `==`, `>`, and `<` are not supported.

### Example

```json
{
  "fields": [
    {
      "name": "start_date",
      "label": "Start date",
      "type": "date",
      "required": true
    },
    {
      "name": "end_date",
      "label": "End date",
      "type": "date",
      "required": true
    }
  ],
  "rules": [
    {
      "field": "end_date",
      "operator": "gte",
      "other_field": "start_date"
    }
  ]
}
```

This declares:

```text
record.end_date >= record.start_date
```

If the relationship fails, the error belongs to `end_date` because `field` is the subject being constrained:

```js
{
  field: "end_date",
  message: "End date must be on or after Start date"
}
```

Only one error is produced for a failed rule; it is not duplicated on `other_field`.

### Operators

The complete operator vocabulary is:

| Operator | Relationship |
|---|---|
| `eq` | `field` equals `other_field` |
| `neq` | `field` does not equal `other_field` |
| `gt` | `field` is strictly greater than or later than `other_field` |
| `gte` | `field` is greater than/later than or equal to `other_field` |
| `lt` | `field` is strictly less than or earlier than `other_field` |
| `lte` | `field` is less than/earlier than or equal to `other_field` |

### Type compatibility

The two referenced fields must have the same exact declared type. There is no type coercion and no concept of compatible type families: `text` cannot be compared with `long_text`, and `number` cannot be compared with `date`.

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

Number comparisons are numeric and do not coerce strings. Text, long-text, and choice equality is exact and case-sensitive. Boolean equality is strict.

Date rules run only after both operands pass the existing `date` validator. Accepted fixed-width `YYYY-MM-DD` strings are compared lexically, which preserves their ordering without timezone conversion or JavaScript date normalization. The existing validator's calendar-date limitations remain unchanged; cross-field rules do not attempt to repair dates that the existing validator accepts.

### Error ownership

`rule.field` is always:

- the left-hand operand;
- the subject being constrained; and
- the field placed in the resulting `{ field, message }` error.

To report an error on a different field, declare that field as the rule subject and reverse the operator as needed. There is no separate `error_field` property.

### Missing values

A rule is skipped when either operand is absent according to the library's existing presence rules. `undefined`, `null`, blank strings, and empty arrays are absent; `0` and `false` are present.

Presence and requiredness remain field-level concerns:

- a missing required dependency produces its normal required error but no cross-field error;
- a missing optional dependency produces no error and does not become conditionally required;
- a missing subject similarly skips the cross-field rule.

### Invalid field values

Per-field validation runs before record relationships. A cross-field rule is evaluated only when both operands are present and neither field has a field-level validation error.

For example, if `start_date` is `"banana"`, its existing date-format error is returned. A dependent `end_date gte start_date` rule is skipped, so the invalid dependency does not cause a secondary error on `end_date`.

A cross-field error from one rule does not make the field ineligible for later rules. Eligible rules are independent.

### Invalid rule configuration

Malformed rules are developer/configuration errors rather than bad record data. `validateRecord` throws synchronous `TypeError` before field validation when:

- `rules` has a value other than `undefined` but is not an array (including `null`, an object, or a string);
- a rule is not a plain object;
- `field`, `operator`, or `other_field` is missing, not a string, or blank;
- a rule contains an unknown property;
- `message` is present but is not a non-empty string;
- an operator is unknown or uses different casing;
- a referenced field does not exist;
- a referenced name is ambiguous because it occurs more than once in `fields`;
- `field` and `other_field` refer to the same field;
- the fields have different declared types;
- the operator is unsupported for the declared type; or
- the referenced type does not support cross-field comparisons.

Exceptions identify the rule index and failure reason where applicable. Exact exception wording is diagnostic and is not part of the compatibility contract; the `TypeError` class and the failure conditions above are.

### Default error messages

Messages use the existing display-label fallback: `field.label || field.name`.

Equality defaults for text, long-text, choice, Boolean, and numbers are:

```text
<subject> must equal <dependency>
<subject> must not equal <dependency>
```

Number ordering defaults are:

```text
gt   <subject> must be greater than <dependency>
gte  <subject> must be greater than or equal to <dependency>
lt   <subject> must be less than <dependency>
lte  <subject> must be less than or equal to <dependency>
```

Date defaults are:

```text
eq   <subject> must be the same date as <dependency>
neq  <subject> must not be the same date as <dependency>
gt   <subject> must be after <dependency>
gte  <subject> must be on or after <dependency>
lt   <subject> must be before <dependency>
lte  <subject> must be on or before <dependency>
```

### Custom error messages

A rule may provide a non-empty `message`:

```json
{
  "field": "end_date",
  "operator": "gte",
  "other_field": "start_date",
  "message": "End date must not be before start date"
}
```

If the rule fails, this string is returned verbatim. The library does not perform placeholder interpolation.

### Multiple rules

Rules execute independently in array order and do not short-circuit:

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

If both relationships fail, both errors are appended in rule order and both belong to `end_date`. Boolean grouping such as AND/OR is not supported.

### Execution and error order

Validation proceeds in this order:

1. Validate the complete cross-field rule configuration.
2. Run the existing field validators in field order.
3. Record which fields have field-level errors.
4. Run eligible cross-field rules in `rules` array order.
5. Append cross-field errors after all field-level errors.
6. Return `{ valid: errors.length === 0, errors }`.

### Unsupported behavior

The cross-field API intentionally does not support:

- symbolic operator aliases;
- literal operands or constants;
- arithmetic or computed values;
- more than two operands per rule;
- AND/OR/NOT grouping or nested expressions;
- conditional rules;
- cross-type coercion;
- multi-choice or file comparisons;
- alphabetical string ordering;
- arbitrary JavaScript or callbacks;
- asynchronous validation;
- custom-message placeholders; or
- automatically making dependencies required.

This is a small binary comparison API, not a general-purpose rules engine.
