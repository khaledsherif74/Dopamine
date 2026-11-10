export function validateNewPassword(value) {
  const pw = typeof value === "string" ? value : "";
  if (pw.length < 8) return "Use at least 8 characters.";
  if (pw.length > 72) return "Use at most 72 characters.";
  if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(pw))
    return "Include at least one letter and one number.";
  return null;
}

export function validateEmail(value) {
  const email = typeof value === "string" ? value.trim() : "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
    ? null
    : "Enter a valid email address.";
}
