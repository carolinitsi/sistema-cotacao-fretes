import { describe, expect, it } from 'vitest'
import { getBreadcrumbItems } from '~/utils/navigation'

describe('getBreadcrumbItems', () => {
  it('retorna a página atual para uma rota de primeiro nível', () => {
    expect(getBreadcrumbItems('/historico')).toEqual([{ label: 'Histórico', to: '/historico' }])
  })

  it('ignora barra final', () => {
    expect(getBreadcrumbItems('/calcular-frete/')).toEqual([{ label: 'Calcular frete', to: '/calcular-frete' }])
  })

  it('ignora segmentos sem label', () => {
    expect(getBreadcrumbItems('/historico/123')).toEqual([{ label: 'Histórico', to: '/historico' }])
  })

  it('retorna vazio para rotas fora do mapeamento', () => {
    expect(getBreadcrumbItems('/')).toEqual([])
    expect(getBreadcrumbItems('/styleguide')).toEqual([])
  })
})
