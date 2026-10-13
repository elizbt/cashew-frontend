# Pendências para o backend do Castanha

Este documento lista os pontos identificados na revisão do frontend que **não podem ser corrigidos só no cliente** — dependem de mudança de contrato de API, política de segurança do servidor, ou configuração de infraestrutura. Prioridade sugerida: Alta → Média → Baixa.

---

## Alta prioridade

### 1. Validar a força da senha no servidor também
**Problema:** hoje o `Register.tsx` do frontend exige senha com 6+ caracteres, 1 maiúscula e 1 número antes de enviar `POST /register`. Essa é uma validação **só de UX** — qualquer requisição feita direto contra a API (curl, Postman, script) ignora essa regra completamente.
**Ação:** replicar (ou definir de forma mais rígida) a mesma política de senha no endpoint `/register`, retornando `400` com a mesma forma de erro já usada hoje:
```json
{ "message": "A senha não atende aos requisitos de segurança" }
```
ou, se preferir apontar campo a campo:
```json
{ "issues": [{ "message": "A senha deve ter ao menos 8 caracteres" }] }
```
(o frontend já sabe interpretar ambos os formatos — ver `ApiError` em `src/types/auth.ts`).

### 2. Rate limiting em `/login` e `/register`
**Problema:** nenhuma das duas rotas parece ter proteção contra força bruta / enumeração de e-mails.
**Ação:** aplicar rate limiting por IP e/ou por e-mail (ex.: 5 tentativas/min) nessas duas rotas específicas.

### 3. Padronizar o formato de resposta de `GET /chats`
**Problema:** o frontend (`ChatContext.loadHistory`, `src/context/ChatContext.tsx`) hoje tenta adivinhar o formato da resposta: aceita um array puro, ou um objeto cujo primeiro valor seja um array, e tenta várias chaves possíveis para o título (`title`, `name`, `subject`, `lastMessage`) e para o id (`id`, `_id`, `chatId`). Isso é sinal de que o contrato da API não está estável/documentado.
**Ação:** definir e manter fixo um único formato, por exemplo:
```json
[
  { "id": "uuid-1", "title": "Sobre matrícula" },
  { "id": "uuid-2", "title": "Bolsas de estudo" }
]
```
Assim que isso estiver garantido, eu simplifico a lógica de normalização no frontend (hoje ela é só uma defesa contra instabilidade do contrato).

### 4. Padronizar o campo de resposta em `POST /chat`
**Problema:** o frontend tenta `response`, `answer`, `content`, `message` e `text`, nessa ordem, para descobrir onde está o texto da resposta do assistente (`SendMessageResponse` em `src/types/chat.ts`). Isso sugere que endpoints diferentes (ou versões diferentes) devolvem em campos diferentes.
**Ação:** padronizar em um único campo, por exemplo sempre `response: string`, e sempre incluir `chatId`.

---

## Média prioridade

### 5. ~~Reconsiderar onde o token de autenticação é guardado~~ → **Feito no frontend, falta só o `CORS_ORIGIN` em produção**
**Status:** o backend já suporta os dois mecanismos em paralelo (cookie `httpOnly` + token no corpo, propositalmente, pra não quebrar nada). O frontend foi migrado para o mecanismo seguro:
- ✅ `axios.create({ withCredentials: true })` em `src/services/api.ts`.
- ✅ Parou de guardar o token em `localStorage` e de mandar `Authorization: Bearer` manualmente — `AuthContext` agora só guarda o perfil do usuário (não-sensível) para hidratação otimista da UI; a sessão de verdade é o cookie `httpOnly`, invisível para o JS.
- ✅ Lê o cookie `csrfToken` (não-httpOnly) via `document.cookie` e reenvia em `X-CSRF-Token` em todo `POST`/`DELETE` para `/chat` (`sendMessage` e `deleteChat`). Não é enviado em `GET`, nem em `/login`/`/register`.
- ✅ Botão "Sair" agora chama `POST /logout` (via `authService.logout`) antes de limpar o estado local — best-effort: mesmo que a chamada falhe, o frontend ainda desloga localmente e redireciona.

**Ação que falta, só do lado do backend:** definir `CORS_ORIGIN` no `.env` de produção com o domínio real do frontend (não pode ser `*` quando `Access-Control-Allow-Credentials: true` está ativo — o navegador rejeita essa combinação). Sem isso, o cookie de sessão não vai ser aceito em produção mesmo com o frontend já pronto.

**Nota:** como a sessão agora é um cookie que o JS não consegue ler, o `AuthContext` faz uma hidratação **otimista** a partir do perfil salvo em `localStorage` ao carregar a página — se o cookie já tiver expirado, a primeira chamada à API vai devolver `401` e o interceptor de resposta já limpa esse estado e redireciona para `/login` (ver `src/services/api.ts`).

### 6. Confirmar o timeout esperado de `POST /chat`
**Contexto:** acabei de configurar o frontend para esperar até **60 segundos** numa chamada de `/chat` (contra 15s nas demais rotas), já que a rota provavelmente faz RAG + geração via LLM e pode demorar mais que um CRUD comum.
**Ação:** me confirmar se 60s é suficiente no pior caso (ex. quando o modelo está sob carga) ou se o ideal é o backend responder mais rápido com streaming (SSE/WebSocket) em vez de uma única resposta longa — isso também melhora a percepção de velocidade para o usuário (resposta aparece token a token, como ChatGPT).

### 7. Cabeçalhos de segurança HTTP
**Problema:** eu avaliei adicionar uma tag `<meta http-equiv="Content-Security-Policy">` no `index.html`, mas isso é frágil porque a URL da API varia por ambiente (`VITE_API_URL`) e uma meta tag não cobre todos os cabeçalhos relevantes (ex. `X-Frame-Options` não funciona via meta tag).
**Ação:** configurar isso no servidor/reverse proxy/CDN que serve o frontend em produção, não no HTML:
- `Content-Security-Policy` (liberando `connect-src` para o domínio real da API)
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (ou `frame-ancestors 'none'` na CSP)
- `Referrer-Policy: strict-origin-when-cross-origin`

### 8. Garantir HTTPS em produção
**Ação:** confirmar que a URL de produção de `VITE_API_URL` é sempre `https://`, e que o backend rejeita (ou redireciona) tráfego HTTP puro.

---

## Baixa prioridade / nice-to-have

### 9. IDs estáveis de mensagem em `GET /chat/:id`
**Contexto:** eu já corrigi no frontend um problema de `key` do React usando índice do array — agora cada mensagem tem um `id` gerado no cliente (`crypto.randomUUID()`) quando o backend não manda um. Funciona bem hoje.
**Ação (opcional):** se o backend passar a devolver um `id` estável por mensagem em `GET /chat/:id` (e em `POST /chat`), o frontend já está preparado para usá-lo em vez de gerar um novo (`msg.id || createMessageId()` em `ChatContext.tsx`) — fica só como melhoria futura, não é bloqueante.

### 10. Erro genérico de "servidor fora do ar"
**Contexto:** quando `/chat` falha, o frontend mostra "Verifique se o backend está rodando corretamente" — mensagem pensada para ambiente de desenvolvimento local, meio estranha em produção.
**Ação:** nenhuma ação de backend necessária, mas se o backend puder devolver mensagens de erro mais específicas (ex. "limite de uso atingido", "serviço de IA indisponível temporariamente") eu troco essa mensagem genérica por algo mais amigável baseado no `error.response.data.message`.

---

## Resumo rápido (para copiar em um card/issue)

- [ ] Validar política de senha também no `/register` (não confiar só no frontend)
- [ ] Rate limiting em `/login` e `/register`
- [ ] Padronizar `GET /chats` → sempre `[{ id, title }]`
- [ ] Padronizar `POST /chat` → sempre `{ response, chatId, sources? }`
- [x] ~~Decidir sobre migrar token de `localStorage` para cookie `httpOnly` (+ CSRF)~~ — frontend migrado; falta só `CORS_ORIGIN` de produção no backend
- [ ] Confirmar se 60s de timeout no `/chat` é suficiente, ou avaliar streaming
- [ ] Cabeçalhos de segurança (CSP, HSTS, X-Frame-Options etc.) no servidor/proxy, não no HTML
- [ ] Garantir HTTPS obrigatório em produção
- [ ] (Opcional) IDs estáveis de mensagem em `GET /chat/:id`
