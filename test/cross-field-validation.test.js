"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { validateRecord } = require("../lib/validate");
const clientB = require("../clients/client-b-grant-foundation.json");

function field(name, type, extra = {}) {
  return { name, label: name.replaceAll("_", " "), type, required: true, ...extra };
}

function definition(fields, rules) {
  return { fields, rules };
}

test("date gte passes when the subject is later", () => {
  const def = definition(
    [field("start_date", "date"), field("end_date", "date")],
    [{ field: "end_date", operator: "gte", other_field: "start_date" }],
  );

  assert.deepEqual(validateRecord(def, { start_date: "2027-01-01", end_date: "2027-01-02" }), {
    valid: true,
    errors: [],
  });
});

test("date gte includes the equality boundary", () => {
  const def = definition(
    [field("start_date", "date"), field("end_date", "date")],
    [{ field: "end_date", operator: "gte", other_field: "start_date" }],
  );

  assert.equal(validateRecord(def, { start_date: "2027-01-01", end_date: "2027-01-01" }).valid, true);
});

test("date violation attaches the generated error to the subject", () => {
  const def = definition(
    [
      field("start_date", "date", { label: "Start date" }),
      field("end_date", "date", { label: "End date" }),
    ],
    [{ field: "end_date", operator: "gte", other_field: "start_date" }],
  );

  assert.deepEqual(validateRecord(def, { start_date: "2027-01-02", end_date: "2027-01-01" }), {
    valid: false,
    errors: [{ field: "end_date", message: "End date must be on or after Start date" }],
  });
});

test("number comparisons support all six operators with strict boundary semantics", () => {
  const cases = [
    ["eq", 5, 5, true],
    ["eq", 5, 6, false],
    ["neq", 5, 6, true],
    ["neq", 5, 5, false],
    ["gt", 6, 5, true],
    ["gt", 5, 5, false],
    ["gte", 5, 5, true],
    ["gte", 4, 5, false],
    ["lt", 4, 5, true],
    ["lt", 5, 5, false],
    ["lte", 5, 5, true],
    ["lte", 6, 5, false],
  ];

  for (const [operator, left, right, expectedValid] of cases) {
    const def = definition(
      [field("left", "number"), field("right", "number")],
      [{ field: "left", operator, other_field: "right" }],
    );
    const result = validateRecord(def, { left, right });
    assert.equal(result.valid, expectedValid, `${left} ${operator} ${right}`);
    assert.equal(result.errors.length, expectedValid ? 0 : 1);
  }
});

test("equality operators support exact scalar comparisons", () => {
  const cases = [
    ["text", "eq", "Same", "Same", true, {}],
    ["text", "eq", "Same", "same", false, {}],
    ["long_text", "neq", "first", "second", true, {}],
    ["choice", "eq", "a", "a", true, { options: ["a", "b"] }],
    ["boolean", "neq", true, false, true, {}],
    ["boolean", "eq", true, false, false, {}],
  ];

  for (const [type, operator, left, right, expectedValid, extra] of cases) {
    const def = definition(
      [field("left", type, extra), field("right", type, extra)],
      [{ field: "left", operator, other_field: "right" }],
    );
    assert.equal(validateRecord(def, { left, right }).valid, expectedValid, `${type} ${operator}`);
  }
});

test("a custom rule message is returned verbatim", () => {
  const message = "The upper limit must not be below the lower limit";
  const def = definition(
    [field("lower", "number"), field("upper", "number")],
    [{ field: "upper", operator: "gte", other_field: "lower", message }],
  );

  assert.deepEqual(validateRecord(def, { lower: 10, upper: 5 }).errors, [{ field: "upper", message }]);
});

test("default messages follow the documented number and date templates", () => {
  const cases = [
    ["number", "eq", 1, 2, "Subject must equal Dependency"],
    ["number", "neq", 1, 1, "Subject must not equal Dependency"],
    ["number", "gt", 1, 2, "Subject must be greater than Dependency"],
    ["number", "gte", 1, 2, "Subject must be greater than or equal to Dependency"],
    ["number", "lt", 2, 1, "Subject must be less than Dependency"],
    ["number", "lte", 2, 1, "Subject must be less than or equal to Dependency"],
    ["date", "eq", "2027-01-01", "2027-01-02", "Subject must be the same date as Dependency"],
    ["date", "neq", "2027-01-01", "2027-01-01", "Subject must not be the same date as Dependency"],
    ["date", "gt", "2027-01-01", "2027-01-02", "Subject must be after Dependency"],
    ["date", "gte", "2027-01-01", "2027-01-02", "Subject must be on or after Dependency"],
    ["date", "lt", "2027-01-02", "2027-01-01", "Subject must be before Dependency"],
    ["date", "lte", "2027-01-02", "2027-01-01", "Subject must be on or before Dependency"],
  ];

  for (const [type, operator, subject, dependency, expectedMessage] of cases) {
    const def = definition(
      [field("subject", type, { label: "Subject" }), field("dependency", type, { label: "Dependency" })],
      [{ field: "subject", operator, other_field: "dependency" }],
    );
    assert.deepEqual(validateRecord(def, { subject, dependency }).errors, [
      { field: "subject", message: expectedMessage },
    ]);
  }
});

test("a rule is skipped when an optional dependency is absent", () => {
  const def = definition(
    [field("start", "number", { required: false }), field("end", "number")],
    [{ field: "end", operator: "gte", other_field: "start" }],
  );

  assert.deepEqual(validateRecord(def, { end: 5 }), { valid: true, errors: [] });
});

test("missing required operands produce only their required errors", () => {
  const fields = [field("start", "number"), field("end", "number")];
  const rules = [{ field: "end", operator: "gte", other_field: "start" }];

  assert.deepEqual(validateRecord(definition(fields, rules), { end: 5 }).errors, [
    { field: "start", message: "start is required" },
  ]);
  assert.deepEqual(validateRecord(definition(fields, rules), { start: 5 }).errors, [
    { field: "end", message: "end is required" },
  ]);
});

test("invalid operands do not produce cascading cross-field errors", () => {
  const def = definition(
    [field("start", "date"), field("end", "date")],
    [{ field: "end", operator: "gte", other_field: "start" }],
  );

  assert.deepEqual(validateRecord(def, { start: "banana", end: "2027-01-02" }).errors, [
    { field: "start", message: "start must be a date in YYYY-MM-DD format" },
  ]);
  assert.deepEqual(validateRecord(def, { start: "2027-01-01", end: "banana" }).errors, [
    { field: "end", message: "end must be a date in YYYY-MM-DD format" },
  ]);
});

test("missing and case-mismatched field references throw TypeError", () => {
  const fields = [field("start", "number"), field("end", "number")];
  for (const rules of [
    [{ field: "missing", operator: "gte", other_field: "start" }],
    [{ field: "end", operator: "gte", other_field: "missing" }],
    [{ field: "End", operator: "gte", other_field: "start" }],
  ]) {
    assert.throws(() => validateRecord(definition(fields, rules), {}), TypeError);
  }
});

test("unknown operators and symbolic aliases throw TypeError", () => {
  const fields = [field("left", "number"), field("right", "number")];
  for (const operator of ["approximately_equal", "GTE", ">=", "=="]) {
    assert.throws(
      () => validateRecord(definition(fields, [{ field: "left", operator, other_field: "right" }]), {}),
      TypeError,
    );
  }
});

test("incompatible field types and type-operator combinations throw TypeError", () => {
  const cases = [
    [[field("left", "number"), field("right", "date")], "eq"],
    [[field("left", "text"), field("right", "text")], "gte"],
    [[field("left", "file"), field("right", "file")], "eq"],
    [[field("left", "multi_choice"), field("right", "multi_choice")], "neq"],
  ];

  for (const [fields, operator] of cases) {
    assert.throws(
      () => validateRecord(definition(fields, [{ field: "left", operator, other_field: "right" }]), {}),
      TypeError,
    );
  }
});

test("malformed rules throw TypeError", () => {
  const fields = [field("left", "number"), field("right", "number")];
  const invalidDefinitions = [
    { fields, rules: null },
    { fields, rules: {} },
    { fields, rules: "not-an-array" },
    { fields, rules: [null] },
    { fields, rules: [[]] },
    { fields, rules: [{ field: "left", operator: "eq" }] },
    { fields, rules: [{ field: "left", operator: "eq", other_field: "right", extra: true }] },
    { fields, rules: [{ field: "", operator: "eq", other_field: "right" }] },
    { fields, rules: [{ field: "left", operator: "eq", other_field: "right", message: "" }] },
    { fields, rules: [{ field: "left", operator: "eq", other_field: "right", message: "   " }] },
    { fields, rules: [{ field: "left", operator: "eq", other_field: "right", message: 123 }] },
  ];

  for (const def of invalidDefinitions) {
    assert.throws(() => validateRecord(def, {}), TypeError);
  }
});

test("a rule cannot compare a field with itself", () => {
  const def = definition(
    [field("value", "number")],
    [{ field: "value", operator: "eq", other_field: "value" }],
  );
  assert.throws(() => validateRecord(def, { value: 1 }), TypeError);
});

test("duplicate referenced field names are rejected as ambiguous", () => {
  const def = definition(
    [field("value", "number"), field("value", "number"), field("other", "number")],
    [{ field: "value", operator: "eq", other_field: "other" }],
  );
  assert.throws(() => validateRecord(def, {}), TypeError);
});

test("multiple eligible rule failures are appended in rule order", () => {
  const def = definition(
    [field("minimum", "number"), field("target", "number"), field("maximum", "number")],
    [
      { field: "target", operator: "gte", other_field: "minimum", message: "first rule" },
      { field: "target", operator: "lte", other_field: "maximum", message: "second rule" },
    ],
  );

  assert.deepEqual(validateRecord(def, { minimum: 10, target: 5, maximum: 4 }).errors, [
    { field: "target", message: "first rule" },
    { field: "target", message: "second rule" },
  ]);
});

test("field-level errors remain before cross-field errors", () => {
  const def = definition(
    [
      field("amount", "number", { constraints: { min: 0 } }),
      field("start", "date"),
      field("end", "date"),
    ],
    [{ field: "end", operator: "gte", other_field: "start" }],
  );

  assert.deepEqual(validateRecord(def, { amount: -1, start: "2027-02-01", end: "2027-01-01" }).errors, [
    { field: "amount", message: "amount must be at least 0" },
    { field: "end", message: "end must be on or after start" },
  ]);
});

test("omitted, undefined, and empty rules preserve ordinary validation behavior", () => {
  const fields = [field("name", "text")];
  const record = {};
  const expected = validateRecord({ fields }, record);

  assert.deepEqual(validateRecord({ fields, rules: undefined }, record), expected);
  assert.deepEqual(validateRecord({ fields, rules: [] }, record), expected);
});

test("a rule works with an in-memory extension of the supplied Client B definition", () => {
  const definitionWithRule = {
    ...clientB,
    rules: [{
      field: "project_end_date",
      operator: "gte",
      other_field: "project_start_date",
    }],
  };
  const record = {
    organisation_name: "Community Learning Trust",
    registry_number: "RN-123456",
    contact_person: "Ari Santos",
    requested_amount: 25000,
    priority_areas: ["education"],
    project_description: "A community learning programme.",
    project_start_date: "2027-06-15",
    project_end_date: "2027-06-14",
    budget_file: { filename: "programme-budget.pdf" },
  };

  assert.deepEqual(validateRecord(definitionWithRule, record), {
    valid: false,
    errors: [{
      field: "project_end_date",
      message: "Project end date must be on or after Project start date",
    }],
  });
});
