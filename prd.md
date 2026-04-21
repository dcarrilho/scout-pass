# ScoutPass — Product Requirements Document

> **Versão:** 0.6 — Participação, Moderação por desafio, Mapa e Waypoints
> **Última atualização:** 2026-04-21

---

## 1. Visão do Produto

ScoutPass é uma rede social gamificada de desafios para motociclistas. Os usuários completam desafios pelo país, registram conquistas e acompanham o progresso de outros pilotos. No futuro, a plataforma se expandirá para outros veículos (carros, bicicletas).

---

## 2. Escopo desta versão (v0.1)

Esta versão cobre exclusivamente:
- Estrutura base do projeto
- Fluxo de cadastro
- Fluxo de login
- Fluxo de logout
- Página inicial pós-login (placeholder)

---

## 3. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend + Backend | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| Banco de dados | PostgreSQL via Supabase |
| ORM | Prisma |
| UI | Tailwind CSS + shadcn/ui |
| Autenticação | Auth.js (Credentials provider) |
| Storage | Supabase Storage |
| Hospedagem | Vercel (app) + Supabase (DB) |

---

## 4. Modelo de Dados — v0.6

```prisma
// Enums: Role, TargetType, CheckInStatus, FollowStatus, LinkStatus, NotificationType, ModerationMode

User — avatar_url, cover_url, bio, is_private, role (USER/MODERATOR/ADMIN)
Motorcycle — garagem do usuário, is_active
Follow — status PENDING/ACCEPTED
PilotoGarupa — vínculo piloto/garupa, status PENDING/ACCEPTED
Organizer — slug, logo_url, cover_url
Series — icon, color, order, cover_url
Challenge — moderation_mode (PUBLIC/PRIVATE), cover_url, is_active
  → ChallengeParticipant (user_id + challenge_id) — participação obrigatória pré check-in
  → ChallengeModerator (user_id + challenge_id) — moderadores designados (modo PRIVATE)
ChallengeTarget — M2N com Challenge, city_id, type, lat/lng, order
City — ibge_code, name, state, region, latitude, longitude (5571 municípios IBGE)
CheckIn — photo_url, EXIF, status PENDING/APPROVED/REJECTED, reviewed_by
Notification — CHECKIN_APPROVED / CHECKIN_REJECTED
Reaction, Comment — feed social
```

---

## 5. Funcionalidades

### 5.1 Cadastro

**Campos obrigatórios:**
- Nome completo
- Nome de usuário (`@username`) — único, usado na URL do perfil
- E-mail — único
- Senha

**Regras:**
- Username: apenas letras minúsculas, números e underscore (`a-z`, `0-9`, `_`), mínimo 3 e máximo 30 caracteres
- Senha: mínimo 8 caracteres
- E-mail deve ser válido e único
- Username deve ser único

**Fluxo:**
1. Usuário acessa `/cadastro`
2. Preenche o formulário
3. Sistema valida campos (client-side + server-side)
4. Cria conta e autentica automaticamente
5. Redireciona para `/home`

### 5.2 Login

**Campos:**
- E-mail
- Senha

**Regras:**
- Credenciais inválidas exibem mensagem genérica ("E-mail ou senha incorretos") — sem indicar qual campo está errado
- Sessão persistida via cookie seguro (Auth.js)

**Fluxo:**
1. Usuário acessa `/login`
2. Preenche e-mail e senha
3. Sistema autentica via Auth.js Credentials
4. Redireciona para `/home`
5. Usuário não autenticado tentando acessar rota protegida é redirecionado para `/login`

### 5.3 Logout

- Botão disponível no menu
- Encerra a sessão e redireciona para `/login`

### 5.4 Proteção de rotas

- Rotas públicas: `/login`, `/cadastro`
- Todas as demais rotas requerem autenticação
- Middleware Next.js intercepta requisições não autenticadas

---

## 6. Estrutura de Pastas

```
/app
  /(auth)
    /login          → página de login
    /cadastro       → página de cadastro
  /(app)
    /home           → home pós-login (placeholder v0.1)
    /perfil
      /[username]   → perfil público

/components
  /ui               → shadcn/ui
  /auth             → formulários de login e cadastro

/lib
  /auth.ts          → configuração Auth.js
  /prisma.ts        → cliente Prisma singleton
  /validations.ts   → schemas Zod

/prisma
  /schema.prisma
  /seed.ts

/middleware.ts       → proteção de rotas
```

---

## 7. Rotas da Aplicação

| Rota | Acesso | Descrição |
|---|---|---|
| `/login` | Público | Tela de login |
| `/cadastro` | Público | Tela de cadastro |
| `/home` | Autenticado | Home principal (placeholder) |
| `/perfil/[username]` | Autenticado | Perfil do usuário |

---

## 8. Requisitos Não Funcionais

- **Mobile-first:** layout pensado para 375px+, responsivo até desktop
- **PWA:** manifesto web configurado desde o início
- **Senhas:** armazenadas com hash bcrypt (nunca em texto puro)
- **Validação:** Zod no client e server (mesmos schemas)
- **Feedback visual:** loading states em todos os botões de ação

---

## 9. Fora de escopo — v0.1

- OAuth (Google, Apple)
- Recuperação de senha
- Edição de perfil
- Desafios e check-ins
- Timeline e feed
- Moderação
- Upload de foto

---

## 10. Histórico de versões

| Versão | Conteúdo |
|---|---|
| v0.1 | Auth (cadastro, login, logout) |
| v0.2 | Perfil, avatar, garagem de motos |
| v0.3 | Desafios, check-in, upload de fotos |
| v0.4 | Feed, curtidas, comentários, social (follow) |
| v0.5 | Moderação, notificações, PWA |
| v0.6 | Participação obrigatória, mapa, waypoints M2N, City (IBGE), moderação por desafio |

## 10.1 Próximas funcionalidades planejadas

| Funcionalidade | Prioridade |
|---|---|
| Posts automáticos de gamificação (marcos de progresso no feed) | Alta |
| Vínculo Piloto/Garupa — UI de convite no perfil | Média |
| Mapa de calor de municípios conquistados | Baixa |
| Ícones PWA (`icon-192.png` / `icon-512.png`) | Baixa |
| Pins de parceiros comerciais no mapa | Backlog |
| Check-in em pontos de apoio | Backlog |

---

## 11. Status das funcionalidades do Fazedor de Chuva

> Levantamento feito em 2026-04-20 comparando `Fazedor de Chuva/projeto.md` com este PRD.
> Estas funcionalidades existem no sistema legado e devem ser consideradas nas próximas versões.

### Perfil e Social
- [ ] **Mapa de calor de municípios conquistados** — exibido no perfil público do usuário
- [ ] **Mural de medalhas** — exibição de conquistas/badges no perfil público
- [ ] **Vínculo Piloto/Garupa** — convite, aceite e replicação automática de check-ins aprovados entre parceiros de viagem
- [ ] **Configuração de visibilidade do perfil** — opção Público / Privado

### Desafios e Check-in
- [x] **Notificações in-app** — implementado (CHECKIN_APPROVED / CHECKIN_REJECTED)
- [x] **Participação obrigatória** — usuário clica "Participar" antes de fazer check-in
- [x] **Moderação por desafio** — modo PUBLIC (qualquer moderador) ou PRIVATE (usuários designados)
- [x] **PWA prompt "Adicionar à Tela Inicial"** — manifesto e componente `InstallPrompt` implementados
  > ⚠️ **Pendente:** criar `/public/icons/icon-192.png` e `/public/icons/icon-512.png` (logo ScoutPass em PNG). Sem esses arquivos o Chrome não dispara o prompt de instalação.

### Timeline e Rede Social
- [ ] **Posts automáticos de gamificação** — gerados ao atingir marcos (MILESTONE, CHALLENGE_START) sem ação manual do usuário
- [ ] **Curtidas com ícone temático** — reação com ícone customizado de moto (não curtida genérica)

### Backoffice e Moderação
- [ ] **Gestão de checkpoints por tipo de desafio** — CRUD de checkpoints específicos para Rodoviário e Lendário
- [ ] **Gestão de pontos de apoio parceiros** — cadastro, edição e ativação de parceiros comerciais no backoffice

### Mapa e Pontos de Apoio
- [ ] **Pins de parceiros comerciais no mapa** — exibição de parceiros sobre o mapa explorador
- [ ] **Check-in em pontos de apoio** — gera badge exclusivo do parceiro
- [ ] **Badges de parceiros no perfil** — exibição de badges conquistados em pontos de apoio parceiros

---

## 12. Perfil do Usuário — v0.2

### 11.1 Modelo de Dados

```prisma
model User {
  id          String       @id @default(cuid())
  name        String
  username    String       @unique
  email       String       @unique
  password    String
  bio         String?
  avatar_url  String?
  motorcycles Motorcycle[]
  created_at  DateTime     @default(now())
  updated_at  DateTime     @updatedAt
}

model Motorcycle {
  id        String   @id @default(cuid())
  user_id   String
  user      User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  brand     String
  model     String
  year      Int
  is_active Boolean  @default(true)
  created_at DateTime @default(now())
}
```

### 11.2 Funcionalidades

**Edição de perfil (`/perfil/editar`)** — autenticado
- Alterar nome
- Alterar bio (texto livre, máx. 160 caracteres)
- Upload de foto de avatar (armazenada no Supabase Storage)
- Cadastrar moto (marca, modelo, ano)
- Marcar moto como ativa (apenas uma por vez)
- Remover moto

**Perfil público (`/perfil/[username]`)** — autenticado
- Foto de avatar
- Nome e @username
- Bio
- Moto ativa em destaque

### 11.3 Rotas

| Rota | Acesso | Descrição |
|---|---|---|
| `/perfil/editar` | Autenticado | Formulário de edição do próprio perfil |
| `/perfil/[username]` | Autenticado | Perfil público de qualquer usuário |

### 11.4 Fora de escopo — v0.2

- Seguir/deixar de seguir usuários
- Mural de medalhas
- Mapa de calor de municípios
- Histórico de motos (apenas a ativa é exibida no perfil)
