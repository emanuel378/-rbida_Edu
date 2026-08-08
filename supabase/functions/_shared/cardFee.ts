// Taxas da conta Asaas para cartão de crédito (cobrança online).
// Atualize aqui se as taxas da conta mudarem — mesma tabela replicada no
// frontend (CheckoutModal.tsx) só para exibição, pois o valor cobrado de
// verdade é sempre recalculado aqui no servidor.
const CARD_FEE_TIERS: { maxInstallments: number; percent: number; fixed: number }[] = [
  { maxInstallments: 1, percent: 0.0299, fixed: 0.49 },
  { maxInstallments: 6, percent: 0.0349, fixed: 0.49 },
  { maxInstallments: 12, percent: 0.0399, fixed: 0.49 },
  { maxInstallments: 21, percent: 0.0429, fixed: 0.49 },
]

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
