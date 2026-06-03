# Flow

API + realtime notifications platform. Monorepo com **backend** (Express + Socket.IO) e **shared** (tipos/zod schemas).

## Stack

- **Runtime:** Node 22 + npm workspaces
- **Dev runner:** tsx (watch mode)
- **API:** Express 5
- **Realtime:** Socket.IO com Redis adapter
- **Mensageria:** RabbitMQ
- **Cache/PubSub:** Redis
- **DB:** MongoDB via Prisma
- **Validação:** Zod (em `packages/shared`)

## Estrutura

```
flow/
├── packages/
│   └── shared/        # @flow/shared — tipos, schemas Zod, constantes
├── backend/           # API Express + worker de notificações
│   ├── infra/         # clients (rabbitmq, redis, socket)
│   ├── routes/        # auth, users, notifications
│   ├── services/      # regras de negócio
│   ├── repositories/  # acesso a dados (Prisma)
│   ├── middleware/    # auth, error handler
│   └── workers/       # notification.worker.ts + Dockerfile
├── docker-compose.yml # redis, rabbitmq, notification-worker
└── .env               # envs compartilhadas (raiz)
```

## Pré-requisitos

- [Node.js](https://nodejs.org) >= 22
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para redis + rabbitmq)
- Conta MongoDB (Atlas ou local)

## Setup

```bash
# 1. instalar deps do monorepo (npm workspaces)
npm install

# 2. copiar/env vars
# raiz (.env): RABBITMQ_*, REDIS_*, REDIS_URL_*, RABBITMQ_URL_*
# backend (.env): DATABASE_URL, JWT_SECRET

# 3. subir a infra (redis + rabbitmq)
docker compose up -d redis rabbitmq

# 4. gerar o client do Prisma
npm -w backend exec prisma generate
```

## Rodando

| Comando | O que faz |
|---|---|
| `npm run dev:back` | Sobe o backend (Express + Socket.IO) no host, em `localhost:3000` |
| `npm run dev:worker` | Sobe o worker de notificações no host (conecta em `localhost`) |
| `docker compose up -d notification-worker` | Sobe o worker dentro do container (conecta via service names) |
| `docker compose up -d redis rabbitmq` | Sobe só a infra |

## Configuração de ambiente

Três arquivos `.env` no projeto, **todos no `.gitignore`** (nenhum valor é commitado). Copie os exemplos abaixo e ajuste com seus valores.

### `.env` (raiz) — infra compartilhada

Fonte única de verdade pra RabbitMQ, Redis e as URLs usadas em cada contexto (host vs docker).

```ini
# Credenciais do RabbitMQ (usadas pelo serviço `rabbitmq` no compose + pelos clients)
RABBITMQ_USER="<rabbitmq-user>"
RABBITMQ_PASS="<rabbitmq-pass>"

# URL do RabbitMQ para o backend rodando **no host** (acessa via localhost)
RABBITMQ_URL="amqp://<rabbitmq-user>:<rabbitmq-pass>@localhost:5672"

# URL do Redis para o backend rodando **no host**
REDIS_URL="redis://localhost:6379"

# URL do RabbitMQ para o worker rodando **dentro do docker** (hostnames internos da rede)
RABBITMQ_URL_DOCKER="amqp://<rabbitmq-user>:<rabbitmq-pass>@rabbitmq:5672"

# URL do Redis para o worker rodando **dentro do docker**
REDIS_URL_DOCKER="redis://redis:6379"
```

### `backend/.env` — secrets da aplicação

```ini
# String de conexão do MongoDB (Atlas ou local)
DATABASE_URL="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority"

# Chave usada pra assinar os tokens JWT
JWT_SECRET="qualquer-string-longa-e-aleatoria"
```

### Quem carrega o quê

| Contexto | Como | O que entra em `process.env` |
|---|---|---|
| **Backend no host** (`npm run dev:back`) | `backend/infra/env.ts` carrega raiz `.env` + `backend/.env` via `dotenv` | `RABBITMQ_URL` → `localhost`, `REDIS_URL` → `localhost`, `DATABASE_URL`, `JWT_SECRET` |
| **Worker no host** (`npm run dev:worker`) | mesmo `env.ts` (importado via `infra/rabbitmq` e `infra/redis`) | idem |
| **Worker no docker** (`docker compose up notification-worker`) | `env_file: .env` carrega raiz inteira, depois `environment:` no compose sobrescreve `RABBITMQ_URL` e `REDIS_URL` com `*_DOCKER` | `RABBITMQ_URL` → `rabbitmq:5672`, `REDIS_URL` → `redis:6379`, mais tudo da raiz |

### Por que existem `*_DOCKER`?

Quando o backend roda no **host** (Windows/macOS/Linux), ele acessa Redis e RabbitMQ via `localhost:6379` / `localhost:5672` (portas expostas pelo compose).

Quando o worker roda **dentro de um container** na mesma rede do compose, esses hostnames **não existem** — o que existe é o nome do serviço (`redis`, `rabbitmq`). Por isso a raiz tem dois pares de URLs: o "normal" pro host e o `_DOCKER` pro contexto containerizado. O `docker-compose.yml` faz o override automaticamente:

```yaml
notification-worker:
  env_file:
    - .env                    # carrega tudo da raiz
  environment:
    RABBITMQ_URL: ${RABBITMQ_URL_DOCKER}   # override para o hostname interno
    REDIS_URL: ${REDIS_URL_DOCKER}
```

Nada de URL hardcoded no compose — tudo via env.

## Fluxo de uma notificação

```
HTTP request
  → routes/notifications.ts
  → services/notification.service.ts
  → repositories/notification.repository.ts (Prisma → Mongo)
  → publisher RabbitMQ (exchange/queue notification.created)

worker (notification.worker.ts)
  ← consome fila notification.created
  → pubClient.publish("socket:notifications", payload)

backend (server.ts)
  ← subClient recebe no canal "socket:notifications"
  → setupRedisSocketForwarder emite via Socket.IO pros clients conectados
```

## Convenções

- Workspaces Bun: tudo que é compartilhado entre backend e frontend vai em `packages/shared`
- Rotas finas, lógica em `services/`, acesso a dados em `repositories/`
- Validação de input com Zod (schemas em `packages/shared`)
- Erros centralizados em `middleware/error.ts` + classes em `backend/exceptions/`
