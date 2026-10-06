import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import ShellSidebar from '~/components/shell/Sidebar.vue'

describe('ShellSidebar', () => {
  it('exibe os itens de navegação com as rotas reais', async () => {
    const wrapper = await mountSuspended(ShellSidebar, { route: '/inicio' })

    expect(wrapper.get('nav[aria-label="Navegação principal"]').findAll('a').map(link => [link.text(), link.attributes('href')])).toEqual([
      ['Início', '/inicio'],
      ['Calcular frete', '/calcular-frete'],
      ['Histórico', '/historico'],
      ['Configurações', '/configuracoes']
    ])
    expect(wrapper.get('nav[aria-label="Suporte"]').findAll('a').map(link => link.attributes('href'))).toEqual(['/ajuda'])
  })

  it('exibe o usuário como botão, sem navegar', async () => {
    const wrapper = await mountSuspended(ShellSidebar, { route: '/inicio' })

    const userButton = wrapper.findAll('button').find(button => button.text().includes('Carlo Martins'))
    expect(userButton?.text()).toContain('CM')
    expect(wrapper.find('a[href="/perfil"]').exists()).toBe(false)
  })

  it('marca como ativo só o item da rota atual', async () => {
    const wrapper = await mountSuspended(ShellSidebar, { route: '/historico' })

    const active = wrapper.findAll('a[aria-current="page"]')
    expect(active.map(link => link.text())).toEqual(['Histórico'])
  })

  it('navega para a rota do item clicado', async () => {
    const wrapper = await mountSuspended(ShellSidebar, { route: '/inicio' })

    await wrapper.get('a[href="/configuracoes"]').trigger('click')
    await vi.waitFor(() => expect(useRouter().currentRoute.value.path).toBe('/configuracoes'))
  })
})
