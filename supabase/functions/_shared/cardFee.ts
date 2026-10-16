// Taxas da conta Asaas para cartão de crédito (cobrança online).
// Atualize aqui se as taxas da conta mudarem — mesma tabela replicada no
// frontend (src/features/courses/data/cardPricing.ts) só para exibição, pois
// o valor cobrado de verdade é sempre recalculado aqui no servidor.
const CARD_FEE_TIERS: { maxInstallments: number; percent: number; fixed: number }[] = [
  { maxInstallments: 1, percent: 0.0299, fixed: 0.49 },
  { maxInstallments: 6, percent: 0.0349, fixed: 0.49 },
  { maxInstallments: 12, percent: 0.0399, fixed: 0.49 },
  { maxInstallments: 21, percent: 0.0429, fixed: 0.49 },
]

// Valor mínimo de cada parcela aceito pela Asaas
export const MIN_INSTALLMENT_VALUE = 5

export function cardFeeTier(installmentCount: number) {
  return CARD_FEE_TIERS.find(t => installmentCount <= t.maxInstallments) ?? CARD_FEE_TIERS[CARD_FEE_TIERS.length - 1]
}

// Repassa a taxa da Asaas ao aluno: calcula o valor bruto que, depois de a
// Asaas descontar percent% + fixo, deixa exatamente `netAmount` pra plataforma.
// gross - (percent*gross + fixo) = netAmount  =>  gross = (netAmount + fixo) / (1 - percent)
export function grossCardAmount(netAmount: number, installmentCount: number): number {
  const { percent, fixed } = cardFeeTier(installmentCount)
  return Math.round(((netAmount + fixed) / (1 - percent)) * 100) / 100
}

export interface CourseCardPricing {
  price: number
  card_cash_price?: number | null
  card_3x_price?: number | null
  card_max_installments?: number | null
  card_interest_free_installments?: number | null
  card_interest_rate?: number | null
}

// Parcelas oferecidas para o curso. Sem configuração do admin, mantém o
// comportamento antigo: só à vista (1x) ou 3x.
export function allowedInstallments(course: CourseCardPricing): number[] {
  const max = course.card_max_installments
  const options = max ? Array.from({ length: Math.min(Math.max(max, 1), 12) }, (_, i) => i + 1) : [1, 3]
  return options.filter(n => n === 1 || cardInstallmentTotal(course, n) / n >= MIN_INSTALLMENT_VALUE)
}

// Valor total cobrado no cartão para `n` parcelas.
// 1. Base: preço fixo do curso (card_cash_price / card_3x_price) ou o repasse
//    automático da taxa da Asaas.
// 2. Acima das parcelas sem juros, aplica juros mensais pela Tabela Price e
//    arredonda a parcela para centavos (total = parcela × n, sem sobra).
export function cardInstallmentTotal(course: CourseCardPricing, n: number): number {
  const base =
    n === 1 ? course.card_cash_price ?? grossCardAmount(course.price, 1)
    : n === 3 && course.card_3x_price != null ? course.card_3x_price
    : grossCardAmount(course.price, n)

  const rate = Number(course.card_interest_rate ?? 0) / 100
  const interestFree = course.card_interest_free_installments ?? 1
  if (n <= 1 || n <= interestFree || rate <= 0) return Number(base)

  const installment = Math.round(((base * rate) / (1 - Math.pow(1 + rate, -n))) * 100) / 100
  return Math.round(installment * n * 100) / 100
}
