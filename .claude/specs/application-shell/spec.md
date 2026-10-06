# Spec — Application shell

## Objetivo
Layout base navegável (sidebar, topbar, breadcrumb, área de conteúdo) com rotas stub.
Sem regra de negócio, formulário de cotação, API ou autenticação.

## Decisões da entrevista
- `Início` é a home: `/` redireciona para `/inicio`.
- Sidebar na ordem Início, Calcular frete, Histórico, Configurações (difere da imagem; ver DECISIONS).
- Breadcrumb reflete só a hierarquia real da rota (hoje, todas são de primeiro nível).
- Rodapé da sidebar com "Ajuda" (`/ajuda`) e bloco do usuário (`/perfil`), ambos stub.

## Arquitetura
- `app/utils/navigation.ts`: itens do menu e labels das rotas (fonte única) + `getBreadcrumbItems(path)`.
- `app/utils/current-user.ts`: usuário estático temporário (sem auth).
- `app/components/shell/`: `Sidebar`, `Topbar`, `Breadcrumb` (apresentação, sem lógica de negócio).
- `app/layouts/default.vue`: `UDashboardGroup` + sidebar + `UDashboardPanel` (topbar, breadcrumb, `<main>`).
- Responsivo: abaixo de `lg` a sidebar vira slideover aberto pelo toggle da topbar (Nuxt UI).

## Requisitos
| # | Requisito | Aceite |
|---|-----------|--------|
| R1 | Layout default compõe sidebar, topbar, breadcrumb e conteúdo | Páginas não repetem o shell |
| R2 | Sidebar com logo, 4 itens, rodapé (Ajuda, usuário) | Links com rotas reais; item ativo com `aria-current="page"` e estilo de selecionado |
| R3 | Topbar com busca (visual), notificações (visual), avatar com iniciais | Controles com nome acessível |
| R4 | Breadcrumb derivado da rota via mapeamento central | Último item com `aria-current="page"` |
| R5 | Rotas stub `/inicio`, `/calcular-frete`, `/historico`, `/configuracoes`, `/ajuda`, `/perfil` | `h1` + descrição |
| R6 | Responsivo | Sem overflow horizontal em 375px; menu abre e navega no mobile |
| R7 | Testes unit, componente e e2e | `pnpm lint`, `typecheck`, `test`, `test:e2e` verdes |
| R8 | DECISIONS.md atualizado | — |

## Fora de escopo
Busca real, atalho ⌘K, notificações, dropdown/autenticação do usuário, conteúdo das páginas.
