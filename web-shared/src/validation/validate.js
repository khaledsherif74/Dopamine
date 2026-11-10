export function validate(schema, input) {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, values: result.data, errors: {} };
  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join(".") || "_";
    if (!errors[field]) errors[field] = issue.message;
  }
  return { ok: false, values: null, errors };
}
