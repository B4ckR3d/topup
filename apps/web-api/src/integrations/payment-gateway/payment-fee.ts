export function calculatePaymentFee(
  amountReceived: number,
  feeRate: number,
  fixedFee: number,
): number {
  const total = amountReceived / (1 - feeRate) + fixedFee / (1 - feeRate)
  const fee = total - amountReceived
  return Math.ceil(fee)
}
