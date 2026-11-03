# Specs — cashew-frontend

Fila de trabalho do `/hades deliver`. Uma spec por arquivo: `FE-NNN-<slug>.md` (ex.: `FE-001-login-social.md`).
O próximo ID é o maior número existente + 1.

## Status

A primeira linha depois do título é `Status: <valor>`:

| Status | Significado |
|---|---|
| `rascunho` | em escrita; o deliver ignora |
| `aprovada` | pronta para implementar; o deliver pega |
| `entregue` | implementada (avança no mesmo commit do código) |

Use `_template.md` como ponto de partida. A branch e o título da PR levam o ID (`feat/FE-001-login-social`,
`feat: FE-001 login social`), que é como o loop cruza spec com PR aberta.
