import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import UiMaskedInput from '~/components/ui/MaskedInput.vue'
import { cepMask, currencyMask, decimalMask } from '~/utils/masks'

describe('UiMaskedInput', () => {
  it('mascara o CEP digitado e emite só os dígitos', async () => {
    const wrapper = await mountSuspended(UiMaskedInput<string>, {
      props: { mask: cepMask, modelValue: '' }
    })

    await wrapper.get('input').setValue('01310100')

    expect(wrapper.get('input').element.value).toBe('01310-100')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['01310100'])
  })

  it('descarta caracteres que a máscara não aceita', async () => {
    const wrapper = await mountSuspended(UiMaskedInput<number | undefined>, {
      props: { mask: decimalMask({ decimals: 1, maxIntegerDigits: 3 }), modelValue: 12 }
    })

    await wrapper.get('input').setValue('12a')

    expect(wrapper.get('input').element.value).toBe('12')
  })

  it('emite undefined quando o campo é apagado', async () => {
    const wrapper = await mountSuspended(UiMaskedInput<number | undefined>, {
      props: { mask: currencyMask({ maxIntegerDigits: 7 }), modelValue: 10 }
    })

    expect(wrapper.get('input').element.value).toBe('10,00')

    await wrapper.get('input').setValue('')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined])
  })

  it('reformata o texto quando o valor muda fora do input', async () => {
    const wrapper = await mountSuspended(UiMaskedInput<number | undefined>, {
      props: { mask: decimalMask({ decimals: 3, maxIntegerDigits: 4 }), modelValue: undefined }
    })

    await wrapper.setProps({ modelValue: 1.25 })

    expect(wrapper.get('input').element.value).toBe('1,25')
  })

  it('repassa atributos para o input', async () => {
    const wrapper = await mountSuspended(UiMaskedInput<string>, {
      props: { mask: cepMask, modelValue: '' },
      attrs: { 'inputmode': 'numeric', 'aria-label': 'CEP de origem' }
    })

    expect(wrapper.get('input').attributes()).toMatchObject({ 'inputmode': 'numeric', 'aria-label': 'CEP de origem' })
  })
})
