# FE-003 — Cadastro criado com login automático falho

Status: aprovada

## Contexto

`Register.handleSubmit` chama `register` e em seguida `login`, e trata as duas falhas no mesmo `catch`. Se o cadastro
funciona e o login automático falha (rede, rate limit de 5 req/min do backend), a tela mostra "Erro ao cadastrar
usuário". A conta já existe: tentar de novo devolve "e-mail já cadastrado" e a pessoa fica sem saber o que aconteceu.

## Escopo

Entra:
- Separar as duas etapas. Falha em `register` mantém o comportamento atual (mensagem do backend ou genérica).
- Falha só no `login` automático: navegar para `/login` com o e-mail já preenchido e o aviso
  "Conta criada. Entre com seu e-mail e senha." (via `state` do `navigate`).
- `Login` lê esse `state` para preencher o e-mail e exibir o aviso (estilo de aviso de sucesso, não de erro).

Fica de fora: reenviar o login automaticamente.

## Critérios de aceite

- [ ] Cadastro ok + login falho: vai para `/login`, e-mail preenchido, aviso de conta criada visível, senha vazia.
- [ ] Cadastro falho: mensagem de erro do cadastro como hoje, permanece em `/register`.
- [ ] Cadastro e login ok: entra no app como hoje.
- [ ] Testes em `Register.test.tsx` e `Login.test.tsx` cobrindo os casos acima.

## Contrato

Nenhum (só `state` de navegação entre as duas telas).
