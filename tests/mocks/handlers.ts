import type { AnyHandler } from 'msw'

// Handlers padrão das rotas da API. Testes específicos sobrescrevem com server.use().
export const handlers: AnyHandler[] = []
