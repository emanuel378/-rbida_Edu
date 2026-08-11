export const PASSWORD_MIN_LENGTH = 8

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`
  }
  if (!/[a-zA-Z]/.test(password)) {
    return 'A senha deve conter pelo menos 1 letra.'
  }
  if (!/\d/.test(password)) {
    return 'A senha deve conter pelo menos 1 número.'
  }
  return null
}

export function passwordRuleErrors(password: string): { rule: string; met: boolean }[] {
  return [
    { rule: `Mínimo de ${PASSWORD_MIN_LENGTH} caracteres`, met: password.length >= PASSWORD_MIN_LENGTH },
    { rule: 'Pelo menos 1 letra', met: /[a-zA-Z]/.test(password) },
    { rule: 'Pelo menos 1 número', met: /\d/.test(password) },
  ]
}
