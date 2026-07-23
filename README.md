<div align="center">

# 🍷 FluxOS

**Sistema de gestão operacional completo para adegas, bares, distribuidoras e conveniências**

Controle de estoque, PDV, comandas/mesas, produção (cozinha/bar), financeiro (DRE) e relatórios — tudo em uma única plataforma web.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

[Demo ao vivo](https://adega-os.vercel.app/) · [Reportar bug](https://github.com/prerojan/AdegaOs/issues) · [Sugerir feature](https://github.com/prerojan/AdegaOs/issues)

</div>

---

## 📖 Sobre o projeto

O **FluxOS** é um sistema operacional de gestão (ERP leve) voltado para o dia a dia de adegas, bares, distribuidoras e conveniências. Ele unifica em uma única aplicação web o que normalmente exigiria várias ferramentas separadas: PDV, controle de estoque em caixas/unidades, gestão de mesas e comandas, painel de produção para cozinha/bar, compras com fornecedores, financeiro com DRE gerencial e relatórios exportáveis.

A aplicação foi construída com um modelo multi-perfil: cada tipo de usuário (dono, gerente, financeiro, caixa, garçom, cozinha, bar) enxerga apenas a interface relevante para sua função, tudo dentro do mesmo app.

---

## ✨ Funcionalidades

### 🔐 Login multi-perfil
Autenticação por **PIN de 4 dígitos** (rápido, pensado para tablets no salão) ou por **e-mail e senha** para acesso administrativo. Cada papel (`admin`, `manager`, `finance`, `cashier`, `waiter`, `kitchen`, `bar`) é redirecionado automaticamente para o painel correspondente após o login.

<p align="center">
  <img src="docs/screenshots/login.png" alt="Tela de login com PIN" width="800"/>
</p>

### 📊 Painel Executivo (Dashboard)
Visão gerencial com KPIs de faturamento, comparativo de faturamento x custo e indicadores operacionais em tempo real.

<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="Dashboard executivo" width="800"/>
</p>

### 📦 Cadastro de Produtos
CRUD completo de produtos com código de barras, SKU interno, categoria, marca, fornecedor vinculado, preço de custo/venda com **cálculo automático de margem**, unidade de medida (`UN`, `LT`, `KG`), conversão caixa↔unidade e geração de etiquetas.

<p align="center">
  <img src="docs/screenshots/produtos.png" alt="Cadastro de produtos" width="800"/>
</p>

### 🏬 Estoque Físico
Controle de estoque em dois níveis (caixas fechadas + unidades soltas), com alertas visuais quando o estoque total atinge o **estoque mínimo**, histórico de movimentações (entrada, ajuste, conversão, saída) e justificativas de quebra/perda.

### 🧾 Auditoria de Vendas / PDV
Registro de vendas por **mesa, comanda, balcão ou entrega (WhatsApp)**, com múltiplas formas de pagamento (Pix, dinheiro, débito, crédito, dividido entre bandeiras/maquininhas, ou fiado), desconto por venda e cancelamento com motivo justificado.

<p align="center">
  <img src="docs/screenshots/vendas.png" alt="Auditoria de vendas" width="800"/>
</p>

### 🛒 Venda Rápida (Balcão)
Barra lateral de venda rápida para atendimento de balcão, com carrinho, split de pagamento e emissão imediata do ticket.

### 🍽️ Salão — Mesas e Comandas
Gestão visual de mesas e comandas abertas, com lançamento de itens por garçom, acompanhamento de status por item (`pendente → preparo → pronto → entregue`) e fechamento de conta com cálculo automático do total.

<p align="center">
  <img src="docs/screenshots/salao.png" alt="Gestão de mesas e comandas" width="800"/>
</p>

### 👨‍🍳 Fila de Produção (Cozinha / Bar)
Painel dedicado para as equipes de cozinha e bar, roteando pedidos automaticamente por setor (ex.: petiscos → cozinha, bebidas → bar) e permitindo atualizar o status de preparo em tempo real, com histórico de quem alterou cada etapa.

<p align="center">
  <img src="docs/screenshots/producao.png" alt="Painel de produção" width="800"/>
</p>

### 🚚 Compras / NF-e e Fornecedores
Cadastro de fornecedores (contato, WhatsApp, condições comerciais) e lançamento de pedidos de compra com itens, frete, desconto, número da nota fiscal e status (`pendente` / `recebido`), atualizando o estoque automaticamente ao confirmar o recebimento.

### 💰 Financeiro / DRE Gerencial
Fluxo de caixa diário, contas a pagar/receber e um **DRE (Demonstrativo do Resultado do Exercício)** calculado dinamicamente a partir das vendas pagas e lançamentos financeiros — receita bruta, margem de contribuição, despesas fixas/variáveis e lucro líquido.

<p align="center">
  <img src="docs/screenshots/financeiro.png" alt="Financeiro e DRE" width="800"/>
</p>

### 📈 Relatórios & BI
Exportação de relatórios gerenciais em **PDF** e **Excel**.

### ⚙️ Configurações
Gestão de funcionários (nome, PIN, papel/permissão, status ativo/inativo) e parâmetros gerais do sistema, incluindo tema claro/escuro.

---

## 👥 Perfis de acesso

| Papel | Descrição | Painel de destino |
|---|---|---|
| `admin` | Dono do negócio, acesso irrestrito | Gerencial completo |
| `manager` | Gerente | Gerencial completo |
| `finance` | Financeiro | Gerencial (financeiro/DRE) |
| `cashier` | Caixa | Gerencial (vendas/PDV) |
| `waiter` | Garçom | Salão (mesas/comandas) |
| `kitchen` | Cozinha | Fila de produção |
| `bar` | Bar | Fila de produção |

---

## 🛠️ Stack tecnológica

- **[React 19](https://react.dev/)** + **[TypeScript](https://www.typescriptlang.org/)**
- **[Vite 6](https://vitejs.dev/)** — build e dev server
- **[Tailwind CSS 4](https://tailwindcss.com/)** — estilização utilitária
- **[Firebase / Firestore](https://firebase.google.com/)** — persistência em nuvem, com fallback automático para armazenamento local quando não configurado
- **[Recharts](https://recharts.org/)** — gráficos do dashboard
- **[Framer Motion](https://www.framer.com/motion/)** — animações de interface
- **[Lucide React](https://lucide.dev/)** — ícones

---

## 🚀 Como rodar localmente

**Pré-requisitos:** Node.js 18+

```bash
# 1. Clone o repositório
git clone https://github.com/prerojan/AdegaOs.git
cd AdegaOs

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Firebase (opcional — sem elas,
# o app funciona normalmente salvando os dados no localStorage do navegador)

# 4. Rode em modo desenvolvimento
npm run dev
```

O app sobe em `http://localhost:3000`.

### Outros comandos

```bash
npm run build     # build de produção
npm run preview   # preview do build de produção
npm run lint      # checagem de tipos (tsc --noEmit)
```

### Contas de demonstração

A tela de login inclui atalhos de credenciais de demo. PINs padrão (dados mockados em `src/data/mockData.ts`):

| Usuário | PIN | Papel |
|---|---|---|
| Carlos (Dono/Admin) | `1234` | admin |
| Vanessa (Gerente) | `2222` | manager |
| João (Garçom) | `3333` | waiter |
| Roberto (Financeiro) | `5555` | finance |
| Márcia (Caixa) | `6666` | cashier |
| Ana (Cozinha) | `7777` | kitchen |
| Felipe (Barman) | `8888` | bar |

> ⚠️ Esses PINs são apenas para o ambiente de demonstração/mock. Substitua-os antes de usar em produção.

---

## 📂 Estrutura do projeto

```
AdegaOs/
├── src/
│   ├── components/         # Telas: Login, Dashboard, Produtos, Estoque,
│   │                        # Vendas, Compras, Fornecedores, Financeiro,
│   │                        # Relatórios, Configurações, Salão, Produção
│   ├── data/                # Dados mockados (produtos, fornecedores, usuários)
│   ├── lib/                 # Integração com Firebase/Firestore
│   ├── types.ts              # Modelos de dados (Product, Sale, Purchase, etc.)
│   ├── App.tsx                # Roteamento de painéis e estado global
│   └── main.tsx
├── index.html
└── package.json
```

---

## 🗺️ Roadmap

- [ ] Autenticação real (Firebase Auth) em substituição ao PIN local
- [ ] Emissão fiscal integrada (NF-e/NFC-e)
- [ ] App mobile nativo para garçons
- [ ] Integração com maquininhas de cartão via API

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Abra uma *issue* descrevendo a mudança proposta ou envie um *pull request*.

1. Faça um fork do projeto
2. Crie uma branch (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: minha feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto ainda não possui uma licença definida. Adicione um arquivo `LICENSE` (ex.: MIT) caso deseje torná-lo open source formalmente.

---

<div align="center">

Feito com 🍇 para o setor de bebidas

</div>
