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
- `User` — id, name, username, email, password, bio, avatar_url, cover_url, is_private, role (USER/MODERATOR/ADMIN)
- `Motorcycle` — garagem do usuário, is_active
- `Follow` — follower/following, status PENDING/ACCEPTED (perfis privados)
- `PilotoGarupa` — vínculo entre piloto e garupa, status PENDING/ACCEPTED
- `Organizer` → `Series` → `Challenge` → `ChallengeTarget`
- `Challenge` — moderation_mode (PUBLIC/PRIVATE), moderators, participants, cover_url
- `ChallengeTarget` — M2N com Challenge via `_ChallengeTargets`, city_id, type (CITY/WAYPOINT/LANDMARK/BORDER)
- `City` — ibge_code, name, state, region, latitude, longitude (5571 municípios do IBGE)
- `ChallengeParticipant` — join table user_id + challenge_id (usuário deve participar antes de fazer check-in)
- `ChallengeModerator` — join table user_id + challenge_id (moderação restrita)
- `CheckIn` — foto, EXIF, status PENDING/APPROVED/REJECTED, reviewed_by
- `Notification` — type CHECKIN_APPROVED/CHECKIN_REJECTED, checkin_id, read

## Funcionalidades implementadas
- Auth (cadastro, login, logout, proteção de rotas via middleware)
- Perfil (avatar, cover, bio, garagem, edição, mural de medalhas 🏆/🎯)
- Desafios (catálogo, série, organização, CRUD via admin, cover por entidade)
- Participação em desafios — botão "Participar" obrigatório antes de check-in; filtro "Em progresso" usa participação
- Check-in (upload para Supabase Storage, EXIF, status PENDING; galeria + câmera no mobile)
- Waypoints — M2N (um waypoint em múltiplos desafios), campo Município (City), tipo via pills
- Mapa (`/mapa`) — pins de todos os waypoints dos desafios que o usuário participa (verde/laranja/cinza)
- Locais próximos (`/locais-proximos`) — geolocalização + Haversine SQL, raio configurável
- Social (follow/unfollow, busca de usuários)
- Notificações (`/notificacoes`): solicitações de follow, convites Piloto/Garupa, aprovação/reprovação de check-in
- Moderação (`/moderacao`): fila com dark theme, aprovar/reprovar, justificativa livre obrigatória
- Moderação por desafio — modo PUBLIC (qualquer moderador) ou PRIVATE (usuários designados por desafio)
- Feed (`/home`): check-ins aprovados, curtidas 🏍️ (toggle), comentários inline
- PWA: manifest, meta tags Apple Web App, componente `InstallPrompt` (beforeinstallprompt)

## Actions disponíveis (src/app/actions/)
- `auth.ts` — login, cadastro
- `challenges.ts` — CRUD de organizer/series/challenge (com moderators sync)
- `checkin.ts` — submitCheckIn (verifica participação antes de criar)
- `cities.ts` — searchCities (busca debounced por nome)
- `feed.ts` — getFeed, toggleReaction, addComment
- `moderation.ts` — approveCheckIn, rejectCheckIn (respeita moderation_mode por desafio)
- `participation.ts` — joinChallenge, leaveChallenge
- `profile.ts` — updateProfile, updateAvatar
- `social.ts` — follow, unfollow
- `targets.ts` — CRUD de waypoints, findNearbyTargets (Haversine)
- `users.ts` — searchUsers (busca por nome/@username)

## Componentes notáveis (src/components/challenges/)
- `CityPicker` — busca debounced de município, mostra "Cuiabá - MT"
- `ModeratorPicker` — multi-seleção de usuários para moderação restrita
- `CheckInForm` — upload de foto sem `capture` (permite galeria no mobile)

## Padrão de testes
```ts
vi.mock("@/lib/prisma", () => ({ prisma: { model: { method: vi.fn() } } }))
vi.mock("@/lib/dal", () => ({ verifySession: vi.fn() }))
```
- Nunca testar com banco real
- Testar: happy path + casos de erro de cada Server Action
- Mock do `revalidatePath` é automático (configurado em `src/test/setup.ts`)

## Pendente / Próximas funcionalidades
- Posts automáticos de gamificação (marcos de progresso no feed)
- Mapa de calor de municípios conquistados (longo prazo)
- Vínculo Piloto/Garupa (schema existe, UI de convite no perfil pendente)
- Ícones PWA: `/public/icons/icon-192.png` e `/public/icons/icon-512.png` (sem eles o Chrome não dispara o prompt de instalação)
