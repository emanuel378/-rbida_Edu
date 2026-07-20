export function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false

  const calcCheckDigit = (base: string) => {
    let sum = 0
    for (let i = 0; i < base.length; i++) {
      sum += parseInt(base[i], 10) * (base.length + 1 - i)
    }
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  const d1 = calcCheckDigit(digits.slice(0, 9))
  const d2 = calcCheckDigit(digits.slice(0, 10))
  return d1 === parseInt(digits[9], 10) && d2 === parseInt(digits[10], 10)
}
