# Design System - Portal SINTESE

## Objetivo

Padronizar interface, componentes e comportamento responsivo da aplicacao, com foco em clareza, acessibilidade e manutencao.

## Tokens Visuais

Paleta principal (cyan/teal):
- `50`: `#ecfeff`
- `100`: `#cffafe`
- `500`: `#0891b2`
- `600`: `#0e7490`
- `700`: `#155e75`
- `900`: `#0c3547`

Tipografia:
- fonte principal: `Inter`
- labels: uppercase + tracking wider
- conteudo: `text-sm` ou `text-base`
- dados numericos/beneficios: `font-mono` quando aplicavel

## Responsividade (Mobile-First)

Breakpoints:
- base: mobile
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

Padroes:
- formularios em `form-grid` (1 coluna no mobile, 2 no `sm+`)
- tabelas desktop com `overflow-x-auto`
- cards dedicados para mobile em listagens densas
- sidebar fixa no desktop e drawer no mobile

## Classes Base (`@layer components`)

Layout:
- `page-container`
- `form-card`
- `ds-card`
- `form-grid`

Formulario:
- `form-label`
- `form-input`
- `form-select`

Botoes:
- `btn-primary`
- `btn-secondary`
- `btn-accent`
- `btn-ghost` (suporte complementar para acao neutra)

Alertas:
- `alert-error`
- `alert-warning`
- `alert-info`
- `alert-success`

## Componentes Compartilhados (`@sintese/ui`)

- `Button`:
  - variantes: `primary`, `secondary`, `accent`, `ghost`
  - suporte a `isLoading`
- `Input`:
  - `label`, `error`, `helperText`, `maskHint`
  - `maskHint` apenas orientativo nesta fase (sem mascara real ainda)
- `Card`:
  - `header`, `body`, `footer`
- `Badge`:
  - status visual (`default`, `success`, `warning`, `error`, `info`)
- `LoadingSpinner`:
  - estado de carregamento padrao
- `EmptyState`:
  - estado vazio com acao opcional
- `ResponsiveTable`:
  - tabela para desktop (`md+`)
  - representacao em cards no mobile

## Padroes de UX

- cada tela deve prever estados:
  - loading
  - erro
  - vazio
  - pronto
- estados assincronos devem ser dirigidos por hooks (`useQuery` / `useMutation`) e não por chamadas diretas de serviço na pagina.
- mocks devem ser explicitos e removiveis com troca simples de constante.
- sem regras de negócio definitivas nesta camada visual.

