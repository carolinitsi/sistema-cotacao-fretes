<script setup lang="ts">
import type { FormErrorEvent } from '@nuxt/ui'
import { quoteRequestSchema, type QuoteRequest } from '#shared/schemas/quote'

// O formulário edita um estado próprio e só emite o request num envio válido; digitar não
// cota (DECISIONS 026). A página grava o request na URL e mostra os resultados (DECISIONS 028).
// Quando o request da URL muda (histórico), a página remonta o formulário pelo :key.
const props = defineProps<{ initialRequest: QuoteRequest | null }>()

const emit = defineEmits<{ submit: [request: QuoteRequest] }>()

const state = reactive(createQuoteFormState(props.initialRequest))

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

function onSubmit() {
  const next = mapFormToQuoteRequest(state)
  if (next) {
    emit('submit', next)
  }
}

// Leva o foco ao primeiro campo inválido (o id vem do UFormField). Por isso o UForm usa
// :loading-auto="false": o loadingAuto desabilita os campos durante o envio, e campo
// desabilitado não recebe foco. O envio não espera nada: a cotação roda na tela de resultados.
function onError(event: FormErrorEvent) {
  const id = event.errors[0]?.id
  if (id) {
    document.getElementById(id)?.focus()
  }
}
</script>

<template>
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
          class="w-full cursor-pointer justify-center sm:w-auto"
        />
      </div>
    </UCard>
  </UForm>
</template>
