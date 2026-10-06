// Tema do Nuxt UI. As classes usam só utilities ligadas aos tokens --fp-*
// (definidas em app/assets/css/main.css).
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'brand',
      neutral: 'slate',
      error: 'red'
    },

    // Ensina o tailwind-merge que rounded-control, text-title etc. são raio,
    // tamanho de fonte e altura; sem isso ele não substitui rounded-md, text-sm...
    tv: {
      twMergeConfig: {
        extend: {
          theme: {
            'radius': ['control', 'card'],
            'shadow': ['subtle'],
            'text': ['title', 'section', 'body', 'label', 'caption'],
            'font-weight': ['button'],
            'spacing': ['control', 'icon']
          }
        }
      }
    },

    button: {
      slots: {
        base: 'rounded-control font-button focus-visible:outline-offset-2',
        leadingIcon: 'size-icon',
        trailingIcon: 'size-icon'
      },
      variants: {
        size: {
          md: { base: 'h-control px-4 text-body' }
        }
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          // Texto escuro (text/primary) sobre o amarelo: 10,35:1. Branco daria 1,73:1.
          class: 'text-highlighted disabled:bg-disabled disabled:text-on-disabled disabled:opacity-100 aria-disabled:bg-disabled aria-disabled:text-on-disabled aria-disabled:opacity-100 outline-focus'
        },
        {
          color: 'primary',
          variant: ['outline', 'soft', 'subtle', 'ghost', 'link'],
          class: 'outline-focus'
        }
      ]
    },

    input: {
      slots: {
        base: 'rounded-control',
        leadingIcon: 'size-icon',
        trailingIcon: 'size-icon'
      },
      variants: {
        size: {
          md: { base: 'h-control text-body' }
        }
      },
      compoundVariants: [
        {
          color: ['primary', 'error'],
          variant: ['outline', 'subtle'],
          class: 'outline-focus focus-visible:ring-focus'
        },
        {
          color: 'error',
          highlight: true,
          class: 'bg-surface-error ring-error-border'
        }
      ]
    },

    formField: {
      slots: {
        label: 'text-label',
        error: 'text-error-a11y'
      }
    },

    card: {
      slots: {
        root: 'rounded-card shadow-subtle'
      }
    },

    // Item ativo como "selecionado" do design. O padrão (text-primary) teria
    // amarelo sobre branco, 1,73:1.
    navigationMenu: {
      slots: {
        link: 'text-body focus-visible:before:outline-focus'
      },
      variants: {
        orientation: {
          vertical: { link: 'px-3 py-2' }
        }
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'pill',
          active: true,
          class: {
            link: 'text-selected-a11y before:bg-surface-selected',
            linkLeadingIcon: 'text-selected-a11y group-data-[state=open]:text-selected-a11y'
          }
        }
      ]
    },

    // Como no design: todos os itens em text-body regular e cinza; o atual se
    // distingue por não ser link e por aria-current. O padrão (semibold e
    // text-highlighted no atual, ícone de 20px) destoava do layout.
    breadcrumb: {
      slots: {
        link: 'text-body focus-visible:outline-focus',
        separatorIcon: 'size-icon'
      },
      variants: {
        active: {
          true: { link: 'font-normal' },
          false: { link: 'font-normal' }
        }
      },
      compoundVariants: [
        {
          color: 'neutral',
          active: true,
          class: { link: 'text-muted' }
        }
      ]
    },

    pageHeader: {
      slots: {
        root: 'border-none py-0',
        title: 'text-title sm:text-title',
        description: 'text-body'
      },
      variants: {
        title: {
          true: { description: 'mt-1' }
        }
      }
    }
  }
})
