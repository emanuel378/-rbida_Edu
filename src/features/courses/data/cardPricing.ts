import type { Course } from './mock'

// Taxas da conta Asaas para cartão de crédito (cobrança online), repassadas ao
// aluno no valor final. Mesma lógica replicada em supabase/functions/_shared/cardFee.ts,
// que é quem de fato calcula o valor cobrado — isso aqui é só para exibição.
const CARD_FEE_TIERS: { maxInstallments: number; percent: number; fixed: number }[] = [
  { maxInstallments: 1, percent: 0.0299, fixed: 0.49 },
  { maxInstallments: 6, percent: 0.0349, fixed: 0.49 },
  { maxInstallments: 12, percent: 0.0399, fixed: 0.49 },
  { maxInstallments: 21, percent: 0.0429, fixed: 0.49 },
]

// Valor mínimo de cada parcela aceito pela Asaas
export const MIN_INSTALLMENT_VALUE = 5

export function grossCardAmount(netAmount: number, installmentCount: number): number {
  const tier = CARD_FEE_TIERS.find(t => installmentCount <= t.maxInstallments) ?? CARD_FEE_TIERS[CARD_FEE_TIERS.length - 1]
  return Math.round(((netAmount + tier.fixed) / (1 - tier.percent)) * 100) / 100
}

type CardPricingFields = Pick<Course, 'price' | 'cardCashPrice' | 'card3xPrice' | 'cardMaxInstallments' | 'cardInterestFreeInstallments' | 'cardInterestRate'>

// Parcelas oferecidas para o curso. Sem configuração do admin, mantém o
// comportamento antigo: só à vista (1x) ou 3x.
export function allowedInstallments(course: CardPricingFields): number[] {
  const max = course.cardMaxInstallments
  const options = max ? Array.from({ length: Math.min(Math.max(max, 1), 12) }, (_, i) => i + 1) : [1, 3]
  return options.filter(n => n === 1 || cardInstallmentTotal(course, n) / n >= MIN_INSTALLMENT_VALUE)
}

export function hasInterest(course: CardPricingFields, n: number): boolean {
  return n > 1 && n > (course.cardInterestFreeInstallments ?? 1) && (course.cardInterestRate ?? 0) > 0
}

// Valor total cobrado no cartão para `n` parcelas: preço fixo do curso ou
// repasse da taxa da Asaas, mais juros mensais (Tabela Price) acima das
// parcelas sem juros.
export function cardInstallmentTotal(course: CardPricingFields, n: number): number {
  const base =
    n === 1 ? course.cardCashPrice ?? grossCardAmount(course.price, 1)
    : n === 3 && course.card3xPrice != null ? course.card3xPrice
    : grossCardAmount(course.price, n)

  if (!hasInterest(course, n)) return base

  const rate = (course.cardInterestRate ?? 0) / 100
  const installment = Math.round(((base * rate) / (1 - Math.pow(1 + rate, -n))) * 100) / 100
  return Math.round(installment * n * 100) / 100
}
