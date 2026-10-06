<template>
  <UDashboardGroup>
    <ShellSidebar />

    <UDashboardPanel>
      <template #header>
        <ShellTopbar />
      </template>

      <template #body>
        <main class="flex flex-col gap-4">
          <ShellBreadcrumb />
          <slot />
        </main>
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
