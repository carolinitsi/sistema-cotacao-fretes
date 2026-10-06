import { resolveFreightConfig } from '../../utils/freight/config'
import { FreightQuoteError } from '../../utils/freight/errors'
import { quoteFreight } from '../../utils/freight/quote'

// O corpo esperado tem poucas centenas de bytes.
const MAX_BODY_BYTES = 4 * 1024

export default defineEventHandler(async (event) => {
  if (Number(getRequestHeader(event, 'content-length') ?? 0) > MAX_BODY_BYTES) {
    throw createError({ statusCode: 413, message: 'Requisição muito grande.' })
  }

  try {
    const config = resolveFreightConfig(useRuntimeConfig(event), import.meta.dev)

    return await quoteFreight(await readBody(event), config)
  } catch (error) {
    if (error instanceof FreightQuoteError) {
      throw createError({ statusCode: error.statusCode, message: error.message, data: error.data })
    }

    throw error
  }
})
