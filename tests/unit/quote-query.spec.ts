import { describe, expect, it } from 'vitest'
import type { QuoteRequest } from '#shared/schemas/quote'
import { parseQuoteQuery, quoteRequestToQuery } from '~/utils/quote-query'

const request: QuoteRequest = {
  originCep: '01310100',
  destinationCep: '20040002',
  heightCm: 10,
  widthCm: 15.5,
  lengthCm: 20,
  weightKg: 1.25,
  insuranceBrl: 0
}

const query = {
  originCep: '01310100',
  destinationCep: '20040002',
  heightCm: '10',
  widthCm: '15.5',
  lengthCm: '20',
  weightKg: '1.25',
  insuranceBrl: '0'
}

describe('quoteRequestToQuery', () => {
  it('serializa os campos com ponto decimal e mantém o seguro 0', () => {
    expect(quoteRequestToQuery(request)).toEqual(query)
  })

  it('omite o seguro ausente', () => {
    const { insuranceBrl: _, ...withoutInsurance } = request

    expect(quoteRequestToQuery(withoutInsurance)).not.toHaveProperty('insuranceBrl')
  })
})

describe('parseQuoteQuery', () => {
  it('lê de volta o request gravado na URL', () => {
    expect(parseQuoteQuery(quoteRequestToQuery(request))).toEqual(request)
  })

  it('aceita a URL sem seguro ou com seguro vazio', () => {
    const { insuranceBrl: _, ...withoutInsurance } = query

    expect(parseQuoteQuery(withoutInsurance)?.insuranceBrl).toBeUndefined()
    expect(parseQuoteQuery({ ...query, insuranceBrl: '' })?.insuranceBrl).toBeUndefined()
  })

  it('ignora parâmetros desconhecidos', () => {
    expect(parseQuoteQuery({ ...query, utm_source: 'email' })).toEqual(request)
  })

  it.each([
    ['sem parâmetros', {}],
    ['campo obrigatório ausente', { originCep: query.originCep, destinationCep: query.destinationCep }],
    ['medida vazia', { ...query, heightCm: '' }],
    ['texto não numérico', { ...query, heightCm: 'abc' }],
    ['notação que z.coerce aceitaria', { ...query, heightCm: '1e2' }],
    ['CEP com máscara', { ...query, originCep: '01310-100' }],
    ['parâmetro repetido', { ...query, originCep: ['01310100', '20040002'] }],
    ['parâmetro sem valor', { ...query, destinationCep: null }],
    ['medida fora do limite', { ...query, heightCm: '500' }],
    ['casas decimais demais', { ...query, weightKg: '1.2345' }],
    ['seguro negativo', { ...query, insuranceBrl: '-10' }],
    ['seguro não numérico', { ...query, insuranceBrl: 'grátis' }]
  ])('devolve null com %s', (_, input) => {
    expect(parseQuoteQuery(input)).toBeNull()
  })
})
