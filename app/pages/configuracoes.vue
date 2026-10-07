<script setup lang="ts">
useSeoMeta({ title: 'Configurações' })

// Página ainda não implementada: estado vazio com o caminho para o fluxo disponível.
const actions = [{ label: 'Calcular frete', icon: 'i-lucide-truck', to: '/calcular-frete', color: 'neutral' as const, variant: 'outline' as const }]
</script>

<template>
  <div class="flex flex-col gap-4">
    <UPageHeader
      title="Configurações"
      description="Preferências da conta e do sistema."
    />

    <UEmpty
      icon="i-lucide-settings"
      title="Em breve"
      description="As preferências da conta e do sistema vão ficar aqui."
      :actions="actions"
    />
  </div>
</template>
