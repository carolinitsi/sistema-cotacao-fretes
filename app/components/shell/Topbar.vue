<template>
  <UDashboardNavbar
    as="header"
    :ui="{ root: 'bg-default', left: 'flex-1' }"
  >
    <template #left>
      <UInput
        type="search"
        icon="i-lucide-search"
        placeholder="Buscar..."
        aria-label="Buscar"
        class="w-full max-w-xs"
      />
    </template>

    <template #right>
      <UButton
        icon="i-lucide-bell"
        color="neutral"
        variant="ghost"
        aria-label="Notificações"
      />
      <UAvatar
        :alt="currentUser.name"
        size="md"
      />
    </template>
  </UDashboardNavbar>
</template>
