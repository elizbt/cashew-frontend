# FE-001 — Resposta e carregamento sempre na conversa certa

Status: aprovada

## Contexto

`ChatContext.sendMessage` anexa a resposta do `/chat` à lista de mensagens que estiver aberta quando a resposta
chega. Se a usuária troca de conversa ou clica em "Nova Conversa" durante a espera (até 60 s), a resposta aparece na
conversa errada; se a conversa de origem era nova, o `chatId` devolvido ainda é gravado como conversa atual,
misturando as duas. `loadChat` tem a mesma corrida: dois cliques rápidos em conversas diferentes deixam valer a
resposta que chegar por último, não a do último clique.

## Escopo

Entra:
- `sendMessage`: a resposta só é anexada se a conversa aberta ainda é aquela em que a pergunta foi feita. Se não é
  mais, a resposta é descartada da tela (o backend já a persistiu; reabrir a conversa a mostra). Se a conversa de
  origem era nova e devolveu `chatId`, ela entra no histórico da barra lateral, mas não vira a conversa atual.
- `loadChat`: só o último pedido aplica mensagens e `currentChatId`; respostas de pedidos anteriores são ignoradas.
- O mesmo vale para a mensagem de erro do `sendMessage`: não aparece em outra conversa.

Fica de fora: cancelar a requisição no servidor (`AbortController`) — opcional, não exigido.

## Critérios de aceite

- [ ] Enviar em A, trocar para B antes da resposta: B não recebe a resposta nem o erro; reabrir A (backend) a mostra.
- [ ] Enviar numa conversa nova, clicar "Nova Conversa" antes da resposta: a tela continua vazia e a conversa de
      origem aparece no histórico.
- [ ] `loadChat(A)` seguido de `loadChat(B)` com A respondendo depois: a tela mostra B e `currentChatId === B`.
- [ ] Caminho feliz atual (enviar e receber na mesma conversa) continua passando.
- [ ] Testes em `ChatContext.test.tsx` cobrindo os três cenários acima.

## Contrato

Nenhum.
