export function validatePasswordChange({
  currentPassword = "",
  newPassword = "",
  confirm = "",
} = {}) {
  const errors = {};
  if (!currentPassword) errors.currentPassword = "validation.required";
  if (newPassword.length < 8) errors.newPassword = "validation.passwordShort";
  else if (newPassword.length > 72)
    errors.newPassword = "validation.passwordLong";
  else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(newPassword))
    errors.newPassword = "validation.passwordWeak";
  else if (currentPassword && newPassword === currentPassword)
    errors.newPassword = "validation.passwordSame";
  if (!errors.newPassword && confirm !== newPassword)
    errors.confirm = "validation.passwordMismatch";
  return {
    ok: Object.keys(errors).length === 0,
    values: { currentPassword, newPassword },
    errors,
  };
}
