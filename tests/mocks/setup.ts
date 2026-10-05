import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

// Requisições sem handler falham o teste em vez de irem para a rede.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
