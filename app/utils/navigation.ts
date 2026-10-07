import type { BreadcrumbItem, NavigationMenuItem } from '@nuxt/ui'
import type { LocationQuery } from 'vue-router'
import { getQuotedRequest } from '~/utils/quote-query'

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

const QUOTE_PATH = '/calcular-frete'

// Um item por segmento do caminho que tenha label; segmentos sem label são ignorados.
// Em "Calcular frete", os resultados são um estado da mesma página (vêm da query, DECISIONS 028):
// o item "Resultados" entra quando a URL tem uma cotação fora do modo de edição.
export function getBreadcrumbItems(path: string, query: LocationQuery = {}): BreadcrumbItem[] {
  const segments = path.split('/').filter(Boolean)

  const items: BreadcrumbItem[] = segments.flatMap((_, index) => {
    const to = `/${segments.slice(0, index + 1).join('/')}`
    const label = routeLabels.get(to)

    return label ? [{ label, to }] : []
  })

  if (segments.length === 1 && items[0]?.to === QUOTE_PATH && getQuotedRequest(query)) {
    // Sem `to`, o UBreadcrumb não marca o item como ativo sozinho; active dá o aria-current.
    items.push({ label: 'Resultados', active: true })
  }

  return items
}
