# Flow

Plataforma de notificações em tempo real. Monorepo com **backend** (Express + Socket.IO), **frontend** (React + Vite) e **shared** (tipos/schemas Zod).

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node 22 + npm workspaces |
| API | Express 5 |
| Realtime | Socket.IO + Redis adapter |
| Mensageria | RabbitMQ |
| PubSub | Redis |
| Banco | MongoDB via Prisma |
| Validação | Zod (`@flow/shared`) |
| Frontend | React 19 + Vite 6 + TypeScript |
| Roteamento | TanStack Router (file-based) |
| Data fetching | TanStack Query |
| UI | shadcn/ui + Tailwind CSS 4 |

## Estrutura

```
flow/
├── packages/
│   └── shared/          # @flow/shared — tipos, schemas Zod, constantes
├── backend/
│   ├── infra/           # clients (rabbitmq, redis, socket)
│   ├── routes/          # auth, users, notifications
│   ├── services/        # regras de negócio
│   ├── repositories/    # acesso a dados (Prisma)
│   ├── middleware/      # auth, error handler
│   ├── exceptions/      # classes de erro tipadas
│   └── workers/         # notification.worker.ts + Dockerfile
├── frontend/
│   └── src/
│       ├── routes/      # páginas (TanStack Router file-based)
│       ├── features/    # módulos por domínio (auth, notifications)
│       ├── providers/   # auth, query, theme
│       ├── stores/      # Zustand (logged user)
│       └── api/         # Axios instance + interceptors
├── docker-compose.yml   # redis, rabbitmq, notification-worker
└── .env                 # envs compartilhadas (raiz)
```

## Pré-requisitos

- [Node.js](https://nodejs.org) >= 22
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Conta MongoDB (Atlas ou local)

## Setup

```bash
# 1. instalar todas as dependências do monorepo
npm install

# 2. configurar variáveis de ambiente (ver seção abaixo)

# 3. subir infraestrutura
docker compose up -d redis rabbitmq

# 4. gerar o client do Prisma
npm -w backend exec prisma generate
```

## Rodando

```bash
# Backend (Express + Socket.IO) — localhost:3000
npm run dev:back

# Worker de notificações (consome RabbitMQ, publica no Redis)
npm run dev:worker

# Frontend (Vite) — localhost:5173
npm run dev:front
```

| Comando extra | O que faz |
|---|---|
| `docker compose up -d notification-worker` | Worker dentro do container (hostnames Docker internos) |
| `docker compose up -d redis rabbitmq` | Só a infra |
| `npm -w frontend run lint` | ESLint no frontend |
| `npm -w backend exec prisma generate` | Regenera client Prisma após mudanças no schema |

## Funcionalidades

**Autenticação**
- Registro e login com JWT
- Proteção de rotas no frontend via `beforeLoad`

**Criar notificação**
- Tipo: informação, sucesso, aviso, erro
- Destino: usuário específico ou broadcast de sistema (só admins)
- Título opcional + conteúdo rico (HTML sanitizado)
- Rascunho salvo no `localStorage`

**Histórico**
- Lista paginada de notificações recebidas com scroll infinito
- Filtros: destino (pessoal/sistema) e status de leitura
- Marcar como lida/não lida
- Atualização em tempo real via Socket.IO — novas notificações aparecem no topo sem recarregar

**Gerenciamento**
- Lista de notificações enviadas; admins veem todas, usuários veem só as suas
- Filtros: destino, tipo e status ativo
- Desativar/reativar notificações (soft delete)
- Notificações desativadas não aparecem no histórico dos destinatários

**Sinos**
- Sino de notificações pessoais: recebe em tempo real via Socket.IO
- Sino de comunicados: broadcast de novidades do sistema

## Configuração de ambiente

### `.env` (raiz) — infra compartilhada

```ini
RABBITMQ_USER="<user>"
RABBITMQ_PASS="<pass>"

# URLs para quando o processo roda no host
RABBITMQ_URL="amqp://<user>:<pass>@localhost:5672"
REDIS_URL="redis://localhost:6379"

# URLs para quando o processo roda dentro do Docker
RABBITMQ_URL_DOCKER="amqp://<user>:<pass>@rabbitmq:5672"
REDIS_URL_DOCKER="redis://redis:6379"
```

### `backend/.env` — secrets da aplicação

```ini
DATABASE_URL="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority"
JWT_SECRET="<string-longa-e-aleatória>"
CORS_ORIGIN="http://localhost:5173"
```

### `frontend/.env.local`

```ini
VITE_API_URL=http://localhost:3000
```

### Por que existem URLs `_DOCKER`?

Processos no **host** acessam Redis/RabbitMQ via `localhost` (portas expostas pelo compose). Processos **dentro do Docker** precisam dos hostnames de serviço da rede interna (`redis`, `rabbitmq`). O `docker-compose.yml` faz o override automaticamente:

```yaml
notification-worker:
  env_file: [.env]
  environment:
    RABBITMQ_URL: ${RABBITMQ_URL_DOCKER}
    REDIS_URL: ${REDIS_URL_DOCKER}
```

## Fluxo de uma notificação

```
POST /api/notifications
  → NotificationService.create()
  → NotificationRepository.create()     Prisma → MongoDB
  → publish("notification.created")     RabbitMQ

notification.worker.ts
  ← consome fila "notification.created"
  → pubClient.publish("socket:notifications", payload)   Redis PubSub

server.ts → setupRedisSocketForwarder()
  ← subClient recebe "socket:notifications"
  → io.to(receiverId).emit("notification")   Socket.IO (USER)
  → io.emit("notification")                  Socket.IO (SYSTEM broadcast)

Frontend
  ← useNotificationSocket() escuta evento "notification"
  → atualiza cache TanStack Query (sino + histórico em tempo real)
```

## Convenções

- **Monorepo:** tudo compartilhado entre backend e frontend vai em `packages/shared`
- **Backend:** rotas finas, lógica em `services/`, acesso a dados em `repositories/`
- **Erros:** lançar classes de `backend/exceptions/` — `middleware/error.ts` converte pra HTTP
- **Frontend:** componentes de UI em `components/ui/` (shadcn, nunca modificar), lógica de domínio em `features/`
- **Auth:** JWT Bearer token — `localStorage['flow:token']`, interceptor Axios injetado automaticamente
- **Rotas frontend:** TanStack Router file-based em `src/routes/` — nunca editar `routeTree.gen.ts`
