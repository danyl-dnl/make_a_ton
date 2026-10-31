export const passwordRules = [
  { id: 'length', label: 'More than 8 characters', test: (value: string) => value.length > 8 },
  { id: 'uppercase', label: 'At least one uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { id: 'lowercase', label: 'At least one lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { id: 'special', label: 'At least one special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function getPasswordErrors(value: string): string[] {
  return passwordRules.filter((rule) => !rule.test(value)).map((rule) => rule.label)
}
