<script setup lang="ts">
const { appName } = useRuntimeConfig().public

useHead({
  titleTemplate: title => (title ? `${title} · ${appName}` : appName),
  htmlAttrs: { lang: 'pt-BR' },
  link: [{ rel: 'icon', href: '/favicon.ico' }]
})
</script>

<template>
  <UApp>
    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>
