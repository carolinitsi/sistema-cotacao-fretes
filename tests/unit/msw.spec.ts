import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../mocks/server'

// Valida a infraestrutura do MSW; handlers reais entram em tests/mocks/handlers.ts.
describe('msw', () => {
  it('intercepta requisições com handlers registrados no teste', async () => {
    server.use(http.get('https://api.test/ping', () => HttpResponse.json({ ok: true })))

    const response = await fetch('https://api.test/ping')

    expect(await response.json()).toEqual({ ok: true })
  })
})
