@AGENTS.md

# ScoutPass — Guia para Claude

## Stack
- Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui
- Prisma 7 (output em `src/generated/prisma`) · PostgreSQL via Supabase
- Auth: Auth.js Credentials (sem OAuth)
- Storage: Supabase Storage (bucket `scoutpass`, pasta `checkins/`)
- Testes: Vitest · sem banco real nos testes (mocks via `vi.mock`)

## Workflow obrigatório
1. Ao terminar qualquer alteração: `git add <arquivos> && git commit && git push`
2. Rodar `npm test` antes do push — 143 testes devem passar
3. Schema alterado? O `prisma generate` roda automaticamente no `build`. Localmente não é necessário rodar para os testes.

## Estrutura de pastas
```
src/app
  (auth)/           login, cadastro
  (app)/            rotas autenticadas (usuário)
  (admin)/          moderação (requer role MODERATOR/ADMIN)
  actions/          Server Actions + __tests__/
src/lib/
  dal.ts            verifySession() / verifyModerator()
  prisma.ts         singleton do cliente Prisma
  validations.ts    schemas Zod
  session.ts        JWT com jose
src/components/
  ui/               shadcn/ui
  auth/ profile/ social/ challenges/ layout/
prisma/schema.prisma
```

## Models implementados (schema.prisma)
- `User` — id, name, username, email, password, bio, avatar_url, is_private, role (USER/MODERATOR/ADMIN)
- `Motorcycle` — garagem do usuário, is_active
- `Follow` — follower/following, status PENDING/ACCEPTED (perfis privados)
- `PilotoGarupa` — vínculo entre piloto e garupa, status PENDING/ACCEPTED
- `Organizer` → `Series` → `Challenge` → `ChallengeTarget`
- `CheckIn` — foto, EXIF, status PENDING/APPROVED/REJECTED, reviewed_by
- `Notification` — type CHECKIN_APPROVED/CHECKIN_REJECTED, checkin_id, read

## Funcionalidades implementadas
- Auth (cadastro, login, logout, proteção de rotas via middleware)
- Perfil (avatar, bio, garagem, edição, mural de medalhas 🏆/🎯)
- Desafios (catálogo, série, organização, CRUD via admin)
- Check-in (upload para Supabase Storage, EXIF, status PENDING)
- Social (follow/unfollow, busca de usuários)
- Notificações (`/notificacoes`): solicitações de follow, convites Piloto/Garupa, aprovação/reprovação de check-in
- Moderação (`/moderacao`): fila de pendências, aprovar/reprovar
- Feed (`/home`): check-ins aprovados, curtidas 🏍️ (toggle), comentários inline
- PWA: manifest, meta tags Apple Web App, componente `InstallPrompt` (beforeinstallprompt)

## Padrão de testes
```ts
vi.mock("@/lib/prisma", () => ({ prisma: { model: { method: vi.fn() } } }))
vi.mock("@/lib/dal", () => ({ verifySession: vi.fn() }))
```
- Nunca testar com banco real
- Testar: happy path + casos de erro de cada Server Action
- Mock do `revalidatePath` é automático (configurado em `src/test/setup.ts`)

## Próximas funcionalidades planejadas (PRD §11)
- Posts automáticos de gamificação (marcos de progresso no feed)
- Mapa de calor de municípios conquistados (longo prazo)
- Vínculo Piloto/Garupa (schema existe, UI de convite no perfil pendente)

## Ícones PWA pendentes
Adicionar `/public/icons/icon-192.png` e `/public/icons/icon-512.png`
para o prompt de instalação funcionar no Chrome.
