# Evolute — Plano Personalizado de Nutrição e Treino

> Plano alimentar e de treino 100% personalizado, baseado em ciência, com comida de verdade e exercícios reais para o seu estilo de vida.

---

## Sobre o projeto

O **Evolute** é uma aplicação web que gera, em menos de 2 minutos, um plano completo de nutrição e treino para o usuário — sem custo e sem necessidade de cadastro. O plano é calculado com base nos dados biológicos e nos objetivos de cada pessoa, utilizando fórmulas científicas reconhecidas.

Além do plano gerado, o usuário tem acesso a um **Coach IA** interativo, que responde dúvidas em tempo real e ajuda a ajustar o plano de forma personalizada.

---

## Funcionalidades

- **Plano alimentar personalizado** — 5 a 6 refeições diárias com alimentos acessíveis (arroz, feijão, frango, ovos, etc.), com breakdown completo de calorias e macronutrientes (proteínas, carboidratos e gorduras).
- **Treino semanal estruturado** — divisão por grupos musculares, exercícios compostos e complementares, adaptado para 2x a 6x por semana, para academia ou casa.
- **Cálculo baseado em Mifflin-St Jeor** — fórmula científica para calcular a Taxa Metabólica Basal (TMB) e o gasto calórico total (TDEE).
- **Estratégia e timeline personalizadas** — explicação do porquê de cada escolha e expectativa de evolução semana a semana.
- **Coach IA em tempo real** — chat com streaming de respostas, especializado em nutrição esportiva e treinamento físico, com contexto completo do plano do usuário.
- **Suporte a restrições e preferências** — vegetarianos, veganos, intolerâncias alimentares e preferências pessoais.

---

## Objetivos suportados

| Objetivo | Estratégia aplicada |
|---|---|
| Perder gordura | Déficit calórico moderado + preservação muscular |
| Ganhar massa muscular | Superávit calórico + alta ingestão proteica |
| Manter peso e condicionamento | Calorias de manutenção balanceadas |
| Melhorar saúde geral | Foco em qualidade alimentar e atividade regular |
| Ganhar força | Volume e progressão de carga estruturados |

---

## Tecnologias

### Frontend
- **React 19** com **Vite**
- **TypeScript**
- **Tailwind CSS v4** para estilização
- **Radix UI** + **Lucide React** para componentes e ícones
- **Wouter** para roteamento
- **Framer Motion** para animações
- **React Hook Form** + **Zod** para formulários e validação

### Backend
- **Express 5** (Node.js)
- **Pino** para logging estruturado
- **esbuild** para bundling do servidor

### IA
- **OpenRouter** como gateway de modelos de linguagem
- Modelos utilizados (com fallback automático):
  - `stepfun/step-3.5-flash`
  - `arcee-ai/trinity-mini`
  - `qwen/qwen3.6-plus`
- Respostas em **streaming** via Server-Sent Events (SSE)

### Infraestrutura
- Monorepo gerenciado com **pnpm workspaces**
- Deploy otimizado para **Vercel** (frontend estático + funções serverless)

---

## Estrutura do projeto

```
.
├── artifacts/
│   ├── nutri-treino/        # Frontend React + Vite
│   │   ├── src/
│   │   │   ├── pages/       # Home, Formulário, Plano
│   │   │   ├── components/  # Coach IA e componentes UI
│   │   │   └── lib/         # Gerador de planos (planGenerator.ts)
│   │   └── public/          # Favicon e assets estáticos
│   └── api-server/          # Backend Express
│       └── src/
│           └── routes/      # Rota /api/chat (streaming IA)
├── api/                     # Funções serverless para Vercel
│   ├── chat.ts              # Endpoint do Coach IA
│   └── healthz.ts           # Health check
├── lib/                     # Pacotes compartilhados
│   ├── db/                  # Schema e conexão (PostgreSQL + Drizzle ORM)
│   └── api-spec/            # Especificação OpenAPI
└── vercel.json              # Configuração de deploy
```

---

## Como rodar localmente

### Pré-requisitos

- [Node.js 20+](https://nodejs.org)
- [pnpm 10+](https://pnpm.io) — `npm install -g pnpm`

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/evolute-fit.git
cd evolute-fit

# Instale as dependências
pnpm install
```

### Variáveis de ambiente

Crie um arquivo `.env` na raiz (ou configure nos secrets do seu ambiente):

```env
OPENROUTER_API_KEY=sua_chave_aqui
```

Você pode obter uma chave gratuita em [openrouter.ai](https://openrouter.ai).

### Rodando o projeto

```bash
# Inicia o frontend (porta 24870)
PORT=24870 BASE_PATH=/ pnpm --filter @workspace/nutri-treino run dev

# Inicia o backend (porta 8080) — em outro terminal
PORT=8080 pnpm --filter @workspace/api-server run dev
```

Acesse [http://localhost:24870](http://localhost:24870) no navegador.

---

## Deploy no Vercel

O projeto está configurado para deploy no Vercel via `vercel.json`.

### Passos

1. Faça fork/clone e suba o repositório no GitHub
2. Importe o repositório em [vercel.com](https://vercel.com)
3. Nas configurações do projeto, adicione a variável de ambiente:
   - **Nome:** `OPENROUTER_API_KEY`
   - **Valor:** sua chave da OpenRouter
4. Clique em **Deploy**

O Vercel irá:
- Buildar o frontend com `pnpm --filter @workspace/nutri-treino run build`
- Servir os arquivos estáticos com rewrite para SPA
- Disponibilizar o Coach IA via função serverless em `/api/chat`

---

## Como funciona o cálculo do plano

1. **TMB (Taxa Metabólica Basal)** — calculada com a fórmula de Mifflin-St Jeor
2. **TDEE (Gasto Total Diário de Energia)** — TMB × fator de atividade física baseado na frequência de treino
3. **Meta calórica** — ajustada conforme o objetivo (déficit para perda de gordura, superávit para ganho de massa)
4. **Macros** — distribuição de proteínas, carboidratos e gorduras calibrada para o objetivo
5. **Refeições** — montadas com alimentos do dia a dia, respeitando restrições e preferências
6. **Treino** — divisão semanal por grupos musculares, com volume e intensidade adaptados ao nível do usuário

---

## Licença

MIT — livre para usar, modificar e distribuir.

---

*© 2025 Evolute — Seu próximo nível começa aqui.*
