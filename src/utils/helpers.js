export function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function round2(value) {
  return Math.round(Number(value ?? 0) * 100) / 100;
}

// items: [{ price, quantity }] -> total rounded to 2 decimals
export function calculateTotal(items) {
  const total = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );
  return round2(total);
}

// Validates a JSON body against { field: (value) => boolean }.
// required: fields that must be present. requireAny: at least one field (for PATCH).
export function parseFields(
  body,
  validators,
  { required = [], requireAny = false } = {},
) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const data = {};
  for (const [field, value] of Object.entries(body)) {
    const validate = validators[field];
    if (!validate) {
      return { error: `Unknown field: ${field}.` };
    }
    if (!validate(value)) {
      return { error: `Invalid value for field: ${field}.` };
    }
    data[field] = value;
  }

  const missing = required.filter((field) => data[field] === undefined);
  if (missing.length > 0) {
    return { error: `Missing required field(s): ${missing.join(", ")}.` };
  }
  if (requireAny && Object.keys(data).length === 0) {
    return { error: "Provide at least one field." };
  }

  return { data };
}
