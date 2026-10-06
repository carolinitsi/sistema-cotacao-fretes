import type { AnyHandler } from 'msw'
import { melhorEnvioHandlers } from './melhor-envio'

// Handlers padrão das APIs externas. Testes específicos sobrescrevem com server.use().
export const handlers: AnyHandler[] = [melhorEnvioHandlers.success()]
