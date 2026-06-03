# Backend (`@flow/backend`)

API Express 5 + Socket.IO + worker de notificações. Persistência em MongoDB via Prisma.

## Stack

- **Runtime:** Node 22 (via `tsx` em dev)
- **HTTP:** Express 5
- **Realtime:** Socket.IO + Redis adapter (pub/sub entre instâncias)
- **Mensageria:** RabbitMQ (fila `notification.created`)
- **DB:** MongoDB via Prisma
- **Auth:** JWT (`jsonwebtoken` + bcrypt)
- **Validação:** Zod (schemas em `@flow/shared`)

## Estrutura

```
backend/
├── server.ts                 # entrypoint HTTP + Socket.IO
├── prisma.config.ts          # config do Prisma
├── infra/
│   ├── env.ts                # carrega raiz/.env + backend/.env
│   ├── rabbitmq/             # client + publisher
│   ├── redis/                # pub/sub clients
│   └── socket/               # init + forwarder Redis → Socket.IO
├── routes/                   # Express routers
│   ├── auth.ts               # POST /api/auth (sign in)
│   ├── users.ts              # CRUD /api/users
│   └── notifications.ts      # CRUD /api/notifications
├── services/                 # regras de negócio
├── repositories/             # Prisma (acesso a dados)
├── middleware/               # auth, error handler
├── exceptions/               # classes de erro customizadas
├── generated/                # Prisma client (gerado, gitignored)
├── workers/
│   ├── notification.worker.ts  # consome RabbitMQ → publica no Redis
│   └── Dockerfile              # build do container do worker
└── prisma/
    └── schema.prisma
```

## Setup local

```bash
# da raiz do monorepo
npm install

# 1. subir a infra (redis + rabbitmq) — porta 6379 e 5672 expostas no host
docker compose up -d redis rabbitmq

# 2. gerar o client do Prisma
npm -w backend exec prisma generate

# 3. rodar o backend
npm run dev:back
# → http://localhost:3000
```

## Endpoints

Todas as rotas (exceto `/api/auth`) exigem `Authorization: Bearer <token>`.

### Auth
- `POST /api/auth` — sign in (retorna token JWT)

### Users
- `POST /api/users` — criar
- `GET /api/users` — listar todos
- `GET /api/users/paginated` — lista paginada
- `GET /api/users/:id` — buscar por id
- `PUT /api/users/:id` — atualizar
- `DELETE /api/users/:id` — soft delete

### Notifications
- `POST /api/notifications` — criar (publica na fila `notification.created`)
- `POST /api/notifications/paginated` — lista paginada
- `GET /api/notifications/:id` — buscar por id
- `PATCH /api/notifications/:id/read-status` — marcar como lida
- `DELETE /api/notifications/:id` — deletar

## Variáveis de ambiente

Carregadas pelo `infra/env.ts` (na ordem):

**`.env` (raiz)** — vars de infra compartilhada com o compose:
- `RABBITMQ_USER`, `RABBITMQ_PASS` — credenciais do RabbitMQ
- `RABBITMQ_URL` — URL completa (host: `amqp://<rabbitmq-user>:<rabbitmq-pass>@localhost:5672`)
- `REDIS_URL` — URL do Redis (host: `redis://localhost:6379`)
- `RABBITMQ_URL_DOCKER`, `REDIS_URL_DOCKER` — versões pra uso dentro do compose (hostnames internos)

**`backend/.env`** — secrets do app:
- `DATABASE_URL` — string do MongoDB
- `JWT_SECRET` — chave de assinatura dos tokens

## Fluxo de uma notificação

```
POST /api/notifications
  → notification.service.create()
    → notification.repository.create() (Prisma → Mongo)
    → rabbitMQClient → exchange/queue "notification.created"

worker (workers/notification.worker.ts)
  ← consome "notification.created"
  → pubClient.publish("socket:notifications", payload)

backend (server.ts → setupRedisSocketForwarder)
  ← subClient recebe "socket:notifications"
  → io.emit → clients conectados
```

## Rodando o worker

**No host:**
```bash
npm run dev:worker
```

**No docker:**
```bash
docker compose up -d --build notification-worker
```

O `docker-compose.yml` já está configurado: o worker usa `env_file: .env` pra herdar as vars da raiz, e o `environment:` block sobrescreve `RABBITMQ_URL`/`REDIS_URL` com os valores `*_DOCKER` (hostnames internos da rede do compose).

## Scripts

| Script | Comando | O que faz |
|---|---|---|
| `dev` | `tsx watch server.ts` | dev server com watch |
| `build` | `prisma generate && tsc` | build de produção |
| `start` | `tsx server.ts` | roda o build |
| `worker` | `tsx workers/notification.worker.ts` | roda o worker |

## Convenções

- Services são **classes injetadas manualmente** (sem container de DI)
- Repositories encapsulam Prisma; services **não usam Prisma diretamente**
- Erros: lançar classes de `exceptions/` (e.g. `NotFoundError`, `UnauthorizedError`); o `middleware/error.ts` converte pra HTTP response
- Imports usam o alias `@flow/...` (configurado no `tsconfig.json`) que aponta pra `backend/`
- Path mapping: `@flow/services` → `services/`, `@flow/middleware` → `middleware/`, `@flow/infra` → `infra/`
