# Frontend Data Layer

## Objetivo

Desacoplar páginas da origem de dados para permitir transicao de mocks para API real sem retrabalho estrutural.

## Fluxo de Dados

1. Pagina usa hook da feature (`useQuery` / `useMutation`).
2. Hook chama service da feature.
3. Service decide origem:
- mock (`USE_MOCKS=true`)
- API (`USE_MOCKS=false`) via `apiClient`.
4. Resultado volta para pagina com estados assincronos padronizados.

## Estrutura

- `src/config/featureFlags.ts`
- `src/features/auth/mocks/login.mock.ts`
- `src/features/auth/services/auth.service.ts`
- `src/features/auth/hooks/useAuthMutations.ts`
- `src/features/convenios/mocks/convenios.mock.ts`
- `src/features/convenios/services/convenios.service.ts`
- `src/features/convenios/hooks/useConveniosQuery.ts`
- `src/features/parceiros/mocks/parceiros.mock.ts`
- `src/features/parceiros/services/parceiros.service.ts`
- `src/features/parceiros/hooks/useParceirosQuery.ts`

## React Query

Provider:
- `src/app/providers/QueryProvider.tsx`

Defaults:
- `retry` de query: `1`
- `retry` de mutation: `0`
- `staleTime`: `30s`
- `refetchOnWindowFocus`: `false`

## Mocks vs API

- `USE_MOCKS=true`: services retornam mocks.
- `USE_MOCKS=false`: services chamam endpoints REST via `apiClient`.

Observacao:
- páginas não devem chamar `apiClient` diretamente.
- páginas não devem importar mocks diretamente.

## Boas Praticas

- manter contratos tipados em `packages/types`;
- criar hooks por feature para encapsular query keys e mutacoes;
- evitar logica de infraestrutura dentro de componentes visuais;
- padronizar estados de loading, erro e vazio em todas as telas.


