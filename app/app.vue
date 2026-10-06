<script setup lang="ts">
import { pt_br } from '@nuxt/ui/locale'

const { appName } = useRuntimeConfig().public

useHead({
  titleTemplate: title => (title ? `${title} · ${appName}` : appName),
  htmlAttrs: { lang: 'pt-BR' },
  link: [{ rel: 'icon', href: '/favicon.ico' }]
})
</script>

<template>
  <UApp :locale="pt_br">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
