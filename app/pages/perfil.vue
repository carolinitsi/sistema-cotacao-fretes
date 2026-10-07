<script setup lang="ts">
useSeoMeta({ title: 'Perfil' })

// Página ainda não implementada: estado vazio com o caminho para o fluxo disponível.
const actions = [{ label: 'Calcular frete', icon: 'i-lucide-truck', to: '/calcular-frete', color: 'neutral' as const, variant: 'outline' as const }]
</script>

<template>
  <div class="flex flex-col gap-4">
    <UPageHeader
      title="Perfil"
      description="Dados do usuário."
    />

    <UEmpty
      icon="i-lucide-user"
      title="Em breve"
      description="Os dados da sua conta vão ficar aqui."
      :actions="actions"
    />
  </div>
</template>
