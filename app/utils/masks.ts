import { formatCep } from '~/utils/formatters'

// Máscara de input: o texto exibido é mascarado e o valor do formulário é normalizado.
export interface InputMask<T> {
  // Texto digitado → texto exibido.
  mask: (text: string) => string
  // Texto exibido → valor validado pelo schema.
  parse: (masked: string) => T
  // Valor → texto exibido (quando o valor muda fora do input).
  format: (value: T) => string
}

export function onlyDigits(text: string): string {
  return text.replace(/\D/g, '')
}

export const cepMask: InputMask<string> = {
  mask: text => formatCep(onlyDigits(text).slice(0, 8)),
  parse: masked => onlyDigits(masked),
  format: value => formatCep(onlyDigits(value).slice(0, 8))
}

// Decimal pt-BR sem sinal e sem separador de milhar: "12,5". Sem vírgula no texto, o ponto
// vira vírgula ("12.5"); com vírgula, o ponto é separador de milhar colado ("1.250,5").
export function decimalMask(options: { decimals: number, maxIntegerDigits: number }): InputMask<number | undefined> {
  const { decimals, maxIntegerDigits } = options
  const formatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: decimals, useGrouping: false })

  return {
    mask: (text) => {
      const normalized = text.includes(',') ? text.replace(/\./g, '') : text.replace(/\./g, ',')
      const [integer = '', fraction] = normalized.replace(/[^\d,]/g, '').split(',')
      const integerPart = integer.replace(/^0+(?=\d)/, '').slice(0, maxIntegerDigits)

      if (fraction === undefined || decimals === 0) {
        return integerPart
      }

      return `${integerPart || '0'},${fraction.slice(0, decimals)}`
    },
    parse: masked => (masked === '' ? undefined : Number(masked.replace(',', '.'))),
    format: value => (value === undefined ? '' : formatter.format(value))
  }
}

// Moeda preenchida da direita para a esquerda, como em caixa eletrônico: "123456" → "1.234,56".
export function currencyMask(options: { maxIntegerDigits: number }): InputMask<number | undefined> {
  const formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return {
    mask: (text) => {
      const digits = onlyDigits(text).replace(/^0+/, '').slice(0, options.maxIntegerDigits + 2)

      return digits === '' ? '' : formatter.format(Number(digits) / 100)
    },
    parse: masked => (masked === '' ? undefined : Number(onlyDigits(masked)) / 100),
    format: value => (value === undefined ? '' : formatter.format(value))
  }
}
