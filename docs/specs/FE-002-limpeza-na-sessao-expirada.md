# FE-002 — Sessão expirada limpa todos os dados locais

Status: aprovada

## Contexto

Quando uma requisição volta 401, o interceptor de `services/api.ts` apaga só `@Castanha:token` e `@Castanha:user`.
Histórico (`@Castanha:history`), última conversa (`@Castanha:last_chat_id`) e os caches `@Castanha:chat_cache_*`
continuam no `localStorage`. Num computador compartilhado, a próxima conta que entrar pode ver o histórico da anterior
(o `loadHistory` usa o histórico salvo como fallback quando `/chats` falha) e tenta abrir a última conversa da outra
pessoa. O `signOut` já faz a limpeza completa, mas com lógica própria, duplicada.

## Escopo

Entra:
- Uma função única de limpeza de sessão local (ex.: `clearLocalSession()` num módulo de `services/`, sem depender de
  contexto React) que remove toda chave com prefixo `@Castanha:` e zera o token CSRF em memória.
- O interceptor de 401 e o `signOut` passam a usar essa função; o laço de limpeza duplicado do `AuthContext` sai.

Fica de fora: a remoção da escrita de `chat_cache_*` (feita à parte, junto com os bugs simples).

## Critérios de aceite

- [ ] 401 numa rota que não é `/login`/`/register` remove todas as chaves `@Castanha:*` e redireciona para `/login`.
- [ ] `signOut` remove as mesmas chaves (comportamento atual preservado).
- [ ] Chaves de outras origens/prefixos no `localStorage` não são tocadas.
- [ ] 401 em `/login` e `/register` continua sem limpar nem redirecionar.
- [ ] Testes em `api.test.ts` e `AuthContext.test.tsx` cobrindo os casos acima.

## Contrato

Nenhum.
