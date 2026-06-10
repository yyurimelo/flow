# Flow — Frontend

Interface web da plataforma Flow. React 19 + Vite + TypeScript, com roteamento file-based, data fetching declarativo e design system baseado em shadcn/ui.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 19 + Vite 8 |
| Linguagem | TypeScript |
| Roteamento | TanStack Router (file-based) |
| Data fetching | TanStack Query |
| Estado global | Zustand |
| HTTP | Axios |
| UI | shadcn/ui + Tailwind CSS 4 |
| Toast | Sonner |
| Realtime | Socket.IO client |
| Fontes | Inter Variable + Newsreader |

## Estrutura

```
frontend/src/
├── main.tsx                  # Entry: ThemeProvider > QueryProvider > RouterProvider
├── routes/                   # Páginas — TanStack Router file-based
│   ├── __root.tsx            # Layout raiz (Outlet + Toaster + devtools)
│   ├── index.tsx             # "/"
│   └── _auth/                # Layout group de rotas autenticadas
├── features/                 # Módulos por domínio
│   └── [feature]/
│       ├── components/       # Componentes do domínio
│       ├── hooks/            # useQuery / useMutation do domínio
│       └── api.ts            # Chamadas Axios do domínio
├── api/
│   └── client.ts             # Instância Axios com interceptor JWT + 401 redirect
├── providers/                # AuthProvider, QueryProvider, ThemeProvider
├── stores/                   # Zustand (usuário logado)
├── hooks/                    # Hooks globais (useIsMobile, useTheme…)
├── components/
│   ├── ui/                   # shadcn/ui — nunca modificar
│   └── [componentes globais]
└── lib/
    └── utils.ts              # cn() helper
```

## Comandos

```bash
# Dev server — localhost:5173
npm run dev:front

# Lint
npm -w frontend run lint

# Build
npm -w frontend run build
```

## Roteamento

TanStack Router file-based em `src/routes/`. O Vite plugin auto-gera `routeTree.gen.ts` — nunca editar esse arquivo.

| Arquivo | Rota |
|---|---|
| `index.tsx` | `/` |
| `users.tsx` | `/users` |
| `users.$id.tsx` | `/users/:id` |
| `_auth.tsx` | Layout wrapper (sem segmento de URL) |
| `_auth.login.tsx` | `/login` dentro do layout auth |

Cada arquivo de rota exporta `Route` como named export.

Proteção de rotas via `beforeLoad` — redireciona para `/login` se não autenticado.

## Auth

- Token JWT em `localStorage['flow:token']`
- Interceptor Axios injeta `Authorization: Bearer <token>` automaticamente
- Respostas 401 redirecionam para `/login` via response interceptor
- `AuthProvider` expõe `useAuth()` com `user`, `login()`, `logout()`

## Data fetching

Hooks em `src/features/[feature]/hooks/`. Regras:

- Query keys em objeto `keys` no mesmo arquivo — nunca strings inline
- `queryFn` retorna `.data` desembrulhado do Axios
- Mutations chamam `queryClient.invalidateQueries` no `onSuccess`
- Componentes nunca chamam `api` diretamente — sempre via hook

## Shared types

Importar sempre de `@flow/shared`:

```ts
import type { User, Notification } from '@flow/shared'
import { USER_ROLE, NOTIFICATION_TYPE, API_ENDPOINTS } from '@flow/shared'
```

## Design system

Tokens CSS via Tailwind: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-card`, `text-primary`, `bg-destructive`. Nunca hardcodar cores.

**Fontes:**
- `font-sans` (Inter Variable) — todo texto de UI
- `font-display` (Newsreader italic) — logotipo "Flow" apenas

**Tema dark/light** via `ThemeProvider`. Padrão: `dark`.

## Env

`frontend/.env.local`:

```ini
VITE_API_URL=http://localhost:3000
```
