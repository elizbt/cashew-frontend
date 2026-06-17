# Castanha - Chatbot Acadêmico

Castanha é um assistente virtual inteligente desenvolvido para auxiliar estudantes em suas jornadas acadêmicas. A interface foi construída com foco em usabilidade, oferecendo uma experiência de chat fluida, moderna e responsiva.

## Tecnologias

Este projeto utiliza as seguintes tecnologias:

- React (com TypeScript)
- Vite (Build tool)
- Tailwind CSS (Estilização)
- Lucide React (Ícones)
- Axios (Consumo de API)
- React Router Dom (Navegação)
- Biome (Linting e Formatação)

## Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:
- Node.js (versão 18 ou superior recomendada)
- npm ou yarn

## Instalação

Siga os passos abaixo para configurar o ambiente de desenvolvimento:

1. Clonar o repositório
   ```bash
   git clone <url-do-repositorio>
   cd frontend-tcc
   ```

2. Instalar as dependências
   ```bash
   npm install
   ```

3. Configuração de Variáveis de Ambiente
   O projeto utiliza uma URL base para se comunicar com a API. Verifique o arquivo `src/config/constants.ts` ou crie um arquivo `.env` na raiz do projeto (se suportado pelo backend) para definir a URL da API.

   Atualmente, as configurações estão centralizadas em `src/config/constants.ts`.

4. Executar o projeto
   ```bash
   npm run dev
   ```

O projeto estará disponível em `http://localhost:5173` (ou na porta indicada no terminal).

## Estrutura de Pastas

```text
src/
├── components/     # Componentes reutilizáveis de UI e seções da página
├── config/         # Configurações globais e constantes
├── context/        # Gerenciamento de estado (Autenticação e Chat)
├── services/       # Integração com APIs externas
├── types/          # Definições de tipos TypeScript
└── App.tsx         # Componente principal e rotas
```

## Comandos Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento.
- `npm run build`: Cria a versão de produção do projeto.
- `npm run preview`: Visualiza a versão de produção localmente.
- `npm run lint`: Executa o linter para verificar o código.

---
Desenvolvido como parte de um Trabalho de Conclusão de Curso (TCC).
