# ScoutPass — Product Requirements Document

> **Versão:** 0.1 — Estrutura do projeto + Autenticação
> **Última atualização:** 2026-04-20

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

## 4. Modelo de Dados — v0.1

```prisma
model User {
  id         String   @id @default(cuid())
  name       String
  username   String   @unique
  email      String   @unique
  password   String   -- hash bcrypt
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}
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

## 10. Próximas versões (planejamento futuro)

| Versão | Conteúdo |
|---|---|
| v0.2 | Perfil do usuário (edição, foto, bio, moto) |
| v0.3 | Desafios e sistema de check-in |
| v0.4 | Timeline e rede social |
| v0.5 | Moderação e backoffice |
| v0.6 | Mapa explorador |
