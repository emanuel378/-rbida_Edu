// Taxa fixa cobrada pela Asaas a cada boleto liquidado, repassada ao aluno
// no valor final da cobrança. Atualize aqui se a taxa da conta mudar — o
// mesmo valor está espelhado no frontend (CheckoutModal.tsx) só para
// exibição; o valor efetivamente cobrado é sempre o calculado aqui.
export const BOLETO_FEE = 1.99

// Repassa a taxa ao aluno: gross - fee = net  =>  gross = net + fee
export function grossBoletoAmount(netAmount: number): number {
  return Math.round((netAmount + BOLETO_FEE) * 100) / 100
}
