// Formatação para exibição (pt-BR). Moeda fica em currency.ts.

// Recebe só dígitos; aceita CEP incompleto para servir também à máscara.
export function formatCep(digits: string): string {
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

export function formatDecimal(value: number, maxDecimals: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: maxDecimals }).format(value)
}

export function formatWeight(kg: number): string {
  return `${formatDecimal(kg, 3)} kg`
}

export function formatDimensions(dimensions: { heightCm: number, widthCm: number, lengthCm: number }): string {
  const { heightCm, widthCm, lengthCm } = dimensions

  return `${[heightCm, widthCm, lengthCm].map(value => formatDecimal(value, 1)).join(' × ')} cm`
}

export function formatDeliveryTime(businessDays: number): string {
  return businessDays === 1 ? '1 dia útil' : `${businessDays} dias úteis`
}
