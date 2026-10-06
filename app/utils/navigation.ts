import type { BreadcrumbItem, NavigationMenuItem } from '@nuxt/ui'

export const mainNavigation = [
  { label: 'Início', icon: 'i-lucide-house', to: '/inicio' },
  { label: 'Calcular frete', icon: 'i-lucide-truck', to: '/calcular-frete' },
  { label: 'Histórico', icon: 'i-lucide-history', to: '/historico' },
  { label: 'Configurações', icon: 'i-lucide-settings', to: '/configuracoes' }
] satisfies NavigationMenuItem[]

export const footerNavigation = [
  { label: 'Ajuda', icon: 'i-lucide-circle-help', to: '/ajuda' }
] satisfies NavigationMenuItem[]

export const profileLink = { label: 'Perfil', to: '/perfil' }

const routeLabels = new Map<string, string>(
  [...mainNavigation, ...footerNavigation, profileLink].map(item => [item.to, item.label])
)

// Um item por segmento do caminho que tenha label; segmentos sem label são ignorados.
export function getBreadcrumbItems(path: string): BreadcrumbItem[] {
  const segments = path.split('/').filter(Boolean)

  return segments.flatMap((_, index) => {
    const to = `/${segments.slice(0, index + 1).join('/')}`
    const label = routeLabels.get(to)

    return label ? [{ label, to }] : []
  })
}
