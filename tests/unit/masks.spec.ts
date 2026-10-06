import { describe, expect, it } from 'vitest'
import { cepMask, currencyMask, decimalMask, onlyDigits } from '~/utils/masks'

describe('onlyDigits', () => {
  it('remove tudo que não é dígito', () => {
    expect(onlyDigits('01.310-100 ')).toBe('01310100')
  })
})

describe('cepMask', () => {
  it('aplica o formato 00000-000 enquanto digita', () => {
    expect(cepMask.mask('01310')).toBe('01310')
    expect(cepMask.mask('013101')).toBe('01310-1')
    expect(cepMask.mask('01310100')).toBe('01310-100')
  })

  it('ignora letras e corta além de 8 dígitos', () => {
    expect(cepMask.mask('01a310-1009')).toBe('01310-100')
  })

  it('converte para só dígitos e de volta', () => {
    expect(cepMask.parse('01310-100')).toBe('01310100')
    expect(cepMask.format('01310100')).toBe('01310-100')
    expect(cepMask.format('')).toBe('')
  })
})

describe('decimalMask', () => {
  const mask = decimalMask({ decimals: 1, maxIntegerDigits: 3 })

  it('aceita vírgula e converte ponto em vírgula', () => {
    expect(mask.mask('12,5')).toBe('12,5')
    expect(mask.mask('12.5')).toBe('12,5')
  })

  it('mantém a vírgula final enquanto o usuário digita', () => {
    expect(mask.mask('12,')).toBe('12,')
    expect(mask.parse('12,')).toBe(12)
  })

  it('remove sinal, letras e casas e dígitos excedentes', () => {
    expect(mask.mask('-1a2,57')).toBe('12,5')
    expect(mask.mask('12345')).toBe('123')
  })

  it('permite digitar 0 e remove zeros à esquerda', () => {
    expect(mask.mask('0')).toBe('0')
    expect(mask.mask('007')).toBe('7')
    expect(mask.mask(',5')).toBe('0,5')
  })

  it('converte para number e de volta', () => {
    expect(mask.parse('12,5')).toBe(12.5)
    expect(mask.parse('')).toBeUndefined()
    expect(mask.format(12.5)).toBe('12,5')
    expect(mask.format(undefined)).toBe('')
  })

  it('respeita a quantidade de casas configurada', () => {
    const weight = decimalMask({ decimals: 3, maxIntegerDigits: 4 })

    expect(weight.mask('1,25678')).toBe('1,256')
    expect(weight.format(1000)).toBe('1000')
  })

  it('trata o ponto como milhar quando o texto colado já tem vírgula', () => {
    const weight = decimalMask({ decimals: 3, maxIntegerDigits: 4 })

    expect(weight.mask('1.250,5')).toBe('1250,5')
    expect(weight.mask('1,2,3')).toBe('1,2')
  })
})

describe('currencyMask', () => {
  const mask = currencyMask({ maxIntegerDigits: 7 })

  it('preenche da direita para a esquerda', () => {
    expect(mask.mask('1')).toBe('0,01')
    expect(mask.mask('123456')).toBe('1.234,56')
  })

  it('reage à edição do texto já mascarado', () => {
    expect(mask.mask('1.234,567')).toBe('12.345,67')
    expect(mask.mask('1.234,5')).toBe('123,45')
  })

  it('não aceita sinal negativo nem dígitos além do limite', () => {
    expect(mask.mask('-10')).toBe('0,10')
    expect(mask.mask('12345678901')).toBe('1.234.567,89')
  })

  it('fica vazio quando não há valor', () => {
    expect(mask.mask('0,0')).toBe('')
    expect(mask.parse('')).toBeUndefined()
    expect(mask.format(undefined)).toBe('')
  })

  it('converte para number e de volta', () => {
    expect(mask.parse('1.234,56')).toBe(1234.56)
    expect(mask.format(1234.5)).toBe('1.234,50')
  })
})
