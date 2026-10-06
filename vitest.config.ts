import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    projects: [
      {
        // Testes puros (schemas, utils) sem subir o Nuxt: mais rápidos.
        resolve: {
          alias: {
            '~': fileURLToPath(new URL('./app', import.meta.url)),
            '#shared': fileURLToPath(new URL('./shared', import.meta.url))
          }
        },
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.{test,spec}.ts'],
          environment: 'node',
          setupFiles: ['tests/mocks/setup.ts']
        }
      },
      await defineVitestProject({
        test: {
          name: 'component',
          include: ['tests/component/**/*.{test,spec}.ts'],
          environment: 'nuxt',
          setupFiles: ['tests/mocks/setup.ts']
        }
      })
    ]
  }
})
