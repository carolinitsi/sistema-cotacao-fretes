<script setup lang="ts">
import type { QuoteRequest } from '#shared/schemas/quote'

// Formulário e resultados são estados da mesma página, decididos pela URL (DECISIONS 028):
// query válida mostra os resultados; com a flag de edição, o formulário preenchido.
const { request, quotedRequest, setRequest, editRequest } = useQuoteRequestQuery()

const header = computed(() => (quotedRequest.value
  ? { title: 'Cotações de frete', description: 'Confira as opções disponíveis para o seu envio.' }
  : { title: 'Calcular frete', description: 'Receba cotações das principais transportadoras do país.' }))

useSeoMeta({ title: () => header.value.title })

// O formulário é remontado quando o request da URL muda de valor (voltar/avançar no
// histórico), em vez de sincronizado por um watch.
const formKey = computed(() => JSON.stringify(request.value))

// O botão clicado (enviar ou editar) some com a troca de visão: o foco vai para o título,
// que anuncia a tela nova.
const titleRef = useTemplateRef('title')

async function focusTitle() {
  await nextTick()
  titleRef.value?.focus()
}

async function onSubmit(next: QuoteRequest) {
  await setRequest(next)
  await focusTitle()
}

async function onEdit() {
  await editRequest()
  await focusTitle()
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UPageHeader :description="header.description">
      <template #title>
        <span
          ref="title"
          tabindex="-1"
        >{{ header.title }}</span>
      </template>
    </UPageHeader>

    <FeaturesQuoteFreightQuoteResults
      v-if="quotedRequest"
      :request="quotedRequest"
      @edit="onEdit"
    />

    <FeaturesQuoteFreightQuoteForm
      v-else
      :key="formKey"
      :initial-request="request"
      @submit="onSubmit"
    />
  </div>
</template>
