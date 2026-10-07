import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ShellBreadcrumb from '~/components/shell/Breadcrumb.vue'

describe('ShellBreadcrumb', () => {
  it('mostra a página atual como item corrente', async () => {
    const wrapper = await mountSuspended(ShellBreadcrumb, { route: '/configuracoes' })

    expect(wrapper.findAll('li').map(item => item.text()).filter(Boolean)).toEqual(['Configurações'])
    expect(wrapper.get('[aria-current="page"]').text()).toBe('Configurações')
  })

  it('mostra "Resultados" como atual quando a URL tem uma cotação', async () => {
    const query = 'originCep=01001000&destinationCep=20040002&heightCm=2&widthCm=12&lengthCm=17&weightKg=0.3'
    const wrapper = await mountSuspended(ShellBreadcrumb, { route: `/calcular-frete?${query}` })

    expect(wrapper.findAll('li').map(item => item.text()).filter(Boolean)).toEqual(['Calcular frete', 'Resultados'])
    expect(wrapper.get('[aria-current="page"]').text()).toBe('Resultados')
    expect(wrapper.get('a[href="/calcular-frete"]').text()).toBe('Calcular frete')
  })

  it('não renderiza nada em rotas fora do mapeamento', async () => {
    const wrapper = await mountSuspended(ShellBreadcrumb, { route: '/styleguide' })

    expect(wrapper.find('nav').exists()).toBe(false)
  })
})
