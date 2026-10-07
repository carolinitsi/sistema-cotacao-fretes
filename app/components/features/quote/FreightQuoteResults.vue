<script setup lang="ts">
import type { QuoteRequest } from '#shared/schemas/quote'
import type { FreightOption } from '#shared/types/freight'

// Tela de resultados: resumo do request da URL e as opções da cotação, com os estados
// de loading, erro e vazio do useFreightQuote.
const props = defineProps<{ request: QuoteRequest }>()

defineEmits<{ edit: [] }>()

// Cota só no cliente, depois de montar (DECISIONS 027). No SSR o useQuery dispararia a
// busca sem esperar por ela: a resposta não entra no HTML e o cliente buscaria de novo.
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})
const quoteRequest = computed(() => (isMounted.value ? props.request : null))

const { data, isFetching, isError, errorMessage, refetch } = useFreightQuote(quoteRequest)

// Dados do request atual têm prioridade; sem eles, erro (fora de uma nova tentativa) ou loading.
// Antes de montar a query fica desabilitada e pendente: também é loading.
const view = computed(() => {
  if (data.value) {
    return 'results'
  }

  return isError.value && !isFetching.value ? 'error' : 'loading'
})

const statusMessage = computed(() => {
  if (view.value === 'loading') {
    return 'Calculando frete…'
  }

  const count = data.value?.options.length

  if (count === undefined) {
    return ''
  }

  return count === 1 ? '1 opção de frete encontrada.' : `${count} opções de frete encontradas.`
})

// Ainda não há fluxo de contratação (DECISIONS 028).
const toast = useToast()

function onSelect(option: FreightOption) {
  toast.add({
    title: 'Seleção de frete em breve',
    description: `A contratação de ${getFreightOptionLabel(option)} ainda não está disponível.`,
    icon: 'i-lucide-info'
  })
}

const titleId = useId()
</script>

<template>
  <div class="flex flex-col gap-4">
    <FeaturesQuoteFreightQuoteSummary
      :request="request"
      @edit="$emit('edit')"
    />

    <p
      role="status"
      class="sr-only"
    >
      {{ statusMessage }}
    </p>

    <UAlert
      v-if="view === 'error'"
      role="alert"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="Não foi possível calcular o frete"
      :description="errorMessage ?? undefined"
      :actions="[{ label: 'Tentar novamente', color: 'neutral', variant: 'outline', onClick: () => refetch() }]"
    />

    <UCard
      v-else
      as="section"
      :aria-labelledby="titleId"
      :ui="{ body: 'p-0 sm:p-0' }"
    >
      <h2
        :id="titleId"
        class="sr-only"
      >
        Opções de frete
      </h2>

      <!-- Skeleton fora da árvore de acessibilidade: o status acima anuncia o loading. -->
      <div
        v-if="view === 'loading'"
        aria-hidden="true"
        class="flex flex-col divide-y divide-default"
      >
        <div
          v-for="index in 4"
          :key="index"
          class="flex items-center gap-4 p-4"
        >
          <USkeleton class="size-8 rounded-full" />
          <USkeleton class="h-4 flex-1" />
          <USkeleton class="hidden h-4 flex-1 md:block" />
          <USkeleton class="h-4 w-20" />
          <USkeleton class="size-8" />
        </div>
      </div>

      <template v-else-if="data">
        <p
          v-if="!data.options.length"
          class="p-4 text-body text-muted"
        >
          Nenhuma transportadora atende esse trecho com esses dados.
        </p>

        <FeaturesQuoteFreightOptionsTable
          v-else
          :options="data.options"
          @select="onSelect"
        />
      </template>
    </UCard>
  </div>
</template>
