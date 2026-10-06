// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  // Os tokens do design só têm modo claro (ver docs/DECISIONS.md).
  colorMode: {
    preference: 'light',
    fallback: 'light'
  },

  // Só o que o cliente precisa; sobrescrito por NUXT_PUBLIC_APP_NAME.
  runtimeConfig: {
    public: {
      appName: 'FretePro'
    }
  },

  compatibilityDate: '2026-06-30',

  // O Nuxt 4 já gera os tsconfigs com strict e noUncheckedIndexedAccess.
  // strict fica explícito aqui para não depender do padrão.
  typescript: {
    strict: true,
    // Inclui os testes no typecheck (por padrão o Nuxt só cobre tests/nuxt).
    tsConfig: {
      include: ['../tests/unit/**/*', '../tests/component/**/*', '../tests/mocks/**/*']
    },
    nodeTsConfig: {
      include: ['../tests/e2e/**/*', '../vitest.config.ts', '../playwright.config.ts']
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
