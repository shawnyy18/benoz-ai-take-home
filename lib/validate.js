"use strict";

/**
 * Field-definition-driven record validator.
 *
 * A "definition" is:
 * { fields: [ { name, label, type, required, options?, constraints? }, ... ], rules?: [ ... ] }
 * A "record" is a plain object of { fieldName: value }.
 *
 * validateRecord(definition, record) -> { valid: boolean, errors: [{ field, message }] }
 *
 * This module is deliberately client-agnostic: it knows nothing about any
 * particular client's field names or business rules. It only knows the
 * generic type/constraint vocabulary below.
 */

function isPresent(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

function fieldLabel(field) {
  return field.label || field.name;
}

function validateText(field, value, errors) {
  if (typeof value !== "string") {
    errors.push({ field: field.name, message: `${fieldLabel(field)} must be a string` });
    return;
  }
  const c = field.constraints || {};
  if (typeof c.min_length === "number" && value.length < c.min_length) {
    errors.push({ field: field.name, message: `${fieldLabel(field)} must be at least ${c.min_length} characters` });
  }
  if (typeof c.max_length === "number" && value.length > c.max_length) {
    errors.push({ field: field.name, message: `${fieldLabel(field)} must be at most ${c.max_length} characters` });
  }
  if (c.pattern) {
    const re = c.pattern instanceof RegExp ? c.pattern : new RegExp(c.pattern);
    if (!re.test(value)) {
      errors.push({ field: field.name, message: `${fieldLabel(field)} does not match the required format` });
    }
  }
}

function validateLongText(field, value, errors) {
  // long_text behaves like text but is not typically pattern-constrained.
  validateText(field, value, errors);
}

function validateNumber(field, value, errors) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    errors.push({ field: field.name, message: `${fieldLabel(field)} must be a number` });
    return;
  }
  const c = field.constraints || {};
  if (typeof c.min === "number" && value < c.min) {
    errors.push({ field: field.name, message: `${fieldLabel(field)} must be at least ${c.min}` });
  }
  if (typeof c.max === "number" && value > c.max) {
    errors.push({ field: field.name, message: `${fieldLabel(field)} must be at most ${c.max}` });
  }
}

function validateBoolean(field, value, errors) {
  if (typeof value !== "boolean") {
    errors.push({ field: field.name, message: `${fieldLabel(field)} must be true or false` });
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validateDate(field, value, errors) {
  if (typeof value !== "string" || !DATE_RE.test(value)) {
    errors.push({ field: field.name, message: `${fieldLabel(field)} must be a date in YYYY-MM-DD format` });
    return;
  }
  const d = new Date(value + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) {
    errors.push({ field: field.name, message: `${fieldLabel(field)} is not a valid date` });
  }
}

function validateChoice(field, value, errors) {
  if (typeof value !== "string") {
    errors.push({ field: field.name, message: `${fieldLabel(field)} must be one of the allowed options` });
    return;
  }
  const options = field.options || [];
  if (!options.includes(value)) {
    errors.push({ field: field.name, message: `${fieldLabel(field)} must be one of: ${options.join(", ")}` });
  }
}

function validateMultiChoice(field, value, errors) {
  if (!Array.isArray(value)) {
    errors.push({ field: field.name, message: `${fieldLabel(field)} must be a list of options` });
    return;
  }
  const options = field.options || [];
  const invalid = value.filter((v) => !options.includes(v));
  if (invalid.length > 0) {
    errors.push({ field: field.name, message: `${fieldLabel(field)} contains invalid option(s): ${invalid.join(", ")}` });
  }
  const c = field.constraints || {};
  if (typeof c.min_selected === "number" && value.length < c.min_selected) {
    errors.push({ field: field.name, message: `${fieldLabel(field)} requires at least ${c.min_selected} selection(s)` });
  }
  if (typeof c.max_selected === "number" && value.length > c.max_selected) {
    errors.push({ field: field.name, message: `${fieldLabel(field)} allows at most ${c.max_selected} selection(s)` });
  }
}

function validateFile(field, value, errors) {
  if (typeof value !== "object" || value === null || typeof value.filename !== "string") {
    errors.push({ field: field.name, message: `${fieldLabel(field)} must be a file with a filename` });
    return;
  }
  const c = field.constraints || {};
  if (Array.isArray(c.accepted) && c.accepted.length > 0) {
    const ext = value.filename.split(".").pop().toLowerCase();
    if (!c.accepted.map((e) => e.toLowerCase()).includes(ext)) {
      errors.push({ field: field.name, message: `${fieldLabel(field)} must be one of: ${c.accepted.join(", ")}` });
    }
  }
}

const TYPE_VALIDATORS = {
  text: validateText,
  long_text: validateLongText,
  number: validateNumber,
  boolean: validateBoolean,
  date: validateDate,
  choice: validateChoice,
  multi_choice: validateMultiChoice,
  file: validateFile,
};

const CROSS_FIELD_OPERATORS = new Set(["eq", "neq", "gt", "gte", "lt", "lte"]);
const RULE_KEYS = new Set(["field", "operator", "other_field", "message"]);
const TYPE_OPERATORS = {
  number: CROSS_FIELD_OPERATORS,
  date: CROSS_FIELD_OPERATORS,
  text: new Set(["eq", "neq"]),
  long_text: new Set(["eq", "neq"]),
  choice: new Set(["eq", "neq"]),
  boolean: new Set(["eq", "neq"]),
};

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function isPlainObject(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function ruleConfigurationError(index, message) {
  return new TypeError(`rules[${index}] ${message}`);
}

function validateRuleConfiguration(definition, fields) {
  if (!definition || !hasOwn(definition, "rules") || definition.rules === undefined) return [];
  if (!Array.isArray(definition.rules)) {
    throw new TypeError("definition.rules must be an array");
  }

  const fieldsByName = new Map();
  for (const field of fields) {
    if (!field || typeof field.name !== "string") continue;
    const matches = fieldsByName.get(field.name) || [];
    matches.push(field);
    fieldsByName.set(field.name, matches);
  }

  return definition.rules.map((rule, index) => {
    if (!isPlainObject(rule)) {
      throw ruleConfigurationError(index, "must be an object");
    }

    for (const key of Object.keys(rule)) {
      if (!RULE_KEYS.has(key)) {
        throw ruleConfigurationError(index, `contains unknown property "${key}"`);
      }
    }

    for (const key of ["field", "operator", "other_field"]) {
      if (typeof rule[key] !== "string" || rule[key].trim() === "") {
        throw ruleConfigurationError(index, `requires a non-empty "${key}" string`);
      }
    }

    if (hasOwn(rule, "message") && (typeof rule.message !== "string" || rule.message.trim() === "")) {
      throw ruleConfigurationError(index, '"message" must be a non-empty string');
    }

    if (!CROSS_FIELD_OPERATORS.has(rule.operator)) {
      throw ruleConfigurationError(index, `uses unknown operator "${rule.operator}"`);
    }
    if (rule.field === rule.other_field) {
      throw ruleConfigurationError(index, '"field" and "other_field" must refer to different fields');
    }

    const subjectMatches = fieldsByName.get(rule.field) || [];
    const dependencyMatches = fieldsByName.get(rule.other_field) || [];
    if (subjectMatches.length === 0) {
      throw ruleConfigurationError(index, `references unknown field "${rule.field}"`);
    }
    if (dependencyMatches.length === 0) {
      throw ruleConfigurationError(index, `references unknown field "${rule.other_field}"`);
    }
    if (subjectMatches.length > 1) {
      throw ruleConfigurationError(index, `references ambiguous field "${rule.field}"`);
    }
    if (dependencyMatches.length > 1) {
      throw ruleConfigurationError(index, `references ambiguous field "${rule.other_field}"`);
    }

    const field = subjectMatches[0];
    const otherField = dependencyMatches[0];
    if (field.type !== otherField.type) {
      throw ruleConfigurationError(
        index,
        `cannot compare field types "${field.type}" and "${otherField.type}"`,
      );
    }

    const supportedOperators = TYPE_OPERATORS[field.type];
    if (!supportedOperators || !supportedOperators.has(rule.operator)) {
      throw ruleConfigurationError(
        index,
        `operator "${rule.operator}" is not supported for field type "${field.type}"`,
      );
    }

    return { rule, field, otherField };
  });
}

function compareValues(operator, left, right) {
  // Configuration enforces exact types; both operands passed field validation.
  switch (operator) {
    case "eq": return left === right;
    case "neq": return left !== right;
    case "gt": return left > right;
    case "gte": return left >= right;
    case "lt": return left < right;
    case "lte": return left <= right;
    default: return false; // Configuration validation rejects unknown operators.
  }
}

function defaultRuleMessage(field, otherField, operator) {
  const subject = fieldLabel(field);
  const dependency = fieldLabel(otherField);

  if (field.type === "date") {
    const phrases = {
      eq: "must be the same date as",
      neq: "must not be the same date as",
      gt: "must be after",
      gte: "must be on or after",
      lt: "must be before",
      lte: "must be on or before",
    };
    return `${subject} ${phrases[operator]} ${dependency}`;
  }

  const phrases = {
    eq: "must equal",
    neq: "must not equal",
    gt: "must be greater than",
    gte: "must be greater than or equal to",
    lt: "must be less than",
    lte: "must be less than or equal to",
  };
  return `${subject} ${phrases[operator]} ${dependency}`;
}

/**
 * Validate a record against its field definitions, then evaluate eligible
 * cross-field rules. See the README for the public rule contract.
 */
function validateRecord(definition, record) {
  const errors = [];
  const fields = (definition && definition.fields) || [];
  const configuredRules = validateRuleConfiguration(definition, fields);

  for (const field of fields) {
    const value = record ? record[field.name] : undefined;
    const present = isPresent(value);

    if (!present) {
      if (field.required) {
        errors.push({ field: field.name, message: `${fieldLabel(field)} is required` });
      }
      continue; // optional and absent: nothing further to check
    }

    const validator = TYPE_VALIDATORS[field.type];
    if (!validator) {
      errors.push({ field: field.name, message: `Unknown field type "${field.type}" for ${fieldLabel(field)}` });
      continue;
    }

    validator(field, value, errors);
  }

  // Only field-level errors affect eligibility; independent rules do not suppress one another.
  const fieldsWithErrors = new Set(errors.map((error) => error.field));
  for (const { rule, field, otherField } of configuredRules) {
    const value = record ? record[field.name] : undefined;
    const otherValue = record ? record[otherField.name] : undefined;

    if (!isPresent(value) || !isPresent(otherValue)) continue;
    if (fieldsWithErrors.has(field.name) || fieldsWithErrors.has(otherField.name)) continue;

    if (!compareValues(rule.operator, value, otherValue)) {
      errors.push({
        field: field.name,
        message: hasOwn(rule, "message")
          ? rule.message
          : defaultRuleMessage(field, otherField, rule.operator),
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateRecord, TYPE_VALIDATORS };
