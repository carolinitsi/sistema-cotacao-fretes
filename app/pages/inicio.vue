<script setup lang="ts">
useSeoMeta({ title: 'Início' })

// Ainda sem painel: a página leva direto ao único fluxo disponível.
const actions = [{ label: 'Calcular frete', icon: 'i-lucide-truck', to: '/calcular-frete' }]
</script>

<template>
  <div class="flex flex-col gap-4">
    <UPageHeader
      title="Início"
      description="Página inicial do sistema."
    />

    <UEmpty
      icon="i-lucide-package"
      title="Cote seu primeiro frete"
      description="Informe os CEPs, as medidas e o peso do pacote para comparar preços e prazos das transportadoras."
      :actions="actions"
    />
  </div>
</template>
