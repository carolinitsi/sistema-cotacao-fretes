<script setup lang="ts">
import type { FormErrorEvent } from '@nuxt/ui'
import { quoteRequestSchema } from '#shared/schemas/quote'

// O formulário edita um estado próprio; a cotação usa o request da URL, que só muda
// num envio válido. Digitar não cota (DECISIONS 026).
const { request, setRequest } = useQuoteRequestQuery()

// Cota só no cliente, depois de montar (DECISIONS 027). No SSR o useQuery dispararia a
// busca sem esperar por ela: a resposta não entra no HTML e o cliente buscaria de novo.
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})
const quoteRequest = computed(() => (isMounted.value ? request.value : null))

const { data, isFetching, isError, errorMessage, refetch } = useFreightQuote(quoteRequest)

const state = reactive(createQuoteFormState(request.value))

// Voltar/avançar no navegador troca o request: o formulário mostra os dados dele.
watch(request, (next) => {
  Object.assign(state, createQuoteFormState(next))
})

const cepFields = [
  { name: 'originCep', label: 'CEP de origem' },
  { name: 'destinationCep', label: 'CEP de destino' }
] as const

const measureFields = [
  { name: 'heightCm', label: 'Altura (cm)', icon: 'i-lucide-box', placeholder: '0', mask: quoteFormMasks.dimension },
  { name: 'widthCm', label: 'Largura (cm)', icon: 'i-lucide-box', placeholder: '0', mask: quoteFormMasks.dimension },
  { name: 'lengthCm', label: 'Comprimento (cm)', icon: 'i-lucide-box', placeholder: '0', mask: quoteFormMasks.dimension },
  { name: 'weightKg', label: 'Peso (kg)', icon: 'i-lucide-weight', placeholder: '0,000', mask: quoteFormMasks.weight }
] as const

async function onSubmit() {
  // O botão já fica desabilitado; isto cobre um Enter durante a cotação.
  if (isFetching.value) {
    return
  }

  const next = mapFormToQuoteRequest(state)
  if (!next) {
    return
  }

  // Mesmo request: a URL não muda e o Vue Query responde do cache. Depois de um erro,
  // o reenvio é a nova tentativa.
  const navigated = await setRequest(next)
  if (!navigated && isError.value) {
    await refetch()
  }
}

// Leva o foco ao primeiro campo inválido (o id vem do UFormField). Por isso o UForm usa
// :loading-auto="false": o loadingAuto desabilita os campos durante o envio, e campo
// desabilitado não recebe foco. O loading da tela é o da cotação (isFetching).
function onError(event: FormErrorEvent) {
  const id = event.errors[0]?.id
  if (id) {
    document.getElementById(id)?.focus()
  }
}

const statusMessage = computed(() => {
  if (isFetching.value) {
    return 'Calculando frete…'
  }

  const count = data.value?.options.length

  if (count === undefined) {
    return ''
  }

  return count === 1 ? '1 opção de frete encontrada.' : `${count} opções de frete encontradas.`
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <UForm
      :schema="quoteRequestSchema"
      :state="state"
      :loading-auto="false"
      class="flex flex-col gap-2"
      @submit="onSubmit"
      @error="onError"
    >
      <FeaturesQuoteFreightFormSection
        icon="i-lucide-map"
        title="Endereços"
        description="Informe os CEPs de origem e destino para calcular o frete."
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            v-for="field in cepFields"
            :key="field.name"
            :label="field.label"
            :name="field.name"
          >
            <template #error="{ error }">
              <span
                v-if="error"
                class="flex items-center gap-1"
              >
                <UIcon
                  name="i-lucide-circle-alert"
                  class="size-icon shrink-0"
                  aria-hidden="true"
                />
                {{ error }}
              </span>
            </template>
            <UiMaskedInput
              v-model="state[field.name]"
              :mask="quoteFormMasks.cep"
              icon="i-lucide-map-pin"
              placeholder="00000-000"
              inputmode="numeric"
              class="w-full"
            />
          </UFormField>
        </div>
      </FeaturesQuoteFreightFormSection>

      <FeaturesQuoteFreightFormSection
        icon="i-lucide-package"
        title="Dimensões e peso"
        description="Informe as dimensões do pacote e o peso total."
      >
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UFormField
            v-for="field in measureFields"
            :key="field.name"
            :label="field.label"
            :name="field.name"
          >
            <template #error="{ error }">
              <span
                v-if="error"
                class="flex items-center gap-1"
              >
                <UIcon
                  name="i-lucide-circle-alert"
                  class="size-icon shrink-0"
                  aria-hidden="true"
                />
                {{ error }}
              </span>
            </template>
            <UiMaskedInput
              v-model="state[field.name]"
              :mask="field.mask"
              :icon="field.icon"
              :placeholder="field.placeholder"
              inputmode="decimal"
              class="w-full"
            />
          </UFormField>
        </div>
      </FeaturesQuoteFreightFormSection>

      <FeaturesQuoteFreightFormSection
        icon="i-lucide-shield-check"
        title="Seguro (opcional)"
        description="Informe o valor do seguro da carga."
      >
        <UFormField
          label="Valor do seguro da carga (R$)"
          name="insuranceBrl"
        >
          <template #error="{ error }">
            <span
              v-if="error"
              class="flex items-center gap-1"
            >
              <UIcon
                name="i-lucide-circle-alert"
                class="size-icon shrink-0"
                aria-hidden="true"
              />
              {{ error }}
            </span>
          </template>
          <UiMaskedInput
            v-model="state.insuranceBrl"
            :mask="quoteFormMasks.insurance"
            icon="i-lucide-banknote"
            placeholder="0,00"
            inputmode="numeric"
            class="w-full"
          />
        </UFormField>
      </FeaturesQuoteFreightFormSection>

      <UCard>
        <div class="flex justify-end">
          <UButton
            type="submit"
            label="Calcular frete"
            icon="i-lucide-search"
            :loading="isFetching"
            :disabled="isFetching"
            class="w-full justify-center sm:w-auto"
          />
        </div>
      </UCard>
    </UForm>

    <p
      role="status"
      class="sr-only"
    >
      {{ statusMessage }}
    </p>

    <UAlert
      v-if="isError && !isFetching"
      role="alert"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="Não foi possível calcular o frete"
      :description="errorMessage ?? undefined"
    />

    <FeaturesQuoteFreightQuoteResult
      v-else-if="data && !isFetching"
      :quote="data"
    />
  </div>
</template>
