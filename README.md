# Sistema de cotação de fretes

Teste técnico para a vaga de Front-end Pleno (Vue/Nuxt).

Stack: Nuxt 4, Vue 3, TypeScript estrito, Nuxt UI + Tailwind CSS 4, TanStack Vue Query, zod,
Vitest, MSW e Playwright.

**Versão publicada:** https://sistema-cotacao-fretes.vercel.app/calcular-frete. Usa a API Sandbox
do Melhor Envio e serve para validar sem instalar nada ou se o ambiente local der problema.

## Como rodar

Requisitos: Node 22.19+ ou 24.11+ (versão no [`.nvmrc`](.nvmrc)) e pnpm via Corepack.

```bash
nvm use
corepack enable
pnpm install
pnpm dev        # http://localhost:3000/calcular-frete
```

Não precisa de `.env` nem de conta no Melhor Envio: o `pnpm dev` usa dados simulados.
Para o build de produção: `pnpm build` e `pnpm preview`.

## Cotação: mock ou Melhor Envio

A tela chama só a rota interna `POST /api/freight/quote`. O server decide a origem dos dados, e o
token nunca chega ao navegador.

| Ambiente | Origem dos dados |
|----------|------------------|
| `pnpm dev` (padrão) | Mock |
| `pnpm dev` com `NUXT_FREIGHT_API_MODE=melhor-envio` e token | Sandbox do Melhor Envio |
| `pnpm build` + `pnpm preview` com token | Sandbox do Melhor Envio |
| `pnpm build` + `pnpm preview` sem token, ou com `mock` | Erro 503 "Cotação de frete não configurada" |

**Mock:** o resultado é sempre o mesmo, seja qual for o dado digitado: quatro opções e uma
indisponível. Os dados passam pela mesma normalização da integração real. A tela não indica que são
simulados; o log do server e o campo `simulated: true` da resposta indicam.

**Sandbox:** para usar a API real localmente:

1. Crie uma conta em https://sandbox.melhorenvio.com.br e um aplicativo em Integrações › Área Dev.
2. Gere um access token com o escopo `shipping-calculate`
   ([doc](https://docs.melhorenvio.com.br/reference/solicitacao-do-token)).
3. Copie o `.env.example` para `.env` e preencha:

   ```bash
   NUXT_FREIGHT_API_MODE=melhor-envio
   NUXT_MELHOR_ENVIO_TOKEN=<access token>
   NUXT_MELHOR_ENVIO_USER_AGENT=FretePro (seu-email@exemplo.com)
   ```

Exemplo de cotação: origem `01310-100`, destino `20040-020`, 10 × 15 × 20 cm, 1 kg.

## Qualidade e testes

```bash
pnpm lint
pnpm typecheck                         # inclui os testes
pnpm test                              # Vitest: unit e componente
pnpm exec playwright install chromium  # só na primeira vez
pnpm test:e2e                          # faz o build e sobe o app na porta 3100
```

Os testes não acessam a rede nem precisam de token: MSW simula o Melhor Envio, e o E2E intercepta a
rota interna. O [CI](.github/workflows/ci.yml) roda tudo em cada push e pull request.

## Problemas comuns

| Sintoma | Solução |
|---------|---------|
| `ERR_PNPM_UNSUPPORTED_ENGINE` no install | Node antigo; rode `nvm use`. |
| 503 "Cotação de frete não configurada" | Use `pnpm dev` ou configure o token. |
| 502 "Serviço de frete indisponível" com `melhor-envio` | Token expirado ou inválido; gere outro. |
| `.env` alterado sem efeito | Reinicie o servidor. |
| Nada funciona localmente | Use a [versão publicada](https://sistema-cotacao-fretes.vercel.app/calcular-frete). |

## Estrutura de pastas

```
app/                      páginas, componentes, composables (Vue Query) e utils
shared/schemas/           schemas zod usados pelo app e pelo server
shared/types/             contrato da resposta da cotação
server/api/               rota interna /api/freight/quote
server/utils/freight/     integração Melhor Envio, mock e erros
tests/                    unit, component, mocks (MSW) e e2e
docs/                     decisões e design tokens
```

## Decisões técnicas

Registro completo em [`docs/DECISIONS.md`](docs/DECISIONS.md) (números entre parênteses).

- **Validação única** (003, 017): um schema zod em `shared/schemas` valida o formulário, a URL e o
  server.
- **Estado na URL, sem Pinia** (004, 028): reload, histórico e link compartilhado reproduzem a
  cotação e a tela de resultados.
- **Vue Query** (002, 025): cache por parâmetros; repetir a mesma cotação não chama a API.
- **API externa só no server** (021, 023): resposta validada e normalizada num contrato próprio.
- **Mock nunca é fallback** (022): só existe em `pnpm dev` e não esconde falha da API real.

## Desvios de design

Os design tokens não vieram prontos com o layout: foram gerados automaticamente no Figma durante o
desenvolvimento e exportados em JSON para [`docs/design/tokens/`](docs/design/tokens/). Esses valores
não foram alterados; as correções de contraste ficam em variantes `-a11y` separadas.

| No design | Na implementação | Motivo |
|-----------|------------------|--------|
| "Calcular frete" antes de "Início"; breadcrumb "Início > Calcular frete" | "Início" primeiro; breadcrumb "Calcular frete > Resultados" (014) | As duas páginas são de primeiro nível, sem relação pai/filho. |
| Medidas e peso pré-preenchidos | Campos vazios com placeholder (026) | Eram valores de exemplo do layout. |
| Ícone de pin no seguro | Ícone de cédula (020) | O pin repete o ícone do CEP. |
| "O CEP inválido" | "CEP inválido" (019) | Erro de digitação; |
| Botão desabilitado com erros | Sempre habilitado; valida no envio e foca o erro (020) | Botão desabilitado não explica o que falta para quem usa teclado ou leitor de tela. |
| Textos e item ativo do menu abaixo de 4,5:1 | Variantes `-a11y` (010, 015) | Contraste mínimo do WCAG AA. |
| Sem foco, hover nem loading; sem layout mobile | Foco `amber/700`, padrões do Nuxt UI e lista no lugar da tabela no mobile (028) | Estados e telas não previstos no design. |

## Limitações conhecidas

- Token do Melhor Envio gerado à mão, válido por 30 dias. Não há fluxo OAuth.
- O Sandbox tem preços de teste e devolve CEP inexistente como opção indisponível, não como erro.
- Um volume por cotação, com as medidas arredondadas para cima (a API só aceita inteiros).
- A tela não mostra o motivo de indisponibilidade enviado pela API, só o texto do layout.
- "Selecionar" só mostra um toast: não há contratação nem histórico. As outras páginas do menu só
  têm título.
- Nas máscaras, o cursor vai para o fim do campo quando o texto é reformatado.
- Só modo claro;

## Próximos passos

Com mais tempo, eu trabalharia em:

- **Contratação do frete:** dar função ao botão "Selecionar" e salvar as cotações na página Histórico.
- **Autenticação OAuth com o Melhor Envio**, com renovação automática do token.
- **Motivo da indisponibilidade** visível na tabela, por exemplo num tooltip.
- **Testes de acessibilidade automatizados** (axe no Playwright) e E2E em Firefox e WebKit.
- **Modo escuro**, quando o design tiver tokens para ele.
