<script setup lang="ts">
const { appName } = useRuntimeConfig().public
</script>

<template>
  <UDashboardSidebar
    :ui="{ root: 'w-60 bg-default', footer: 'flex-col items-stretch py-4' }"
  >
    <template #header>
      <NuxtLink
        to="/inicio"
        class="flex items-center gap-2 rounded-control text-section outline-focus focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <UIcon
          name="i-lucide-package"
          class="size-6 text-primary"
        />
        {{ appName }}
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items="mainNavigation"
      orientation="vertical"
      aria-label="Navegação principal"
    />

    <template #footer>
      <UNavigationMenu
        :items="footerNavigation"
        orientation="vertical"
        aria-label="Suporte"
      />
      <!-- Vai abrir o menu do usuário quando houver autenticação. -->
      <UButton
        :avatar="{ alt: currentUser.name, size: 'md', ui: { fallback: 'text-caption' } }"
        :label="currentUser.name"
        trailing-icon="i-lucide-chevron-down"
        color="neutral"
        variant="ghost"
        block
        class="h-auto gap-2 px-3 py-2 font-medium text-muted"
        :ui="{ label: 'flex-1 text-start', trailingIcon: 'text-muted' }"
      />
    </template>
  </UDashboardSidebar>
</template>
